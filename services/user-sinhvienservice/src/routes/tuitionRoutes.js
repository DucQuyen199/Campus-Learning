const express = require('express');
const router = express.Router();
const tuitionController = require('../controllers/tuitionController');

// Get current semester tuition
router.get('/current/:userId', tuitionController.getCurrentTuition);

// Get tuition history
router.get('/history/:userId', tuitionController.getTuitionHistory);

module.exports = router; 