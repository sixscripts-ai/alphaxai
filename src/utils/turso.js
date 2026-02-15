const { createClient } = require('@libsql/client');
const logger = require('./logger');

let db = null;

const connectTurso = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      logger.warn('DATABASE_URL not set, using in-memory SQLite');
      db = createClient({
        url: ':memory:'
      });
    } else {
      db = createClient({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN
      });
    }

    logger.info('Turso database connected successfully');
    
    // Initialize database schema
    await initializeSchema();
    
    return db;
  } catch (error) {
    logger.error('Turso connection failed:', error);
    throw error;
  }
};

const initializeSchema = async () => {
  try {
    // Create contacts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        company TEXT,
        status TEXT DEFAULT 'lead',
        source TEXT,
        value REAL DEFAULT 0,
        score INTEGER DEFAULT 0,
        notes TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deals table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        contact_id TEXT,
        amount REAL NOT NULL,
        stage TEXT DEFAULT 'prospecting',
        probability INTEGER DEFAULT 0,
        expected_close_date TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )
    `);

    // Create inventory table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 10,
        cost REAL DEFAULT 0,
        price REAL DEFAULT 0,
        supplier TEXT,
        location TEXT,
        last_restock_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Schema initialization failed:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectTurso() first.');
  }
  return db;
};

module.exports = {
  connectTurso,
  getDB
};
