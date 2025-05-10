const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/competitions', competitionController.getAllCompetitions);
router.get('/competitions/:id', competitionController.getCompetitionDetails);
router.get('/competitions/:competitionId/problems/:problemId', authMiddleware, competitionController.getProblemDetails);

// Protected routes
router.post('/competitions/:competitionId/register', authMiddleware, competitionController.registerForCompetition);
router.post('/competitions/:competitionId/start', authMiddleware, competitionController.startCompetition);
router.post('/competitions/:competitionId/problems/:problemId/submit', authMiddleware, competitionController.submitSolution);
router.get('/competitions/:competitionId/scoreboard', authMiddleware, competitionController.getScoreboard);
router.get('/competitions/submissions/:submissionId', authMiddleware, competitionController.getSubmissionDetails);
router.get('/user/competitions', authMiddleware, competitionController.getUserCompetitions);

module.exports = router; 