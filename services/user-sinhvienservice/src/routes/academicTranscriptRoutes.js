const express = require('express');
const router = express.Router();
const academicTranscriptController = require('../controllers/academicTranscriptController');
const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/academic-transcript/:userId/summary
 * @desc Get academic summary information for a student
 * @access Private
 */
router.get(
  '/:userId/summary',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  academicTranscriptController.getAcademicSummary
);

/**
 * @route GET /api/academic-transcript/:userId/semesters
 * @desc Get all semesters with grades for a student
 * @access Private
 */
router.get(
  '/:userId/semesters',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  academicTranscriptController.getStudentSemesters
);

/**
 * @route GET /api/academic-transcript/:userId/:semesterId
 * @desc Get grades for a specific semester
 * @access Private
 */
router.get(
  '/:userId/:semesterId',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  academicTranscriptController.getSemesterGrades
);

/**
 * @route GET /api/academic-transcript/:userId/all
 * @desc Get all grades for a student across all semesters
 * @access Private
 */
router.get(
  '/:userId/all',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  academicTranscriptController.getAllGrades
);

module.exports = router; 