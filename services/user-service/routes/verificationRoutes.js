const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required)
// Request password reset
router.post('/password/forgot', verificationController.requestPasswordReset);

// Reset password with OTP
router.post('/password/reset', verificationController.resetPassword);

// Routes that require authentication
router.use(authenticateToken);

// Send email verification OTP
router.post('/email/send-otp', verificationController.sendVerificationOTP);

// Verify email with OTP
router.post('/email/verify', verificationController.verifyEmail);

// Resend verification OTP
router.post('/email/resend-otp', verificationController.resendVerificationOTP);

// Add a new email address to account
router.post('/email/add', verificationController.addEmail);

// Verify additional email
router.post('/email/verify-additional', verificationController.verifyAdditionalEmail);

// Resend verification for additional email
router.post('/email/resend-additional-verification', verificationController.resendAdditionalEmailVerification);

module.exports = router; 