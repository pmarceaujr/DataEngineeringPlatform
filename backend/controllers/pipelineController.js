/**
 * Pipeline Controller
 * Handles pipeline CRUD and execution
 */

const { Pipeline, PipelineExecution, DataSource, User } = require('../models');
const pipelineExecutor = require('../services/pipelineExecutor');
const { Op } = require('sequelize');

/**
 * Create new pipeline
 * POST /api/pipelines
 */
exports.createPipeline = async (req, res) => {
  try {
    const { name, description, config, workspaceId, sourceId, schedule } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ 
        error: 'Name and config are required' 
      });
    }
    
    const pipeline = await Pipeline.create({
      userId: req.user.userId,
      name,
      description,
      config,
      workspaceId,
      sourceId,
      schedule,
      status: 'draft',
      version: 1
    });
    
    res.status(201).json({
      message: 'Pipeline created successfully',
      pipeline
    });
    
  } catch (error) {
    console.error('Create pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to create pipeline' 
    });
  }
};

/**
 * Get all pipelines
 * GET /api/pipelines
 */
exports.getPipelines = async (req, res) => {
  try {
    const { workspaceId, status } = req.query;
    
    const where = { userId: req.user.userId };
    if (workspaceId) where.workspaceId = workspaceId;
    if (status) where.status = status;
    
    const pipelines = await Pipeline.findAll({
      where,
      include: [
        {
          model: DataSource,
          attributes: ['id', 'name', 'type']
        },
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json( pipelines );
    
  } catch (error) {
    console.error('Get pipelines error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pipelines' 
    });
  }
};

/**
 * Get single pipeline
 * GET /api/pipelines/:id
 */
exports.getPipeline = async (req, res) => {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('Backend: getPipeline called');
    console.log('Pipeline ID:', req.params.id);
    console.log('User ID:', req.user.userId);    
    const pipeline = await Pipeline.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      include: [
        {
          model: DataSource,
          attributes: ['id', 'name', 'type', 'status']
        }
      ]
    });
    
    if (!pipeline) {
      return res.status(404).json({ 
        error: 'Pipeline not found' 
      });
    }
    
    console.log('Found pipeline:', pipeline.name);
    console.log('Config:', pipeline.config);
    console.log('Nodes:', pipeline.config?.nodes?.length);
    console.log('═══════════════════════════════════════════');

    res.json({ pipeline });
    
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline' 
    });
  }
};

/**
 * Update pipeline
 * PUT /api/pipelines/:id
 */
exports.updatePipeline = async (req, res) => {
  try {
    const { name, description, config, status, schedule } = req.body;
    
    const pipeline = await Pipeline.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!pipeline) {
      return res.status(404).json({ 
        error: 'Pipeline not found' 
      });
    }
    
    // Update fields
    if (name) pipeline.name = name;
    if (description !== undefined) pipeline.description = description;
    if (config) {
      pipeline.config = config;
      pipeline.version += 1;  // Increment version on config change
    }
    if (status) pipeline.status = status;
    if (schedule !== undefined) pipeline.schedule = schedule;
    
    await pipeline.save();
    
    res.json({
      message: 'Pipeline updated successfully',
      pipeline
    });
    
  } catch (error) {
    console.error('Update pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to update pipeline' 
    });
  }
};

/**
 * Delete pipeline
 * DELETE /api/pipelines/:id
 */
exports.deletePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!pipeline) {
      return res.status(404).json({ 
        error: 'Pipeline not found' 
      });
    }
    
    await pipeline.destroy();
    
    res.json({ 
      message: 'Pipeline deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to delete pipeline' 
    });
  }
};

/**
 * Execute pipeline manually
 * POST /api/pipelines/:id/execute
 */
exports.executePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      include: [DataSource]
    });
    
    if (!pipeline) {
      return res.status(404).json({ 
        error: 'Pipeline not found' 
      });
    }
    console.log('========================================');
    console.log('PIPELINE EXECUTION STARTED');
    console.log('Pipeline ID:', pipeline.id);
    console.log('Pipeline Name:', pipeline.name);
    console.log('Pipeline Config:', JSON.stringify(pipeline.config, null, 2));
    console.log('========================================');

    
    // Create execution record
    const execution = await PipelineExecution.create({
      pipelineId: pipeline.id,
      status: 'running',
      startedAt: new Date()
    });
    
    // Execute pipeline
    try {
      const result = await pipelineExecutor.execute(pipeline, execution.id);

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║ PIPELINE EXECUTION RESULT                                  ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('Records Processed:', result.recordsProcessed);
      console.log('Errors Count:', result.errorsCount);
      console.log('Has destinationResult?', !!result.destinationResult);
      console.log('Destination Result Type:', result.destinationResult?.type);
      console.log('Has data array?', !!result.data);
      console.log('Data length:', result.data?.length);
      console.log('Data sample:', result.data?.slice(0, 2));
      console.log('╚════════════════════════════════════════════════════════════╝');

      
      // If destination is local file, return the data for download
      if (result.destinationResult && result.destinationResult.type === 'local_file') {
        console.log('✓ LOCAL FILE DOWNLOAD DETECTED');
        console.log('Preparing response with download data...');
        
        const responseData = {
          message: 'Pipeline execution completed',
          executionId: execution.id,
          recordsProcessed: result.recordsProcessed,
          downloadReady: true,
          downloadData: {
            data: result.data,
            config: result.destinationResult.config || {},
            format: 'csv'
          }
        };
        
        console.log('Response structure:', {
          downloadReady: responseData.downloadReady,
          hasDownloadData: !!responseData.downloadData,
          downloadDataKeys: Object.keys(responseData.downloadData),
          dataLength: responseData.downloadData.data?.length
        });
        
        return res.json(responseData);
      }
      
      console.log('✗ NOT a local file download');
      res.json({
        message: 'Pipeline execution completed',
        executionId: execution.id,
        recordsProcessed: result.recordsProcessed
      });
      
    } catch (error) {
      console.error('========================================');
      console.error('PIPELINE EXECUTION FAILED');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================================');      
      console.error('Pipeline execution failed:', error);
      res.status(500).json({
        error: 'Pipeline execution failed',
        details: error.message,
        executionId: execution.id
      });
    }
    
  } catch (error) {
    console.error('Execute pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to start pipeline execution' 
    });
  }
};



// exports.executePipeline = async (req, res) => {
//   try {
//     const pipeline = await Pipeline.findOne({
//       where: { 
//         id: req.params.id,
//         userId: req.user.userId
//       },
//       include: [DataSource]
//     });
    
//     if (!pipeline) {
//       return res.status(404).json({ 
//         error: 'Pipeline not found' 
//       });
//     }
    
//     // Create execution record
//     const execution = await PipelineExecution.create({
//       pipelineId: pipeline.id,
//       status: 'running',
//       startedAt: new Date()
//     });
    
//     // Start execution in background
//     pipelineExecutor.execute(pipeline, execution.id)
//       .then(result => {
//         console.log('Pipeline execution completed:', result);
//       })
//       .catch(error => {
//         console.error('Pipeline execution failed:', error);
//       });
    
//     res.json({
//       message: 'Pipeline execution started',
//       executionId: execution.id
//     });
    
//   } catch (error) {
//     console.error('Execute pipeline error:', error);
//     res.status(500).json({ 
//       error: 'Failed to start pipeline execution' 
//     });
//   }
// };

/**
 * Get pipeline executions
 * GET /api/pipelines/:id/executions
 */
exports.getExecutions = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const executions = await PipelineExecution.findAll({
      where: { pipelineId: req.params.id },
      order: [['startedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ executions });
    
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch executions' 
    });
  }
};