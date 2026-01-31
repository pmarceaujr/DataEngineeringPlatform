/**
 * PipelineExecution Model
 * Tracks individual pipeline runs
 */

module.exports = (sequelize, DataTypes) => {
  const PipelineExecution = sequelize.define('PipelineExecution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pipelineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pipelines',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('running', 'completed', 'failed', 'cancelled'),
      defaultValue: 'running'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    logs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Execution logs for debugging'
    },
    recordsProcessed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    errorsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    resultData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data for local file downloads or other results'
    },    
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'pipeline_executions'
  });

  PipelineExecution.associate = (models) => {
    PipelineExecution.belongsTo(models.Pipeline, {
      foreignKey: 'pipelineId',
      as: 'Pipeline'
    });
  };
  return PipelineExecution;
};