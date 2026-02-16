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
