const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const { apiPrefix } = require('./config/app');
const { errorHandler, notFoundHandler, dbErrorHandler } = require('./middleware/errorHandler');

// Import routes
const profileRoutes = require('./routes/profileRoutes');
const academicRoutes = require('./routes/academicRoutes');

// Initialize Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 200) + '...');
    }
    next();
  });
}

// Root route for API health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Student API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version route
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString()
  });
});

// Apply API routes
app.use(`${apiPrefix}/profile`, profileRoutes);
app.use(`${apiPrefix}/academic`, academicRoutes);

// Apply error handling middleware
app.use(dbErrorHandler);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app; 