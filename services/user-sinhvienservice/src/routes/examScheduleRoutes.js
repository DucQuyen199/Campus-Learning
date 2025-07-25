/*-----------------------------------------------------------------
* File: examScheduleRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const examScheduleController = require('../controllers/examScheduleController');
const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/exam-schedule/semesters
 * @desc Get all semesters that have exams
 * @access Private
 */
router.get(
  '/semesters',
  authMiddleware.authenticate,
  examScheduleController.getExamSemesters
);

/**
 * @route GET /api/exam-schedule/:userId
 * @desc Get current semester exam schedule for a student
 * @access Private
 */
router.get(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  examScheduleController.getCurrentExamSchedule
);

/**
 * @route GET /api/exam-schedule/:userId/:semesterId
 * @desc Get exam schedule for a specific semester
 * @access Private
 */
router.get(
  '/:userId/:semesterId',
  authMiddleware.authenticate,
  authMiddleware.authorize(),
  examScheduleController.getSemesterExamSchedule
);

module.exports = router; 
