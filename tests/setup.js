// Test setup file

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'mongodb://localhost:27017/alphaxai_test';

// Mock console methods in test environment
global.console = {
  ...console,
  // Suppress debug logs in tests
  debug: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global test timeout
jest.setTimeout(10000);