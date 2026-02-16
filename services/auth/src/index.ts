import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { query } from '@inventory/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', async (req, res) => {
  try {
    const cols = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
    );
    const tables = await query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    res.json({
      status: 'healthy',
      service: 'auth-service',
      db: {
        connected: true,
        user_columns: cols.rows.map((r: any) => r.column_name),
        tables: tables.rows.map((r: any) => r.table_name),
      }
    });
  } catch (err: any) {
    res.json({
      status: 'healthy',
      service: 'auth-service',
      db: { connected: false, error: err.message }
    });
  }
});

app.post('/migrate', async (req, res) => {
  const results: string[] = [];
  try {
    // Add first_name/last_name to users
    const fn = await query(`SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name'`);
    if (fn.rows.length === 0) {
      await query(`ALTER TABLE users ADD COLUMN first_name text`);
      results.push('Added first_name to users');
    } else {
      results.push('first_name already exists');
    }

    const ln = await query(`SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name'`);
    if (ln.rows.length === 0) {
      await query(`ALTER TABLE users ADD COLUMN last_name text`);
      results.push('Added last_name to users');
    } else {
      results.push('last_name already exists');
    }

    // Add description to items
    const desc = await query(`SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='description'`);
    if (desc.rows.length === 0) {
      await query(`ALTER TABLE items ADD COLUMN description text`);
      results.push('Added description to items');
    } else {
      results.push('description already exists');
    }

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, results });
  }
});

app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});
