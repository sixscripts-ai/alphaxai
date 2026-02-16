import { db } from '@inventory/database';
import { Request, Response } from 'express';
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
  const client = await db.getClient();
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
    const { locationId, search } = req.query;
    
    // Base query to fetch items with rich data
    let sql = `
      WITH item_stats AS (
        SELECT 
            i.id, 
            COALESCE(SUM(im.signed_quantity), 0)::float as quantity_on_hand,
            MAX(im.occurred_at) as last_movement_at
        FROM items i
        LEFT JOIN inventory_movements im ON i.id = im.item_id
        WHERE i.org_id = $1
        ${locationId ? 'AND im.location_id = $2' : ''}
        GROUP BY i.id
      ),
      item_policies AS (
        SELECT 
            rp.item_id, 
            rp.min_order_qty as reorder_point,
            rp.target_days_of_supply
        FROM replenishment_policies rp
        WHERE rp.org_id = $1
        ${locationId ? 'AND rp.location_id = $2' : ''}
      ),
      item_costing AS (
        SELECT 
            ic.item_id, 
            ic.unit_cost
        FROM item_costs ic
        WHERE ic.org_id = $1
        ${locationId ? 'AND ic.location_id = $2' : ''}
        ORDER BY ic.effective_at DESC
        LIMIT 1 -- Ideally this should be a LATERAL JOIN or distinct on item_id, simplified for now
      )
      SELECT 
        i.*, 
        COALESCE(s.quantity_on_hand, 0) as quantity_on_hand,
        s.last_movement_at,
        COALESCE(rp.reorder_point, 10) as reorder_point, -- Default 10 if not set
        COALESCE(ic.unit_cost, 0) as unit_cost,
        CASE 
            WHEN COALESCE(s.quantity_on_hand, 0) <= COALESCE(rp.reorder_point, 10) THEN 'LOW_STOCK'
            WHEN COALESCE(s.quantity_on_hand, 0) = 0 THEN 'OUT_OF_STOCK'
            ELSE 'ACTIVE'
        END as status
      FROM items i
      LEFT JOIN item_stats s ON i.id = s.id
      LEFT JOIN item_policies rp ON i.id = rp.item_id
      LEFT JOIN item_costing ic ON i.id = ic.item_id
      WHERE i.org_id = $1
    `;
    
    const params: any[] = [orgId];
    if (locationId) {
        params.push(locationId);
    }

    if (search) {
        sql += ` AND (i.name ILIKE $${params.length + 1} OR i.sku ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY i.created_at DESC`;

    const result = await db.query(sql, params);
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

    const result = await db.query(
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
