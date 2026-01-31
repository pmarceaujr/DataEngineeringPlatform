/**
 * Data Source Controller
 * Handles CRUD operations for data sources
 */

const { DataSource } = require('../models');
const encryption = require('../utils/encryption');
const { Op } = require('sequelize');

/**
 * Create new data source
 * POST /api/data-sources
 */
exports.createDataSource = async (req, res) => {
  try {
    const { name, type, connectionConfig } = req.body;
    
    // Validate input
    if (!name || !type || !connectionConfig) {
      return res.status(400).json({ 
        error: 'Name, type, and connection config are required' 
      });
    }
    
    // Encrypt sensitive connection details
    const encryptedConfig = encryption.encrypt(JSON.stringify(connectionConfig));
    
    // Create data source
    const dataSource = await DataSource.create({
      userId: req.user.userId,
      name,
      type,
      connectionConfig: encryptedConfig,
      status: 'active'
    });
    
    res.status(201).json({
      message: 'Data source created successfully',
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        status: dataSource.status
        // Don't return connection config (security)
      }
    });
    
  } catch (error) {
    console.error('Create data source error:', error);
    res.status(500).json({ 
      error: 'Failed to create data source' 
    });
  }
};

/**
 * Get all data sources for current user
 * GET /api/data-sources
 */
exports.getDataSources = async (req, res) => {
  try {
    const dataSources = await DataSource.findAll({
      where: { userId: req.user.userId },
      attributes: ['id', 'name', 'type', 'status', 'lastTestedAt', 'lastTestStatus', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ dataSources });
    
  } catch (error) {
    console.error('Get data sources error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data sources' 
    });
  }
};

/**
 * Get single data source by ID
 * GET /api/data-sources/:id
 */
exports.getDataSource = async (req, res) => {
  try {
    const dataSource = await DataSource.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId  // Ensure user owns this source
      }
    });
    
    if (!dataSource) {
      return res.status(404).json({ 
        error: 'Data source not found' 
      });
    }
    
    // Decrypt connection config
    const decryptedConfig = JSON.parse(
      encryption.decrypt(dataSource.connectionConfig)
    );
    
    res.json({
      id: dataSource.id,
      name: dataSource.name,
      type: dataSource.type,
      connectionConfig: decryptedConfig,
      status: dataSource.status,
      lastTestedAt: dataSource.lastTestedAt,
      lastTestStatus: dataSource.lastTestStatus
    });
    
  } catch (error) {
    console.error('Get data source error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data source' 
    });
  }
};

/**
 * Update data source
 * PUT /api/data-sources/:id
 */
exports.updateDataSource = async (req, res) => {
  try {
    const { name, connectionConfig, status } = req.body;
    
    const dataSource = await DataSource.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!dataSource) {
      return res.status(404).json({ 
        error: 'Data source not found' 
      });
    }
    
    // Update fields
    if (name) dataSource.name = name;
    if (status) dataSource.status = status;
    if (connectionConfig) {
      dataSource.connectionConfig = encryption.encrypt(JSON.stringify(connectionConfig));
    }
    
    await dataSource.save();
    
    res.json({
      message: 'Data source updated successfully',
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        status: dataSource.status
      }
    });
    
  } catch (error) {
    console.error('Update data source error:', error);
    res.status(500).json({ 
      error: 'Failed to update data source' 
    });
  }
};

/**
 * Delete data source
 * DELETE /api/data-sources/:id
 */
exports.deleteDataSource = async (req, res) => {
  try {
    const dataSource = await DataSource.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!dataSource) {
      return res.status(404).json({ 
        error: 'Data source not found' 
      });
    }
    
    await dataSource.destroy();
    
    res.json({ 
      message: 'Data source deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete data source error:', error);
    res.status(500).json({ 
      error: 'Failed to delete data source' 
    });
  }
};

/**
 * Test data source connection
 * POST /api/data-sources/:id/test
 */
exports.testConnection = async (req, res) => {
  try {
    const dataSource = await DataSource.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!dataSource) {
      return res.status(404).json({ 
        error: 'Data source not found' 
      });
    }
    
    // Decrypt config
    const config = JSON.parse(encryption.decrypt(dataSource.connectionConfig));
    
    // Test connection based on type
    let testResult;
    switch (dataSource.type) {
      case 'postgresql':
        testResult = await testPostgresConnection(config);
        break;
      case 'rest_api':
        testResult = await testAPIConnection(config);
        break;
      default:
        testResult = { success: false, message: 'Connection test not implemented for this type' };
    }
    
    // Update test status
    await dataSource.update({
      lastTestedAt: new Date(),
      lastTestStatus: testResult.success ? 'success' : 'failed'
    });
    
    res.json(testResult);
    
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      error: 'Connection test failed',
      details: error.message
    });
  }
};


