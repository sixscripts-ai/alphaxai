import { Request, Response } from 'express';
import { db } from '@inventory/database';

export class ReportController {

  static async initTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS saved_reports (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name text NOT NULL,
          type text NOT NULL DEFAULT 'inventory',
          config jsonb NOT NULL DEFAULT '{}',
          created_by uuid REFERENCES users(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      console.log('saved_reports table ready');
    } catch (err) {
      console.error('Error initializing saved_reports table:', err);
    }
  }

  // GET /api/inventory/reports
  static async listReports(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;

      const result = await db.query(`
        SELECT id, name, type, config, created_by, created_at, updated_at
        FROM saved_reports
        WHERE org_id = $1
        ORDER BY updated_at DESC
      `, [orgId]);

      res.json(result.rows.map(r => ({
        ...r,
        config: typeof r.config === 'string' ? JSON.parse(r.config) : r.config,
      })));
    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({ error: 'Failed to list reports' });
    }
  }

  // POST /api/inventory/reports
  static async createReport(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const userId = (req as any).user.userId;
      const { name, type, config } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Report name is required' });
      }

      const result = await db.query(`
        INSERT INTO saved_reports (org_id, name, type, config, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, type, config, created_by, created_at, updated_at
      `, [orgId, name, type || 'inventory', JSON.stringify(config || {}), userId || null]);

      const report = result.rows[0];
      res.status(201).json({
        ...report,
        config: typeof report.config === 'string' ? JSON.parse(report.config) : report.config,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  // PUT /api/inventory/reports/:id
  static async updateReport(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const { id } = req.params;
      const { name, type, config } = req.body;

      const result = await db.query(`
        UPDATE saved_reports
        SET name = COALESCE($1, name),
            type = COALESCE($2, type),
            config = COALESCE($3, config),
            updated_at = now()
        WHERE id = $4 AND org_id = $5
        RETURNING id, name, type, config, created_by, created_at, updated_at
      `, [name || null, type || null, config ? JSON.stringify(config) : null, id, orgId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json({
        ...result.rows[0],
        config: typeof result.rows[0].config === 'string' ? JSON.parse(result.rows[0].config) : result.rows[0].config,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }

  // DELETE /api/inventory/reports/:id
  static async deleteReport(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId;
      const { id } = req.params;

      const result = await db.query(
        'DELETE FROM saved_reports WHERE id = $1 AND org_id = $2 RETURNING id',
        [id, orgId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json({ message: 'Report deleted' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
}
