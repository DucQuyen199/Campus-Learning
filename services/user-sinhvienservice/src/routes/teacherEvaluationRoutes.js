const express = require('express');
const router = express.Router();
const teacherEvaluationController = require('../controllers/teacherEvaluationController');
const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/teacher-evaluation/pending/:userId
 * @desc Get classes pending teacher evaluation for a student
 * @access Private
 */
router.get(
  '/pending/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  teacherEvaluationController.getPendingEvaluations
);

/**
 * @route GET /api/teacher-evaluation/submitted/:userId
 * @desc Get submitted teacher evaluations by a student
 * @access Private
 */
router.get(
  '/submitted/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  teacherEvaluationController.getSubmittedEvaluations
);

/**
 * @route POST /api/teacher-evaluation/submit
 * @desc Submit a new teacher evaluation
 * @access Private
 */
router.post(
  '/submit',
  authMiddleware.authenticate,
  teacherEvaluationController.submitEvaluation
);

module.exports = router; 