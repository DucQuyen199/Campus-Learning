const express = require('express');
const router = express.Router();
const teacherAuth = require('../middleware/teacherAuth');

// Import routes
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const studentRoutes = require('./student.routes');
const assignmentRoutes = require('./assignment.routes');
const notificationRoutes = require('./notification.routes');
const teacherRoutes = require('./teacher.routes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes - Apply authentication middleware to all routes below
router.use(teacherAuth);

// Teacher routes
router.use('/teachers', teacherRoutes);
router.use('/courses', courseRoutes);
router.use('/students', studentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router; 