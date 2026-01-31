/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get recent activity
router.get('/activity', dashboardController.getActivity);

// Get execution trend
router.get('/trend', dashboardController.getTrend);

module.exports = router;