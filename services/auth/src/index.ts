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

app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});
