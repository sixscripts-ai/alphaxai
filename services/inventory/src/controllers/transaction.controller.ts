import { Request, Response } from 'express';
import { query, getClient } from '@inventory/database';
import { z } from 'zod';

const transactionSchema = z.object({
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  referenceId: z.string().uuid().optional(),
});

export const createTransaction = async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    const { itemId, locationId, type, quantity, reason, referenceId } = transactionSchema.parse(req.body);
    const orgId = (req as any).user.organizationId;

    await client.query('BEGIN');

    // 1. Calculate current stock
    const stockResult = await client.query(
      `SELECT COALESCE(SUM(signed_quantity), 0) as current_stock 
       FROM inventory_movements 
       WHERE org_id = $1 AND location_id = $2 AND item_id = $3`,
      [orgId, locationId, itemId]
    );
    const currentStock = parseFloat(stockResult.rows[0].current_stock);

    let movementType = '';
    let signedQuantity = 0;

    if (type === 'IN') {
        movementType = 'RECEIPT';
        signedQuantity = quantity;
    } else if (type === 'OUT') {
        movementType = 'CONSUME';
        signedQuantity = -quantity;
        
        if (currentStock + signedQuantity < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient stock' });
        }
    } else {
        movementType = 'ADJUSTMENT';
        // For adjustment, we assume the input quantity is the DELTA. 
        // If the user meant "set to X", we'd need different logic.
        // Assuming "add/remove X" here for simplicity or we can treat as +/-
        // Let's assume input quantity is always positive and we need a direction. 
        // But the schema just says ADJUSTMENT. 
        // Let's assume ADJUSTMENT means +quantity for now, or maybe we need a 'direction' field.
        // The previous code had type IN/OUT.
        // Let's just say ADJUSTMENT adds for now, or handle signed input if schema allowed.
        // Schema says quantity >= 0.
        // So we can't pass negative quantity.
        // We'll treat ADJUSTMENT as 'add' for now, user should use OUT for remove.
        signedQuantity = quantity; 
    }

    // 2. Insert Movement
    const result = await client.query(
      `INSERT INTO inventory_movements 
       (org_id, location_id, item_id, movement, quantity, signed_quantity, reason_code, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [orgId, locationId, itemId, movementType, quantity, signedQuantity, reason, referenceId]
    );
    
    const movement = result.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
        movement,
        newStock: currentStock + signedQuantity
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

export const createTransfer = async (req: Request, res: Response) => {
    res.status(501).json({ error: 'Not implemented yet' });
};
