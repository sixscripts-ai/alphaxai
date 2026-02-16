import { Request, Response } from 'express';
import { db } from '@inventory/database';

export const getOrganization = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.orgId;

    const result = await db.query(
      `SELECT o.id, o.name, o.created_at,
              (SELECT COUNT(*)::int FROM org_members WHERE org_id = o.id) as member_count,
              (SELECT COUNT(*)::int FROM locations WHERE org_id = o.id) as location_count
       FROM organizations o
       WHERE o.id = $1`,
      [orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.orgId;

    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name, om.created_at as joined_at
       FROM org_members om
       JOIN users u ON om.user_id = u.id
       JOIN roles r ON om.role_id = r.id
       WHERE om.org_id = $1
       ORDER BY om.created_at ASC`,
      [orgId]
    );

    const users = result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      roles: [row.role_name],
      joined_at: row.joined_at,
    }));

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
