const path = require('path');
const fs = require('fs');

const tmpDir = path.join(__dirname, 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.TURSO_DATABASE_URL = `file:${path.join(__dirname, 'tmp', 'alphaxai-test.db')}`;
process.env.TURSO_AUTH_TOKEN = '';

global.console = {
  ...console,
  debug: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.setTimeout(10000);
