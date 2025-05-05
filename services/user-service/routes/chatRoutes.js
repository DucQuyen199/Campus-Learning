const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Get all conversations for current user
router.get('/conversations', authenticate, chatController.getUserConversations);

// Create a new conversation
router.post('/conversations', authenticate, chatController.createConversation);

// Get messages for a conversation
router.get('/messages/:conversationId', authenticate, chatController.getConversationMessages);

// Send a message
router.post('/messages', authenticate, chatController.sendMessage);

// Add new route for sending messages to a specific conversation
router.post('/conversations/:conversationId/messages', authenticate, chatController.sendMessageToConversation);

// Update message status (read/delivered)
router.post('/messages/status', authenticate, chatController.updateMessageStatus);

// Get users for new conversation (with search and pagination)
router.get('/users', authenticate, chatController.getUsers);

// Search users with pagination
router.get('/users/search', authenticate, chatController.getUsers);

module.exports = router; 