/*-----------------------------------------------------------------
* File: database.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration with default fallbacks
const dbConfig = {
  user: process.env.SQL_USER || process.env.DB_USER || 'sa',
  password: process.env.SQL_PASSWORD || process.env.DB_PASSWORD || '123456aA@$',
  server: process.env.SQL_SERVER || process.env.DB_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || process.env.DB_NAME || 'CampusLearning',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create singleton for SQL connection
const sqlConnection = {
  sql: sql,
  pool: null,
  connect: async function() {
    try {
      // If pool already exists, return it
      if (this.pool) {
        console.log('Using existing SQL connection pool');
        return this.pool;
      }
      
      console.log('Connecting to SQL Server...');
      
      try {
        // First attempt with current config
        this.pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server successfully');
        return this.pool;
      } catch (firstErr) {
        console.warn('First connection attempt failed:', firstErr.message);
        
        // Try alternative configuration
        console.log('Trying alternative connection configuration...');
        const altConfig = {
          ...dbConfig,
          options: {
            ...dbConfig.options,
            encrypt: !dbConfig.options.encrypt, // Try opposite encrypt setting
            port: 1433 // Explicitly set default SQL Server port
          }
        };
        
        console.log(`Alternative connection info:
          Server: ${altConfig.server}
          Database: ${altConfig.database}
          Encrypt: ${altConfig.options.encrypt}
          Port: ${altConfig.options.port}
        `);
        
        try {
          this.pool = await sql.connect(altConfig);
          console.log('Connected to SQL Server with alternative config');
          return this.pool;
        } catch (secondErr) {
          console.error('Alternative connection also failed:', secondErr.message);
          throw firstErr; // Throw original error for consistency
        }
      }
    } catch (err) {
      console.error('Database connection failed:', err);
      console.error('Database connection details:', {
        server: dbConfig.server,
        database: dbConfig.database,
        user: dbConfig.user,
        // Don't log password
      });
      throw new Error('Unable to connect to the database. Please ensure the SQL Server is running and accessible.');
    }
  }
};

// Function to check if SQL Server is running
async function isSqlServerRunning(host, port) {
  return new Promise((resolve) => {
    const socket = new require('net').Socket();
    const timeoutId = setTimeout(() => {
      socket.destroy();
      console.log(`Connection to SQL Server at ${host}:${port} timed out`);
      resolve(false);
    }, 3000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeoutId);
      socket.destroy();
      console.log(`SQL Server at ${host}:${port} is reachable`);
      resolve(true);
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeoutId);
      console.log(`SQL Server at ${host}:${port} is not reachable:`, err.message);
      resolve(false);
    });
  });
}

module.exports = {
  sqlConnection,
  isSqlServerRunning,
  dbConfig
}; 
