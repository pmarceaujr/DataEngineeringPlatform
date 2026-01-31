/**
 * Pipeline Executor Service
 * Executes data pipelines
 * 
 * ⚠️ Security Note: The eval() in executeTransform is simplified for this example. In production, use a safe expression evaluator like expr-eval or mathjs.
 * 
 */


const { Pipeline, PipelineExecution, DataSource } = require('../models');
const axios = require('axios');
const { Client } = require('pg');
const encryption = require('../utils/encryption');

/**
 * Execute a pipeline - UPDATED to handle local file downloads
 */
exports.execute = async (pipeline, executionId) => {
  const execution = await PipelineExecution.findByPk(executionId);
  let logs = '';
  
  try {
    logs += `[${new Date().toISOString()}] Starting pipeline execution\n`;
    console.log('Starting pipeline execution for:', pipeline.name);
    
    const config = pipeline.config;
    const nodes = config.nodes || [];
    
    console.log('Total nodes:', nodes.length);
    logs += `[${new Date().toISOString()}] Total nodes: ${nodes.length}\n`;
    
    let data = [];
    let recordsProcessed = 0;
    let errorsCount = 0;
    let destinationResult = null;
    
    // Process each node in sequence
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      console.log(`Processing node ${i + 1}/${nodes.length}:`, node.type, node.name);
      logs += `[${new Date().toISOString()}] Processing node: ${node.name} (${node.type})\n`;
      
      try {
        switch (node.type) {
          case 'source':
            // Fetch data from source
            console.log('Source node config:', node.config);
            data = await fetchFromSource(node.config);
            console.log('Fetched records:', data.length);
            logs += `[${new Date().toISOString()}] Fetched ${data.length} records from source\n`;
            break;
            
          case 'transform':
            // Transform the data
            console.log('Transform node - input records:', data.length);
            data = await executeTransform(data, node.config);
            console.log('Transform node - output records:', data.length);
            logs += `[${new Date().toISOString()}] Transform complete: ${data.length} records\n`;
            break;
            
          case 'validate':
            // Validate the data
            console.log('Validate node - records to validate:', data.length);
            const validationResult = await executeValidation(data, node.config);
            errorsCount += validationResult.errorsCount;
            console.log('Validation errors:', validationResult.errorsCount);
            logs += `[${new Date().toISOString()}] Validation complete: ${validationResult.errorsCount} errors\n`;
            break;

            
          case 'destination':
            destinationResult = await writeToDestination(data, node.config);
            recordsProcessed = destinationResult.recordCount || data.length;
            logs += `[${new Date().toISOString()}] Written ${recordsProcessed} records\n`;
            break;

          // case 'destination':
          //   // Write to destination
          //   console.log('Destination node - records to write:', data.length);
          //   const destResult = await writeToDestination(data, node.config);
          //   recordsProcessed = destResult.recordCount || data.length;
          //   console.log('Records written:', recordsProcessed);
          //   logs += `[${new Date().toISOString()}] Written ${recordsProcessed} records to destination\n`;
          //   break;
            
          default:
            logs += `[${new Date().toISOString()}] Unknown node type: ${node.type}\n`;
        }
      } catch (error) {
        errorsCount++;
        const errorMsg = `ERROR in node ${node.name}: ${error.message}`;
        console.error(errorMsg);
        logs += `[${new Date().toISOString()}] ${errorMsg}\n`;
      }
    }
    
    // Update execution record
    await execution.update({
      status: errorsCount > 0 ? 'failed' : 'completed',
      completedAt: new Date(),
      logs,
      recordsProcessed,
      errorsCount
    });
    
    await pipeline.update({
      lastRunAt: new Date(),
      lastRunStatus: errorsCount > 0 ? 'failed' : 'completed'
    });


    logs += `[${new Date().toISOString()}] Pipeline execution completed\n`;
    console.log('Pipeline execution completed. Records:', recordsProcessed, 'Errors:', errorsCount);
    
    return { 
      success: errorsCount === 0, 
      recordsProcessed, 
      errorsCount,
      destinationResult: destinationResult,
      data: data // Include the actual data
    };
    
  } catch (error) {
    logs += `[${new Date().toISOString()}] FATAL ERROR: ${error.message}\n`;
    console.error('Fatal pipeline error:', error);
    
    await execution.update({
      status: 'failed',
      completedAt: new Date(),
      logs,
      errorMessage: error.message
    });
    
    throw error;
  }
};

/**
 * Fetch data from source
 */
async function fetchFromSource(config) {
  console.log('fetchFromSource called with config:', config);
  
  if (!config.dataSourceId) {
    throw new Error('No data source specified in source node');
  }
  
  const dataSource = await DataSource.findByPk(config.dataSourceId);
  if (!dataSource) {
    throw new Error('Data source not found');
  }
  
  console.log('Data source type:', dataSource.type);
  console.log('Data source name:', dataSource.name);
  
  // Decrypt connection config
  const connectionConfig = JSON.parse(encryption.decrypt(dataSource.connectionConfig));
  console.log('Connection config (decrypted):', { ...connectionConfig, password: '[HIDDEN]' });
  
  switch (dataSource.type) {
    case 'postgresql':
    case 'mysql':
      return await fetchFromDatabase(dataSource.type, connectionConfig, config);
      
    case 'rest_api':
      return await fetchFromAPI(connectionConfig, config);
      
    default:
      throw new Error(`Unsupported source type: ${dataSource.type}`);
  }
}

/**
 * Fetch from database
 */
