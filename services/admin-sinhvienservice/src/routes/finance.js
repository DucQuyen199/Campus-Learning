/*-----------------------------------------------------------------
* File: finance.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Tuition management routes
router.get('/tuition', financeController.getAllTuition);
router.get('/tuition/:id', financeController.getTuitionById);
router.get('/tuition/:id/payments', financeController.getPaymentHistory);
router.post('/tuition/:id/payments', financeController.processPayment);
router.get('/tuition/payments/:paymentId/receipt', financeController.getPaymentReceipt);
router.post('/tuition/generate/:semesterId', financeController.generateSemesterInvoices);
router.get('/tuition/statistics', financeController.getTuitionStatistics);

module.exports = router; 
