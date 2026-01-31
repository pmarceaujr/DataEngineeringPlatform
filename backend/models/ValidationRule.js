/**
 * ValidationRule Model
 * Defines data quality validation rules
 */

module.exports = (sequelize, DataTypes) => {
  const ValidationRule = sequelize.define('ValidationRule', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ruleType: {
      type: DataTypes.ENUM(
        'not_null',          // Check for null values
        'unique',            // Check for duplicates
        'range',             // Check if values are within range
        'format',            // Check if values match pattern (regex)
        'custom'             // Custom SQL or code
      ),
      allowNull: false
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Rule-specific configuration (e.g., min/max for range, regex for format)'
    },
    columnName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Column this rule applies to'
    },
    severity: {
      type: DataTypes.ENUM('critical', 'warning', 'info'),
      defaultValue: 'warning'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'validation_rules'
  });

  return ValidationRule;
};