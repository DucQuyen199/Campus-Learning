/*-----------------------------------------------------------------
* File: database.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.NODE_ENV === 'production',
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const createConnection = async () => {
  try {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to MSSQL successfully');
    return pool;
  } catch (err) {
    console.error('Database Connection Failed: ', err);
    // Wait and try to reconnect
    setTimeout(createConnection, 5000);
    return null;
  }
};

const poolPromise = createConnection();

// Create event listeners for connection issues
sql.on('error', err => {
  console.error('SQL Server general error:', err);
  if (!pool || pool.connected === false) {
    console.log('Attempting to reconnect to the database...');
    createConnection();
  }
});

module.exports = {
  sql,
  poolPromise
}; 
