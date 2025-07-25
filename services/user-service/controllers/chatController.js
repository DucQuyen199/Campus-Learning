/*-----------------------------------------------------------------
* File: chatController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Enhanced chat controller with full messaging and calling features
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool } = require('../config/db');
const { onlineUsers } = require('../socket');

/**
 * Get all conversations for a user with enhanced details
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conversations = await pool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit))
      .input('offset', offset)
      .query(`
        SELECT 
          c.*,
          cp.Role as UserRole,
          cp.IsMuted,
          cp.LastReadMessageID,
          lm.Content as LastMessageContent,
          lm.Type as LastMessageType,
          lm.CreatedAt as LastMessageTime,
          lmu.Username as LastMessageSender,
          (SELECT COUNT(*) FROM Messages m2 
           WHERE m2.ConversationID = c.ConversationID 
           AND m2.MessageID > ISNULL(cp.LastReadMessageID, 0)) as UnreadCount
        FROM Conversations c
        INNER JOIN ConversationParticipants cp ON c.ConversationID = cp.ConversationID
        LEFT JOIN Messages lm ON c.ConversationID = lm.ConversationID 
          AND lm.CreatedAt = (SELECT MAX(CreatedAt) FROM Messages m3 WHERE m3.ConversationID = c.ConversationID)
        LEFT JOIN Users lmu ON lm.SenderID = lmu.UserID
        WHERE cp.UserID = @userId AND cp.LeftAt IS NULL
        ORDER BY ISNULL(c.LastMessageAt, c.CreatedAt) DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    // Get participants for each conversation
    for (let conv of conversations.recordset) {
      const participants = await pool.request()
        .input('convId', conv.ConversationID)
        .input('userId', userId)
        .query(`
          SELECT 
            u.UserID, u.Username, u.FullName, u.Avatar as Avatar,
            cp.Role, cp.JoinedAt, cp.IsAdmin,
            CASE WHEN ou.UserID IS NOT NULL THEN 1 ELSE 0 END as IsOnline
          FROM ConversationParticipants cp
          INNER JOIN Users u ON cp.UserID = u.UserID
          LEFT JOIN (
            SELECT DISTINCT UserID FROM 
            (SELECT @userId as UserID) ou 
            WHERE @userId IN (${Array.from(onlineUsers.keys()).join(',') || 'NULL'})
          ) ou ON u.UserID = ou.UserID
          WHERE cp.ConversationID = @convId AND cp.LeftAt IS NULL
          ORDER BY cp.JoinedAt ASC
        `);
      
      conv.Participants = participants.recordset;
      
      // For private conversations, set the conversation title to the other user's name
      if (conv.Type === 'private' && participants.recordset.length === 2) {
        const otherUser = participants.recordset.find(p => p.UserID !== userId);
        if (otherUser) {
          conv.Title = otherUser.FullName || otherUser.Username;
          conv.Avatar = otherUser.Avatar;
        }
      }
    }

    res.json({
      success: true,
      data: conversations.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: conversations.recordset.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get messages for a conversation with pagination
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is participant
    const isParticipant = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND LeftAt IS NULL
      `);

    if (!isParticipant.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this conversation' 
      });
    }

    const messages = await pool.request()
      .input('conversationId', conversationId)
      .input('limit', parseInt(limit))
      .input('offset', offset)
      .query(`
        SELECT 
          m.*,
          u.Username as SenderUsername,
          u.FullName as SenderName,
          u.Avatar as SenderAvatar,
          rm.Content as ReplyToContent,
          ru.Username as ReplyToUsername
        FROM Messages m
        INNER JOIN Users u ON m.SenderID = u.UserID
        LEFT JOIN Messages rm ON m.ReplyToMessageID = rm.MessageID
        LEFT JOIN Users ru ON rm.SenderID = ru.UserID
        WHERE m.ConversationID = @conversationId
        AND m.IsDeleted = 0
        ORDER BY m.CreatedAt DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    // Update last read message
    await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .input('lastMessageId', messages.recordset[0]?.MessageID || null)
      .query(`
        UPDATE ConversationParticipants
        SET LastReadMessageID = @lastMessageId
        WHERE ConversationID = @conversationId AND UserID = @userId
      `);

    res.json({
      success: true,
      data: messages.recordset.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.recordset.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Send a message with enhanced features
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyToMessageId, mediaUrl, mediaType } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!conversationId || (!content && !mediaUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conversation ID and content/media are required' 
      });
    }

    // Check if user is participant
    const isParticipant = await pool.request()
      .input('conversationId', conversationId)
      .input('senderId', senderId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @senderId 
        AND LeftAt IS NULL
      `);

    if (!isParticipant.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to send messages in this conversation' 
      });
    }

    // Insert message without OUTPUT to avoid trigger conflicts
    const insertResult = await pool.request()
      .input('conversationId', conversationId)
      .input('senderId', senderId)
      .input('type', type)
      .input('content', content)
      .input('mediaUrl', mediaUrl)
      .input('mediaType', mediaType)
      .input('replyToMessageId', replyToMessageId)
      .query(`
        INSERT INTO Messages (ConversationID, SenderID, Type, Content, MediaUrl, MediaType, ReplyToMessageID)
        VALUES (@conversationId, @senderId, @type, @content, @mediaUrl, @mediaType, @replyToMessageId);
        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS MessageID;
      `);
    const newMessageId = insertResult.recordset[0].MessageID;
    // Retrieve the inserted message
    const messageResult = await pool.request()
      .input('messageId', newMessageId)
      .query(`
        SELECT *
        FROM Messages
        WHERE MessageID = @messageId
      `);
    const message = messageResult.recordset[0];

    // Get sender info
    const senderInfo = await pool.request()
      .input('senderId', senderId)
      .query(`
        SELECT Username as SenderUsername, FullName as SenderName, Avatar as SenderAvatar
        FROM Users WHERE UserID = @senderId
      `);

    // Get reply info if exists
    let replyInfo = null;
    if (replyToMessageId) {
      const replyResult = await pool.request()
        .input('replyToMessageId', replyToMessageId)
        .query(`
          SELECT m.Content as ReplyToContent, u.Username as ReplyToUsername
          FROM Messages m
          INNER JOIN Users u ON m.SenderID = u.UserID
          WHERE m.MessageID = @replyToMessageId
        `);
      replyInfo = replyResult.recordset[0];
    }

    const fullMessage = {
      ...message,
      ...senderInfo.recordset[0],
      ...replyInfo
    };

    // Get conversation participants for real-time updates
    const participants = await pool.request()
      .input('conversationId', conversationId)
      .query(`
        SELECT UserID FROM ConversationParticipants
        WHERE ConversationID = @conversationId AND LeftAt IS NULL
      `);

    // Emit real-time message to all participants
    const io = req.app.get('io');
    participants.recordset.forEach(participant => {
      if (participant.UserID !== senderId) {
        const socketId = onlineUsers.get(participant.UserID);
        if (socketId) {
          io.to(socketId).emit('new-message', {
            conversationId,
            message: fullMessage
          });
        }
      }
    });

    res.status(201).json({
      success: true,
      data: fullMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a new conversation (private or group)
 */
