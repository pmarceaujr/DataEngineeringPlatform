/**
 * Database Configuration
 * This file sets up the connection to PostgreSQL using Sequelize ORM
 * 
 * What this code does:
Imports Sequelize (the ORM library)
Loads environment variables from .env
Creates a database connection with credentials
Sets up a connection pool (manages multiple database connections efficiently)
Provides a function to test if connection works
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with database credentials
const sequelize = new Sequelize(
  process.env.DB_NAME,              // Database name
  process.env.DB_USER,              // Username
  process.env.DB_PASSWORD,          // Password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',            // We're using PostgreSQL
    logging: false,                 // Set to console.log to see SQL queries
    pool: {
      max: 5,                       // Maximum connections at once
      min: 0,                       // Minimum connections
      acquire: 30000,               // Max time (ms) to get connection before error
      idle: 10000                   // Max time connection can be idle before release
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);                // Exit if database connection fails
  }
};

module.exports = { sequelize, testConnection };