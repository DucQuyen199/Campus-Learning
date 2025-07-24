/*-----------------------------------------------------------------
* File: competitions.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competition.controller');
const { verifyAdmin } = require('../middleware/auth');

// Competition management routes
router.get('/', verifyAdmin, competitionController.getCompetitions);
router.post('/', verifyAdmin, competitionController.createCompetition);
router.get('/:id', verifyAdmin, competitionController.getCompetition);
router.put('/:id', verifyAdmin, competitionController.updateCompetition);
router.delete('/:id', verifyAdmin, competitionController.deleteCompetition);
router.put('/:id/status', verifyAdmin, competitionController.updateCompetitionStatus);

// Competition problems routes
router.get('/:competitionId/problems', verifyAdmin, competitionController.getProblems);
router.post('/:competitionId/problems', verifyAdmin, competitionController.createProblem);
router.get('/:competitionId/problems/:problemId', verifyAdmin, competitionController.getProblem);
router.put('/:competitionId/problems/:problemId', verifyAdmin, competitionController.updateProblem);
router.delete('/:competitionId/problems/:problemId', verifyAdmin, competitionController.deleteProblem);

// Competition participants routes
router.get('/:competitionId/participants', verifyAdmin, competitionController.getCompetitionParticipants);

module.exports = router; 
