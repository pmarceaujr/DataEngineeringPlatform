/**
 * Main Server File
 * This is the entry point of the backend application
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

// Import configuration and utilities
const config = require('./config/environment');
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dataSourceRoutes = require('./routes/dataSourceRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); 

// Create Express app
const app = express();

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/dashboard', dashboardRoutes); 

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// WEBSOCKET SETUP
// ============================================

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  
  // Join a room for pipeline updates
  socket.on('join-pipeline', (pipelineId) => {
    socket.join(`pipeline-${pipelineId}`);
    logger.info('Client joined pipeline room', { pipelineId });
  });
  
  // Leave pipeline room
  socket.on('leave-pipeline', (pipelineId) => {
    socket.leave(`pipeline-${pipelineId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Make io accessible to controllers
app.set('io', io);

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase();
    
    // Start listening
    server.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📝 Environment: ${config.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
      
      if (config.NODE_ENV === 'development') {
        logger.info(`
            ================================
            🔧 Development Mode
            ================================
            API Base URL: http://localhost:${config.PORT}/api
            Health Check: http://localhost:${config.PORT}/health
            ================================
        `);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    sequelize.close();
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io };