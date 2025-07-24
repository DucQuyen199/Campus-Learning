/*-----------------------------------------------------------------
* File: auth.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateAdmin = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes (require admin authentication)
router.get('/profile', authenticateAdmin, authController.getProfile);
router.post('/change-password', authenticateAdmin, authController.changePassword);
router.get('/validate-token', authenticateAdmin, authController.validateToken);

module.exports = router; 
