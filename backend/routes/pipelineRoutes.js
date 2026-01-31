/**
 * Pipeline Routes
 */

const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

// All pipeline routes require authentication
router.use(authenticate);

router.post('/',
  validate(schemas.createPipeline),
  pipelineController.createPipeline
);

router.get('/',
  pipelineController.getPipelines
);

router.get('/:id',
  pipelineController.getPipeline
);

router.put('/:id',
  pipelineController.updatePipeline
);

router.delete('/:id',
  pipelineController.deletePipeline
);

router.post('/:id/execute',
  pipelineController.executePipeline
);

router.get('/:id/executions',
  pipelineController.getExecutions
);

module.exports = router;