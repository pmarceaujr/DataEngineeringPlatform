/**
 * Data Source Routes
 */

const express = require('express');
const router = express.Router();
const dataSourceController = require('../controllers/dataSourceController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validation');

// All data source routes require authentication
router.use(authenticate);

router.post('/',
  validate(schemas.createDataSource),
  dataSourceController.createDataSource
);

router.get('/',
  dataSourceController.getDataSources
);

router.get('/:id',
  dataSourceController.getDataSource
);

router.put('/:id',
  dataSourceController.updateDataSource
);

router.delete('/:id',
  dataSourceController.deleteDataSource
);

router.post('/:id/test',
  dataSourceController.testConnection
);

router.post('/:id/preview',
  dataSourceController.previewData
);

module.exports = router;