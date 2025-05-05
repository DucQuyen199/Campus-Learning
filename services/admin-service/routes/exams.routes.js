const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');

// Exam management routes
router.get('/', examController.getAllExams);
router.post('/', examController.createExam);
router.get('/:id', examController.getExamById);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);

// Question management
router.get('/:examId/questions', examController.getExamQuestions);
router.post('/:examId/questions', examController.addQuestion);
router.put('/:examId/questions/:questionId', examController.updateQuestion);
router.delete('/:examId/questions/:questionId', examController.deleteQuestion);

// Answer template management
router.post('/:examId/templates', examController.createAnswerTemplate);
router.put('/:examId/templates/:templateId', examController.updateAnswerTemplate);

module.exports = router; 