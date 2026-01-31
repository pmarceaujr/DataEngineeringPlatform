/**
 * Pipeline Model
 * Represents data pipelines (ETL workflows)
 */

module.exports = (sequelize, DataTypes) => {
  const Pipeline = sequelize.define('Pipeline', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    workspaceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'workspaces',
        key: 'id'
      }
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'data_sources',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Stores pipeline configuration: nodes, connections, transformations'
    },
    schedule: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cron expression for scheduling (e.g., "0 2 * * *" = daily at 2am)'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'archived'),
      defaultValue: 'draft'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastRunStatus: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'pipelines'
  });

  Pipeline.associate = (models) => {
  Pipeline.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'User'
  });
  
  Pipeline.belongsTo(models.DataSource, {
    foreignKey: 'sourceId',
    as: 'DataSource'
  });
  
  // Add this line:
  Pipeline.hasMany(models.PipelineExecution, {
    foreignKey: 'pipelineId',
    as: 'PipelineExecutions'
  });
};

  return Pipeline;
};