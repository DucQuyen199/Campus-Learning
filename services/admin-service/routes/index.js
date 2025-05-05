const router = require('express').Router();
const courseRoutes = require('./courses.routes');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const examRoutes = require('./exam.routes');
const competitionRoutes = require('./competition.routes');
const reportRoutes = require('./report.routes');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/exams', examRoutes);
router.use('/competitions', competitionRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router; 