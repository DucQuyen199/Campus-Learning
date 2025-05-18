// Entry point for backward compatibility
// This file redirects to the new structure
console.log('Starting application with new architecture...');

const express = require('express');
const http = require('http');
const app = require('./src/app');

// Start the server
const PORT = process.env.PORT || 5008;

// Create HTTP server with the Express app
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`User Student Service running on port ${PORT}`);
}); 