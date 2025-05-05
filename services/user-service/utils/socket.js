const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

let io;
const users = new Map(); // userId -> socketId
const sockets = new Map(); // socketId -> userId

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('addUser', (userId) => {
      users.set(userId, socket.id);
      sockets.set(socket.id, userId);
      io.emit('getUsers', Array.from(users.keys()));

      // Update user presence
      updateUserPresence(userId, 'online');
    });

    socket.on('sendMessage', async ({ conversationId, receiverId, content }) => {
      const senderId = socket.user.id;

      try {
        // Save message to database
        const message = await db.query(`
          INSERT INTO Messages (ConversationID, SenderID, Content, Type)
          OUTPUT INSERTED.*
          VALUES (@conversationId, @senderId, @content, 'text')
        `, { conversationId, senderId, content });

        if (!message || message.length === 0) {
          console.error('Failed to insert message');
          return;
        }

        // Update conversation last message time
        await db.query(`
          UPDATE Conversations
          SET LastMessageAt = GETDATE()
          WHERE ConversationID = @conversationId
        `, { conversationId });

        // Get sender info
        const sender = await db.query(`
          SELECT Username as senderName, Avatar as senderAvatar
          FROM Users WHERE UserID = @senderId
        `, { senderId });

        const messageWithSender = { ...message[0], ...sender[0] };

        // Get all participants in the conversation
        const participants = await db.query(`
          SELECT UserID
          FROM ConversationParticipants
          WHERE ConversationID = @conversationId AND LeftAt IS NULL
        `, { conversationId });

        // Send to all online participants except sender
        participants.forEach(participant => {
          if (participant.UserID !== senderId) {
            const receiverSocketId = users.get(participant.UserID);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('getMessage', messageWithSender);
            }
          }
        });

        // Update message status for offline participants
        participants.forEach(async (participant) => {
          if (participant.UserID !== senderId) {
            const status = users.has(participant.UserID) ? 'delivered' : 'sent';
            await db.query(`
              INSERT INTO MessageStatus (MessageID, UserID, Status)
              VALUES (@messageId, @userId, @status)
            `, {
              messageId: messageWithSender.MessageID,
              userId: participant.UserID,
              status
            });
          }
        });
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    socket.on('disconnect', () => {
      const userId = sockets.get(socket.id);
      if (userId) {
        users.delete(userId);
        sockets.delete(socket.id);
        io.emit('getUsers', Array.from(users.keys()));
        
        // Update user presence
        updateUserPresence(userId, 'offline');
      }
    });
  });

  return io;
};

const updateUserPresence = async (userId, status) => {
  try {
    const exists = await db.query(`
      SELECT 1 FROM UserPresence WHERE UserID = @userId
    `, { userId });
    
    if (exists && exists.length > 0) {
      await db.query(`
        UPDATE UserPresence
        SET Status = @status, LastActiveAt = GETDATE()
        WHERE UserID = @userId
      `, { userId, status });
    } else {
      await db.query(`
        INSERT INTO UserPresence (UserID, Status, LastActiveAt)
        VALUES (@userId, @status, GETDATE())
      `, { userId, status });
    }
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
};

module.exports = {
  initializeSocket,
  getIO: () => io
}; 