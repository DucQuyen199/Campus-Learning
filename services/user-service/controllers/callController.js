/*-----------------------------------------------------------------
* File: callController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Enhanced call controller with group call support and better integration
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool } = require('../config/db');
const { onlineUsers } = require('../socket');

// Store active call timeouts
const callTimeouts = new Map();

/**
 * Initiate a call (private or group)
 */
exports.initiateCall = async (req, res) => {
  try {
    const { conversationId, type, receiverId } = req.body;
    const initiatorId = req.user.id;

    if (!type || !['audio', 'video'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid call type (audio/video) is required' 
      });
    }

    let targetConversationId = conversationId;

    // If no conversation ID provided, create or find private conversation
    if (!conversationId) {
      if (!receiverId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Conversation ID or receiver ID is required' 
        });
      }

      // Check if receiver is online
      const isReceiverOnline = onlineUsers.has(receiverId);
      if (!isReceiverOnline) {
        return res.status(400).json({ 
          success: false, 
          message: 'User is offline' 
        });
      }

      // Find or create private conversation
      const existingConversation = await pool.request()
        .input('userIdA', initiatorId)
        .input('userIdB', receiverId)
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
        targetConversationId = existingConversation.recordset[0].ConversationID;
      } else {
        // Create new private conversation
        const newConversation = await pool.request()
          .input('createdBy', initiatorId)
          .query(`
            INSERT INTO Conversations (Type, CreatedBy, CreatedAt, UpdatedAt)
            VALUES ('private', @createdBy, GETDATE(), GETDATE());
            SELECT SCOPE_IDENTITY() AS ConversationID;
          `);

        targetConversationId = newConversation.recordset[0].ConversationID;

        // Add participants
        await pool.request()
          .input('conversationId', targetConversationId)
          .input('userId', initiatorId)
          .query(`
            INSERT INTO ConversationParticipants (ConversationID, UserID, JoinedAt, Role)
            VALUES (@conversationId, @userId, GETDATE(), 'member')
          `);

        await pool.request()
          .input('conversationId', targetConversationId)
          .input('userId', receiverId)
          .query(`
            INSERT INTO ConversationParticipants (ConversationID, UserID, JoinedAt, Role)
            VALUES (@conversationId, @userId, GETDATE(), 'member')
          `);
      }
    }

    // Check if user is participant in conversation
    const isParticipant = await pool.request()
      .input('conversationId', targetConversationId)
      .input('userId', initiatorId)
      .query(`
        SELECT 1 FROM ConversationParticipants
        WHERE ConversationID = @conversationId 
        AND UserID = @userId 
        AND LeftAt IS NULL
      `);

    if (!isParticipant.recordset.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to initiate call in this conversation' 
      });
    }

    // Check for ongoing calls in this conversation
    const ongoingCall = await pool.request()
      .input('conversationId', targetConversationId)
      .query(`
        SELECT * FROM Calls
        WHERE ConversationID = @conversationId 
        AND Status IN ('initiated', 'ringing', 'ongoing')
      `);

    if (ongoingCall.recordset.length > 0) {
      // Instead of returning an error, send back existing call data so client can join
      const existing = ongoingCall.recordset[0];

      // Fetch participants
      const existingParticipants = await pool.request()
        .input('callId', existing.CallID)
        .query(`
          SELECT cp.UserID, u.Username, u.FullName, u.Avatar, cp.Status
          FROM CallParticipants cp
          INNER JOIN Users u ON cp.UserID = u.UserID
          WHERE cp.CallID = @callId
        `);

      return res.status(200).json({
        success: true,
        data: {
          callId: existing.CallID,
          conversationId: existing.ConversationID,
          type: existing.Type,
          status: existing.Status,
          participants: existingParticipants.recordset
        },
        message: 'Existing call returned'
      });
    }

    // Create new call
    const callResult = await pool.request()
      .input('conversationId', targetConversationId)
      .input('initiatorId', initiatorId)
      .input('type', type)
      .query(`
        INSERT INTO Calls (ConversationID, InitiatorID, Type, StartTime, Status)
        VALUES (@conversationId, @initiatorId, @type, GETDATE(), 'initiated');
        SELECT SCOPE_IDENTITY() AS CallID;
      `);

    const callId = callResult.recordset[0].CallID;

    // Add initiator as call participant
    await pool.request()
      .input('callId', callId)
      .input('userId', initiatorId)
      .query(`
        INSERT INTO CallParticipants (CallID, UserID, JoinTime, Status, DeviceInfo)
        VALUES (@callId, @userId, GETDATE(), 'invited', 'Web Browser')
      `);

    // Get conversation participants and their info
    const participants = await pool.request()
      .input('conversationId', targetConversationId)
      .input('initiatorId', initiatorId)
      .query(`
        SELECT 
          u.UserID, u.Username, u.FullName, u.Avatar,
          cp.Role
        FROM ConversationParticipants cp
        INNER JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.ConversationID = @conversationId 
        AND cp.LeftAt IS NULL
        AND u.UserID != @initiatorId
      `);

    // Get initiator info
    const initiatorInfo = await pool.request()
      .input('initiatorId', initiatorId)
      .query(`
        SELECT Username, FullName, Avatar
        FROM Users WHERE UserID = @initiatorId
      `);

    const initiator = initiatorInfo.recordset[0];

    // Emit call invitation to all participants
    const io = req.app.get('io');
    const callData = {
      callId,
      conversationId: targetConversationId,
      initiatorId,
      initiatorName: initiator.FullName || initiator.Username,
      initiatorPicture: initiator.Avatar,
      type,
      participants: participants.recordset
    };

    participants.recordset.forEach(participant => {
      const socketId = onlineUsers.get(participant.UserID);
      if (socketId) {
        io.to(socketId).emit('incoming-call', callData);
      }
    });

    // Update call status to ringing
    await pool.request()
      .input('callId', callId)
      .query(`
        UPDATE Calls SET Status = 'ringing' WHERE CallID = @callId
      `);

    // Set up 60-second timeout for missed call
    const timeoutId = setTimeout(async () => {
      try {
        // Check if call is still ringing (not answered)
        const callStatus = await pool.request()
          .input('callId', callId)
          .query(`SELECT Status FROM Calls WHERE CallID = @callId`);

        if (callStatus.recordset.length > 0 && callStatus.recordset[0].Status === 'ringing') {
          // Mark call as missed
          await pool.request()
            .input('callId', callId)
            .query(`
              UPDATE Calls 
              SET Status = 'missed', EndTime = GETDATE()
              WHERE CallID = @callId
            `);

          // Update all non-initiator participants as missed
          await pool.request()
            .input('callId', callId)
            .input('initiatorId', initiatorId)
            .query(`
              UPDATE CallParticipants
              SET Status = 'missed', LeaveTime = GETDATE()
              WHERE CallID = @callId AND UserID != @initiatorId
            `);

          // Update initiator as no-answer
          await pool.request()
            .input('callId', callId)
            .input('initiatorId', initiatorId)
            .query(`
              UPDATE CallParticipants
              SET Status = 'no-answer', LeaveTime = GETDATE()
              WHERE CallID = @callId AND UserID = @initiatorId
            `);

          // Notify all participants that call timed out
          const allParticipants = await pool.request()
            .input('callId', callId)
            .query(`
              SELECT DISTINCT cp.UserID
              FROM CallParticipants cp
              WHERE cp.CallID = @callId
            `);

          allParticipants.recordset.forEach(participant => {
            const socketId = onlineUsers.get(participant.UserID);
            if (socketId) {
              io.to(socketId).emit('call-timeout', {
                callId,
                reason: 'No response after 60 seconds'
              });
            }
          });

          console.log(`Call ${callId} timed out after 60 seconds`);
        }
      } catch (error) {
        console.error('Error handling call timeout:', error);
      } finally {
        // Clean up timeout reference
        callTimeouts.delete(callId);
      }
    }, 60000); // 60 seconds

    // Store timeout reference
    callTimeouts.set(callId, timeoutId);

    return res.status(200).json({
      success: true,
      data: {
        callId,
        conversationId: targetConversationId,
        type,
        status: 'ringing',
        participants: participants.recordset
      },
      message: 'Call initiated successfully'
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate call',
      error: error.message 
    });
  }
};

