/*-----------------------------------------------------------------
* File: courseRegistrationRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const courseRegistrationController = require('../controllers/courseRegistrationController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all available semesters
router.get('/semesters', courseRegistrationController.getSemesters);

// Get current semester
router.get('/semesters/current', courseRegistrationController.getCurrentSemester);

// Get registered courses for a student in a semester
router.get('/:semesterId', courseRegistrationController.getRegisteredCourses);

// Cancel course registration
router.delete('/:registrationId', courseRegistrationController.cancelRegistration);

module.exports = router; 
