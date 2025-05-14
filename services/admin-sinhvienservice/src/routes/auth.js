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