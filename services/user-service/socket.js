/*-----------------------------------------------------------------
* File: socket.js  
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Enhanced socket handling for real-time messaging and calls
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/db');

// Track online users and their socket IDs
const onlineUsers = new Map();
// Track active conversations and their participants
const activeConversations = new Map();
// Track typing users per conversation
const typingUsers = new Map();

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        throw new Error('No token provided');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details from database
      const userResult = await pool.request()
        .input('userId', decoded.id)
        .query('SELECT UserID, Username, FullName, Avatar FROM Users WHERE UserID = @userId');

      if (!userResult.recordset.length) {
        throw new Error('User not found');
      }

      socket.user = userResult.recordset[0];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.UserID;
    console.log(`User ${socket.user.Username} connected with socket ${socket.id}`);

    // Register user as online
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;

    // Emit user online status to contacts
    emitUserOnlineStatus(userId, true);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Get user's conversations and join those rooms
    getUserConversations(userId).then(conversations => {
      conversations.forEach(conv => {
        socket.join(`conversation:${conv.ConversationID}`);
        
        // Add user to active conversations tracking
        if (!activeConversations.has(conv.ConversationID)) {
          activeConversations.set(conv.ConversationID, new Set());
        }
        activeConversations.get(conv.ConversationID).add(userId);
      });
    });

    // Handle typing indicators
    socket.on('typing-start', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant
        const isParticipant = await verifyConversationParticipant(conversationId, userId);
        if (!isParticipant) return;

        // Add to typing users
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, new Set());
        }
        typingUsers.get(conversationId).add(userId);

        // Broadcast to other participants
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
          conversationId,
          userId,
          username: socket.user.Username,
          isTyping: true
        });
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing-stop', async (data) => {
      try {
        const { conversationId } = data;
        
        // Remove from typing users
        if (typingUsers.has(conversationId)) {
          typingUsers.get(conversationId).delete(userId);
          if (typingUsers.get(conversationId).size === 0) {
            typingUsers.delete(conversationId);
          }
        }

        // Broadcast to other participants
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
          conversationId,
          userId,
          username: socket.user.Username,
          isTyping: false
        });
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    // Handle message sent event
    socket.on('message-sent', async (data) => {
      try {
        const { conversationId, message } = data;
        
        // Verify user is participant
        const isParticipant = await verifyConversationParticipant(conversationId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
          return;
        }

        // Broadcast message to conversation participants
        socket.to(`conversation:${conversationId}`).emit('new-message', {
          conversationId,
          message: {
            ...message,
            SenderUsername: socket.user.Username,
            SenderName: socket.user.FullName || socket.user.Username,
            SenderAvatar: socket.user.Avatar
          }
        });

        // Update conversation's last message time
        socket.to(`conversation:${conversationId}`).emit('conversation-updated', {
          conversationId,
          lastMessage: message,
          lastMessageAt: new Date()
        });

        console.log(`Message sent in conversation ${conversationId} by user ${userId}`);
      } catch (error) {
        console.error('Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to broadcast message' });
      }
    });

    // Handle message read status
    socket.on('message-read', async (data) => {
      try {
        const { conversationId, messageId } = data;
        
        // Update read status in database
        await pool.request()
          .input('conversationId', conversationId)
          .input('userId', userId)
          .input('messageId', messageId)
          .query(`
            UPDATE ConversationParticipants
            SET LastReadMessageID = @messageId
            WHERE ConversationID = @conversationId AND UserID = @userId
          `);

        // Broadcast read status to other participants
        socket.to(`conversation:${conversationId}`).emit('message-read-by', {
          conversationId,
          messageId,
          readBy: userId,
          readByName: socket.user.Username
        });
      } catch (error) {
        console.error('Error updating message read status:', error);
      }
    });

    // Handle joining a conversation
    socket.on('join-conversation', async (conversationId) => {
      try {
        const isParticipant = await verifyConversationParticipant(conversationId, userId);
        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          
          // Add to active conversations
          if (!activeConversations.has(conversationId)) {
            activeConversations.set(conversationId, new Set());
          }
          activeConversations.get(conversationId).add(userId);

          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Handle leaving a conversation
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      
      // Remove from active conversations
      if (activeConversations.has(conversationId)) {
        activeConversations.get(conversationId).delete(userId);
        if (activeConversations.get(conversationId).size === 0) {
          activeConversations.delete(conversationId);
        }
      }

      // Remove from typing users
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
      }

      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Call-related events
    socket.on('call-signal', (data) => {
      const { to, signal, callId } = data;
      const targetSocketId = onlineUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-signal', {
          from: userId,
          signal,
          callId
        });
      }
    });

    socket.on('call-ice-candidate', (data) => {
      const { to, candidate, callId } = data;
      const targetSocketId = onlineUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-ice-candidate', {
          from: userId,
          candidate,
          callId
        });
      }
    });

    // Handle WebRTC offer for calls
    socket.on('call-offer', (data) => {
      const { to, offer, callId } = data;
      const targetSocketId = onlineUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-offer', {
          from: userId,
          offer,
          callId,
          fromUser: {
            id: userId,
            username: socket.user.Username,
            name: socket.user.FullName || socket.user.Username,
            avatar: socket.user.Avatar
          }
        });
      }
    });

    // Handle WebRTC answer for calls
    socket.on('call-answer', (data) => {
      const { to, answer, callId } = data;
      const targetSocketId = onlineUsers.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('call-answer', {
          from: userId,
          answer,
          callId
        });
      }
    });

    // Handle screen sharing
    socket.on('screen-share-start', (data) => {
      const { conversationId, callId } = data;
      socket.to(`conversation:${conversationId}`).emit('screen-share-started', {
        callId,
        sharedBy: userId,
        sharedByName: socket.user.Username
      });
    });

    socket.on('screen-share-stop', (data) => {
      const { conversationId, callId } = data;
      socket.to(`conversation:${conversationId}`).emit('screen-share-stopped', {
        callId,
        stoppedBy: userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.Username} disconnected`);
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      // Emit user offline status
      emitUserOnlineStatus(userId, false);
      
      // Clean up typing indicators
      for (const [conversationId, typingSet] of typingUsers.entries()) {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          
          // Notify others that user stopped typing
          socket.to(`conversation:${conversationId}`).emit('user-typing', {
            conversationId,
            userId,
            username: socket.user.Username,
            isTyping: false
          });
        }
      }
      
      // Clean up active conversations
      for (const [conversationId, participantSet] of activeConversations.entries()) {
        participantSet.delete(userId);
        if (participantSet.size === 0) {
          activeConversations.delete(conversationId);
        }
      }
    });
  });

  return io;
};

// Helper function to get user conversations
async function getUserConversations(userId) {
  try {
    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT c.ConversationID
        FROM Conversations c
        INNER JOIN ConversationParticipants cp ON c.ConversationID = cp.ConversationID
        WHERE cp.UserID = @userId AND cp.LeftAt IS NULL
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}

// Helper function to verify conversation participant
async function verifyConversationParticipant(conversationId, userId) {
  try {
    const result = await pool.request()
      .input('conversationId', conversationId)
      .input('userId', userId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND LeftAt IS NULL
      `);
    
    return result.recordset.length > 0;
  } catch (error) {
    console.error('Error verifying conversation participant:', error);
    return false;
  }
}

// Helper function to emit user online/offline status
async function emitUserOnlineStatus(userId, isOnline) {
  try {
    // Get user's contacts/friends who should be notified
    const contacts = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT DISTINCT f.UserID as ContactId
        FROM Friendships f
        WHERE (f.RequesterID = @userId OR f.RequesteeID = @userId)
        AND f.Status = 'accepted'
      `);

    // Emit status to online contacts
    contacts.recordset.forEach(contact => {
      const contactSocketId = onlineUsers.get(contact.ContactId);
      if (contactSocketId && io) {
        io.to(contactSocketId).emit('user-status-changed', {
          userId,
          isOnline,
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error emitting user online status:', error);
  }
}

// Function to get online users (for external use)
function getOnlineUsers() {
  return onlineUsers;
}

// Function to get active conversations (for external use)
function getActiveConversations() {
  return activeConversations;
}

// Function to emit to specific user
function emitToUser(userId, event, data) {
  const socketId = onlineUsers.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

// Function to emit to conversation
function emitToConversation(conversationId, event, data, excludeUserId = null) {
  if (io) {
    const room = `conversation:${conversationId}`;
    if (excludeUserId) {
      const excludeSocketId = onlineUsers.get(excludeUserId);
      if (excludeSocketId) {
        io.to(room).except(excludeSocketId).emit(event, data);
      } else {
        io.to(room).emit(event, data);
      }
    } else {
      io.to(room).emit(event, data);
    }
    return true;
  }
  return false;
}

module.exports = {
  initializeSocket,
  getOnlineUsers,
  getActiveConversations,
  emitToUser,
  emitToConversation,
  onlineUsers // Export for backward compatibility
}; 
