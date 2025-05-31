const express = require('express');
const router = express.Router();
const courseRoutes = require('./courses.routes');
const eventRoutes = require('./events.routes');
const userRoutes = require('./users.routes');
const examRoutes = require('./exams.routes');
const competitionRoutes = require('./competitions.routes');
const reportRoutes = require('./reports.routes');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/exams', examRoutes);
router.use('/events', eventRoutes);
router.use('/reports', reportRoutes);
router.use('/competitions', competitionRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router; 