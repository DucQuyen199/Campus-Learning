const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Event management routes
router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);
// Event stats route (moved after specific ID route)
router.get('/stats', eventController.getEventStats);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Event participants management
router.get('/:eventId/participants', eventController.getEventParticipants);
router.post('/:eventId/participants/:userId', eventController.addParticipant);
router.delete('/:eventId/participants/:userId', eventController.removeParticipant);

// Event languages routes
router.post('/:eventId/languages', eventController.addEventLanguage);
router.get('/:eventId/languages', eventController.getEventLanguages);

// Event technologies routes
router.post('/:eventId/technologies', eventController.addEventTechnology);
router.get('/:eventId/technologies', eventController.getEventTechnologies);

// Event prizes routes
router.post('/:eventId/prizes', eventController.addEventPrize);
router.get('/:eventId/prizes', eventController.getEventPrizes);

// Event schedule routes
router.post('/:eventId/schedule', eventController.addEventSchedule);
router.get('/:eventId/schedule', eventController.getEventSchedule);

module.exports = router; 