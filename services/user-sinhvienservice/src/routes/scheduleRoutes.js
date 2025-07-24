/*-----------------------------------------------------------------
* File: scheduleRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Get class schedule
router.get('/class/:userId', scheduleController.getClassSchedule);

// Get exam schedule
router.get('/exam/:userId', scheduleController.getExamSchedule);

// Get day schedule (for a specific date)
router.get('/day/:userId', scheduleController.getDaySchedule);

module.exports = router; 
