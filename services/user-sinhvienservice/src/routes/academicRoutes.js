/*-----------------------------------------------------------------
* File: academicRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/academic/program/:userId
 * @desc    Get student's academic program details
 * @access  Private
 */
router.get('/program/:userId', academicController.getProgram);

/**
 * @route   GET /api/academic/courses/:programId
 * @desc    Get student's courses in program
 * @access  Private
 */
router.get('/courses/:programId', academicController.getCourses);

/**
 * @route   GET /api/academic/results/:userId
 * @desc    Get student's academic results (grades)
 * @access  Private
 */
router.get('/results/:userId', academicController.getResults);

/**
 * @route   GET /api/academic/conduct/:userId
 * @desc    Get student's conduct scores
 * @access  Private
 */
router.get('/conduct/:userId', academicController.getConductScores);

/**
 * @route   GET /api/academic/warnings/:userId
 * @desc    Get student's academic warnings
 * @access  Private
 */
router.get('/warnings/:userId', academicController.getWarnings);

/**
 * @route   GET /api/academic/metrics/:userId
 * @desc    Get student's academic metrics
 * @access  Private
 */
router.get('/metrics/:userId', academicController.getMetrics);

/**
 * @route   GET /api/academic/registrations/:userId
 * @desc    Get student's registered courses
 * @access  Private
 */
router.get('/registrations/:userId', academicController.getRegisteredCourses);

/**
 * @route   GET /api/academic/available-courses
 * @desc    Get all available courses for registration
 * @access  Private
 */
router.get('/available-courses', academicController.getAvailableCourses);

/**
 * @route   POST /api/academic/register-course
 * @desc    Register for a course
 * @access  Private
 */
router.post('/register-course', academicController.registerCourse);

/**
 * @route   DELETE /api/academic/cancel-registration/:registrationId
 * @desc    Cancel a course registration
 * @access  Private
 */
router.delete('/cancel-registration/:registrationId', academicController.cancelRegistration);

/**
 * @route   GET /api/academic/semesters
 * @desc    Get all semesters
 * @access  Private
 */
router.get('/semesters', academicController.getSemesters);

/**
 * @route   GET /api/academic/registration-period
 * @desc    Get current registration period info
 * @access  Private
 */
router.get('/registration-period', academicController.getRegistrationPeriod);

/**
 * @route   GET /api/academic/retakeable-courses/:userId
 * @desc    Get courses eligible for retake registration
 * @access  Private
 */
router.get('/retakeable-courses/:userId', academicController.getRetakeableCourses);

module.exports = router; 
