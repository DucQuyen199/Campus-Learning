/*-----------------------------------------------------------------
* File: errorHandler.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { nodeEnv } = require('../config/app');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Custom error response
  const errorResponse = {
    success: false,
    message: message,
    statusCode: status
  };
  
  // Add stack trace in development mode
  if (nodeEnv === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = err.toString();
  }
  
  res.status(status).json(errorResponse);
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
};

// Handle database connection errors
const dbErrorHandler = (err, req, res, next) => {
  if (err.message && (
    err.message.includes('pool.connect is not a function') || 
    err.message.includes('sqlConnection.connect'))) {
    console.error('Database connection error in route:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection error',
      fixedData: true
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  dbErrorHandler
}; 