async function fetchFromDatabase(dbType, connectionConfig, nodeConfig) {
  console.log('Connecting to database...');
  
  const client = new Client({
    host: connectionConfig.host,
    port: connectionConfig.port,
    database: connectionConfig.database,
    user: connectionConfig.username,
    password: connectionConfig.password
  });
  
  await client.connect();
  console.log('Database connected');
  
  try {
    let query;
    
    // PRIORITY 1: Custom query from node config (the modal)
    if (nodeConfig.query && nodeConfig.query.trim()) {
      query = nodeConfig.query.trim();
      console.log('✓ Using custom query from node config');
    }
    // PRIORITY 2: Table from node config
    else if (nodeConfig.table && nodeConfig.table.trim()) {
      query = `SELECT * FROM "${nodeConfig.table}"`;
      console.log('Using table from node config:', nodeConfig.table);
    }
    // PRIORITY 3: Default table from data source
    else if (connectionConfig.table && connectionConfig.table.trim()) {
      query = `SELECT * FROM "${connectionConfig.table}"`;
      console.log('Using default table from connection config:', connectionConfig.table);
    }
    else {
      throw new Error('No query or table specified');
    }
    
    // Add LIMIT if specified and not already in query
    if (nodeConfig.limit && !query.toUpperCase().includes('LIMIT')) {
      query += ` LIMIT ${nodeConfig.limit}`;
    }
    
    console.log('Final query:', query);
    
    const result = await client.query(query);
    console.log('✓ Query returned', result.rows.length, 'rows');
    
    await client.end();
    return result.rows;
    
  } catch (error) {
    await client.end();
    throw error;
  }
}

/**
 * Fetch from REST API
 */
async function fetchFromAPI(connectionConfig, nodeConfig) {
  console.log('Fetching from API...');
  
  const endpoint = nodeConfig.endpoint || connectionConfig.endpoint || '';
  const url = `${connectionConfig.baseUrl}${endpoint}`;
  
  console.log('API URL:', url);
  
  const headers = {
    ...connectionConfig.headers,
    ...(connectionConfig.apiKey ? { 'Authorization': `Bearer ${connectionConfig.apiKey}` } : {})
  };
  
  console.log('Request headers:', headers);
  
  const response = await axios({
    method: nodeConfig.method || 'GET',
    url: url,
    headers: headers,
    params: nodeConfig.queryParams || {},
    timeout: 30000
  });
  
  console.log('API response status:', response.status);
  
  let data = response.data;
  
  // Handle nested response structures
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Try common paths
    if (data.data && Array.isArray(data.data)) {
      data = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      data = data.results;
    } else if (data.items && Array.isArray(data.items)) {
      data = data.items;
    }
  }
  
  // Ensure we have an array
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  console.log('API returned', data.length, 'records');
  
  return data;
}

/**
 * Execute transform
 */
async function executeTransform(data, config) {
  console.log('Transform type:', config.transformType);
  console.log('Input records:', data.length);
  console.log('Condition:', config.condition);
  
  if (data.length === 0) return data;
  
  if (config.transformType === 'filter' && config.condition) {
    return data.filter(row => evaluateCondition(row, config.condition));
  }
  
  return data;
}

/**
 * Evaluate filter condition
 */
function evaluateCondition(row, condition) {
  // Parse: field operator value
  const match = condition.match(/^(\w+\.?\w*)\s*(==|!=|>|>=|<|<=|contains)\s*(.+)$/i);
  
  if (!match) return true;
  
  const field = match[1];
  const operator = match[2].toLowerCase();
  let value = match[3].trim();
  
  // Get field value (supports nested: rating.rate)
  const fieldValue = field.split('.').reduce((obj, key) => obj?.[key], row);
  
  // Remove quotes
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  
  // Convert value type
  const compareValue = !isNaN(value) ? parseFloat(value) : value;
  
  // Evaluate
  switch (operator) {
    case '==': return fieldValue == compareValue;
    case '!=': return fieldValue != compareValue;
    case '>': return Number(fieldValue) > Number(compareValue);
    case '>=': return Number(fieldValue) >= Number(compareValue);
    case '<': return Number(fieldValue) < Number(compareValue);
    case '<=': return Number(fieldValue) <= Number(compareValue);
    case 'contains': return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    default: return true;
  }
}

/**
 * Execute validation
 */
async function executeValidation(data, config) {
  console.log('Executing validation');
  // For now, just pass through
  return {
    errorsCount: 0,
    validRecords: data.length
  };
}

/**
 * Write to destination
 */
async function writeToDestination(data, config) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ WRITE TO DESTINATION                                       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('Data source ID:', config.dataSourceId);
  console.log('Records to write:', data.length);
  
  if (!config.dataSourceId) {
    throw new Error('No destination data source specified');
  }
  
  const dataSource = await DataSource.findByPk(config.dataSourceId);
  if (!dataSource) {
    throw new Error('Destination data source not found');
  }
  
  console.log('Destination type:', dataSource.type);
  console.log('Destination name:', dataSource.name);
  
  // For local file, just return the data
  if (dataSource.type === 'local_file') {
    console.log('✓ LOCAL FILE DESTINATION CONFIRMED');
    
    const result = {
      type: 'local_file',
      data: data,
      recordCount: data.length,
      config: config
    };
    
    console.log('Returning result:', {
      type: result.type,
      recordCount: result.recordCount,
      hasData: !!result.data,
      dataLength: result.data?.length
    });
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    return result;
  }
  
  console.log('Not a local file destination');
  console.log('╚════════════════════════════════════════════════════════════╝');

  
  return {
    recordCount: data.length
  };
}

module.exports = exports;