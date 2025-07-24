/*-----------------------------------------------------------------
* File: db.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// SQL Server configuration
const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456aA@$',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'CampusLearning',
  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true,
    useUTC: false, // Add this to avoid timezone issues
    dateFormat: 'ymd', // Use ISO date format
    datefirst: 7, // Sunday is the first day
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
const pool = new sql.ConnectionPool(sqlConfig);

// Connect to database
const connectDB = async () => {
  try {
    await pool.connect();
    console.log('Database connected successfully');
    
    // Fix date format issues by setting SQL Server to handle dates in a specific format
    await pool.request().query(`
      SET DATEFORMAT ymd;
      SET LANGUAGE English;
      SET DATEFIRST 7; -- Sunday is the first day of the week
      
      -- Ensure we use only the standard date format
      SET ANSI_DEFAULTS ON;
      SET ANSI_NULL_DFLT_ON ON;
      SET ANSI_NULLS ON;
      SET ANSI_PADDING ON;
      SET ANSI_WARNINGS ON;
      SET ARITHABORT ON;
      SET CONCAT_NULL_YIELDS_NULL ON;
      SET QUOTED_IDENTIFIER ON;
    `);
    
    return pool;
  } catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
};

// Helper function to execute parameterized queries
const query = async (queryText, params = {}) => {
  try {
    const request = pool.request();
    
    // Add parameters to the request
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    
    const result = await request.query(queryText);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to execute a transaction
const transaction = async () => {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  
  return {
    query: async (queryText, params = {}) => {
      try {
        const request = new sql.Request(transaction);
        
        // Add parameters to the request
        for (const [key, value] of Object.entries(params)) {
          request.input(key, value);
        }
        
        const result = await request.query(queryText);
        return result.recordset;
      } catch (error) {
        console.error('Transaction query error:', error);
        throw error;
      }
    },
    commit: async () => {
      await transaction.commit();
    },
    rollback: async () => {
      await transaction.rollback();
    }
  };
};

module.exports = {
  connectDB,
  pool,
  sql,
  query,
  transaction
}; 
