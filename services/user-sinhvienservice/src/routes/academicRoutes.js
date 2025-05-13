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

module.exports = router; 