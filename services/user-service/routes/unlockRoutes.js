/*-----------------------------------------------------------------
* File: unlockRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-01-19
* Description: Routes for account unlock functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

const express = require('express');
const router = express.Router();
const unlockController = require('../controllers/accountUnlockController');

// Verify unlock token and get user info
router.get('/verify-token/:token', unlockController.verifyUnlockToken);

// Verify email token (first step)
router.post('/verify-email', unlockController.verifyEmailToken);

// Verify 2FA and complete unlock (second step)
router.post('/verify-2fa', unlockController.verifyTwoFAUnlock);

// Request new unlock email
router.post('/request-email', unlockController.requestNewUnlockEmail);

// Get account lock status
router.get('/status/:email', unlockController.getAccountLockStatus);

module.exports = router; 