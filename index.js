const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const logger = require('./src/utils/logger');
const connectDB = require('./src/utils/database');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');
const rateLimiter = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth');
const aiRoutes = require('./src/routes/ai');
const userRoutes = require('./src/routes/user');
const dataRoutes = require('./src/routes/data');

const app = express();
const PORT = config.server.port;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to AlphaX AI - Advanced AI Platform',
    status: 'running',
    version: '2.0.0',
    environment: config.server.env,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`AlphaX AI server running on port ${PORT} in ${config.server.env} mode`);
  });
}

module.exports = app;