/**
 * Answer a call
 */
exports.answerCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user.id;

    if (!callId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Call ID is required' 
      });
    }

    // Clear timeout if call is answered
    if (callTimeouts.has(callId)) {
      clearTimeout(callTimeouts.get(callId));
      callTimeouts.delete(callId);
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT c.*, conv.Type as ConversationType
        FROM Calls c
        INNER JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        WHERE c.CallID = @callId
      `);

    if (!callInfo.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Call not found' 
      });
    }

    const call = callInfo.recordset[0];

    // Check if call is still valid
    if (!['initiated', 'ringing'].includes(call.Status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Call is no longer available' 
      });
    }

    // Update call status to ongoing
    await pool.request()
      .input('callId', callId)
      .query(`
        UPDATE Calls SET Status = 'ongoing' WHERE CallID = @callId
      `);

    // Update or add user as call participant
    const existingParticipant = await pool.request()
      .input('callId', callId)
      .input('userId', userId)
      .query(`
        SELECT * FROM CallParticipants
        WHERE CallID = @callId AND UserID = @userId
      `);

    if (existingParticipant.recordset.length === 0) {
      await pool.request()
        .input('callId', callId)
        .input('userId', userId)
        .query(`
          INSERT INTO CallParticipants (CallID, UserID, JoinTime, Status, DeviceInfo)
          VALUES (@callId, @userId, GETDATE(), 'joined', 'Web Browser')
        `);
    } else {
      await pool.request()
        .input('callId', callId)
        .input('userId', userId)
        .query(`
          UPDATE CallParticipants
          SET Status = 'joined', JoinTime = GETDATE()
          WHERE CallID = @callId AND UserID = @userId
        `);
    }

    // Get all call participants for notification
    const allParticipants = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT cp.UserID, u.Username, u.FullName, u.Avatar
        FROM CallParticipants cp
        INNER JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.CallID = @callId
      `);

    // Notify all participants that someone joined
    const io = req.app.get('io');
    allParticipants.recordset.forEach(participant => {
      const socketId = onlineUsers.get(participant.UserID);
      if (socketId) {
        io.to(socketId).emit('call-participant-joined', {
          callId,
          userId,
          participants: allParticipants.recordset
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        callId,
        conversationId: call.ConversationID,
        initiatorId: call.InitiatorID,
        type: call.Type,
        status: 'ongoing',
        participants: allParticipants.recordset
      },
      message: 'Call answered successfully'
    });
  } catch (error) {
    console.error('Error answering call:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to answer call',
      error: error.message 
    });
  }
};

