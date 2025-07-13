const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
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

// Forgot and reset password routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-otp', authController.verifyOTP);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);
router.get('/check', authenticateToken, authController.checkAuth);

module.exports = router; 