import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('.render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect()
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();
