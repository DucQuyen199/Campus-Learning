const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all reports
router.get('/', authenticateToken, isAdmin, reportController.getAllReports);

// Get report statistics
router.get('/stats', authenticateToken, isAdmin, reportController.getReportStats);

// Get reports by category
router.get('/by-category', authenticateToken, isAdmin, reportController.getReportsByCategory);

// Export reports as CSV
router.get('/export/csv', authenticateToken, isAdmin, reportController.exportReportsAsCsv);

// Get report by ID
router.get('/:id', authenticateToken, isAdmin, reportController.getReportById);

// Update report status
router.put('/:id/status', authenticateToken, isAdmin, reportController.updateReportStatus);

// Delete report
router.delete('/:id', authenticateToken, isAdmin, reportController.deleteReport);

module.exports = router; 