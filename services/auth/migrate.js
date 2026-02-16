const { readFileSync } = require('fs');
const { Pool } = require('pg');
const path = require('path');

async function migrate() {
  const schemaPath = path.resolve(__dirname, '../../packages/database/schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log('Applying database schema...');
    await pool.query(schema);
    console.log('Schema applied successfully.');
  } catch (err) {
    // "already exists" errors are OK — schema was already applied
    if (err.message.includes('already exists')) {
      console.log('Schema already exists, skipping.');
    } else {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();
