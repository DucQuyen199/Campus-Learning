/*-----------------------------------------------------------------
* File: twoFARoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-06-28
* Description: Routes for 2FA functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

const express = require('express');
const router = express.Router();
const twoFAController = require('../controllers/twoFAController');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

// Get 2FA status (requires authentication)
router.get('/status', authMiddleware, twoFAController.getTwoFAStatus);

// Initialize 2FA setup (public for forced setup with token, otherwise requires auth)
router.post('/setup', twoFAController.initTwoFASetup);

// Verify and enable 2FA
router.post('/verify', twoFAController.verifyAndEnable2FA);

// Disable 2FA (requires authentication)
router.post('/disable', authMiddleware, twoFAController.disable2FA);

// Verify 2FA code during login
router.post('/verify-login', twoFAController.verifyLogin);

module.exports = router; 