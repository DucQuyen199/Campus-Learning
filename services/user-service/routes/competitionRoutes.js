const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const codeExecutionController = require('../controllers/codeExecutionController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/', competitionController.getAllCompetitions);
router.get('/:competitionId', competitionController.getCompetitionById);
router.get('/:competitionId/leaderboard', competitionController.getCompetitionLeaderboard);
router.get('/:competitionId/problems', competitionController.getCompetitionProblems);
router.get('/problems/:problemId', competitionController.getProblemById);

// Protected routes (require authentication)
router.post('/:competitionId/register', authenticateToken, competitionController.registerCompetition);
router.get('/:competitionId/registration-status', authenticateToken, competitionController.checkRegistrationStatus);
router.get('/:competitionId/completed-problems', authenticateToken, competitionController.getCompletedProblems);
router.get('/:competitionId/problems/:problemId/solution', authenticateToken, competitionController.getSubmittedSolution);
router.post('/problems/:problemId/submit', authenticateToken, competitionController.submitSolution);
router.post('/:competitionId/finish', authenticateToken, competitionController.finishCompetition);

// Enhanced code execution routes for competitions
router.post('/problems/:problemId/evaluate', authenticateToken, codeExecutionController.evaluateCompetitionSolution);
router.get('/:competitionId/completed-problems', authenticateToken, competitionController.getUserCompletedProblems);

// Admin routes (require authentication)
router.post('/:competitionId/problems', authenticateToken, competitionController.createProblem);
router.put('/problems/:problemId', authenticateToken, competitionController.updateProblem);

module.exports = router;