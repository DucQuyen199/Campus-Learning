/*-----------------------------------------------------------------
* File: internshipRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');

router.get('/:userId', internshipController.getInternships);

module.exports = router; 
