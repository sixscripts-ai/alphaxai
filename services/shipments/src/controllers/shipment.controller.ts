import { Request, Response } from 'express';
import { db } from '@inventory/database';
import { z } from 'zod';

const createShipmentSchema = z.object({
  tracking_number: z.string().optional(),
  carrier: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  estimated_delivery: z.string(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  cost: z.number().optional(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().min(1)
  })).optional()
});

export const getShipments = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.organizationId;
    const { search, status } = req.query;

    let sql = `
      SELECT s.*, 
             (SELECT COUNT(*) FROM shipment_items WHERE shipment_id = s.id) as items_count
      FROM shipments s
      WHERE s.org_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (s.tracking_number ILIKE $${paramIndex} OR s.carrier ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY s.created_at DESC`;

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getShipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;

    const result = await db.query(
      'SELECT * FROM shipments WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );

    const shipment = result.rows[0];
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createShipment = async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { tracking_number, carrier, origin, destination, estimated_delivery, weight, dimensions, cost, items } = createShipmentSchema.parse(req.body);
    const orgId = (req as any).user.organizationId;

    await client.query('BEGIN');

    // Generate tracking number if not provided
    const finalTracking = tracking_number || `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const shipmentResult = await client.query(
      `INSERT INTO shipments (org_id, tracking_number, carrier, origin, destination, estimated_delivery, weight, dimensions, cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PICKED_UP')
       RETURNING *`,
      [orgId, finalTracking, carrier, origin, destination, estimated_delivery, weight || 0, dimensions || '', cost || 0]
    );
    const shipment = shipmentResult.rows[0];

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO shipment_items (shipment_id, item_id, quantity) VALUES ($1, $2, $3)`,
          [shipment.id, item.item_id, item.quantity]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(shipment);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, actual_delivery } = req.body;
    const orgId = (req as any).user.organizationId;

    await db.query(
      'UPDATE shipments SET status = $1, actual_delivery = $2 WHERE id = $3 AND org_id = $4',
      [status, actual_delivery || null, id, orgId]
    );

    res.json({ message: 'Shipment status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
