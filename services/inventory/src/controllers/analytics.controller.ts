import { Request, Response } from 'express';
import { db } from '@inventory/database';

export class AnalyticsController {
  
  // GET /api/inventory/analytics/history
  // Query params: locationId (optional), itemId (optional), startDate, endDate, days (optional)
  static async getHistory(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const { locationId, itemId, startDate, endDate, days } = req.query;

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
      } else if (days) {
        const nDays = parseInt(days as string) || 30;
        query += ` AND day >= CURRENT_DATE - INTERVAL '${nDays} days'`;
      }

      if (endDate) {
        query += ` AND day <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` GROUP BY day ORDER BY day ASC`;

      const result = await db.query(query, params);
      
      const chartData = result.rows.map(row => ({
        date: row.day,
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
      const orgId = (req as any).user.orgId;
      const { locationId, itemId } = req.query;

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
      
      query += ` AND day >= CURRENT_DATE`;
      query += ` GROUP BY day ORDER BY day ASC LIMIT 30`;

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
  static async getSummary(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      
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
        inventoryTurnover: 4.5,
        activeAlerts: 2
      });

    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }

  // GET /api/inventory/analytics/top-movers
  static async getTopMovers(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const { limit } = req.query;
      const rowLimit = Math.min(parseInt(limit as string) || 10, 50);

      const result = await db.query(`
        SELECT 
          i.id, i.name, i.sku, i.category,
          COUNT(im.id)::int as movement_count,
          SUM(CASE WHEN im.signed_quantity > 0 THEN im.signed_quantity ELSE 0 END) as total_in,
          SUM(CASE WHEN im.signed_quantity < 0 THEN ABS(im.signed_quantity) ELSE 0 END) as total_out,
          COALESCE(AVG(ic.unit_cost), 0) as avg_cost
        FROM inventory_movements im
        JOIN items i ON i.id = im.item_id
        LEFT JOIN item_costs ic ON ic.item_id = i.id
        WHERE i.org_id = $1
        GROUP BY i.id, i.name, i.sku, i.category
        ORDER BY movement_count DESC
        LIMIT $2
      `, [orgId, rowLimit]);

      const movers = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category,
        movementCount: Number(row.movement_count),
        totalIn: Number(row.total_in),
        totalOut: Number(row.total_out),
        avgCost: Number(row.avg_cost),
        netFlow: Number(row.total_in) - Number(row.total_out)
      }));

      res.json(movers);
    } catch (error) {
      console.error('Error fetching top movers:', error);
      res.status(500).json({ error: 'Failed to fetch top movers' });
    }
  }

  // GET /api/inventory/analytics/turnover
  static async getTurnoverTrend(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const { months } = req.query;
      const nMonths = Math.min(parseInt(months as string) || 6, 24);

      const result = await db.query(`
        WITH monthly_usage AS (
          SELECT 
            DATE_TRUNC('month', occurred_at)::date as month,
            SUM(CASE WHEN signed_quantity < 0 THEN ABS(signed_quantity) ELSE 0 END) as units_used
          FROM inventory_movements
          WHERE org_id = $1 AND occurred_at >= CURRENT_DATE - INTERVAL '${nMonths} months'
          GROUP BY DATE_TRUNC('month', occurred_at)
        ),
        avg_inventory AS (
          SELECT 
            DATE_TRUNC('month', day)::date as month,
            AVG(on_hand) as avg_on_hand,
            AVG(inventory_value) as avg_value
          FROM inventory_snapshot_daily
          WHERE org_id = $1 AND day >= CURRENT_DATE - INTERVAL '${nMonths} months'
          GROUP BY DATE_TRUNC('month', day)
        )
        SELECT 
          COALESCE(m.month, i.month) as month,
          COALESCE(m.units_used, 0) as units_used,
          COALESCE(i.avg_on_hand, 0) as avg_on_hand,
          COALESCE(i.avg_value, 0) as avg_value,
          CASE 
            WHEN COALESCE(i.avg_on_hand, 0) > 0 
            THEN ROUND(COALESCE(m.units_used, 0) / i.avg_on_hand, 4) 
            ELSE 0 
          END as turnover_rate
        FROM monthly_usage m
        FULL OUTER JOIN avg_inventory i ON m.month = i.month
        ORDER BY month ASC
      `, [orgId]);

      const trend = result.rows.map(row => ({
        month: row.month,
        unitsUsed: Number(row.units_used),
        avgOnHand: Number(row.avg_on_hand),
        avgValue: Number(row.avg_value),
        turnoverRate: Number(row.turnover_rate)
      }));

      res.json(trend);
    } catch (error) {
      console.error('Error fetching turnover trend:', error);
      res.status(500).json({ error: 'Failed to fetch turnover trend' });
    }
  }

  // GET /api/inventory/analytics/abc-classification
  static async getABCClassification(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;

      const result = await db.query(`
        WITH stock_value AS (
          SELECT 
            i.id, i.name, i.sku, i.category,
            COALESCE(SUM(im.signed_quantity), 0) as current_qty,
            COALESCE(AVG(ic.unit_cost), 0) as unit_cost,
            COALESCE(SUM(im.signed_quantity), 0) * COALESCE(AVG(ic.unit_cost), 0) as total_value
          FROM items i
          LEFT JOIN inventory_movements im ON im.item_id = i.id
          LEFT JOIN item_costs ic ON ic.item_id = i.id
          WHERE i.org_id = $1 AND i.is_active = true
          GROUP BY i.id, i.name, i.sku, i.category
          HAVING COALESCE(SUM(im.signed_quantity), 0) > 0
          ORDER BY total_value DESC
        ),
        totals AS (
          SELECT SUM(total_value) as grand_total FROM stock_value
        )
        SELECT 
          sv.*,
          t.grand_total,
          SUM(sv.total_value) OVER (ORDER BY sv.total_value DESC) as running_total,
          CASE 
            WHEN SUM(sv.total_value) OVER (ORDER BY sv.total_value DESC) / NULLIF(t.grand_total, 0) <= 0.8 THEN 'A'
            WHEN SUM(sv.total_value) OVER (ORDER BY sv.total_value DESC) / NULLIF(t.grand_total, 0) <= 0.95 THEN 'B'
            ELSE 'C'
          END as abc_class
        FROM stock_value sv, totals t
      `, [orgId]);

      const items = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        category: row.category,
        currentQty: Number(row.current_qty),
        unitCost: Number(row.unit_cost),
        totalValue: Number(row.total_value),
        pctOfTotal: Number(row.total_value) / (Number(row.grand_total) || 1) * 100,
        cumulativePct: Number(row.running_total) / (Number(row.grand_total) || 1) * 100,
        abcClass: row.abc_class
      }));

      const classes = {
        A: items.filter(i => i.abcClass === 'A'),
        B: items.filter(i => i.abcClass === 'B'),
        C: items.filter(i => i.abcClass === 'C'),
      };

      res.json({
        items,
        classes: {
          A: { count: classes.A.length, value: classes.A.reduce((s, i) => s + i.totalValue, 0) },
          B: { count: classes.B.length, value: classes.B.reduce((s, i) => s + i.totalValue, 0) },
          C: { count: classes.C.length, value: classes.C.reduce((s, i) => s + i.totalValue, 0) },
        },
        totalValue: Number(result.rows[0]?.grand_total || 0)
      });
    } catch (error) {
      console.error('Error fetching ABC classification:', error);
      res.status(500).json({ error: 'Failed to fetch ABC classification' });
    }
  }

  // GET /api/inventory/analytics/forecast-accuracy
  static async getForecastAccuracy(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;

      const result = await db.query(`
        SELECT 
          model,
          window_days,
          AVG(mae) as avg_mae,
          AVG(rmse) as avg_rmse,
          AVG(mape) as avg_mape,
          COUNT(*) as data_points
        FROM forecast_accuracy
        WHERE org_id = $1
        GROUP BY model, window_days
        ORDER BY model, window_days
      `, [orgId]);

      const accuracy = result.rows.map(row => ({
        model: row.model,
        windowDays: row.window_days,
        mae: Number(row.avg_mae),
        rmse: Number(row.avg_rmse),
        mape: Number(row.avg_mape),
        dataPoints: Number(row.data_points)
      }));

      res.json(accuracy);
    } catch (error) {
      console.error('Error fetching forecast accuracy:', error);
      res.status(500).json({ error: 'Failed to fetch forecast accuracy' });
    }
  }
}
