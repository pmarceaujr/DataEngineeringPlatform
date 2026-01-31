/**
 * DataSource Model
 * Represents external data sources (databases, APIs, cloud storage)
 * 
 * Why JSONB for connectionConfig?
    Different data sources need different connection details:

    PostgreSQL needs: host, port, database, username, password
    REST API needs: baseUrl, apiKey, headers
    AWS S3 needs: bucketName, region, accessKey, secretKey

    JSONB lets us store flexible JSON objects instead of creating separate columns for each possibility.
 */

module.exports = (sequelize, DataTypes) => {
  const DataSource = sequelize.define('DataSource', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('postgresql', 'mysql', 'rest_api', 'aws_s3', 'azure_blob', 'gcp_storage', 'local_file'),
      allowNull: false
    },
    connectionConfig: {
      type: DataTypes.JSONB,          // JSONB = JSON data stored efficiently
      allowNull: false,
      comment: 'Stores connection details like host, port, credentials (encrypted)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      defaultValue: 'active'
    },
    lastTestedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastTestStatus: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'data_sources'
  });

  return DataSource;
};