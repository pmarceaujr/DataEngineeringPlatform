/**
 * Environment Configuration
 * Centralizes all environment variables with validation
 * 
 * What this code does:
    Checks that all required environment variables are present (prevents app from starting with missing config)
    Exports a clean object with all configuration values
    Provides defaults for optional values
 */

require('dotenv').config();

// Validate that required environment variables exist
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'SENDGRID_API_KEY',
  'FROM_EMAIL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',                   // Tokens expire after 7 days
  
  // Email
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL
  },
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // OpenAI (optional)
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  
  // App settings
  maxPipelineExecutionTime: 3600000,    // 1 hour in milliseconds
  defaultPageSize: 20                   // For pagination
};