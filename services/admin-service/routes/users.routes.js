const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// User management routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Role management
router.put('/:id/role', userController.updateUserRole);
router.post('/:id/lock', userController.lockUser);
router.post('/:id/unlock', userController.unlockUser);

module.exports = router; 