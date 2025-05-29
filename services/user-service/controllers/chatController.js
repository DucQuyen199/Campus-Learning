const { Chat, Message, User, ConversationParticipant } = require('../models');
const { io } = require('../socket');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.createConversation = async (req, res) => {
  try {
    // Ensure authentication middleware has run
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
    }
    const { title, participants, type = 'private' } = req.body;
    const createdBy = req.user.id;

    const conversation = await Chat.createConversation(title, participants, createdBy, type);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: error.message || 'Internal server error', stack: error.stack });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check for If-None-Match header for ETags
    const clientEtag = req.headers['if-none-match'];
    
    // Generate a cache key based on user ID
    const cacheKey = `conversations:${userId}`;
    
    // Check if we have a cached response
    if (req.app.locals.conversationCache && req.app.locals.conversationCache[cacheKey]) {
      const cachedData = req.app.locals.conversationCache[cacheKey];
      
      // If client sent matching ETag, return 304 Not Modified
      if (clientEtag && clientEtag === cachedData.etag) {
        return res.status(304).end();
      }
      
      // Check if cache is still fresh (less than 10 seconds old)
      const now = Date.now();
      if (now - cachedData.timestamp < 10000) { // 10 seconds cache
        // Return cached data with ETag
        res.setHeader('ETag', cachedData.etag);
        res.setHeader('Cache-Control', 'private, max-age=10');
        return res.json(cachedData.data);
      }
    }
    
    // Directly use Sequelize query instead of the static method
    const conversations = await Chat.findAll({
      include: [
        {
          model: User,
          as: 'Participants',
          attributes: ['UserID', 'Username', 'FullName', 'Image'],
          through: { 
            attributes: ['Role'],
            where: { LeftAt: null }
          }
        },
        {
          model: Message,
          as: 'Messages',
          limit: 1,
          order: [['CreatedAt', 'DESC']],
          include: [{
            model: User,
            as: 'Sender',
            attributes: ['UserID', 'Username', 'FullName', 'Image']
          }]
        }
      ],
      where: {
        IsActive: true,
        '$Participants.UserID$': userId
      },
      order: [['LastMessageAt', 'DESC']]
    });

    // Generate a simple ETag based on conversation data
    const etag = `W/"${Buffer.from(JSON.stringify(conversations)).toString('base64').substring(0, 27)}"`;
    
    // Store in cache
    if (!req.app.locals.conversationCache) {
      req.app.locals.conversationCache = {};
    }
    
    req.app.locals.conversationCache[cacheKey] = {
      data: conversations,
      etag: etag,
      timestamp: Date.now()
    };
    
    // Return response with caching headers
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=10');
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Fetch messages using the static helper (chronological order)
    const messages = await Chat.getConversationMessages(conversationId, userId);
    return res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(error.message === 'Not authorized to view this conversation' ? 403 : 500)
      .json({ message: error.message || 'Internal server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    // Delegate message creation to Chat.sendMessage static to avoid trigger/OUTPUT conflict
    const messageWithSender = await Chat.sendMessage(conversationId, senderId, content, type);
    return res.json(messageWithSender);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New method for sending messages to a specific conversation
exports.sendMessageToConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;
    const senderId = req.user.id;

    // Delegate message creation to Chat.sendMessage to avoid trigger/OUTPUT conflict
    const messageWithSender = await Chat.sendMessage(conversationId, senderId, content, type);
    return res.json(messageWithSender);
  } catch (error) {
    console.error('Error sending message to conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Update message status to read
    await message.update({ Status: 'read' });

    // Notify sender that message was read
    io.to(`user_${message.SenderID}`).emit('message-read', {
      messageId: message.MessageID,
      readBy: userId,
      conversationId: message.ConversationID
    });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Error marking message as read' });
  }
};

// Search users by query
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { UserID: { [Op.ne]: userId } },
          { [Op.or]: [
            { Username: { [Op.iLike]: `%${query}%` } },
            { FullName: { [Op.iLike]: `%${query}%` } }
          ]}
        ]
      },
      attributes: ['UserID', 'Username', 'FullName', 'Image'],
      limit: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

