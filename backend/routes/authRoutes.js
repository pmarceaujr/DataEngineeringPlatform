/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/register', 
  validate(schemas.register),
  authController.register
);

router.post('/login',
  validate(schemas.login),
  authController.login
);

router.post('/forgot-password',
  authController.forgotPassword
);

router.post('/reset-password',
  authController.resetPassword
);

// Protected routes (authentication required)
router.get('/me',
  authenticate,
  authController.getProfile
);

router.put('/profile',
  authenticate,
  authController.updateProfile
);

module.exports = router;