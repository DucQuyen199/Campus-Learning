/*-----------------------------------------------------------------
* File: authRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
// OTP login routes
router.post('/login-otp', authController.requestLoginOtp);
router.post('/login-otp/verify', authController.verifyLoginOtp);
// Add 2FA login route
router.post('/login-2fa', authController.login2Fa);
// 2FA routes
router.get('/2fa/status', authenticateToken, authController.getTwoFaStatus);
router.post('/2fa/setup', authenticateToken, authController.setup2Fa);
router.post('/2fa/verify', authenticateToken, authController.verify2Fa);
router.post('/2fa/disable', authenticateToken, authController.disable2Fa);
router.post('/refresh-token', authController.refreshToken);

// OAuth routes
router.post('/google', oauthController.googleAuth);
router.post('/facebook', oauthController.facebookAuth);
router.get('/oauth/connections', authenticateToken, oauthController.getConnections);
router.post('/oauth/connect/google', authenticateToken, oauthController.connectGoogle);
router.post('/oauth/connect/facebook', authenticateToken, oauthController.connectFacebook);
router.delete('/oauth/disconnect/:provider', authenticateToken, oauthController.disconnectProvider);

// Forgot and reset password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-otp', authController.verifyOTP);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.get('/check', authenticateToken, authController.checkAuth);

module.exports = router; 
