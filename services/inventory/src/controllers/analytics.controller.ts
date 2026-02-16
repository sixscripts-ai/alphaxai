import { Request, Response } from 'express';
import { db } from '@inventory/database';

export class AnalyticsController {
  
  // GET /api/inventory/analytics/history
  // Query params: locationId (optional), itemId (optional), startDate, endDate
  static async getHistory(req: Request, res: Response) {
    try {
      const { orgId } = req.user!;
      const { locationId, itemId, startDate, endDate } = req.query;

      let query = `
        SELECT day, SUM(on_hand) as total_on_hand, SUM(inventory_value) as total_value
        FROM inventory_snapshot_daily
        WHERE org_id = $1
      `;
      const params: any[] = [orgId];
      let paramIndex = 2;

      if (locationId) {
        query += ` AND location_id = $${paramIndex}`;
        params.push(locationId);
        paramIndex++;
      }

      if (itemId) {
        query += ` AND item_id = $${paramIndex}`;
        params.push(itemId);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND day >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND day <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` GROUP BY day ORDER BY day ASC`;

      const result = await db.query(query, params);
      
      // Transform for chart
      const chartData = result.rows.map(row => ({
        date: row.day, // Format: YYYY-MM-DD
        value: Number(row.total_value),
        quantity: Number(row.total_on_hand)
      }));

      res.json(chartData);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch inventory history' });
    }
  }

  // GET /api/inventory/analytics/forecast
  // Query params: locationId (optional), itemId (optional)
  static async getForecast(req: Request, res: Response) {
    try {
      const { orgId } = req.user!;
      const { locationId, itemId } = req.query;

      // For aggregate forecast, we sum up yhat. Confidence intervals are trickier to sum perfectly, 
      // but for visualization we can sum them roughly.
      let query = `
        SELECT day, SUM(yhat) as predicted_demand, SUM(yhat_lower) as lower_bound, SUM(yhat_upper) as upper_bound
        FROM forecasts_daily
        WHERE org_id = $1
      `;
      const params: any[] = [orgId];
      let paramIndex = 2;

      if (locationId) {
        query += ` AND location_id = $${paramIndex}`;
        params.push(locationId);
        paramIndex++;
      }

      if (itemId) {
        query += ` AND item_id = $${paramIndex}`;
        params.push(itemId);
        paramIndex++;
      }
      
      // Only future dates usually
      query += ` AND day >= CURRENT_DATE`;

      query += ` GROUP BY day ORDER BY day ASC LIMIT 30`; // 30 day forecast

      const result = await db.query(query, params);

      const chartData = result.rows.map(row => ({
        date: row.day,
        value: Number(row.predicted_demand),
        lower: Number(row.lower_bound),
        upper: Number(row.upper_bound)
      }));

      res.json(chartData);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      res.status(500).json({ error: 'Failed to fetch forecast' });
    }
  }

  // GET /api/inventory/analytics/summary
  // KPI Cards data
  static async getSummary(req: Request, res: Response) {
    try {
      const { orgId } = req.user!;
      
      // 1. Total Value (Current)
      // We can get this from items + item_costs or latest snapshot. 
      // Let's use latest snapshot for speed if available, or calculate live.
      // Live calculation is better for "Current" state.
      
      // Calculate current stock from ledger (since snapshots are daily, might be slightly stale if we rely only on them)
      // But for "Total Inventory Value" card, snapshot is usually fine or we query items directly.
      
      // Let's do a live aggregate query on items * cost
      const valueQuery = `
        SELECT 
            COUNT(DISTINCT i.id) as sku_count,
            COALESCE(SUM(ic.unit_cost * (
                SELECT COALESCE(SUM(signed_quantity), 0)
                FROM inventory_movements im
                WHERE im.item_id = i.id AND im.location_id = l.id
            )), 0) as total_value
        FROM items i
        JOIN locations l ON l.org_id = i.org_id
        LEFT JOIN item_costs ic ON ic.item_id = i.id AND ic.location_id = l.id
        WHERE i.org_id = $1
      `;
      
      const valueResult = await db.query(valueQuery, [orgId]);
      
      // 2. Low Stock Count
      // Real implementation would check against reorder_point in item_metrics_daily or replenishment_policies
      // For now, let's assume low stock if quantity < 10 (hardcoded for MVP)
      const lowStockQuery = `
        WITH stock AS (
            SELECT item_id, SUM(signed_quantity) as qty
            FROM inventory_movements
            WHERE org_id = $1
            GROUP BY item_id
        )
        SELECT COUNT(*) as count FROM stock WHERE qty < 10
      `;
      const lowStockResult = await db.query(lowStockQuery, [orgId]);

      res.json({
        totalValue: Number(valueResult.rows[0].total_value),
        skuCount: Number(valueResult.rows[0].sku_count),
        lowStockCount: Number(lowStockResult.rows[0].count),
        inventoryTurnover: 4.5, // Mock for now, requires COGS calc
        activeAlerts: 2 // Mock
      });

    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }
}
