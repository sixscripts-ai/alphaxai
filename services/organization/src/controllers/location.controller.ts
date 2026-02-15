import { Request, Response } from 'express';
import { query } from '@inventory/database';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  timezone: z.string().default('America/Los_Angeles'),
});

const updateLocationSchema = createLocationSchema.partial();

export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, code, timezone } = createLocationSchema.parse(req.body);
    const orgId = (req as any).user.organizationId; 

    const result = await query(
      'INSERT INTO locations (organization_id, name, code, timezone) VALUES ($1, $2, $3, $4) RETURNING *',
      [orgId, name, code, timezone]
    );
    const location = result.rows[0];

    res.status(201).json(location);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    if (error.code === '23505') {
        return res.status(409).json({ error: 'Location with this name or code already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLocations = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.organizationId;

    const result = await query('SELECT * FROM locations WHERE organization_id = $1', [orgId]);
    const locations = result.rows;

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;

    const result = await query(
      'SELECT * FROM locations WHERE id = $1 AND organization_id = $2',
      [id, orgId]
    );
    const location = result.rows[0];

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, timezone } = updateLocationSchema.parse(req.body);
    const orgId = (req as any).user.organizationId;

    // First check existence
    const check = await query(
      'SELECT id FROM locations WHERE id = $1 AND organization_id = $2',
      [id, orgId]
    );
    if (check.rows.length === 0) {
       return res.status(404).json({ error: 'Location not found' });
    }

    const result = await query(
      `UPDATE locations 
       SET name = COALESCE($1, name), 
           code = COALESCE($2, code), 
           timezone = COALESCE($3, timezone)
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [name, code, timezone, id, orgId]
    );
    
    const location = result.rows[0];

    res.json(location);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
