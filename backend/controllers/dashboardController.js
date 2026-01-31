/**
 * Dashboard Controller
 * Provides statistics and metrics for the dashboard
 */

const { Pipeline, PipelineExecution, DataSource, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Get dashboard statistics
 * GET /api/dashboard/stats
 */
exports.getStats = async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('Dashboard: Getting stats for user', req.user.userId);
    
    const userId = req.user.userId;
    
    // Get total pipelines
    const totalPipelines = await Pipeline.count({
      where: { userId }
    });
    
    // Get active pipelines
    const activePipelines = await Pipeline.count({
      where: { 
        userId,
        status: 'active'
      }
    });
    
    // Get total data sources
    const totalDataSources = await DataSource.count({
      where: { userId }
    });
    
    // Get total executions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const totalExecutions = await PipelineExecution.count({
      include: [{
        model: Pipeline,
        where: { userId },
        required: true
      }],
      where: {
        startedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    // Get successful executions
    const successfulExecutions = await PipelineExecution.count({
      include: [{
        model: Pipeline,
        where: { userId },
        required: true
      }],
      where: {
        status: 'completed',
        startedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    // Get failed executions
    const failedExecutions = await PipelineExecution.count({
      include: [{
        model: Pipeline,
        where: { userId },
        required: true
      }],
      where: {
        status: 'failed',
        startedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    // Calculate success rate
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;
    
    // Get total records processed (last 30 days)
    const recordsResult = await PipelineExecution.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('recordsProcessed')), 'total']
      ],
      include: [{
        model: Pipeline,
        where: { userId },
        attributes: [],
        required: true
      }],
      where: {
        status: 'completed',
        startedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      raw: true
    });
    
    const totalRecordsProcessed = parseInt(recordsResult[0]?.total || 0);
    
    const stats = {
      totalPipelines,
      activePipelines,
      totalDataSources,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
      totalRecordsProcessed
    };
    
    console.log('Dashboard stats:', stats);
    console.log('═══════════════════════════════════════════');
    
    res.json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/activity
 */
exports.getActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('Dashboard: Getting recent activity for user', userId);
    
    // Get recent pipeline executions
    const recentExecutions = await PipelineExecution.findAll({
      include: [{
        model: Pipeline,
        where: { userId },
        attributes: ['id', 'name'],
        required: true
      }],
      order: [['startedAt', 'DESC']],
      limit: limit
    });
    
    console.log('Found', recentExecutions.length, 'recent executions');
    
    res.json(recentExecutions);
    
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity' 
    });
  }
};

/**
 * Get execution trend data (last 7 days)
 * GET /api/dashboard/trend
 */
exports.getTrend = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Dashboard: Getting trend data for user', userId);
    
    // Get executions for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const executions = await PipelineExecution.findAll({
      include: [{
        model: Pipeline,
        where: { userId },
        attributes: [],
        required: true
      }],
      where: {
        startedAt: {
          [Op.gte]: sevenDaysAgo
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('PipelineExecution.id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('startedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('startedAt')), 'ASC']],
      raw: true
    });
    
    // Fill in missing days with 0
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = executions.find(e => e.date === dateStr);
      trend.push({
        date: dateStr,
        count: existing ? parseInt(existing.count) : 0
      });
    }
    
    console.log('Trend data:', trend);
    
    res.json(trend);
    
  } catch (error) {
    console.error('Dashboard trend error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trend data' 
    });
  }
};