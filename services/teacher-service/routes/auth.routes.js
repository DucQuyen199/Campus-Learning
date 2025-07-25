/*-----------------------------------------------------------------
* File: auth.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const teacherAuth = require('../middleware/teacherAuth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', teacherAuth, authController.getCurrentUser);

module.exports = router; 
