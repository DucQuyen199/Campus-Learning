const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');

router.get('/:userId', internshipController.getInternships);

module.exports = router; 