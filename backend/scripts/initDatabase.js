/**
 * Database Initialization Script
 * Run this to create all tables and seed initial data
 * 
 * 
 * How to run this script:
    cd backend
    node scripts/initDatabase.js

What it does:
    Creates all database tables based on your models
    Creates a default admin user (email: admin@example.com, password: admin123)
    You can use this admin account to login and test the app
 * 
 */

const { syncDatabase, User } = require('../models');
const bcrypt = require('bcrypt');

const initDatabase = async () => {
  console.log('🔄 Initializing database...');
  
  try {
    // Create all tables
    await syncDatabase();
    
    // Check if admin user exists
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true
      });
      
      console.log('✅ Admin user created: admin@example.com / admin123');
      console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    }
    
    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();