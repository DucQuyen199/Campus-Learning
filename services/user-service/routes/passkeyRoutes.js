const express = require('express');
const router = express.Router();
const passkeyController = require('../controllers/passkeyController');
const { authenticateToken } = require('../middleware/auth');

// Public routes for authentication with passkey
router.post('/auth/options', passkeyController.generateAuthenticationOptions);
router.post('/auth/verify', passkeyController.verifyAuthentication);

// Protected routes for managing passkeys
router.get('/list', authenticateToken, passkeyController.listPasskeys);
router.post('/register/options', authenticateToken, passkeyController.generateRegistrationOptions);
router.post('/register/verify', authenticateToken, passkeyController.verifyRegistration);
router.delete('/:passkeyId', authenticateToken, passkeyController.removePasskey);

module.exports = router; 