const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const logger = require('./logger');

let client;

const migrations = [
  {
    id: '001_create_organizations',
    sql: `
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        owner_id TEXT,
        plan TEXT NOT NULL DEFAULT 'starter',
        settings TEXT NOT NULL,
        monthly_requests INTEGER NOT NULL DEFAULT 0,
        current_month TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
  },
  {
    id: '002_create_users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        organization_id TEXT,
        organization_role TEXT NOT NULL DEFAULT 'member',
        preferences TEXT NOT NULL,
        total_requests INTEGER NOT NULL DEFAULT 0,
        monthly_requests INTEGER NOT NULL DEFAULT 0,
        current_month TEXT NOT NULL,
        last_request_at TEXT,
        last_login_at TEXT,
        password_reset_token TEXT,
        password_reset_expires TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
      )
    `
  },
  {
    id: '003_create_conversations',
    sql: `
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        title TEXT NOT NULL,
        messages TEXT NOT NULL,
        settings TEXT NOT NULL,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost REAL NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `
  },
  {
    id: '004_create_platform_leads',
    sql: `
      CREATE TABLE IF NOT EXISTS platform_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        company TEXT,
        message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
];

const getDB = () => {
  if (!client) {
    const dbUrl = config.database.turso.url;

    if (dbUrl.startsWith('file:')) {
      const filePath = dbUrl.replace('file:', '');
      const dirPath = path.dirname(filePath);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    client = createClient({
      url: dbUrl,
      authToken: config.database.turso.authToken
    });
  }

  return client;
};

const initSchema = async () => {
  const db = getDB();

  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const existingResult = await db.execute('SELECT id FROM schema_migrations');
  const appliedIds = new Set(existingResult.rows.map((row) => row.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    await db.execute(migration.sql);
    await db.execute({
      sql: 'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
      args: [migration.id, new Date().toISOString()]
    });
    logger.info(`Applied migration: ${migration.id}`);
  }
};

const connectDB = async () => {
  try {
    const db = getDB();
    await db.execute('SELECT 1 as ok');
    await initSchema();
    logger.info('Turso connected and schema initialized');
  } catch (error) {
    logger.error('Turso connection failed:', error);
    logger.warn('Continuing without an active Turso connection; API calls that require DB may fail until connectivity is restored.');
  }
};

module.exports = connectDB;
module.exports.getDB = getDB;
module.exports.initSchema = initSchema;
