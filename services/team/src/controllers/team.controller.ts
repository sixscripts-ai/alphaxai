import { Request, Response } from 'express';
import { db } from '@inventory/database';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
  department: z.string().optional(),
});

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.orgId;
    const { search, role, status } = req.query;

    let sql = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        r.name as role_name, om.created_at as joined_at
      FROM users u
      JOIN org_members om ON u.id = om.user_id
      JOIN roles r ON om.role_id = r.id
      WHERE om.org_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      sql += ` AND r.name = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    sql += ` ORDER BY om.created_at DESC`;

    const result = await db.query(sql, params);
    
    const members = result.rows.map(m => ({
      id: m.id,
      name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
      email: m.email,
      avatar: null,
      role: m.role_name.toUpperCase(),
      department: 'General',
      status: 'ACTIVE',
      last_active: null,
      created_at: m.joined_at
    }));

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const { email, name, role, department } = inviteMemberSchema.parse(req.body);
    const orgId = (req as any).user.orgId;
    const inviterId = (req as any).user.id;

    // Check if user exists
    let userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userResult.rows.length === 0) {
      // Create user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(tempPassword, salt);
      
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || null;
      
      const newUser = await db.query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hash, firstName, lastName]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Check if already member
    const existingMember = await db.query(
      'SELECT 1 FROM org_members WHERE org_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Get role ID
    const roleResult = await db.query(
      'SELECT id FROM roles WHERE org_id = $1 AND name = $2',
      [orgId, role]
    );
    
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Add to org
    await db.query(
      'INSERT INTO org_members (org_id, user_id, role_id) VALUES ($1, $2, $3)',
      [orgId, userId, roleResult.rows[0].id]
    );

    // TODO: Send invitation email

    res.status(201).json({ message: 'Member invited successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const orgId = (req as any).user.orgId;

    const roleResult = await db.query(
      'SELECT id FROM roles WHERE org_id = $1 AND name = $2',
      [orgId, role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.query(
      'UPDATE org_members SET role_id = $1 WHERE user_id = $2 AND org_id = $3',
      [roleResult.rows[0].id, id, orgId]
    );

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.orgId;

    await db.query(
      'DELETE FROM org_members WHERE user_id = $1 AND org_id = $2',
      [id, orgId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
