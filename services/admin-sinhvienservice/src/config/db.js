/*-----------------------------------------------------------------
* File: db.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456aA@$',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'CampusLearning',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool for reusing connections
let pool = null;

/**
 * Initialize the global connection pool
 */
const initializePool = async () => {
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('Database pool initialized');
    return pool;
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    throw error;
  }
};

/**
 * Get the existing connection pool or create a new one
 */
const getPool = async () => {
  if (!pool) {
    return await initializePool();
  }
  return pool;
};

/**
 * Execute a SQL query with parameters
 * @param {string} query - SQL query to execute
 * @param {Object} params - Parameters for the query
 * @returns {Promise<Object>} - Query result
 */
const executeQuery = async (query, params = {}) => {
  try {
    const pool = await getPool();
    let request = pool.request();
    
    // Add parameters to the request, handling type/value objects
    for (const [key, param] of Object.entries(params)) {
      if (
        param !== null && typeof param === 'object' &&
        param.hasOwnProperty('type') && param.hasOwnProperty('value')
      ) {
        // param is an object with type and value
        request = request.input(key, param.type, param.value);
      } else {
        // param is a value, use default type inference
        request = request.input(key, param);
      }
    }
    
    // Execute the query
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Close the connection pool
 */
const closePool = async () => {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing pool:', error);
      throw error;
    }
  }
};

module.exports = {
  getPool,
  executeQuery,
  closePool,
  initializePool,
  sql
}; 
