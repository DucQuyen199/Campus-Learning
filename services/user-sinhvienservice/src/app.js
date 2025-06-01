const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { apiPrefix } = require('./config/app');

// Import routes
const profileRoutes = require('./routes/profileRoutes');
const academicRoutes = require('./routes/academicRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const tuitionRoutes = require('./routes/tuitionRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const examRegistrationRoutes = require('./routes/examRegistrationRoutes');

// Initialize Express app
const app = express();

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Root route for API health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Student API is running',
    version: '1.0.0'
  });
});

// API version route
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
    demoMode: app.locals.demoMode || false
  });
});

// Replace the fallback handler with a simple 404 handler
app.use(apiPrefix, (req, res, next) => {
  next();
});

// Register API routes
app.use(`${apiPrefix}/profile`, profileRoutes);
app.use(`${apiPrefix}/academic`, academicRoutes);
app.use(`${apiPrefix}/schedule`, scheduleRoutes);
app.use(`${apiPrefix}/tuition`, tuitionRoutes);
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/notifications`, notificationsRoutes);
app.use(`${apiPrefix}/exam-registration`, examRegistrationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Generic error response
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler (for routes that don't match any of the above)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app; 