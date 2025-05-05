const { pool } = require('../config/db');
const { onlineUsers } = require('../socket');

/**
 * Initiate a call between users
 */
exports.initiateCall = async (req, res) => {
  try {
    const { receiverId, type } = req.body;
    const initiatorId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (!type || !['audio', 'video'].includes(type)) {
      return res.status(400).json({ message: 'Valid call type (audio/video) is required' });
    }

    // Check if receiver is online
    const isReceiverOnline = onlineUsers.has(receiverId);
    if (!isReceiverOnline) {
      return res.status(400).json({ message: 'User is offline' });
    }

    // Check if there's an existing conversation
    let conversationId;
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
      conversationId = existingConversation.recordset[0].ConversationID;
    } else {
      // Create a new conversation
      const newConversation = await pool.request()
        .input('createdBy', initiatorId)
        .query(`
          INSERT INTO Conversations (Type, CreatedBy, CreatedAt, UpdatedAt)
          VALUES ('private', @createdBy, GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS ConversationID;
        `);

      conversationId = newConversation.recordset[0].ConversationID;

      // Add participants
      await pool.request()
        .input('conversationId', conversationId)
        .input('userId', initiatorId)
        .query(`
          INSERT INTO ConversationParticipants (ConversationID, UserID, JoinedAt, Role)
          VALUES (@conversationId, @userId, GETDATE(), 'member')
        `);

      await pool.request()
        .input('conversationId', conversationId)
        .input('userId', receiverId)
        .query(`
          INSERT INTO ConversationParticipants (ConversationID, UserID, JoinedAt, Role)
          VALUES (@conversationId, @userId, GETDATE(), 'member')
        `);
    }

    // Create a new call
    const newCall = await pool.request()
      .input('conversationId', conversationId)
      .input('initiatorId', initiatorId)
      .input('type', type)
      .query(`
        INSERT INTO Calls (ConversationID, InitiatorID, Type, StartTime, Status)
        VALUES (@conversationId, @initiatorId, @type, GETDATE(), 'initiated');
        SELECT SCOPE_IDENTITY() AS CallID;
      `);

    const callId = newCall.recordset[0].CallID;

    // Add initiator as call participant
    await pool.request()
      .input('callId', callId)
      .input('userId', initiatorId)
      .query(`
        INSERT INTO CallParticipants (CallID, UserID, JoinTime, Status, DeviceInfo)
        VALUES (@callId, @userId, GETDATE(), 'joined', 'Web Browser')
      `);

    // Get call details with user information
    const callDetails = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT c.*, u.UserName as InitiatorName, u.ProfilePicture as InitiatorPicture
        FROM Calls c
        JOIN Users u ON c.InitiatorID = u.UserID
        WHERE c.CallID = @callId
      `);

    // Get receiver socket and emit call
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      req.app.get('io').to(receiverSocketId).emit('incoming-call', {
        callId,
        conversationId,
        initiatorId,
        initiatorName: callDetails.recordset[0].InitiatorName,
        initiatorPicture: callDetails.recordset[0].InitiatorPicture,
        type
      });
    }

    return res.status(200).json({
      message: 'Call initiated successfully',
      call: {
        callId,
        conversationId,
        receiverId,
        type,
        status: 'initiated'
      }
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    return res.status(500).json({ message: 'Failed to initiate call' });
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
      return res.status(400).json({ message: 'Call ID is required' });
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT * FROM Calls WHERE CallID = @callId
      `);

    if (callInfo.recordset.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const call = callInfo.recordset[0];

    // Update call status
    await pool.request()
      .input('callId', callId)
      .query(`
        UPDATE Calls
        SET Status = 'ongoing'
        WHERE CallID = @callId
      `);

    // Add user as call participant if not already
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

    // Get initiator socket and emit call accepted
    const initiatorSocketId = onlineUsers.get(call.InitiatorID);
    if (initiatorSocketId) {
      req.app.get('io').to(initiatorSocketId).emit('call-answered', {
        callId,
        userId
      });
    }

    return res.status(200).json({
      message: 'Call answered successfully',
      call: {
        callId,
        conversationId: call.ConversationID,
        initiatorId: call.InitiatorID,
        type: call.Type,
        status: 'ongoing'
      }
    });
  } catch (error) {
    console.error('Error answering call:', error);
    return res.status(500).json({ message: 'Failed to answer call' });
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
      return res.status(400).json({ message: 'Call ID is required' });
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT * FROM Calls WHERE CallID = @callId
      `);

    if (callInfo.recordset.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
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

    // Update participant status
    await pool.request()
      .input('callId', callId)
      .input('userId', userId)
      .input('leaveTime', endTime)
      .query(`
        UPDATE CallParticipants
        SET Status = 'left', LeaveTime = @leaveTime
        WHERE CallID = @callId AND UserID = @userId
      `);

    // Get call participants
    const participants = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT UserID FROM CallParticipants
        WHERE CallID = @callId AND Status = 'joined'
      `);

    // Notify all participants that call has ended
    participants.recordset.forEach(participant => {
      if (participant.UserID !== userId) {
        const participantSocketId = onlineUsers.get(participant.UserID);
        if (participantSocketId) {
          req.app.get('io').to(participantSocketId).emit('call-ended', {
            callId,
            endedBy: userId,
            duration: durationInSeconds
          });
        }
      }
    });

    return res.status(200).json({
      message: 'Call ended successfully',
      callDetails: {
        callId,
        duration: durationInSeconds,
        endTime
      }
    });
  } catch (error) {
    console.error('Error ending call:', error);
    return res.status(500).json({ message: 'Failed to end call' });
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
      return res.status(400).json({ message: 'Call ID is required' });
    }

    // Get call information
    const callInfo = await pool.request()
      .input('callId', callId)
      .query(`
        SELECT * FROM Calls WHERE CallID = @callId
      `);

    if (callInfo.recordset.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const call = callInfo.recordset[0];

    // Update call status
    await pool.request()
      .input('callId', callId)
      .query(`
        UPDATE Calls
        SET Status = 'rejected', EndTime = GETDATE()
        WHERE CallID = @callId
      `);

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

    // Get initiator socket and emit call rejected
    const initiatorSocketId = onlineUsers.get(call.InitiatorID);
    if (initiatorSocketId) {
      req.app.get('io').to(initiatorSocketId).emit('call-rejected', {
        callId,
        rejectedBy: userId
      });
    }

    return res.status(200).json({
      message: 'Call rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting call:', error);
    return res.status(500).json({ message: 'Failed to reject call' });
  }
};

