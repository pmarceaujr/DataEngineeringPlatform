/**
 * Models Index
 * Imports all models and sets up relationships between them
 * 
 * What this code does:
        Imports all model definitions
        Defines how tables relate to each other (e.g., a User has many Pipelines)
        CASCADE means if you delete a User, their Pipelines also get deleted
        Exports everything so other files can use these models
 */

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all model definitions
const User = require('./User')(sequelize, DataTypes);
const DataSource = require('./DataSource')(sequelize, DataTypes);
const Pipeline = require('./Pipeline')(sequelize, DataTypes);
const PipelineExecution = require('./PipelineExecution')(sequelize, DataTypes);
const ValidationRule = require('./ValidationRule')(sequelize, DataTypes);
const QualityReport = require('./QualityReport')(sequelize, DataTypes);
const Workspace = require('./Workspace')(sequelize, DataTypes);
const Task = require('./Task')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);

// Define relationships between models

// User relationships
User.hasMany(DataSource, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Pipeline, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Workspace, { foreignKey: 'ownerId', onDelete: 'CASCADE' });
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });

// DataSource relationships
DataSource.belongsTo(User, { foreignKey: 'userId' });
DataSource.hasMany(Pipeline, { foreignKey: 'sourceId' });

// Pipeline relationships
Pipeline.belongsTo(User, { foreignKey: 'userId' });
Pipeline.belongsTo(Workspace, { foreignKey: 'workspaceId' });
Pipeline.belongsTo(DataSource, { foreignKey: 'sourceId' });
Pipeline.hasMany(PipelineExecution, { foreignKey: 'pipelineId', onDelete: 'CASCADE' });
Pipeline.hasMany(ValidationRule, { foreignKey: 'pipelineId', onDelete: 'CASCADE' });
Pipeline.hasMany(Task, { foreignKey: 'pipelineId' });
Pipeline.hasMany(Comment, { foreignKey: 'pipelineId', onDelete: 'CASCADE' });

// PipelineExecution relationships
PipelineExecution.belongsTo(Pipeline, { foreignKey: 'pipelineId' });
PipelineExecution.hasOne(QualityReport, { foreignKey: 'executionId', onDelete: 'CASCADE' });

// ValidationRule relationships
ValidationRule.belongsTo(Pipeline, { foreignKey: 'pipelineId' });

// QualityReport relationships
QualityReport.belongsTo(Pipeline, { foreignKey: 'pipelineId' });
QualityReport.belongsTo(PipelineExecution, { foreignKey: 'executionId' });

// Workspace relationships
Workspace.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
Workspace.hasMany(Pipeline, { foreignKey: 'workspaceId' });
Workspace.hasMany(Task, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });

// Task relationships
Task.belongsTo(Workspace, { foreignKey: 'workspaceId' });
Task.belongsTo(Pipeline, { foreignKey: 'pipelineId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });

// Comment relationships
Comment.belongsTo(User, { foreignKey: 'userId' });
Comment.belongsTo(Pipeline, { foreignKey: 'pipelineId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });

// Sync database (creates tables if they don't exist)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });  // alter: true updates existing tables
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
  }
};

module.exports = {
  sequelize,
  User,
  DataSource,
  Pipeline,
  PipelineExecution,
  ValidationRule,
  QualityReport,
  Workspace,
  Task,
  Comment,
  syncDatabase
};