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