const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

// Get all reports
router.get('/', reportController.getAllReports);

// Get report statistics
router.get('/stats', reportController.getReportStats);

// Get reports by category
router.get('/by-category', reportController.getReportsByCategory);

// Get report by ID
router.get('/:id', reportController.getReportById);

// Update report status
router.put('/:id/status', reportController.updateReportStatus);

// Delete report
router.delete('/:id', reportController.deleteReport);

module.exports = router; 