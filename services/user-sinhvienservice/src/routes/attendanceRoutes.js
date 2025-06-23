const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// /api/attendance/semesters/:userId
router.get('/semesters/:userId', attendanceController.getSemesters);

// /api/attendance/courses/:userId
router.get('/courses/:userId', attendanceController.getCourses);

// /api/attendance/:userId
router.get('/:userId', attendanceController.getAttendance);

module.exports = router; 