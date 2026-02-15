const path = require('path');

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    turso: {
      url: process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'data', 'alphaxai.db')}`,
      authToken: process.env.TURSO_AUTH_TOKEN || ''
    }
  },

  // AI Service Configuration
  ai: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      models: {
        text: process.env.GEMINI_TEXT_MODEL || 'gemini-pro-3',
        vision: process.env.GEMINI_VISION_MODEL || 'gemini-pro-vision',
        embedding: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
      }
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/models'
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com'
    }
  },

  // Authentication & Security
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/csv'],
    destination: process.env.UPLOAD_PATH || './uploads'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    filename: process.env.LOG_FILENAME || 'logs/alphaxai.log'
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@alphaxai.com'
  },

  // Monitoring & Analytics
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false'
  }
};
