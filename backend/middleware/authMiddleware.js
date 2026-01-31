/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */

const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Verify JWT token
 * Usage: Add to any route that requires authentication
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];  // Extract token after "Bearer "
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Invalid token format' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Attach user info to request object
    req.user = decoded;
    
    // Continue to next middleware or controller
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
};

/**
 * Check if user has specific role
 * Usage: checkRole(['admin', 'engineer'])
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = { authenticate, checkRole };