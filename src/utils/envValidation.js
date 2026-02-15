const config = require('../../config');

const DEFAULT_JWT_SECRET = 'your-super-secret-jwt-key';

const validateEnvironment = () => {
  const issues = [];
  const isProduction = config.server.env === 'production';

  if (!isProduction) {
    return issues;
  }

  if (!process.env.TURSO_DATABASE_URL) {
    issues.push('TURSO_DATABASE_URL must be set in production');
  }

  if (config.auth.jwt.secret === DEFAULT_JWT_SECRET) {
    issues.push('JWT_SECRET must be set to a strong secret in production');
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    issues.push('GEMINI_API_KEY (or OPENAI_API_KEY fallback) must be set in production');
  }

  return issues;
};

module.exports = {
  validateEnvironment
};
