/*-----------------------------------------------------------------
* File: notificationsRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