/**
 * End a call
 */
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user.id;

    if (!callId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Call ID is required' 
      });
    }

    // Clear timeout if call is ended manually
    if (callTimeouts.has(callId)) {
      clearTimeout(callTimeouts.get(callId));
      callTimeouts.delete(callId);
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT * FROM Calls WHERE CallID = @callId
      `);

    if (!callInfo.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Call not found' 
      });
    }

    const call = callInfo.recordset[0];

    // Calculate call duration
    const startTime = new Date(call.StartTime);
    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);

    // Update call status and duration
    await pool.request()
      .input('callId', callId)
      .input('endTime', endTime)
      .input('duration', durationInSeconds)
      .query(`
        UPDATE Calls
        SET Status = 'ended', EndTime = @endTime, Duration = @duration
        WHERE CallID = @callId
      `);

    // Update all participants status
    await pool.request()
      .input('callId', callId)
      .input('leaveTime', endTime)
      .query(`
        UPDATE CallParticipants
        SET Status = 'left', LeaveTime = @leaveTime
        WHERE CallID = @callId AND Status = 'joined'
      `);

    // Get all participants for notification
    const participants = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT DISTINCT cp.UserID
        FROM CallParticipants cp
        WHERE cp.CallID = @callId
      `);

    // Notify all participants that call has ended
    const io = req.app.get('io');
    participants.recordset.forEach(participant => {
      const socketId = onlineUsers.get(participant.UserID);
      if (socketId) {
        io.to(socketId).emit('call-ended', {
          callId,
          endedBy: userId,
          duration: durationInSeconds
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        callId,
        duration: durationInSeconds,
        endTime
      },
      message: 'Call ended successfully'
    });
  } catch (error) {
    console.error('Error ending call:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to end call',
      error: error.message 
    });
  }
};

