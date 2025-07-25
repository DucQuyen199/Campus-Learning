/*-----------------------------------------------------------------
* File: executionConfig.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Execution Service Configuration
 */

module.exports = {
  // Local execution service URL
  EXECUTION_SERVICE_URL: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001',
  
  // Whether to use the execution service for code evaluation
  USE_EXECUTION_SERVICE: process.env.USE_EXECUTION_SERVICE === 'true' || true,
  
  // Maximum execution time in milliseconds
  MAX_EXECUTION_TIME: parseInt(process.env.MAX_EXECUTION_TIME || 30000),
  
  // Maximum memory limit in MB
  MAX_MEMORY_LIMIT: parseInt(process.env.MAX_MEMORY_LIMIT || 512)
}; 
