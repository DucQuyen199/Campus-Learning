/*-----------------------------------------------------------------
* File: tuitionRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const tuitionController = require('../controllers/tuitionController');

// Get current semester tuition
router.get('/current/:userId', tuitionController.getCurrentTuition);

// Get tuition history
router.get('/history/:userId', tuitionController.getTuitionHistory);

// Get tuition by ID
router.get('/details/:tuitionId', tuitionController.getTuitionById);

// Get payments for a specific tuition
router.get('/payments/:tuitionId', tuitionController.getTuitionPayments);

// Make a tuition payment
router.post('/pay', tuitionController.makePayment);

module.exports = router; 
