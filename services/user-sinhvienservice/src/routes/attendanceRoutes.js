/*-----------------------------------------------------------------
* File: attendanceRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
