import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query, getClient } from '@inventory/database';
import { generateTokens, verifyRefreshToken } from '../utils/token';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { email, password, organizationName, firstName, lastName } = registerSchema.parse(req.body);

    await client.query('BEGIN');

    // Check if user exists
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create Organization
    const orgResult = await client.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [organizationName]
    );
    const orgId = orgResult.rows[0].id;

    // 2. Create User
    const newUserResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name`,
      [email, passwordHash, firstName || null, lastName || null]
    );
    const user = newUserResult.rows[0];

    // 3. Create 'OWNER' Role for this Org
    const roleResult = await client.query(
      `INSERT INTO roles (org_id, name) VALUES ($1, 'OWNER') RETURNING id`,
      [orgId]
    );
    const roleId = roleResult.rows[0].id;

    // 4. Link User to Org via Role
    await client.query(
      `INSERT INTO org_members (org_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [orgId, user.id, roleId]
    );

    await client.query('COMMIT');

    // Construct token payload
    const userPayload = {
        ...user,
        organizationId: orgId,
        roles: ['OWNER']
    };

    const tokens = generateTokens(userPayload);

    res.status(201).json({
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, roles: ['OWNER'], organizationId: orgId },
      tokens,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // 1. Get User
    const result = await query('SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Get Org and Role (Picking the first one for simplicity)
    const memberResult = await query(
        `SELECT om.org_id, r.name as role_name 
         FROM org_members om
         JOIN roles r ON om.role_id = r.id
         WHERE om.user_id = $1
         LIMIT 1`,
        [user.id]
    );

    if (memberResult.rows.length === 0) {
        return res.status(403).json({ error: 'User is not a member of any organization' });
    }

    const memberData = memberResult.rows[0];
    const userPayload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        organizationId: memberData.org_id,
        roles: [memberData.role_name]
    };

    const tokens = generateTokens(userPayload);

    // Update last login - removed from schema provided by user, so skipping
    // await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({
      user: userPayload,
      tokens,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const orgId = (req as any).user.orgId; // From token

  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name 
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get roles again to be sure
  const memberResult = await query(
    `SELECT r.name as role_name 
     FROM org_members om
     JOIN roles r ON om.role_id = r.id
     WHERE om.user_id = $1 AND om.org_id = $2`,
    [userId, orgId]
  );
  
  const roles = memberResult.rows.map((r: any) => r.role_name);

  res.json({ user: { ...user, roles, organizationId: orgId } });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(token) as any;
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user info to rebuild tokens
    const userResult = await query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [decoded.userId]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const memberResult = await query(
      `SELECT om.org_id, r.name as role_name 
       FROM org_members om
       JOIN roles r ON om.role_id = r.id
       WHERE om.user_id = $1
       LIMIT 1`,
      [user.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'User is not a member of any organization' });
    }

    const memberData = memberResult.rows[0];
    const userPayload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      organizationId: memberData.org_id,
      roles: [memberData.role_name],
    };

    const tokens = generateTokens(userPayload);
    res.json({ user: userPayload, tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
