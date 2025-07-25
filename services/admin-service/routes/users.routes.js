/*-----------------------------------------------------------------
* File: users.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Role management
router.put('/:id/role', userController.updateUserRole);
router.post('/:id/lock', userController.lockUser);
router.post('/:id/unlock', userController.unlockUser);

// Password management
router.post('/:id/reset-password', userController.resetUserPassword);

module.exports = router; 
