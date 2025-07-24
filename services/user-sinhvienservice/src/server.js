/*-----------------------------------------------------------------
* File: server.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const app = require('./app');
const { port } = require('./config/app');
const { sqlConnection, isSqlServerRunning, dbConfig } = require('./config/database');

// Start server function
async function startServer() {
  try {
    // Check if SQL Server is running
    const sqlHost = dbConfig.server;
    const sqlPort = 1433; // Default SQL Server port
    const isServerRunning = await isSqlServerRunning(sqlHost, sqlPort);
    
    let demoMode = false;
    
    if (!isServerRunning) {
      console.warn(`SQL Server doesn't appear to be running at ${sqlHost}:${sqlPort}`);
      console.warn('Starting in demo mode with limited functionality.');
      demoMode = true;
    } else {
      // Try to connect to database
      try {
        await sqlConnection.connect();
        console.log('Database connection successful.');
      } catch (err) {
        console.error('Failed to connect to database:', err.message);
        console.warn('Starting in demo mode with limited functionality.');
        demoMode = true;
      }
    }
    
    // Add demo mode flag to app
    app.locals.demoMode = demoMode;
    
    // Start server
    app.listen(port, () => {
      console.log(`Server is running${demoMode ? ' in DEMO MODE' : ''} on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 
