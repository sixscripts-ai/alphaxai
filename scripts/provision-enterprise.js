const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://ash-brady-sixscripts-ai.aws-us-west-2.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
});

const ALLOWED_PLANS = new Set(['starter', 'growth', 'enterprise']);

const run = async () => {
  const ownerName = process.env.PROVISION_OWNER_NAME || 'Enterprise Owner';
  const ownerEmail = process.env.PROVISION_OWNER_EMAIL;
  const ownerPassword = process.env.PROVISION_OWNER_PASSWORD;
  const organizationName = process.env.PROVISION_ORG_NAME || 'Enterprise Workspace';
  const plan = process.env.PROVISION_PLAN || 'enterprise';

  if (!ownerEmail || !ownerPassword) {
    throw new Error('PROVISION_OWNER_EMAIL and PROVISION_OWNER_PASSWORD are required');
  }

  if (!ALLOWED_PLANS.has(plan)) {
    throw new Error(`PROVISION_PLAN must be one of: ${Array.from(ALLOWED_PLANS).join(', ')}`);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS organization_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  await db.execute({
    sql: 'INSERT INTO organizations (name, plan) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET plan = excluded.plan',
    args: [organizationName, plan]
  });

  const organization = await db.execute({
    sql: 'SELECT id, name, plan FROM organizations WHERE name = ? LIMIT 1',
    args: [organizationName]
  });

  const organizationId = organization.rows[0].id;

  await db.execute({
    sql: `INSERT INTO organization_users (organization_id, name, email, password, role)
          VALUES (?, ?, ?, ?, 'owner')
          ON CONFLICT(email) DO UPDATE SET
          organization_id = excluded.organization_id,
          name = excluded.name,
          password = excluded.password,
          role = 'owner'`,
    args: [organizationId, ownerName, ownerEmail, ownerPassword]
  });

  process.stdout.write(`Provisioned ${organizationName} (${plan}) with owner ${ownerEmail}\n`);
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
