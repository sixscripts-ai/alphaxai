import { Request, Response } from 'express';
import { db } from '@inventory/database';
import { z } from 'zod';

const createSupplierSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user.organizationId;
    const { search, status } = req.query;

    let sql = `
      SELECT s.*, 
             COALESCE(json_agg(DISTINCT jsonb_build_object('name', sc.name)) FILTER (WHERE sc.name IS NOT NULL), '[]') as categories,
             (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.id) as total_orders,
             (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id) as total_spend
      FROM suppliers s
      LEFT JOIN supplier_categories sc ON s.id = sc.supplier_id
      WHERE s.org_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (search) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.contact_person ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ` GROUP BY s.id ORDER BY s.created_at DESC`;

    const result = await db.query(sql, params);
    const suppliers = result.rows.map(s => ({
      ...s,
      categories: s.categories ? s.categories.map((c: any) => c.name) : [],
      status: s.is_active ? 'ACTIVE' : 'INACTIVE'
    }));

    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;

    const result = await db.query(
      `SELECT s.*, 
              COALESCE(json_agg(DISTINCT jsonb_build_object('name', sc.name)) FILTER (WHERE sc.name IS NOT NULL), '[]') as categories
       FROM suppliers s
       LEFT JOIN supplier_categories sc ON s.id = sc.supplier_id
       WHERE s.id = $1 AND s.org_id = $2
       GROUP BY s.id`,
      [id, orgId]
    );

    const supplier = result.rows[0];
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      ...supplier,
      categories: supplier.categories ? supplier.categories.map((c: any) => c.name) : [],
      status: supplier.is_active ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { name, contact_person, email, phone, website, address, categories } = createSupplierSchema.parse(req.body);
    const orgId = (req as any).user.organizationId;

    await client.query('BEGIN');

    const supplierResult = await client.query(
      `INSERT INTO suppliers (org_id, name, contact_person, email, phone, website, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orgId, name, contact_person || null, email || null, phone || null, website || null, address || null]
    );
    const supplier = supplierResult.rows[0];

    if (categories && categories.length > 0) {
      for (const cat of categories) {
        await client.query(
          `INSERT INTO supplier_categories (supplier_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [supplier.id, cat]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...supplier, categories: categories || [], status: 'ACTIVE' });
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

export const updateSupplier = async (req: Request, res: Response) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;
    const { name, contact_person, email, phone, website, address, categories, status } = req.body;

    await client.query('BEGIN');

    await client.query(
      `UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, website = $5, address = $6, is_active = $7
       WHERE id = $8 AND org_id = $9`,
      [name, contact_person, email, phone, website, address, status === 'ACTIVE', id, orgId]
    );

    if (categories) {
      await client.query('DELETE FROM supplier_categories WHERE supplier_id = $1', [id]);
      for (const cat of categories) {
        await client.query(
          `INSERT INTO supplier_categories (supplier_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, cat]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = (req as any).user.organizationId;

    await db.query('DELETE FROM suppliers WHERE id = $1 AND org_id = $2', [id, orgId]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
