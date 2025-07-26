/*-----------------------------------------------------------------
* File: chatRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const { chatUploadMiddleware, validateFileSize } = require('../middleware/chatUpload');

// Get all conversations for current user
router.get('/conversations', authenticate, chatController.getConversations);

// Get a single conversation by ID
router.get('/conversations/:conversationId', authenticate, (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = req.user.id;
  
  chatController.getConversationDetails(conversationId, userId)
    .then(conversation => {
      res.json({ success: true, data: conversation });
    })
    .catch(error => {
      console.error('Error getting conversation:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
});

// Create a new conversation
router.post('/conversations', authenticate, chatController.createConversation);

// Get messages for a conversation (legacy path)
router.get('/messages/:conversationId', authenticate, chatController.getMessages);

// Get messages for a conversation (preferred path to match frontend)
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);

// Send a message
router.post('/messages', authenticate, chatController.sendMessage);

// Add new route for sending messages to a specific conversation
router.post('/conversations/:conversationId/messages', authenticate, (req, res) => {
  // Add conversation ID from params to the body
  req.body.conversationId = req.params.conversationId;
  chatController.sendMessage(req, res);
});

// Upload file(s) for chat
router.post('/upload-files', 
  authenticate, 
  chatUploadMiddleware.array('files', 5), 
  validateFileSize, 
  chatController.uploadFiles
);

// Send message with file
router.post('/conversations/:conversationId/files', 
  authenticate,
  chatUploadMiddleware.single('file'),
  validateFileSize,
  chatController.sendFileMessage
);

// Update message
router.put('/messages/:messageId', authenticate, chatController.updateMessage);

// Delete message
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

// Get users for new conversation (with search and pagination)
router.get('/users', authenticate, chatController.searchUsers);

// Get suggested users for chat (users not in conversations with current user)
router.get('/users/suggested', authenticate, chatController.searchUsers);

// Search users with pagination
router.get('/users/search', authenticate, chatController.searchUsers);

// Add participants to a group conversation
router.post('/conversations/:conversationId/participants', authenticate, chatController.addParticipants);

// Remove a participant from a group conversation
router.delete('/conversations/:conversationId/participants/:participantId', authenticate, chatController.removeParticipant);

// Leave a group conversation (self-removal)
router.delete('/conversations/:conversationId/leave', authenticate, chatController.leaveConversation);

// Update conversation info
router.put('/conversations/:conversationId', authenticate, chatController.updateConversation);

// Update conversation image
router.post('/conversations/:conversationId/image', authenticate, chatController.updateConversationImage);

module.exports = router; 
