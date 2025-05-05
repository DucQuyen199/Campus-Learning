const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');
const { ExamQuestion, ExamAnswerTemplate, ExamAnswer } = require('../models');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all exams 
router.get('/', examController.getAllExams);

// Get upcoming exams
router.get('/upcoming', examController.getUpcomingExams);

// Get exam by ID
router.get('/:id', examController.getExamById);

// Register for exam
router.post('/:examId/register', examController.registerForExam);

// Start exam
router.post('/:examId/start', examController.startExam);

// Submit answer
router.post('/:participantId/answer/:questionId', examController.submitAnswer);

// Grade answer - add a more specific route for grading questions
router.post('/:examId/questions/:questionId/grade', examController.gradeAnswer);

// Alternative route for grading that includes participantId
router.post('/:examId/questions/:questionId/grade/:participantId?', examController.gradeAnswer);

// Alternative route for grading that puts participantId in a clearer position in the URL
router.post('/:examId/participants/:participantId/questions/:questionId/grade', examController.gradeAnswer);

// Get questions with templates for specific exam - add this new route
router.get('/:examId/questions', async (req, res) => {
  try {
    const { examId } = req.params;
    const examIdInt = parseInt(examId, 10);
    
    if (isNaN(examIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid exam ID. Must be a numeric value.' 
      });
    }
    
    // Get questions for this exam
    const questions = await db.query(`
      SELECT q.*, t.TemplateID, t.Content as TemplateContent, t.Keywords
      FROM ExamQuestions q
      LEFT JOIN ExamAnswerTemplates t ON t.ExamID = q.ExamID
      WHERE q.ExamID = @examId
      ORDER BY q.OrderIndex
    `, { examId: examIdInt });
    
    res.status(200).json({
      success: true,
      data: questions || []
    });
  } catch (error) {
    console.error('Error fetching exam questions with templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching questions', 
      error: error.message 
    });
  }
});

// Log fullscreen exit
router.post('/:participantId/fullscreen-exit', examController.logFullscreenExit);

// Log fullscreen return
router.post('/:participantId/fullscreen-return', examController.logFullscreenReturn);

// Complete exam
router.post('/:participantId/complete', examController.completeExam);

// Complete exam (alternative endpoint for frontend compatibility)
router.post('/participants/:participantId/complete', examController.completeExam);

// Complete exam with both examId and participantId - making this one more specific
router.post('/:examId/participants/:participantId/complete', examController.completeExam);

// Get exam results
router.get('/:participantId/results', examController.getExamResults);

// Get participant answers
router.get('/participants/:participantId/answers', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Validate participantId
    const participantIdInt = parseInt(participantId, 10);
    if (isNaN(participantIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid participant ID. Must be a numeric value.' 
      });
    }
    
    // Get all answers for this participant
    const answers = await db.query(`
      SELECT ea.AnswerID, ea.ParticipantID, ea.QuestionID, ea.Answer, 
             ea.Score, ea.SubmittedAt, eq.Content as QuestionContent
      FROM ExamAnswers ea
      JOIN ExamQuestions eq ON ea.QuestionID = eq.QuestionID
      WHERE ea.ParticipantID = @participantId
    `, { participantId: participantIdInt });
    
    res.status(200).json({
      success: true,
      answers: answers || []
    });
  } catch (error) {
    console.error('Error fetching participant answers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching answers', 
      error: error.message 
    });
  }
});

// Get answer template for a question
router.get('/:examId/questions/:questionId/template', async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    
    // Get answer template from database
    const template = await db.query(`
      SELECT t.Content, t.Keywords, t.MinimumMatchPercentage
      FROM ExamAnswerTemplates t
      WHERE t.ExamID = ?
    `, [examId]);

    if (!template || template.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đáp án mẫu'
      });
    }

    res.json({
      success: true,
      data: template[0]
    });
  } catch (error) {
    console.error('Error getting answer template:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy đáp án mẫu'
    });
  }
});

module.exports = router;