/**
 * Preview data from source
 * POST /api/data-sources/:id/preview
 */
exports.previewData = async (req, res) => {
  try {
    // IMPORTANT: Don't destructure 'query' - keep it as-is to preserve case
    const limit = req.body.limit || 10;
    const query = req.body.query; // Preserve exact case from reques
    
    const dataSource = await DataSource.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!dataSource) {
      return res.status(404).json({ 
        error: 'Data source not found' 
      });
    }
    
    // Decrypt config
    const config = JSON.parse(encryption.decrypt(dataSource.connectionConfig));
    
    let previewData = [];
    let columns = [];
    
    // Fetch preview based on type
    switch (dataSource.type) {
      case 'postgresql':
      case 'mysql':
        const dbResult = await previewFromDatabase(dataSource.type, config, query, limit);
        previewData = dbResult.data;
        columns = dbResult.columns;
        break;
        
      case 'rest_api':
        const apiResult = await previewFromAPI(config, query);
        previewData = apiResult.data.slice(0, limit);
        columns = apiResult.columns;
        break;
        
      default:
        return res.status(400).json({ 
          error: `Preview not supported for ${dataSource.type}` 
        });
    }
    
    res.json({
      data: previewData,
      columns: columns,
      count: previewData.length,
      dataSourceType: dataSource.type
    });
    
  } catch (error) {
    console.error('Preview data error:', error);
    res.status(500).json({ 
      error: 'Failed to preview data',
      details: error.message
    });
  }
};

/**
 * Helper: Preview from database
 */
async function previewFromDatabase(dbType, config, customQuery, limit) {
  const { Client } = require('pg'); // For PostgreSQL
  
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password
  });
  
  try {
    await client.connect();
    
    let query = customQuery;
    if (!query) {
      // If no query and table is specified in config, use it
      if (config.table) {
        // Use double quotes to preserve case in PostgreSQL
        query = `SELECT * FROM "${config.table}" LIMIT ${limit}`;
      } else {
        // Get first table if no query or table provided
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          LIMIT 1
        `);
        
        if (tablesResult.rows.length > 0) {
          const tableName = tablesResult.rows[0].table_name;
          // Use double quotes to preserve case
          query = `SELECT * FROM "${tableName}" LIMIT ${limit}`;
        } else {
          throw new Error('No tables found in database');
        }
      }
    } else {
      // Custom query provided - use it EXACTLY as given (preserve case)
      // Add limit if not present
      if (!query.toLowerCase().includes('limit')) {
        query += ` LIMIT ${limit}`;
      }
    }
    
    console.log('Executing query:', query); // Debug log
    
    const result = await client.query(query);
    await client.end();
    
    const columns = result.fields.map(field => ({
      name: field.name,
      type: field.dataTypeID
    }));
    
    return {
      data: result.rows,
      columns: columns
    };
    
  } catch (error) {
    throw new Error(`Database preview error: ${error.message}`);
  }
}

/**
 * Helper: Preview from REST API
 */
async function previewFromAPI(config, endpoint) {
  const axios = require('axios');
  
  try {
    const url = endpoint ? `${config.baseUrl}${endpoint}` : config.baseUrl;
    
    const headers = {
      ...(config.headers || {}),
      ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
    };
    
    const response = await axios({
      method: 'GET',
      url: url,
      headers: headers,
      timeout: 10000
    });
    
    let data = response.data;
    
    // Handle nested data structures
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Try common array paths
      if (data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        data = data.results;
      } else if (data.items && Array.isArray(data.items)) {
        data = data.items;
      }
    }
    
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    // Extract columns from first item
    const columns = data.length > 0 
      ? Object.keys(data[0]).map(key => ({ name: key, type: typeof data[0][key] }))
      : [];
    
    return {
      data: data,
      columns: columns
    };
    
  } catch (error) {
    throw new Error(`API preview error: ${error.message}`);
  }
}


/**
 * Helper: Test PostgreSQL connection
 */
async function testPostgresConnection(config) {
  const { Client } = require('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password
  });
  
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Helper: Test REST API connection
 */
async function testAPIConnection(config) {
  const axios = require('axios');
  
  try {
    const response = await axios({
      method: 'GET',
      url: config.baseUrl,
      headers: config.headers || {},
      timeout: 5000
    });
    
    return { 
      success: response.status === 200,
      message: `API responded with status ${response.status}`
    };
  } catch (error) {
    return { 
      success: false,
      message: error.message
    };
  }
}