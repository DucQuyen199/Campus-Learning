const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const teacherAuth = require('../middleware/teacherAuth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', teacherAuth, authController.getCurrentUser);

module.exports = router; 