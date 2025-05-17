// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./src/routes/students');
const usersRoutes = require('./src/routes/users'); // Import users routes from src/routes
const academicRoutes = require('./src/routes/academic'); // Update to use src/routes
const financeRoutes = require('./routes/finance');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/users', usersRoutes); // Enable users routes
app.use('/api/academic', academicRoutes);
app.use('/api/finance', financeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Admin Student Service API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5011;
app.listen(PORT, () => {
  console.log(`Admin Student Service running on port ${PORT}`);
});

module.exports = app; 