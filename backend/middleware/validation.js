/**
 * Request Validation Middleware
 * Uses Joi to validate request data
 */

const Joi = require('joi');

/**
 * Validate request body, query, or params
 */
const validate = (schema, property = 'body') => {
  console.log('***************************************************')
  console.log('schema')
  console.log(schema)
  console.log('property')
  console.log(property)

  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,  // Return all errors, not just first
      stripUnknown: true  // Remove fields not in schema
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      console.log('#####################################')
      console.log(detail.message)
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  }),
  
  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  // Create data source
  createDataSource: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    type: Joi.string().valid('postgresql', 'mysql', 'rest_api', 'aws_s3', 'azure_blob', 'gcp_storage', 'local_file').required(),
    connectionConfig: Joi.object().required()
  }),
  
  // Create pipeline
  createPipeline: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow(''),
    config: Joi.object().required(),
    workspaceId: Joi.string().uuid().allow(null),
    sourceId: Joi.string().uuid().allow(null),
    schedule: Joi.string().allow(null)
  })
};

module.exports = { validate, schemas };