const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

/**
 * @route   GET /api/notifications/:userId
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/:userId', notificationsController.getNotifications);

/**
 * @route   PUT /api/notifications/:notificationId
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId', notificationsController.markAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:notificationId', notificationsController.deleteNotification);

module.exports = router; 