// Update message status (read/delivered)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;
    const userId = req.user.id;

    const messageStatus = await sequelize.models.MessageStatus.findOne({
      where: { MessageID: messageId, UserID: userId }
    });

    if (messageStatus) {
      await messageStatus.update({ Status: status, UpdatedAt: sequelize.literal('GETDATE()') });
    } else {
      await sequelize.models.MessageStatus.create({
        MessageID: messageId,
        UserID: userId,
        Status: status,
        UpdatedAt: sequelize.literal('GETDATE()')
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get users with pagination and optional search
exports.getUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereClause = { [Op.and]: [
      { UserID: { [Op.ne]: userId } },
      { DeletedAt: null }
    ]};
    if (search.trim().length > 0) {
      whereClause[Op.and].push({ [Op.or]: [
        { Username: { [Op.iLike]: `%${search}%` } },
        { FullName: { [Op.iLike]: `%${search}%` } },
        { Email: { [Op.iLike]: `%${search}%` } }
      ]});
    }

    const total = await User.count({ where: whereClause });
    const users = await User.findAll({
      where: whereClause,
      attributes: ['UserID', 'Username', 'FullName', 'Image', 'Email'],
      limit: limit,
      offset: offset,
      order: [['UserID', 'ASC']]
    });

    res.json({ data: users, pagination: { total, page, limit, pages: Math.ceil(total/limit) } });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get suggested users for chat (paginated, excluding existing participants)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const userConvs = await ConversationParticipant.findAll({
      where: { UserID: userId },
      attributes: ['ConversationID'],
      raw: true
    });
    const convIds = userConvs.map(c => c.ConversationID);

    let existingUserIds = [];
    if (convIds.length > 0) {
      const existing = await ConversationParticipant.findAll({
        where: { ConversationID: { [Op.in]: convIds }, UserID: { [Op.ne]: userId } },
        attributes: ['UserID'],
        raw: true
      });
      existingUserIds = existing.map(p => p.UserID);
    }

    const whereClause = { UserID: { [Op.notIn]: [userId, ...existingUserIds] }, DeletedAt: null };
    const suggestedUsers = await User.findAll({
      where: whereClause,
      attributes: ['UserID', 'Username', 'FullName', 'Image', 'Email'],
      limit: limit,
      offset: offset,
      order: sequelize.literal('NEWID()')
    });

    res.json(suggestedUsers);
  } catch (error) {
    console.error('Error getting suggested users for chat:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get a single conversation by ID with participants
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Chat.findOne({
      where: { ConversationID: conversationId, IsActive: true },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    // Ensure requesting user is a participant
    const isParticipant = conversation.Participants.some(p => p.UserID === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Fetch full message history for this conversation
    const messages = await Chat.getConversationMessages(conversationId, userId);
    // Merge messages into conversation object
    const convData = conversation.toJSON();
    convData.Messages = messages;
    // Return conversation with full messages
    return res.json(convData);

  } catch (error) {
    console.error('Error getting conversation by id:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add participants to a group conversation
exports.addParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participants } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Participants array is required' });
    }

    // Find the conversation
    const conversation = await Chat.findOne({
      where: { 
        ConversationID: conversationId, 
        Type: 'group', 
        IsActive: true 
      },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    // Check if user is a participant and has admin rights
    const userParticipant = conversation.Participants.find(p => p.UserID === userId);
    if (!userParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Get current participant IDs to avoid duplicates
    const existingParticipantIds = conversation.Participants.map(p => p.UserID);
    
    // Filter out users that are already participants
    const newParticipants = participants.filter(id => !existingParticipantIds.includes(Number(id)));
    
    if (newParticipants.length === 0) {
      return res.status(400).json({ message: 'All users are already participants' });
    }

    // Add new participants to the conversation
    const participantRecords = newParticipants.map(participantId => ({
      ConversationID: conversationId,
      UserID: participantId,
      Role: 'member',
      JoinedAt: new Date()
    }));

    await ConversationParticipant.bulkCreate(participantRecords);

    // Get updated list of participants
    const updatedConversation = await Chat.findOne({
      where: { ConversationID: conversationId },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    // Notify all participants about new members
    const addedUsers = await User.findAll({
      where: { UserID: { [Op.in]: newParticipants } },
      attributes: ['UserID', 'Username', 'FullName', 'Image']
    });

    // Create a system message about the new members
    const addedNames = addedUsers.map(u => u.FullName || u.Username).join(', ');
    const systemMessage = await Message.create({
      ConversationID: conversationId,
      SenderID: userId,
      Type: 'system',
      Content: `${req.user.FullName || req.user.Username} đã thêm ${addedNames} vào nhóm.`
    });

    // Emit socket event to all participants
    conversation.Participants.forEach(participant => {
      io.to(`user:${participant.UserID}`).emit('group-members-added', {
        conversationId,
        addedMembers: addedUsers,
        systemMessage
      });
    });

    // Emit to new participants
    newParticipants.forEach(participantId => {
      io.to(`user:${participantId}`).emit('added-to-group', {
        conversation: updatedConversation,
        addedBy: userId
      });
    });

    res.status(200).json({ 
      message: 'Participants added successfully',
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove a participant from a group conversation
exports.removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user.id;

    // Find the conversation
    const conversation = await Chat.findOne({
      where: { 
        ConversationID: conversationId, 
        Type: 'group',
        IsActive: true 
      },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    // Check if user is a participant and has admin rights or is removing themselves
    const userParticipant = conversation.Participants.find(p => p.UserID === userId);
    if (!userParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Only allow self-removal or admin removal
    const isAdmin = userParticipant.ConversationParticipant?.Role === 'admin';
    const isSelfRemoval = Number(participantId) === userId;
    
    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({ message: 'You do not have permission to remove other participants' });
    }

    // Check if participant exists
    const participant = conversation.Participants.find(p => p.UserID === Number(participantId));
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found in this conversation' });
    }

    // Set LeftAt to mark participant as removed instead of deleting
    await ConversationParticipant.update(
      { LeftAt: new Date() },
      { 
        where: { 
          ConversationID: conversationId, 
          UserID: participantId 
        } 
      }
    );

    // Create a system message about the removal
    const actionUser = req.user.FullName || req.user.Username;
    const removedUser = participant.FullName || participant.Username;
    
    const messageContent = isSelfRemoval 
      ? `${actionUser} đã rời khỏi nhóm.`
      : `${actionUser} đã xóa ${removedUser} khỏi nhóm.`;
    
    const systemMessage = await Message.create({
      ConversationID: conversationId,
      SenderID: userId,
      Type: 'system',
      Content: messageContent
    });

    // Emit socket event to all participants about the removal
    conversation.Participants.forEach(p => {
      io.to(`user:${p.UserID}`).emit('group-member-removed', {
        conversationId,
        removedMemberId: Number(participantId),
        removedBy: userId,
        systemMessage
      });
    });

    // Notify the removed participant if they're not the one removing themselves
    if (!isSelfRemoval) {
      io.to(`user:${participantId}`).emit('removed-from-group', {
        conversationId,
        removedBy: userId
      });
    }

    res.status(200).json({ 
      message: 'Participant removed successfully',
      participantId: Number(participantId)
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Leave a group conversation (wrapper for removeParticipant for self-removal)
exports.leaveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Use the removeParticipant method with the current user as participant
    req.params.participantId = userId;
    return this.removeParticipant(req, res);
  } catch (error) {
    console.error('Error leaving conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update conversation information (title, description, etc.)
exports.updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    // Find the conversation
    const conversation = await Chat.findOne({
      where: { 
        ConversationID: conversationId,
        IsActive: true 
      },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant
    const userParticipant = conversation.Participants.find(p => p.UserID === userId);
    if (!userParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) {
      updateData.Title = title;
    }
    
    if (description !== undefined) {
      updateData.Description = description;
    }
    
    // Update conversation
    await Chat.update(updateData, { 
      where: { ConversationID: conversationId } 
    });

    // Get the updated conversation
    const updatedConversation = await Chat.findOne({
      where: { ConversationID: conversationId },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    // Emit socket event to notify participants about the update
    conversation.Participants.forEach(participant => {
      io.to(`user:${participant.UserID}`).emit('conversation-updated', {
        conversationId,
        updatedBy: userId,
        updatedConversation
      });
    });

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update conversation image
exports.updateConversationImage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Find the conversation
    const conversation = await Chat.findOne({
      where: { 
        ConversationID: conversationId,
        IsActive: true 
      },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is a participant
    const userParticipant = conversation.Participants.find(p => p.UserID === userId);
    if (!userParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this conversation' });
    }

    // Process the image (you'll need to implement file storage logic)
    // This example assumes you're saving to a local directory
    const imageUrl = `/uploads/groups/${conversationId}.jpg`;
    
    // Update conversation with image URL
    await Chat.update(
      { ImageUrl: imageUrl },
      { where: { ConversationID: conversationId } }
    );

    // Get the updated conversation
    const updatedConversation = await Chat.findOne({
      where: { ConversationID: conversationId },
      include: [{
        model: User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { attributes: ['Role'], where: { LeftAt: null } }
      }]
    });

    // Emit socket event to notify participants about the update
    conversation.Participants.forEach(participant => {
      io.to(`user:${participant.UserID}`).emit('conversation-image-updated', {
        conversationId,
        updatedBy: userId,
        imageUrl
      });
    });

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};