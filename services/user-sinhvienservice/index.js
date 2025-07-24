/*-----------------------------------------------------------------
* File: index.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// Entry point for student service
require('dotenv').config();
const http = require('http');
const app = require('./src/app');

// Start the server
const PORT = process.env.PORT || 5008;

// Create HTTP server with the Express app
const server = http.createServer(app);

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use another port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Start listening
server.listen(PORT, () => {
  console.log(`User Student Service running on port ${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing server gracefully.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 
