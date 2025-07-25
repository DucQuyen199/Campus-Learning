/*-----------------------------------------------------------------
* File: chat.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Enhanced chat routes with full messaging features
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Get all conversations for a user
router.get('/conversations', authenticate, chatController.getConversations);

// Create a new conversation
router.post('/conversations', authenticate, chatController.createConversation);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);

// Send a message
router.post('/messages', authenticate, chatController.sendMessage);

// Search users
router.get('/users/search', authenticate, chatController.searchUsers);

// Update message (edit)
router.put('/messages/:messageId', authenticate, chatController.updateMessage);

// Delete message
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

// Leave conversation
router.post('/conversations/:conversationId/leave', authenticate, chatController.leaveConversation);

// Mute/unmute conversation
router.post('/conversations/:conversationId/mute', authenticate, chatController.toggleMuteConversation);

module.exports = router; 
