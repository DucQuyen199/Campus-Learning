const { Chat, Message, User, ConversationParticipant } = require('../models');
const { io } = require('../socket');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.createConversation = async (req, res) => {
  try {
    const { title, participants, type = 'private' } = req.body;
    const createdBy = req.user.id;

    const conversation = await Chat.createConversation(title, participants, createdBy, type);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
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

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { UserID: { [Op.ne]: userId } },
          {
            [Op.or]: [
              { Username: { [Op.iLike]: `%${query}%` } },
              { FullName: { [Op.iLike]: `%${query}%` } }
            ]
          }
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

exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;
    const userId = req.user.id;
    
    // Implementation to update message status directly
    const messageStatus = await sequelize.models.MessageStatus.findOne({
      where: { MessageID: messageId, UserID: userId }
    });

    if (messageStatus) {
      await messageStatus.update({ 
        Status: status,
        UpdatedAt: sequelize.literal('GETDATE()')
      });
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

exports.getUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    const whereClause = {
      [Op.and]: [
        { UserID: { [Op.ne]: userId } },
        { DeletedAt: null }
      ]
    };
    
    // Add search condition if search parameter is provided
    if (search.trim().length > 0) {
      whereClause[Op.and].push({
        [Op.or]: [
          { Username: { [Op.iLike]: `%${search}%` } },
          { FullName: { [Op.iLike]: `%${search}%` } },
          { Email: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }
    
    // Get total count for pagination
    const total = await User.count({ where: whereClause });
    
    // Get users with pagination
    const users = await User.findAll({
      where: whereClause,
      attributes: ['UserID', 'Username', 'FullName', 'Image', 'Email'],
      limit: limit,
      offset: offset,
      order: [['UserID', 'ASC']]
    });
    
    // Return users with pagination metadata
    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};