exports.createConversation = async (req, res) => {
  try {
    const { title, participants, type = 'private' } = req.body;
    const createdBy = req.user.id;

    // Validate input
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Participants array is required' 
      });
    }

    if (type === 'group' && !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group title is required' 
      });
    }

    // For private chats, check if conversation already exists
    if (type === 'private' && participants.length === 1) {
      const otherUserId = participants[0];
      const existingConversation = await pool.request()
        .input('userIdA', createdBy)
        .input('userIdB', otherUserId)
        .query(`
          SELECT c.ConversationID
          FROM Conversations c
          JOIN ConversationParticipants cp1 ON c.ConversationID = cp1.ConversationID
          JOIN ConversationParticipants cp2 ON c.ConversationID = cp2.ConversationID
          WHERE c.Type = 'private'
          AND cp1.UserID = @userIdA
          AND cp2.UserID = @userIdB
          AND cp1.LeftAt IS NULL
          AND cp2.LeftAt IS NULL
        `);

      if (existingConversation.recordset.length > 0) {
        return res.status(200).json({
          success: true,
          data: { ConversationID: existingConversation.recordset[0].ConversationID },
          message: 'Existing conversation found'
        });
      }
    }

    const transaction = await pool.transaction();
    
    try {
      await transaction.begin();

      // Create conversation
      const conversationResult = await transaction.request()
        .input('type', type)
        .input('title', title)
        .input('createdBy', createdBy)
        .query(`
          INSERT INTO Conversations (Type, Title, CreatedBy, CreatedAt, UpdatedAt)
          OUTPUT INSERTED.*
          VALUES (@type, @title, @createdBy, GETDATE(), GETDATE())
        `);

      const conversation = conversationResult.recordset[0];

      // Add creator as admin
      await transaction.request()
        .input('conversationId', conversation.ConversationID)
        .input('userId', createdBy)
        .query(`
          INSERT INTO ConversationParticipants (ConversationID, UserID, Role, IsAdmin, JoinedAt)
          VALUES (@conversationId, @userId, 'admin', 1, GETDATE())
        `);

      // Add other participants
      for (const userId of participants) {
        if (userId !== createdBy) {
          await transaction.request()
            .input('conversationId', conversation.ConversationID)
            .input('userId', userId)
            .query(`
              INSERT INTO ConversationParticipants (ConversationID, UserID, Role, JoinedAt)
              VALUES (@conversationId, @userId, 'member', GETDATE())
            `);
        }
      }

      await transaction.commit();

      // Get full conversation details
      const fullConversation = await this.getConversationDetails(conversation.ConversationID, createdBy);

      res.status(201).json({
        success: true,
        data: fullConversation,
        message: 'Conversation created successfully'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get conversation details by ID
 */
exports.getConversationDetails = async (conversationId, userId) => {
  const conversation = await pool.request()
    .input('conversationId', conversationId)
    .input('userId', userId)
    .query(`
      SELECT c.*, cp.Role as UserRole, cp.IsMuted
      FROM Conversations c
      INNER JOIN ConversationParticipants cp ON c.ConversationID = cp.ConversationID
      WHERE c.ConversationID = @conversationId AND cp.UserID = @userId
    `);

  if (conversation.recordset.length === 0) {
    throw new Error('Conversation not found');
  }

  const conv = conversation.recordset[0];

  // Get participants
  const participants = await pool.request()
    .input('conversationId', conversationId)
    .query(`
      SELECT 
        u.UserID, u.Username, u.FullName, u.Avatar as Avatar,
        cp.Role, cp.JoinedAt, cp.IsAdmin
      FROM ConversationParticipants cp
      INNER JOIN Users u ON cp.UserID = u.UserID
      WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
      ORDER BY cp.JoinedAt ASC
    `);

  conv.Participants = participants.recordset;

  return conv;
};

/**
 * Search users for conversations
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const users = await pool.request()
      .input('query', `%${query.trim()}%`)
      .input('currentUserId', currentUserId)
      .input('limit', parseInt(limit))
      .query(`
        SELECT TOP (@limit)
          UserID, Username, FullName, Avatar as Avatar, Email
        FROM Users
        WHERE (Username LIKE @query OR FullName LIKE @query OR Email LIKE @query)
        AND UserID != @currentUserId
        AND IsActive = 1
        ORDER BY 
          CASE 
            WHEN Username LIKE @query THEN 1
            WHEN FullName LIKE @query THEN 2
            ELSE 3
          END,
          FullName ASC
      `);

    res.json({
      success: true,
      data: users.recordset
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update message (edit)
 */
exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if user owns the message
    const message = await pool.request()
      .input('messageId', messageId)
      .input('userId', userId)
      .query(`
        SELECT * FROM Messages
        WHERE MessageID = @messageId AND SenderID = @userId
      `);

    if (!message.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to edit this message' 
      });
    }

    // Update message
    await pool.request()
      .input('messageId', messageId)
      .input('content', content)
      .query(`
        UPDATE Messages
        SET Content = @content, IsEdited = 1, UpdatedAt = GETDATE()
        WHERE MessageID = @messageId
      `);

    res.json({
      success: true,
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete message
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Check if user owns the message
    const message = await pool.request()
      .input('messageId', messageId)
      .input('userId', userId)
      .query(`
        SELECT * FROM Messages
        WHERE MessageID = @messageId AND SenderID = @userId
      `);

    if (!message.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this message' 
      });
    }

    // Soft delete message
    await pool.request()
      .input('messageId', messageId)
      .query(`
        UPDATE Messages
        SET IsDeleted = 1, DeletedAt = GETDATE()
        WHERE MessageID = @messageId
      `);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Leave conversation
 */
exports.leaveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Update participant status
    await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        UPDATE ConversationParticipants
        SET LeftAt = GETDATE()
        WHERE ConversationID = @conversationId AND UserID = @userId
      `);

    res.json({
      success: true,
      message: 'Left conversation successfully'
    });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Mute/unmute conversation
 */
exports.toggleMuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { muted } = req.body;
    const userId = req.user.id;

    await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .input('muted', muted)
      .query(`
        UPDATE ConversationParticipants
        SET IsMuted = @muted
        WHERE ConversationID = @conversationId AND UserID = @userId
      `);

    res.json({
      success: true,
      message: `Conversation ${muted ? 'muted' : 'unmuted'} successfully`
    });
  } catch (error) {
    console.error('Error toggling mute:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Add participants to a group conversation
 */
exports.addParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participants } = req.body;
    const userId = req.user.id;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Participants array is required' 
      });
    }

    // Check if user is admin of the conversation
    const isAdmin = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND IsAdmin = 1
        AND LeftAt IS NULL
      `);

    if (!isAdmin.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can add participants' 
      });
    }

    // Add participants
    for (const participantId of participants) {
      // Check if participant already exists
      const existingParticipant = await pool.request()
        .input('conversationId', conversationId)
        .input('participantId', participantId)
        .query(`
          SELECT 1 FROM ConversationParticipants
          WHERE ConversationID = @conversationId AND UserID = @participantId
        `);

      if (existingParticipant.recordset.length > 0) {
        // If participant left, update LeftAt to NULL
        await pool.request()
          .input('conversationId', conversationId)
          .input('participantId', participantId)
          .query(`
            UPDATE ConversationParticipants
            SET LeftAt = NULL
            WHERE ConversationID = @conversationId AND UserID = @participantId
          `);
      } else {
        // Add new participant
        await pool.request()
          .input('conversationId', conversationId)
          .input('participantId', participantId)
          .query(`
            INSERT INTO ConversationParticipants (ConversationID, UserID, Role, JoinedAt)
            VALUES (@conversationId, @participantId, 'member', GETDATE())
          `);
      }
    }

    res.json({
      success: true,
      message: 'Participants added successfully'
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Remove a participant from a group conversation
 */
exports.removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user.id;

    // Check if user is admin of the conversation
    const isAdmin = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND IsAdmin = 1
        AND LeftAt IS NULL
      `);

    if (!isAdmin.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can remove participants' 
      });
    }

    // Mark participant as left
    await pool.request()
      .input('conversationId', conversationId)
      .input('participantId', participantId)
      .query(`
        UPDATE ConversationParticipants
        SET LeftAt = GETDATE()
        WHERE ConversationID = @conversationId AND UserID = @participantId
      `);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update conversation info (title, etc.)
 */
exports.updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the conversation
    const isAdmin = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND IsAdmin = 1
        AND LeftAt IS NULL
      `);

    if (!isAdmin.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can update conversation info' 
      });
    }

    await pool.request()
      .input('conversationId', conversationId)
      .input('title', title)
      .query(`
        UPDATE Conversations
        SET Title = @title, UpdatedAt = GETDATE()
        WHERE ConversationID = @conversationId
      `);

    res.json({
      success: true,
      message: 'Conversation updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update conversation image
 */
exports.updateConversationImage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // Check if user is admin of the conversation
    const isAdmin = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND IsAdmin = 1
        AND LeftAt IS NULL
      `);

    if (!isAdmin.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can update conversation image' 
      });
    }

    const imageUrl = `/uploads/conversations/${req.file.filename}`;

    await pool.request()
      .input('conversationId', conversationId)
      .input('imageUrl', imageUrl)
      .query(`
        UPDATE Conversations
        SET ImageUrl = @imageUrl, UpdatedAt = GETDATE()
        WHERE ConversationID = @conversationId
      `);

    res.json({
      success: true,
      data: { imageUrl },
      message: 'Conversation image updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversation image:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
