/*-----------------------------------------------------------------
* File: secondMajorRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const secondMajorController = require('../controllers/secondMajorController');
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/second-major/programs
 * @desc    Get all available programs for second major
 * @access  Private
 */
router.get('/programs', secondMajorController.getAvailablePrograms);

/**
 * @route   GET /api/second-major/eligibility/:userId
 * @desc    Check if a student is eligible for second major registration
 * @access  Private
 */
router.get('/eligibility/:userId', secondMajorController.checkEligibility);

/**
 * @route   POST /api/second-major/register
 * @desc    Register for a second major
 * @access  Private
 */
router.post('/register', secondMajorController.registerSecondMajor);

/**
 * @route   GET /api/second-major/registrations/:userId
 * @desc    Get student's second major registrations
 * @access  Private
 */
router.get('/registrations/:userId', secondMajorController.getStudentRegistrations);

/**
 * @route   GET /api/second-major/registration/:registrationId
 * @desc    Get registration details
 * @access  Private
 */
router.get('/registration/:registrationId', secondMajorController.getRegistrationDetails);

/**
 * @route   DELETE /api/second-major/cancel/:registrationId
 * @desc    Cancel a registration
 * @access  Private
 */
router.delete('/cancel/:registrationId', secondMajorController.cancelRegistration);

module.exports = router; 
