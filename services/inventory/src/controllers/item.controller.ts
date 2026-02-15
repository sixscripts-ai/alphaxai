import { Request, Response } from 'express';
import { query, getClient } from '@inventory/database';
import { z } from 'zod';

const createItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().default('each'),
  category: z.string().optional(),
  unitCost: z.number().min(0).default(0),
  locationId: z.string().uuid().optional(),
});

export const createItem = async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { sku, name, unit, category, unitCost, locationId } = createItemSchema.parse(req.body);
    const orgId = (req as any).user.organizationId;

    await client.query('BEGIN');

    const itemResult = await client.query(
      `INSERT INTO items 
       (org_id, sku, name, unit, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, sku, name, unit, category]
    );
    const item = itemResult.rows[0];

    if (locationId && unitCost > 0) {
        await client.query(
            `INSERT INTO item_costs (org_id, item_id, location_id, unit_cost)
             VALUES ($1, $2, $3, $4)`,
            [orgId, item.id, locationId, unitCost]
        );
    }

    await client.query('COMMIT');
    
    // Return with 0 stock
    res.status(201).json({ ...item, quantity_on_hand: 0 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    if (error.code === '23505') {
        return res.status(409).json({ error: 'Item with this SKU already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.organizationId;
    const { locationId } = req.query;
    
    let sql = `
      SELECT i.*, COALESCE(SUM(im.signed_quantity), 0)::float as quantity_on_hand
      FROM items i
      LEFT JOIN inventory_movements im ON i.id = im.item_id
    `;
    
    const params: any[] = [orgId];
    
    if (locationId) {
        sql += ` AND im.location_id = $2`;
        params.push(locationId);
    }

    sql += ` WHERE i.org_id = $1 GROUP BY i.id`;

    const result = await query(sql, params);
    const items = result.rows;

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;

    const result = await query(
      `SELECT i.*, COALESCE(SUM(im.signed_quantity), 0)::float as quantity_on_hand
       FROM items i
       LEFT JOIN inventory_movements im ON i.id = im.item_id
       WHERE i.id = $1 AND i.org_id = $2
       GROUP BY i.id`,
      [id, orgId]
    );
    const item = result.rows[0];

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