/**
 * Get call history
 */
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const callHistory = await pool.request()
      .input('userId', userId)
      .input('limit', parseInt(limit))
      .input('offset', parseInt(offset))
      .query(`
        SELECT c.*, u.UserName as InitiatorName, u.ProfilePicture as InitiatorPicture, 
               conv.ConversationID
        FROM Calls c
        JOIN Users u ON c.InitiatorID = u.UserID
        JOIN Conversations conv ON c.ConversationID = conv.ConversationID
        JOIN ConversationParticipants cp ON conv.ConversationID = cp.ConversationID
        WHERE cp.UserID = @userId
        ORDER BY c.StartTime DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return res.status(200).json({
      calls: callHistory.recordset
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    return res.status(500).json({ message: 'Failed to get call history' });
  }
};

/**
 * Get active call
 */
exports.getActiveCall = async (req, res) => {
  try {
    const userId = req.user.id;

    const activeCall = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT c.*, u.UserName as InitiatorName, u.ProfilePicture as InitiatorPicture
        FROM Calls c
        JOIN Users u ON c.InitiatorID = u.UserID
        JOIN CallParticipants cp ON c.CallID = cp.CallID
        WHERE cp.UserID = @userId
        AND c.Status IN ('initiated', 'ongoing')
        AND cp.Status = 'joined'
      `);

    if (activeCall.recordset.length === 0) {
      return res.status(200).json({
        hasActiveCall: false
      });
    }

    return res.status(200).json({
      hasActiveCall: true,
      call: activeCall.recordset[0]
    });
  } catch (error) {
    console.error('Error getting active call:', error);
    return res.status(500).json({ message: 'Failed to get active call' });
  }
};

/**
 * Get active calls for a user
 */
exports.getActiveCalls = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user ? req.user.id || req.user.userId || req.user.UserID : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    // Get the Call model
    const { Call } = require('../models');

    // Query for active calls where the user is involved
    const activeCalls = await Call.findAll({
      where: {
        Status: 'active',
        $or: [
          { InitiatorID: userId },
          { ReceiverID: userId }
        ]
      }
    });

    return res.status(200).json({
      success: true,
      data: activeCalls || []
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