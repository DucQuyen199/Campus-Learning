/*-----------------------------------------------------------------
* File: server.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
require('dotenv').config();
const app = require('./app');
const http = require('http');
const jwt = require('jsonwebtoken');
const { pool, sql } = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./socket');
const { initializeDocker } = require('./utils/dockerManager');
const { fork } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5001;

// Hàm tạo bảng EmailVerifications
async function createEmailVerificationsTable() {
  try {
    console.log('Creating EmailVerifications table if it does not exist...');
    
    const checkTableResult = await pool.request().query(`
      SELECT OBJECT_ID('dbo.EmailVerifications') as TableExists
    `);
    
    const tableExists = checkTableResult.recordset[0].TableExists !== null;
    
    if (!tableExists) {
      await pool.request().query(`
        CREATE TABLE EmailVerifications (
          VerificationID BIGINT IDENTITY(1,1) PRIMARY KEY,
          UserID BIGINT NOT NULL,
          Email VARCHAR(100) NOT NULL,
          OTP VARCHAR(6) NOT NULL,
          ExpiresAt DATETIME NOT NULL,
          IsUsed BIT DEFAULT 0,
          CreatedAt DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_EmailVerifications_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
        );
        
        CREATE INDEX IX_EmailVerifications_UserID ON EmailVerifications(UserID);
        CREATE INDEX IX_EmailVerifications_Email ON EmailVerifications(Email);
        CREATE INDEX IX_EmailVerifications_OTP ON EmailVerifications(OTP);
      `);
      
      console.log('EmailVerifications table created successfully.');
    } else {
      console.log('EmailVerifications table already exists.');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating EmailVerifications table:', error);
    throw error;
  }
}

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io and capture the io object
const io = initializeSocket(server);

// Export the io instance for other modules to use
global.io = io;

// Start execution service as a child process
const startExecutionService = () => {
  console.log('Starting execution service...');
  const executionServicePath = path.join(__dirname, 'executionService.js');
  const executionService = fork(executionServicePath);
  
  executionService.on('message', (message) => {
    console.log('Execution service message:', message);
  });
  
  executionService.on('error', (error) => {
    console.error('Execution service error:', error);
  });
  
  executionService.on('exit', (code, signal) => {
    console.warn(`Execution service exited with code ${code} and signal ${signal}`);
    console.log('Restarting execution service in 5 seconds...');
    
    // Restart execution service after 5 seconds
    setTimeout(() => {
      startExecutionService();
    }, 5000);
  });
  
  return executionService;
};

// Initialize Docker for code execution
const startServer = async () => {
  try {
    // Start execution service
    const executionService = startExecutionService();
    
    // Run database migrations
    try {
      await createEmailVerificationsTable();
    } catch (migrationError) {
      console.error('Migration error:', migrationError);
    }
    
    // Initialize Docker first
    const dockerResult = await initializeDocker();
    if (dockerResult.success) {
      console.log('Docker initialized successfully for code execution:', dockerResult.message);
    } else {
      console.error('Docker initialization failed:', dockerResult.message);
      console.warn('Code execution functionality will be degraded or unavailable');
    }
    
    // Then start server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down services...');
      
      // Kill execution service
      if (executionService && !executionService.killed) {
        executionService.kill();
      }
      
      // Close server connections
      server.close(() => {
        console.log('Main server closed');
        process.exit(0);
      });
    };
    
    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('Error during server startup:', error);
    console.warn('Code execution functionality will be degraded or unavailable');
    
    // Start server anyway, but without Docker functionality
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (without Docker code execution)`);
    });
  }
};

// Add public route handlers BEFORE routes are mounted in app.js
// This is critical for handling CORS properly
const express = require('express');

// Move course details route to server.js as a standalone route 
// to ensure it's handled independently of other middleware
app.get('/api/test-course/:courseIdentifier', async (req, res) => {
  try {
    const { courseIdentifier } = req.params;
    
    console.log('=== HANDLING TEST COURSE DETAILS ===');
    console.log('Course identifier:', courseIdentifier);
    
    // Set CORS headers for public access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Truy vấn database thực sự thay vì trả về dữ liệu mẫu
    let query;
    
    // Kiểm tra nếu identifier là số
    const isNumeric = /^\d+$/.test(courseIdentifier);
    
    if (isNumeric) {
      query = `
        SELECT c.*, u.FullName as InstructorName, u.FullName as InstructorTitle, u.Bio as InstructorBio, u.Image as InstructorAvatar
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.CourseID = @courseId AND c.IsPublished = 1 AND c.DeletedAt IS NULL
      `;
    } else {
      query = `
        SELECT c.*, u.FullName as InstructorName, u.FullName as InstructorTitle, u.Bio as InstructorBio, u.Image as InstructorAvatar
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.Slug = @courseSlug AND c.IsPublished = 1 AND c.DeletedAt IS NULL
      `;
    }
    
    console.log(`Executing SQL Query: ${query}`);
    console.log(`Parameters: courseId=${isNumeric ? courseIdentifier : null}, courseSlug=${isNumeric ? null : courseIdentifier}`);
    
    const { pool, sql } = require('./config/db');
    const result = await pool.request()
      .input('courseId', sql.BigInt, isNumeric ? courseIdentifier : null)
      .input('courseSlug', sql.NVarChar, isNumeric ? null : courseIdentifier)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy khóa học' 
      });
    }
    
    const course = result.recordset[0];
    
    // Lấy thêm thông tin modules và lessons
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, course.CourseID)
      .query(`
        SELECT * FROM CourseModules
        WHERE CourseID = @courseId
        ORDER BY OrderIndex
      `);
    
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, course.CourseID)
      .query(`
        SELECT l.* FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId
        ORDER BY m.OrderIndex, l.OrderIndex
      `);
    
    // Tạo cấu trúc dữ liệu đúng
    const modules = modulesResult.recordset.map(module => {
      const moduleLessons = lessonsResult.recordset
        .filter(lesson => lesson.ModuleID === module.ModuleID)
        .map(lesson => ({
          ...lesson,
          // Chỉ hiển thị URL video cho các bài học preview
          VideoUrl: lesson.IsPreview ? lesson.VideoUrl : null
        }));
      
      return {
        ...module,
        Lessons: moduleLessons
      };
    });
    
    // Format instructor data
    const instructor = {
      Name: course.InstructorName,
      Title: course.InstructorTitle,
      Bio: course.InstructorBio,
      AvatarUrl: course.InstructorAvatar
    };
    
    // Định dạng kết quả trả về
    const formattedCourse = {
      ...course,
      Modules: modules,
      Instructor: instructor
    };
    
    // Xóa các trường không cần thiết
    delete formattedCourse.InstructorName;
    delete formattedCourse.InstructorTitle;
    delete formattedCourse.InstructorBio;
    delete formattedCourse.InstructorAvatar;
    
    return res.status(200).json({
      success: true,
      data: formattedCourse
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin khóa học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Online users map
const onlineUsers = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Add user to online users map
  onlineUsers.set(socket.user.id, socket.id);
  
  // Update presence status in database
  updateUserPresence(socket.user.id, 'online');
  
  // Message sent event
  socket.on('message-sent', async (message) => {
    try {
      // Get all participants in the conversation
      const request = new sql.Request(pool);
      request.input('conversationId', sql.BigInt, message.conversationId);
      
      const participantsResult = await request.query(`
        SELECT cp.UserID 
        FROM ConversationParticipants cp
        WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
      `);
      
      // Broadcast to all other participants
      participantsResult.recordset.forEach(participant => {
        const userId = participant.UserID;
        
        // Skip sender
        if (userId === socket.user.id) return;
        
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('new-message', message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  });
  
  // Message read event
  socket.on('message-read', async (data) => {
    try {
      // Get message sender
      const request = new sql.Request(pool);
      request.input('messageId', sql.BigInt, data.messageId);
      
      const messageResult = await request.query(`
        SELECT SenderID, ConversationID FROM Messages
        WHERE MessageID = @messageId
      `);
      
      if (messageResult.recordset.length > 0) {
        const senderId = messageResult.recordset[0].SenderID;
        const conversationId = messageResult.recordset[0].ConversationID;
        
        // Notify sender that message was read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-status-update', {
            messageId: data.messageId,
            userId: data.userId,
            conversationId,
            status: 'read'
          });
        }
      }
    } catch (error) {
      console.error('Error handling message read:', error);
    }
  });
  
  // Message delivered event
  socket.on('message-delivered', async (data) => {
    try {
      // Get message sender
      const request = new sql.Request(pool);
      request.input('messageId', sql.BigInt, data.messageId);
      
      const messageResult = await request.query(`
        SELECT SenderID, ConversationID FROM Messages
        WHERE MessageID = @messageId
      `);
      
      if (messageResult.recordset.length > 0) {
        const senderId = messageResult.recordset[0].SenderID;
        const conversationId = messageResult.recordset[0].ConversationID;
        
        // Notify sender that message was delivered
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-status-update', {
            messageId: data.messageId,
            userId: data.userId,
            conversationId,
            status: 'delivered'
          });
        }
      }
    } catch (error) {
      console.error('Error handling message delivered:', error);
    }
  });
  
  // Call initiated event
  socket.on('call-initiated', async (callData) => {
    try {
      // Notify all participants about the call
      if (callData.participantIds && callData.participantIds.length > 0) {
        callData.participantIds.forEach(participantId => {
          // Skip initiator
          if (participantId === socket.user.id) return;
          
          const socketId = onlineUsers.get(participantId);
          if (socketId) {
            io.to(socketId).emit('incoming-call', callData);
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting call:', error);
    }
  });
  
  // Call ended event
  socket.on('call-ended', async (callData) => {
    try {
      // Get all participants in the call
      const request = new sql.Request(pool);
      request.input('callId', sql.BigInt, callData.callId);
      
      const participantsResult = await request.query(`
        SELECT cp.UserID 
        FROM CallParticipants cp
        WHERE cp.CallID = @callId AND cp.Status != 'left'
      `);
      
      // Notify all participants that the call has ended
      participantsResult.recordset.forEach(participant => {
        const userId = participant.UserID;
        
        // Skip initiator
        if (userId === socket.user.id) return;
        
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('call-ended', callData);
        }
      });
    } catch (error) {
      console.error('Error broadcasting call end:', error);
    }
  });
  
  // User is typing event
  socket.on('typing', async (data) => {
    try {
      const { conversationId } = data;
      
      // Get all participants in the conversation
      const request = new sql.Request(pool);
      request.input('conversationId', sql.BigInt, conversationId);
      
      const participantsResult = await request.query(`
        SELECT cp.UserID 
        FROM ConversationParticipants cp
        WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
      `);
      
      // Broadcast to all other participants
      participantsResult.recordset.forEach(participant => {
        const userId = participant.UserID;
        
        // Skip sender
        if (userId === socket.user.id) return;
        
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('user-typing', {
            conversationId,
            userId: socket.user.id,
            username: socket.user.username || 'Someone'
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  });
  
  // User stopped typing event
  socket.on('stop-typing', async (data) => {
    try {
      const { conversationId } = data;
      
      // Get all participants in the conversation
      const request = new sql.Request(pool);
      request.input('conversationId', sql.BigInt, conversationId);
      
      const participantsResult = await request.query(`
        SELECT cp.UserID 
        FROM ConversationParticipants cp
        WHERE cp.ConversationID = @conversationId AND cp.LeftAt IS NULL
      `);
      
      // Broadcast to all other participants
      participantsResult.recordset.forEach(participant => {
        const userId = participant.UserID;
        
        // Skip sender
        if (userId === socket.user.id) return;
        
        const socketId = onlineUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit('user-stop-typing', {
            conversationId,
            userId: socket.user.id
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting stop typing status:', error);
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
    
    // Remove user from online users map
    onlineUsers.delete(socket.user.id);
    
    // Update presence status in database
    updateUserPresence(socket.user.id, 'offline');
  });
});

// Helper function to update user presence
async function updateUserPresence(userId, status) {
  try {
    const request = new sql.Request(pool);
    request.input('userId', sql.BigInt, userId);
    request.input('status', sql.VarChar(20), status);
    
    // Check if presence record exists
    const checkResult = await request.query(`
      SELECT PresenceID FROM UserPresence
      WHERE UserID = @userId
    `);
    
    if (checkResult.recordset.length > 0) {
      // Update existing record
      await request.query(`
        UPDATE UserPresence
        SET Status = @status, LastActiveAt = GETDATE()
        WHERE UserID = @userId
      `);
    } else {
      // Create new record
      await request.query(`
        INSERT INTO UserPresence (UserID, Status)
        VALUES (@userId, @status)
      `);
    }
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
}

// Đảm bảo database đã kết nối trước khi khởi động server
pool.connect()
  .then(() => {
    console.log('Database connected successfully');
    
    // Call startServer function ONLY HERE after database connection is established
    startServer();
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Xử lý tắt server gracefully
process.on('SIGINT', () => {
  pool.close().then(() => {
    console.log('Database pool closed.');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

app.use('/api', chatRoutes);
