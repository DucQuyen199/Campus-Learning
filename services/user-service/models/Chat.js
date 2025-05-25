const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  ConversationID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  Type: {
    type: DataTypes.STRING(20),
    defaultValue: 'private',
    validate: {
      isIn: [['private', 'group']]
    }
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  CreatedBy: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserID'
    }
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  LastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  IsActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Conversations',
  timestamps: false,
  returning: false
});

// Helper function to format dates consistently for SQL Server
const formatDateForSQLServer = (date = new Date()) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  // Format: YYYY-MM-DD HH:MM:SS without timezone info
  // Get individual components in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Format as YYYY-MM-DD HH:MM:SS - SQL Server format without timezone
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Create a shared formatter utility function
const dateFormatter = {
  toSqlServer: formatDateForSQLServer,
  
  // Format a Date object to SQL Server's expected format for a field
  formatDateField: function(value) {
    if (!value) return null;
    
    if (value instanceof Date) {
      return this.toSqlServer(value);
    } else if (typeof value === 'string') {
      // If it contains timezone info, convert to Date first
      return this.toSqlServer(new Date(value));
    }
    
    return value;
  }
};

// Static methods for chat operations
Chat.createConversation = async function(title, participants, createdBy, type = 'private') {
  // Normalize IDs to ensure consistency and avoid duplicates due to type mismatch
  const participantIds = Array.isArray(participants) ? participants.map(id => Number(id)) : [];
  const creatorId = Number(createdBy);

  // For group chats, check if a group with exact same participants already exists
  if (type === 'group' && participantIds.length > 0) {
    try {
      // First, ensure all participants includes the creator
      const allParticipantIds = [...new Set([...participantIds, creatorId])];
      
      // Get all conversations the creator is part of
      const creatorConversations = await sequelize.models.ConversationParticipant.findAll({
        where: {
          UserID: creatorId,
          LeftAt: null
        },
        attributes: ['ConversationID'],
        raw: true
      });
      
      const conversationIds = creatorConversations.map(c => c.ConversationID);
      
      if (conversationIds.length > 0) {
        // For each conversation, check if it has the same participants
        for (const convId of conversationIds) {
          // Get conversation info to check if it's a group
          const conversation = await this.findByPk(convId);
          if (!conversation || conversation.Type !== 'group') continue;
          
          // Get all participants of this conversation
          const participants = await sequelize.models.ConversationParticipant.findAll({
            where: {
              ConversationID: convId,
              LeftAt: null
            },
            attributes: ['UserID'],
            raw: true
          });
          
          const participantIds = participants.map(p => Number(p.UserID));
          
          // If participant count matches and all the same people
          if (participantIds.length === allParticipantIds.length && 
              allParticipantIds.every(id => participantIds.includes(id)) &&
              participantIds.every(id => allParticipantIds.includes(id))) {
            
            // Found existing conversation with same participants, return it
            return await Chat.findByPk(convId, {
              include: [{
                model: sequelize.models.User,
                as: 'Participants',
                attributes: ['UserID', 'Username', 'FullName', 'Image'],
                through: { attributes: ['Role'] }
              }]
            });
          }
        }
      }
    } catch (error) {
      console.log('Error checking for existing conversation:', error);
      // Continue with creation if check fails
    }
  }

  const t = await sequelize.transaction();
  
  try {
    // Create conversation
    const conversation = await this.create({
      Type: type,
      Title: title,
      CreatedBy: creatorId,
      // Use SQL Server's GETDATE() function for all date fields
      LastMessageAt: sequelize.literal('GETDATE()'),
      CreatedAt: sequelize.literal('GETDATE()'),
      UpdatedAt: sequelize.literal('GETDATE()')
    }, { transaction: t });

    // Add participants
    const allParticipants = [...new Set([...participantIds, creatorId])];
    await Promise.all(allParticipants.map(userId => 
      sequelize.models.ConversationParticipant.create({
        ConversationID: conversation.ConversationID,
        UserID: userId,
        Role: userId === createdBy ? 'admin' : 'member',
        JoinedAt: sequelize.literal('GETDATE()')
      }, { transaction: t })
    ));

    await t.commit();

    // Get full conversation details
    return await Chat.findByPk(conversation.ConversationID, {
      include: [{
        model: sequelize.models.User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { attributes: ['Role'] }
      }]
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

Chat.getUserConversations = async function(userId) {
  return await this.findAll({
    include: [
      {
        model: sequelize.models.User,
        as: 'Participants',
        attributes: ['UserID', 'Username', 'FullName', 'Image'],
        through: { 
          attributes: ['Role'],
          where: { LeftAt: null }
        }
      },
      {
        model: sequelize.models.Message,
        as: 'Messages',
        limit: 1,
        order: [['CreatedAt', 'DESC']],
        include: [{
          model: sequelize.models.User,
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
};

Chat.getConversationMessages = async function(conversationId, userId) {
  // Check if user is participant
  const isParticipant = await sequelize.models.ConversationParticipant.findOne({
    where: {
      ConversationID: conversationId,
      UserID: userId,
      LeftAt: null
    }
  });

  if (!isParticipant) {
    throw new Error('Not authorized to view this conversation');
  }

  return await sequelize.models.Message.findAll({
    where: {
      ConversationID: conversationId,
      IsDeleted: false
    },
    include: [{
      model: sequelize.models.User,
      as: 'Sender',
      attributes: ['UserID', 'Username', 'FullName', 'Image']
    }],
    order: [['CreatedAt', 'ASC']]
  });
};

Chat.sendMessage = async function(conversationId, senderId, content, type = 'text') {
  // First, check if user is participant
  const isParticipant = await sequelize.models.ConversationParticipant.findOne({
    where: {
      ConversationID: conversationId,
      UserID: senderId,
      LeftAt: null
    }
  });

  if (!isParticipant) {
    throw new Error('Not authorized to send messages in this conversation');
  }

  // Step 1: Create the message without transaction
  try {
    // Create message using a raw SQL query to ensure dates are properly formatted
    const message = await sequelize.query(
      `INSERT INTO Messages (ConversationID, SenderID, Type, Content, IsEdited, IsDeleted, CreatedAt, UpdatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE());`,
      {
        replacements: [conversationId, senderId, type, content, false, false],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    // Step 2: Update conversation's last message time in a separate operation
    await this.update(
      { LastMessageAt: sequelize.literal('GETDATE()') },
      { where: { ConversationID: conversationId } }
    );

    // Step 3: Get message ID for subsequent operations
    const createdMessage = await sequelize.models.Message.findOne({
      where: {
        ConversationID: conversationId,
        SenderID: senderId,
        Content: content
      },
      order: [['CreatedAt', 'DESC']]
    });
    
    if (!createdMessage) {
      throw new Error('Failed to create message');
    }

    // Step 4: Retrieve all participants
    const participants = await sequelize.models.ConversationParticipant.findAll({
      where: { 
        ConversationID: conversationId,
        LeftAt: null
      },
      attributes: ['UserID']
    });

    // Step 5: Create message statuses individually to avoid bulk insert issues
    for (const participant of participants) {
      await sequelize.query(
        `INSERT INTO MessageStatus (MessageID, UserID, Status, UpdatedAt)
         VALUES (?, ?, ?, GETDATE());`,
        {
          replacements: [
            createdMessage.MessageID,
            participant.UserID,
            participant.UserID === senderId ? 'read' : 'sent'
          ],
          type: sequelize.QueryTypes.INSERT
        }
      );
    }

    // Return the complete message with sender info
    return await sequelize.models.Message.findByPk(createdMessage.MessageID, {
      include: [{
        model: sequelize.models.User,
        as: 'Sender',
        attributes: ['UserID', 'Username', 'FullName', 'Image']
      }]
    });
  } catch (error) {
    console.error('Error in sendMessage operation:', error);
    throw error;
  }
};

Chat.updateMessageStatus = async function(messageId, userId, status) {
  try {
    // First check if the record exists
    const existingStatus = await sequelize.query(
      `SELECT StatusID FROM MessageStatus 
       WHERE MessageID = ? AND UserID = ?`,
      {
        replacements: [messageId, userId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingStatus && existingStatus.length > 0) {
      // Update existing record
      await sequelize.query(
        `UPDATE MessageStatus 
         SET Status = ?, UpdatedAt = GETDATE() 
         WHERE MessageID = ? AND UserID = ?`,
        {
          replacements: [status, messageId, userId],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    } else {
      // Insert new record
      await sequelize.query(
        `INSERT INTO MessageStatus (MessageID, UserID, Status, UpdatedAt)
         VALUES (?, ?, ?, GETDATE())`,
        {
          replacements: [messageId, userId, status],
          type: sequelize.QueryTypes.INSERT
        }
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
};

// Export the Chat model directly
module.exports = Chat; 