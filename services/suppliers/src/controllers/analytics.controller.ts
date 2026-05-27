import { Request, Response } from 'express';
import { db } from '@inventory/database';

export class SupplierAnalyticsController {

  // GET /api/suppliers/analytics/spend
  static async getSpendBreakdown(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;

      const result = await db.query(`
        SELECT
          s.id, s.name, s.email, s.phone,
          COALESCE(json_agg(DISTINCT jsonb_build_object('name', sc.name)) FILTER (WHERE sc.name IS NOT NULL), '[]') as categories
        FROM suppliers s
        LEFT JOIN supplier_categories sc ON s.id = sc.supplier_id
        WHERE s.org_id = $1
        GROUP BY s.id
      `, [orgId]);

      const suppliers = result.rows.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        categories: s.categories ? s.categories.map((c: any) => c.name) : [],
      }));

      res.json({
        suppliers,
        supplierCount: suppliers.length,
      });
    } catch (error) {
      console.error('Error fetching supplier spend:', error);
      res.status(500).json({ error: 'Failed to fetch supplier spend analytics' });
    }
  }

  // GET /api/suppliers/analytics/lead-times
  static async getLeadTimeStats(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;

      const result = await db.query(`
        SELECT
          s.id as supplier_id, s.name as supplier_name,
          lts.item_id, i.name as item_name, i.sku,
          lts.location_id, l.name as location_name,
          lts.avg_lead_time_days, lts.stddev_lead_time_days, lts.sample_count
        FROM lead_time_stats lts
        JOIN suppliers s ON s.id = lts.supplier_id
        LEFT JOIN items i ON i.id = lts.item_id
        LEFT JOIN locations l ON l.id = lts.location_id
        WHERE lts.org_id = $1
        ORDER BY lts.avg_lead_time_days DESC
      `, [orgId]);

      const stats = result.rows.map(row => ({
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        itemId: row.item_id,
        itemName: row.item_name,
        sku: row.sku,
        locationId: row.location_id,
        locationName: row.location_name,
        avgLeadTimeDays: Number(row.avg_lead_time_days),
        stddevLeadTimeDays: Number(row.stddev_lead_time_days),
        sampleCount: Number(row.sample_count),
      }));

      const bySupplier = stats.reduce((acc: any, s) => {
        if (!acc[s.supplierId]) {
          acc[s.supplierId] = { supplierName: s.supplierName, items: [] };
        }
        acc[s.supplierId].items.push(s);
        return acc;
      }, {});

      res.json({
        stats,
        bySupplier: Object.entries(bySupplier).map(([id, data]: any) => ({
          supplierId: id,
          supplierName: data.supplierName,
          avgLeadTime: data.items.reduce((s: number, i: any) => s + i.avgLeadTimeDays, 0) / data.items.length,
          items: data.items,
        })),
        overallAvgLeadTime: stats.length > 0
          ? stats.reduce((s, i) => s + i.avgLeadTimeDays, 0) / stats.length
          : 0,
      });
    } catch (error) {
      console.error('Error fetching lead time stats:', error);
      res.status(500).json({ error: 'Failed to fetch lead time stats' });
    }
  }
}
