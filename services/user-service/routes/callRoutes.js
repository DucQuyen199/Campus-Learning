/*-----------------------------------------------------------------
* File: callRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const callController = require('../controllers/callController');

// Initiate a call
router.post('/initiate', authenticate, callController.initiateCall);

// Answer a call
router.post('/answer', authenticate, callController.answerCall);

// End a call
router.post('/end', authenticate, callController.endCall);

// Reject a call
router.post('/reject', authenticate, callController.rejectCall);

// Get call history
router.get('/history', authenticate, callController.getCallHistory);

// Get missed calls
router.get('/missed', authenticate, callController.getMissedCalls);

// Get active call for a user (single active call)
router.get('/active', authenticate, callController.getActiveCall);

// Get all active calls for a user (multiple calls)
router.get('/active-calls', authenticate, callController.getActiveCalls);

module.exports = router; 
