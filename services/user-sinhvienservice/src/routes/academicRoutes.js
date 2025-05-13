const express = require('express');
const router = express.Router();
const AcademicController = require('../controllers/academicController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/academic/program/:userId
 * @desc    Get student's academic program details
 * @access  Private
 */
router.get('/program/:userId', authenticate, AcademicController.getProgram);

/**
 * @route   GET /api/academic/courses/:programId
 * @desc    Get student's courses in program
 * @access  Private
 */
router.get('/courses/:programId', authenticate, AcademicController.getCourses);

/**
 * @route   GET /api/academic/grades/:userId
 * @desc    Get student's academic results (grades)
 * @access  Private
 */
router.get('/grades/:userId', authenticate, AcademicController.getGrades);

/**
 * @route   GET /api/academic/conduct/:userId
 * @desc    Get student's conduct scores
 * @access  Private
 */
router.get('/conduct/:userId', authenticate, AcademicController.getConductScores);

/**
 * @route   GET /api/academic/warnings/:userId
 * @desc    Get student's academic warnings
 * @access  Private
 */
router.get('/warnings/:userId', authenticate, AcademicController.getWarnings);

/**
 * @route   GET /api/academic/metrics/:userId
 * @desc    Get student's academic metrics
 * @access  Private
 */
router.get('/metrics/:userId', authenticate, AcademicController.getMetrics);

/**
 * @route   GET /api/academic/registered-courses/:userId
 * @desc    Get student's registered courses
 * @access  Private
 */
router.get('/registered-courses/:userId', authenticate, AcademicController.getRegisteredCourses);

module.exports = router; 