/**
 * Reject a call
 */
exports.rejectCall = async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user.id;

    if (!callId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Call ID is required' 
      });
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT * FROM Calls WHERE CallID = @callId
      `);

    if (!callInfo.recordset.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Call not found' 
      });
    }

    const call = callInfo.recordset[0];

    // Add user as call participant with declined status
    const existingParticipant = await pool.request()
      .input('callId', callId)
      .input('userId', userId)
      .query(`
        SELECT * FROM CallParticipants
        WHERE CallID = @callId AND UserID = @userId
      `);

    if (existingParticipant.recordset.length === 0) {
      await pool.request()
        .input('callId', callId)
        .input('userId', userId)
        .query(`
          INSERT INTO CallParticipants (CallID, UserID, JoinTime, LeaveTime, Status, DeviceInfo)
          VALUES (@callId, @userId, GETDATE(), GETDATE(), 'declined', 'Web Browser')
        `);
    } else {
      await pool.request()
        .input('callId', callId)
        .input('userId', userId)
        .query(`
          UPDATE CallParticipants
          SET Status = 'declined', LeaveTime = GETDATE()
          WHERE CallID = @callId AND UserID = @userId
        `);
    }

    // Check if there are still participants who might answer
    const remainingParticipants = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT COUNT(*) as Count
        FROM CallParticipants
        WHERE CallID = @callId 
        AND Status IN ('invited', 'joined')
      `);

    // If no one else can answer, end the call and clear timeout
    if (remainingParticipants.recordset[0].Count === 0) {
      await pool.request()
        .input('callId', callId)
        .query(`
          UPDATE Calls SET Status = 'rejected', EndTime = GETDATE()
          WHERE CallID = @callId
        `);

      // Clear timeout since call is manually rejected
      if (callTimeouts.has(callId)) {
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
      }
    }

    // Notify other participants about the rejection
    const allParticipants = await pool.request()
      .input('callId', callId)
      .input('userId', userId)
      .query(`
        SELECT DISTINCT cp.UserID
        FROM CallParticipants cp
        WHERE cp.CallID = @callId AND cp.UserID != @userId
      `);

    const io = req.app.get('io');
    allParticipants.recordset.forEach(participant => {
      const socketId = onlineUsers.get(participant.UserID);
      if (socketId) {
        io.to(socketId).emit('call-participant-declined', {
          callId,
          declinedBy: userId
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Call rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting call:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reject call',
      error: error.message 
    });
  }
};

/**
 * Get missed calls for a user
 */
exports.getMissedCalls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const missedCalls = await pool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit))
      .input('offset', offset)
      .query(`
        SELECT 
          c.*,
          u.Username as InitiatorUsername,
          u.FullName as InitiatorName,
          u.Avatar as InitiatorPicture,
          conv.Type as ConversationType,
          conv.Title as ConversationTitle
        FROM Calls c
        INNER JOIN Users u ON c.InitiatorID = u.UserID
        INNER JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        INNER JOIN CallParticipants cp ON c.CallID = cp.CallID
        WHERE cp.UserID = @userId
        AND cp.Status = 'missed'
        ORDER BY c.StartTime DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    return res.status(200).json({
      success: true,
      data: missedCalls.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: missedCalls.recordset.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting missed calls:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get missed calls',
      error: error.message 
    });
  }
};

/**
 * Get call history for a user
 */
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const callHistory = await pool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit))
      .input('offset', offset)
      .query(`
        SELECT 
          c.*,
          u.Username as InitiatorUsername,
          u.FullName as InitiatorName,
          u.Avatar as InitiatorPicture,
          conv.Type as ConversationType,
          conv.Title as ConversationTitle,
          cp.Status as UserStatus
        FROM Calls c
        INNER JOIN Users u ON c.InitiatorID = u.UserID
        INNER JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        INNER JOIN CallParticipants cp ON c.CallID = cp.CallID
        WHERE cp.UserID = @userId
        ORDER BY c.StartTime DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    // Get participants for each call
    for (let call of callHistory.recordset) {
      const participants = await pool.request()
        .input('callId', call.CallID)
        .query(`
          SELECT 
            u.UserID, u.Username, u.FullName, u.Avatar,
            cp.Status, cp.JoinTime, cp.LeaveTime
          FROM CallParticipants cp
          INNER JOIN Users u ON cp.UserID = u.UserID
          WHERE cp.CallID = @callId
          ORDER BY cp.JoinTime ASC
        `);
      
      call.Participants = participants.recordset;
    }

    return res.status(200).json({
      success: true,
      data: callHistory.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: callHistory.recordset.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get call history',
      error: error.message 
    });
  }
};

