const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Public routes
router.get('/', rankingController.getAllRankings);
router.get('/user/:userId', rankingController.getUserRanking);
router.get('/users/:userId', rankingController.getUserRanking);

// Protected routes
router.post('/user/:userId/points', authenticateToken, rankingController.addPoints);

// Admin routes
router.post('/reset/weekly', authenticateToken, isAdmin, rankingController.resetWeeklyRankings);
router.post('/reset/monthly', authenticateToken, isAdmin, rankingController.resetMonthlyRankings);

module.exports = router; 