/*-----------------------------------------------------------------
* File: eventRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:id', eventController.getEventById);

// Protected routes - require authentication
router.use(authMiddleware);
router.post('/:id/register', eventController.registerEvent);
router.delete('/:id/register', eventController.cancelEventRegistration);
router.get('/:id/registration-status', eventController.checkEventRegistration);
router.get('/:id/participants', eventController.getEventParticipants);
router.get('/:id/schedule', eventController.getEventSchedule);
router.get('/:id/prizes', eventController.getEventPrizes);
router.get('/:id/technologies', eventController.getEventTechnologies);
router.get('/:id/languages', eventController.getProgrammingLanguages);
router.get('/:id/achievements', eventController.getEventAchievements);

module.exports = router; 
