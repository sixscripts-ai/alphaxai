describe('envValidation', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('returns no issues outside production', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development'
    };

    const { validateEnvironment } = require('../src/utils/envValidation');
    expect(validateEnvironment()).toEqual([]);
  });

  test('returns expected issues in production when required vars are missing', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production'
    };

    delete process.env.TURSO_DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const { validateEnvironment } = require('../src/utils/envValidation');
    const issues = validateEnvironment();

    expect(issues).toContain('TURSO_DATABASE_URL must be set in production');
    expect(issues).toContain('JWT_SECRET must be set to a strong secret in production');
    expect(issues).toContain('GEMINI_API_KEY (or OPENAI_API_KEY fallback) must be set in production');
  });
});
