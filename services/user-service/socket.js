const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/db');
const { Op } = require('sequelize');
const sequelize = require('./config/database');

// Online users map
const onlineUsers = new Map();

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
  // Initialize Socket.IO
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5004',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
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
    console.log('User connected:', socket.user.id);
    
    // Add user to online users map
    onlineUsers.set(socket.user.id, socket.id);
    
    // Join user's personal room
    socket.join(`user:${socket.user.id}`);
    
    // Emit updated online users list
    io.emit('getUsers', Array.from(onlineUsers.keys()));
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
      onlineUsers.delete(socket.user.id);
      io.emit('getUsers', Array.from(onlineUsers.keys()));
    });
    
    // Handle joining a chat room
    socket.on('join_room', (roomId) => {
      socket.join(`room:${roomId}`);
      console.log(`User ${socket.user.id} joined room ${roomId}`);
    });
    
    // Handle leaving a chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.user.id} left room ${roomId}`);
    });
    
    // Handle message-sent event (when user sends a message)
    socket.on('message-sent', async (data) => {
      try {
        const { conversationId, message } = data;
        console.log(`Message sent in conversation ${conversationId}`);
        
        // Get all participants in the conversation
        const result = await pool.request()
          .input('conversationId', conversationId)
          .query(`
            SELECT cp.UserID 
            FROM ConversationParticipants cp
            WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
          `);
        
        // Broadcast to all other participants
        result.recordset.forEach(participant => {
          const userId = participant.UserID;
          
          // Skip sender
          if (userId === socket.user.id) return;
          
          const socketId = onlineUsers.get(userId);
          if (socketId) {
            // Send the new message
            io.to(socketId).emit('new-message', message);
            
            // Also emit conversation update to move this conversation to the top
            io.to(socketId).emit('conversation-updated', {
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
    
    // Handle message delivered event
    socket.on('message-delivered', async (data) => {
      try {
        const { messageId, userId } = data;
        
        // Get message sender
        const result = await pool.request()
          .input('messageId', messageId)
          .query(`
            SELECT SenderID, ConversationID FROM Messages
            WHERE MessageID = @messageId
          `);
        
        if (result.recordset.length > 0) {
          const senderId = result.recordset[0].SenderID;
          const conversationId = result.recordset[0].ConversationID;
          
          // Notify sender that message was delivered
          const senderSocketId = onlineUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-status-update', {
              messageId,
              userId,
              conversationId,
              status: 'delivered'
            });
          }
        }
      } catch (error) {
        console.error('Error handling message delivered:', error);
      }
    });

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