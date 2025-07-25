/*-----------------------------------------------------------------
* File: feedbackRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all feedback routes
router.use(authenticate);

// Create a new feedback
router.post('/', feedbackController.createFeedback);

// Get user feedback history
router.get('/history', feedbackController.getUserFeedback);

// Get feedback metadata (departments and types)
router.get('/metadata', feedbackController.getFeedbackMetadata);

module.exports = router; 
