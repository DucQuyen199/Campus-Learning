/*-----------------------------------------------------------------
* File: socket.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/db');
const { Op } = require('sequelize');
const sequelize = require('./config/database');

// Online users map - store socket IDs by user ID for efficient lookup
const onlineUsers = new Map();
// Active conversations map to track which users are in which conversations
const activeConversations = new Map();

// Add scheduled task to update competition statuses
const updateCompetitionStatuses = async () => {
  try {
    // Check if pool is connected before proceeding
    if (!pool.connected) {
      console.log('Database not connected yet, skipping competition status update');
      return;
    }
    
    const now = new Date();
    
    // Update upcoming competitions to ongoing if current time is after start time
    await pool.request().query(`
      UPDATE Competitions
      SET Status = 'ongoing'
      WHERE Status = 'upcoming' 
      AND StartTime <= GETDATE() 
      AND DATEADD(MINUTE, Duration, StartTime) > GETDATE()
    `);
    
    // Update ongoing competitions to completed if current time is after end time
    await pool.request().query(`
      UPDATE Competitions
      SET Status = 'completed'
      WHERE Status = 'ongoing' 
      AND DATEADD(MINUTE, Duration, StartTime) <= GETDATE()
    `);
    
    console.log('Competition statuses updated at:', now.toISOString());
  } catch (error) {
    console.error('Error updating competition statuses:', error);
  }
};

const initializeSocket = (server) => {
  // Initialize Socket.IO with improved performance options
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5004',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    // Add performance optimizations
    pingTimeout: 30000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    // Prefer WebSocket transport
    allowEIO3: true
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Don't run competition status update immediately
  // Instead, set up a timer to check database connection and run it when ready
  const checkDbAndRunUpdate = () => {
    if (pool.connected) {
      console.log('Database connected, running competition status update');
      updateCompetitionStatuses();
      // Schedule to run every minute
      setInterval(updateCompetitionStatuses, 60000);
    } else {
      console.log('Database not connected yet, will retry in 5 seconds');
      setTimeout(checkDbAndRunUpdate, 5000);
    }
  };
  
  // Start checking for database connection
  checkDbAndRunUpdate();

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log('User connected:', userId);
    
    // Add user to online users map
    onlineUsers.set(userId, socket.id);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Emit updated online users list
    io.emit('getUsers', Array.from(onlineUsers.keys()));
    
    // Send initial presence status to all friends
    sendPresenceUpdate(userId, 'online');
    
    // Handle disconnection with grace period
    let disconnectTimer;
    
    socket.on('disconnect', () => {
      // Give a grace period before marking as offline (for reconnects)
      disconnectTimer = setTimeout(() => {
        console.log('User disconnected (timed out):', userId);
        onlineUsers.delete(userId);
        
        // Leave all active conversations
        const userConversations = getUserActiveConversations(userId);
        userConversations.forEach(conversationId => {
          leaveConversation(userId, conversationId);
        });
        
        // Send offline status to friends
        sendPresenceUpdate(userId, 'offline');
        
        // Let everyone know updated online users
        io.emit('getUsers', Array.from(onlineUsers.keys()));
      }, 5000); // 5 second grace period for reconnection
    });
    
    // Handle reconnection by clearing timeout
    socket.on('reconnect', () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }
    });
    
    // Handle joining a chat room with tracking
    socket.on('join_room', (roomId) => {
      socket.join(`room:${roomId}`);
      console.log(`User ${userId} joined room ${roomId}`);
      
      // Track which conversation this user is in
      addToConversation(userId, roomId);
    });
    
    // Handle leaving a chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${userId} left room ${roomId}`);
      
      // Remove user from conversation tracking
      leaveConversation(userId, roomId);
    });
    
    // Send typing indicator to other participants
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        
        // Get all participants in the conversation
        const participants = await getConversationParticipants(conversationId);
        
        // Send typing status to all other participants
        participants.forEach(participantId => {
          // Skip sender
          if (participantId === userId) return;
          
          const participantSocketId = onlineUsers.get(participantId);
          if (participantSocketId) {
            io.to(participantSocketId).emit('user-typing', {
              conversationId,
              userId,
              isTyping
            });
          }
        });
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    });
    
    // Handle message-sent event (when user sends a message) with optimized delivery
    socket.on('message-sent', async (data) => {
      try {
        const { conversationId, message } = data;
        console.log(`Message sent in conversation ${conversationId}`);
        
        // Get or fetch participants
        const participants = await getConversationParticipants(conversationId);
        
        // Broadcast to all other participants with efficient targeting
        participants.forEach(participantId => {
          // Skip sender
          if (participantId === userId) return;
          
          const participantSocketId = onlineUsers.get(participantId);
          if (participantSocketId) {
            // Send the new message
            io.to(participantSocketId).emit('new-message', message);
            
            // Also emit conversation update to move this conversation to the top
            io.to(participantSocketId).emit('conversation-updated', {
              conversationId: conversationId,
              lastMessage: message
            });
          }
        });
      } catch (error) {
        console.error('Error broadcasting message:', error);
        socket.emit('error', { message: 'Failed to broadcast message' });
      }
    });
    
    // Helper function to get conversation participants with caching
    async function getConversationParticipants(conversationId) {
      // Check if we already have participants cached
      if (activeConversations.has(conversationId)) {
        const participants = activeConversations.get(conversationId);
        return [...participants]; // Return a copy of the set
      }
      
      // If not cached, fetch from database
      const result = await pool.request()
        .input('conversationId', conversationId)
        .query(`
          SELECT cp.UserID 
          FROM ConversationParticipants cp
          WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
        `);
      
      // Extract user IDs
      const participants = result.recordset.map(row => row.UserID);
      
      // Initialize in the tracking map if needed
      if (!activeConversations.has(conversationId)) {
        activeConversations.set(conversationId, new Set());
      }
      
      // Add all participants to the tracking (but don't override active status)
      participants.forEach(participantId => {
        addToConversation(participantId, conversationId, false); // Don't join socket room
      });
      
      return participants;
    }
    
    // Helper function to track user in conversation
    function addToConversation(userId, conversationId, joinRoom = true) {
      if (!activeConversations.has(conversationId)) {
        activeConversations.set(conversationId, new Set());
      }
      
      activeConversations.get(conversationId).add(userId);
      
      // Optionally join the room
      if (joinRoom) {
        socket.join(`conversation:${conversationId}`);
      }
    }
    
    // Helper function to remove user from conversation tracking
    function leaveConversation(userId, conversationId) {
      if (activeConversations.has(conversationId)) {
        activeConversations.get(conversationId).delete(userId);
        
        // Clean up empty conversations
        if (activeConversations.get(conversationId).size === 0) {
          activeConversations.delete(conversationId);
        }
      }
      
      // Leave the room
      socket.leave(`conversation:${conversationId}`);
    }
    
    // Helper to get all conversations a user is active in
    function getUserActiveConversations(userId) {
      const userConversations = [];
      
      for (const [conversationId, participants] of activeConversations.entries()) {
        if (participants.has(userId)) {
          userConversations.push(conversationId);
        }
      }
      
      return userConversations;
    }
    
    // Helper to update user's presence status
    async function sendPresenceUpdate(userId, status) {
      try {
        // Update database
        await pool.request()
          .input('userId', userId)
          .input('status', status)
          .query(`
            UPDATE UserPresence
            SET Status = @status, LastActiveAt = GETDATE()
            WHERE UserID = @userId;
            
            -- If no record exists, insert one
            IF @@ROWCOUNT = 0
            INSERT INTO UserPresence (UserID, Status, LastActiveAt)
            VALUES (@userId, @status, GETDATE());
          `);
          
        // Get user's friends to notify them
        const friendsResult = await pool.request()
          .input('userId', userId)
          .query(`
            SELECT
              CASE 
                WHEN f.UserID = @userId THEN f.FriendID
                ELSE f.UserID
              END as FriendID
            FROM Friendships f
            WHERE (f.UserID = @userId OR f.FriendID = @userId)
              AND f.Status = 'accepted'
          `);
          
        // Notify all online friends about status change
        if (friendsResult.recordset) {
          friendsResult.recordset.forEach(row => {
            const friendId = row.FriendID;
            const friendSocketId = onlineUsers.get(friendId);
            
            if (friendSocketId) {
              io.to(friendSocketId).emit('presence-update', {
                userId,
                status
              });
            }
          });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    }
    
    // CALL RELATED SOCKET EVENTS

    // Handle call signaling (WebRTC)
    socket.on('call-signal', (data) => {
      const { userId, signal } = data;
      const userSocketId = onlineUsers.get(userId);
      
      console.log(`Call signal from ${socket.user.id} to ${userId}, type: ${signal.type}`);
      
      if (userSocketId) {
        io.to(userSocketId).emit('call-signal', {
          fromUserId: socket.user.id,
          signal
        });
        console.log(`Signal forwarded to ${userId} successfully`);
      } else {
        console.log(`Failed to send signal: User ${userId} not found or offline`);
      }
    });

    // Handle ICE candidate exchange for WebRTC
    socket.on('ice-candidate', (data) => {
      const { userId, candidate } = data;
      const userSocketId = onlineUsers.get(userId);
      
      if (userSocketId) {
        io.to(userSocketId).emit('ice-candidate', {
          fromUserId: socket.user.id,
          candidate
        });
      }
    });

    // Join a call room
    socket.on('join-call-room', (callId) => {
      socket.join(`call:${callId}`);
      console.log(`User ${socket.user.id} joined call room ${callId}`);
      
      // Notify other participants in the call room
      socket.to(`call:${callId}`).emit('user-joined-call', {
        userId: socket.user.id
      });
    });

    // Leave a call room
    socket.on('leave-call-room', (callId) => {
      socket.leave(`call:${callId}`);
      console.log(`User ${socket.user.id} left call room ${callId}`);
      
      // Notify other participants in the call room
      socket.to(`call:${callId}`).emit('user-left-call', {
        userId: socket.user.id
      });
    });

    // Toggle audio/video
    socket.on('toggle-media', (data) => {
      const { callId, type, enabled } = data;
      
      socket.to(`call:${callId}`).emit('user-toggle-media', {
        userId: socket.user.id,
        type,
        enabled
      });
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  onlineUsers
}; 
