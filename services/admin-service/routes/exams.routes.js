/*-----------------------------------------------------------------
* File: exams.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Exam management routes
router.get('/', authenticateToken, isAdmin, examController.getAllExams);
router.post('/', authenticateToken, isAdmin, examController.createExam);
router.get('/:id', authenticateToken, isAdmin, examController.getExamById);
router.put('/:id', authenticateToken, isAdmin, examController.updateExam);
router.delete('/:id', authenticateToken, isAdmin, examController.deleteExam);

// Question management
router.get('/:examId/questions', authenticateToken, isAdmin, examController.getExamQuestions);
router.post('/:examId/questions', authenticateToken, isAdmin, examController.addQuestion);
router.put('/:examId/questions/:questionId', authenticateToken, isAdmin, examController.updateQuestion);
router.delete('/:examId/questions/:questionId', authenticateToken, isAdmin, examController.deleteQuestion);

// Answer template management
router.post('/:examId/templates', authenticateToken, isAdmin, examController.createAnswerTemplate);
router.put('/:examId/templates/:templateId', authenticateToken, isAdmin, examController.updateAnswerTemplate);

// ---------------- Participant management ----------------
router.get('/:examId/participants', authenticateToken, isAdmin, examController.getExamParticipants);
router.get('/participants/:participantId/answers', authenticateToken, isAdmin, examController.getParticipantAnswers);
router.post('/:examId/participants/:participantId/questions/:questionId/grade-essay', authenticateToken, isAdmin, examController.gradeEssayAnswer);

module.exports = router; 