/**
 * Get active call for a user
 */
exports.getActiveCall = async (req, res) => {
  try {
    const userId = req.user.id;

    const activeCall = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT 
          c.*,
          u.Username as InitiatorUsername,
          u.FullName as InitiatorName,
          u.Avatar as InitiatorPicture,
          conv.Type as ConversationType,
          conv.Title as ConversationTitle
        FROM Calls c
        INNER JOIN Users u ON c.InitiatorID = u.UserID
        INNER JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        INNER JOIN CallParticipants cp ON c.CallID = cp.CallID
        WHERE cp.UserID = @userId
        AND c.Status IN ('initiated', 'ringing', 'ongoing')
        AND cp.Status IN ('invited', 'joined')
      `);

    if (!activeCall.recordset.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active call found'
      });
    }

    const call = activeCall.recordset[0];

    // Get all participants
    const participants = await pool.request()
      .input('callId', call.CallID)
      .query(`
        SELECT 
          u.UserID, u.Username, u.FullName, u.Avatar,
          cp.Status, cp.JoinTime
        FROM CallParticipants cp
        INNER JOIN Users u ON cp.UserID = u.UserID
        WHERE cp.CallID = @callId
        ORDER BY cp.JoinTime ASC
      `);

    call.Participants = participants.recordset;

    return res.status(200).json({
      success: true,
      data: call
    });
  } catch (error) {
    console.error('Error getting active call:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get active call',
      error: error.message 
    });
  }
};

/**
 * Get all active calls (for admin purposes)
 */
exports.getActiveCalls = async (req, res) => {
  try {
    const userId = req.user.id;

    // For non-admin users, just return their own active call
    if (req.user.role !== 'admin') {
      return this.getActiveCall(req, res);
    }

    const activeCalls = await pool.request()
      .query(`
        SELECT 
          c.*,
          u.Username as InitiatorUsername,
          u.FullName as InitiatorName,
          u.Avatar as InitiatorPicture,
          conv.Type as ConversationType,
          conv.Title as ConversationTitle
        FROM Calls c
        INNER JOIN Users u ON c.InitiatorID = u.UserID
        INNER JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        WHERE c.Status IN ('initiated', 'ringing', 'ongoing')
        ORDER BY c.StartTime DESC
      `);

    return res.status(200).json({
      success: true,
      data: activeCalls.recordset
    });
  } catch (error) {
    console.error('Error fetching active calls:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active calls',
      error: error.message
    });
  }
}; 
