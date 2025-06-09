const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const routes = require('./routes');
const { poolPromise } = require('./config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const studentRoutes = require('./routes/student.routes');
const assignmentRoutes = require('./routes/assignment.routes');

const app = express();
const PORT = process.env.PORT || 5003;

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
})); 
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true }));

// Database connection check middleware
app.use(async (req, res, next) => {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('Database connection not available');
      return res.status(503).json({ message: 'Database service unavailable' });
    }
    req.dbPool = pool; // Attach pool to request
    next();
  } catch (err) {
    console.error('Database middleware error:', err);
    return res.status(503).json({ message: 'Database service unavailable' });
  }
});

// Connect to database
poolPromise.then((pool) => {
  if (pool) {
    console.log('Connected to database successfully');
  } else {
    console.error('Database pool is not available');
  }
}).catch(err => {
  console.error('Database connection failed:', err);
  // Don't exit process, let the reconnection logic handle it
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', authenticate, courseRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/assignments', authenticate, assignmentRoutes);

// API Routes
app.use('/api/v1', routes); // Match the frontend's expected endpoint

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'teacher-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Teacher service running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process, just log the error
});

module.exports = app; 