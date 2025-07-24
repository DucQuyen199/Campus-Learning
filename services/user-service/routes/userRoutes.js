/*-----------------------------------------------------------------
* File: userRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');
const sessionController = require('../controllers/sessionController');
const authController = require('../controllers/authController');
const sshController = require('../controllers/sshController');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/user');

// Route để lấy thông tin người dùng hiện tại
router.get('/me', authMiddleware, authController.getMe);

// Route để cập nhật thông tin người dùng
router.put('/update', authMiddleware, userController.updateUser);

// Routes cho hồ sơ người dùng
router.get('/profile', authMiddleware, userController.getUserProfile);
router.get('/profile/:userId', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);

// Route tìm kiếm người dùng
router.get('/search', authMiddleware, userController.searchUsers);

// Gợi ý bạn bè
router.get('/suggest-friends', authMiddleware, userController.suggestFriends);

// Email settings routes
router.get('/emails', authMiddleware, emailController.getUserEmails);
router.post('/emails', authMiddleware, emailController.addUserEmail);
router.put('/emails/:emailId/primary', authMiddleware, emailController.setPrimaryEmail);
router.delete('/emails/:emailId', authMiddleware, emailController.deleteUserEmail);
router.post('/emails/:emailId/resend-verification', authMiddleware, emailController.resendVerificationEmail);

// SSH key routes
router.get('/ssh-keys', authMiddleware, sshController.getUserSSHKeys);
router.post('/ssh-keys', authMiddleware, sshController.addSSHKey);
router.delete('/ssh-keys/:keyId', authMiddleware, sshController.deleteSSHKey);

// GPG key routes
router.get('/gpg-keys', authMiddleware, sshController.getUserGPGKeys);
router.post('/gpg-keys', authMiddleware, sshController.addGPGKey);
router.delete('/gpg-keys/:keyId', authMiddleware, sshController.deleteGPGKey);

// Session management routes
router.get('/sessions', authMiddleware, sessionController.getUserSessions);
router.delete('/sessions/:sessionId', authMiddleware, sessionController.deleteUserSession);
router.post('/sessions/terminate-others', authMiddleware, sessionController.terminateOtherSessions);

// Đường dẫn mới cho danh sách người dùng (đảm bảo route này có '/' ở đầu)
router.get('/', authMiddleware, userController.getUsers);

// Route để lấy thông tin người dùng theo ID - phải đặt ở cuối cùng
router.get('/:userId', authMiddleware, userController.getUserById);

module.exports = router; 
