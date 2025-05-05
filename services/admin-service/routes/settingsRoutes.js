const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken);

// System settings routes
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Notification settings routes  
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// System info route
router.get('/system-info', settingsController.getSystemInfo);

module.exports = router; 