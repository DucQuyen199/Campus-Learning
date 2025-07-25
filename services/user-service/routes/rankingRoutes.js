/*-----------------------------------------------------------------
* File: rankingRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
