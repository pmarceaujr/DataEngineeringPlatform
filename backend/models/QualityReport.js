/**
 * QualityReport Model
 * Stores results of data quality checks
 */

module.exports = (sequelize, DataTypes) => {
  const QualityReport = sequelize.define('QualityReport', {
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
    executionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pipeline_executions',
        key: 'id'
      }
    },
    qualityScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Overall quality score (0-100)'
    },
    totalRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    validRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    invalidRecords: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    issues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detailed list of quality issues found'
    },
    rulesEvaluated: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rulesPassed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rulesFailed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'quality_reports'
  });

  return QualityReport;
};