/*-----------------------------------------------------------------
* File: authRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

// User login
router.post('/login', [
  body('username').optional(),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('password').optional()
], authController.login);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router; 
