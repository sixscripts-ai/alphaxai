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
    const orgId = (req as any).user.orgId;

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
    const orgId = (req as any).user.orgId;
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
    const orgId = (req as any).user.orgId;

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

export const exportItems = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.orgId;

    const result = await db.query(
      `SELECT i.sku, i.name, i.unit, i.category, i.is_active,
              COALESCE(SUM(im.signed_quantity), 0)::float as quantity_on_hand,
              COALESCE(ic.unit_cost, 0) as unit_cost
       FROM items i
       LEFT JOIN inventory_movements im ON i.id = im.item_id
       LEFT JOIN item_costs ic ON ic.item_id = i.id AND ic.org_id = i.org_id
       WHERE i.org_id = $1
       GROUP BY i.id, i.sku, i.name, i.unit, i.category, i.is_active, ic.unit_cost
       ORDER BY i.created_at DESC`,
      [orgId]
    );

    const items = result.rows;
    const headers = ['sku', 'name', 'unit', 'category', 'is_active', 'quantity_on_hand', 'unit_cost'];
    const csvRows = [headers.join(',')];

    for (const item of items) {
      const row = headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export inventory' });
  }
};

export const importItems = async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const orgId = (req as any).user.orgId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Request body must include a non-empty "items" array' });
    }

    await client.query('BEGIN');

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        if (!item.sku || !item.name) {
          errors.push(`Skipped row: missing sku or name`);
          skipped++;
          continue;
        }

        await client.query(
          `INSERT INTO items (org_id, sku, name, unit, category)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (org_id, sku) DO NOTHING`,
          [orgId, item.sku, item.name, item.unit || 'each', item.category || null]
        );
        created++;
      } catch (err: any) {
        errors.push(`Error on SKU ${item.sku}: ${err.message}`);
        skipped++;
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ created, skipped, errors: errors.slice(0, 10) });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Import failed' });
  } finally {
    client.release();
  }
};
