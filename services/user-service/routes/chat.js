/*-----------------------------------------------------------------
* File: chat.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

// Get all conversations for a user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await db.query(`
      SELECT c.*, cp.Role as userRole,
        (SELECT Content FROM Messages m 
         WHERE m.ConversationID = c.ConversationID 
         ORDER BY m.CreatedAt DESC LIMIT 1) as lastMessage
      FROM Conversations c
      INNER JOIN ConversationParticipants cp ON c.ConversationID = cp.ConversationID
      WHERE cp.UserID = @userId AND cp.LeftAt IS NULL
      ORDER BY c.LastMessageAt DESC
    `, { userId });

    // Get participants for each conversation
    for (let conv of conversations) {
      const participants = await db.query(`
        SELECT u.UserID, u.Username, u.Avatar, cp.Role
        FROM ConversationParticipants cp
        INNER JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.ConversationID = @convId AND cp.LeftAt IS NULL
      `, { convId: conv.ConversationID });
      
      conv.participants = participants;
    }

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await db.query(`
      SELECT 1 FROM ConversationParticipants
      WHERE ConversationID = @conversationId 
      AND UserID = @userId 
      AND LeftAt IS NULL
    `, { conversationId, userId });

    if (!isParticipant.length) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await db.query(`
      SELECT m.*, u.Username as senderName, u.Avatar as senderAvatar
      FROM Messages m
      INNER JOIN Users u ON m.SenderID = u.UserID
      WHERE m.ConversationID = @conversationId
      AND m.IsDeleted = 0
      ORDER BY m.CreatedAt ASC
    `, { conversationId });

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a message
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    // Check if user is participant
    const isParticipant = await db.query(`
      SELECT 1 FROM ConversationParticipants
      WHERE ConversationID = @conversationId 
      AND UserID = @senderId 
      AND LeftAt IS NULL
    `, { conversationId, senderId });

    if (!isParticipant.length) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Insert message
    const [message] = await db.query(`
      INSERT INTO Messages (ConversationID, SenderID, Type, Content)
      OUTPUT INSERTED.*
      VALUES (@conversationId, @senderId, @type, @content)
    `, { conversationId, senderId, type, content });

    // Update conversation last message time
    await db.query(`
      UPDATE Conversations
      SET LastMessageAt = GETDATE()
      WHERE ConversationID = @conversationId
    `, { conversationId });

    // Get sender info
    const [sender] = await db.query(`
      SELECT Username as senderName, Avatar as senderAvatar
      FROM Users WHERE UserID = @senderId
    `, { senderId });

    res.json({ ...message, ...sender });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new conversation
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { title, participants, type = 'private' } = req.body;
    const createdBy = req.user.id;

    // Start transaction
    const transaction = await db.transaction();

    try {
      // Create conversation
      const [conversation] = await transaction.query(`
        INSERT INTO Conversations (Type, Title, CreatedBy)
        OUTPUT INSERTED.*
        VALUES (@type, @title, @createdBy)
      `, { type, title, createdBy });

      // Add participants
      const allParticipants = [...new Set([...participants, createdBy])];
      for (const userId of allParticipants) {
        await transaction.query(`
          INSERT INTO ConversationParticipants (ConversationID, UserID, Role)
          VALUES (@conversationId, @userId, @role)
        `, {
          conversationId: conversation.ConversationID,
          userId,
          role: userId === createdBy ? 'admin' : 'member'
        });
      }

      await transaction.commit();

      // Get full conversation details
      const [fullConversation] = await db.query(`
        SELECT c.*, cp.Role as userRole
        FROM Conversations c
        INNER JOIN ConversationParticipants cp 
        ON c.ConversationID = cp.ConversationID
        WHERE c.ConversationID = @conversationId AND cp.UserID = @userId
      `, { conversationId: conversation.ConversationID, userId: createdBy });

      // Get participants
      fullConversation.participants = await db.query(`
        SELECT u.UserID, u.Username, u.Avatar, cp.Role
        FROM ConversationParticipants cp
        INNER JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
      `, { conversationId: conversation.ConversationID });

      res.json(fullConversation);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 
