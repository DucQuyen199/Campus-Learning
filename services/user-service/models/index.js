const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

// Import user models
const User = require('./User');
const UserAchievement = require('./UserAchievement');
const Achievement = require('./Achievement');
const Chat = require('./Chat');
const Message = require('./Message');
const ConversationParticipant = require('./ConversationParticipant');
const MessageStatus = require('./MessageStatus');
const Story = require('./Story');
const StoryView = require('./StoryView');
const StoryLike = require('./StoryLike');

// Only import models we're sure are Sequelize models
// The other models will be loaded dynamically if they exist and are Sequelize models

// Function to set up model associations
const setupAssociations = () => {
  console.log('Setting up model associations...');
  
  try {
    // Create a map of all models that are Sequelize models
    const models = {
      User,
      Chat,
      Message,
      ConversationParticipant,
      MessageStatus
    };
    
    // Dynamically load models only if they are Sequelize models
    const modelFiles = [
      'Achievement', 'UserAchievement',
      'Course', 'CourseEnrollment', 'CourseLesson', 'LessonProgress',
      'Exam', 'ExamQuestion', 'ExamParticipant', 'ExamAnswer', 'ExamAnswerTemplate', 'ExamMonitoringLog', 'EssayAnswerAnalysis',
      'Story', 'StoryView', 'StoryLike', 'PaymentHistory', 'PaymentTransaction', 'Friendship', 'Report', 'Ranking'
    ];
    
    for (const modelName of modelFiles) {
      try {
        const model = require(`./${modelName}`);
        // Check if it's a Sequelize model by checking for associations methods
        if (model && typeof model.belongsTo === 'function') {
          models[modelName] = model;
        } else {
          console.log(`Skipping non-Sequelize model: ${modelName}`);
        }
      } catch (err) {
        console.log(`Could not load model: ${modelName}`, err.message);
      }
    }
    
    // Now set up associations only between existing Sequelize models
    
    // User - Achievement (if both exist)
    if (models.User && models.Achievement && models.UserAchievement) {
      console.log('Setting up User-Achievement associations');
      models.User.belongsToMany(models.Achievement, { through: models.UserAchievement, foreignKey: 'UserID' });
      models.Achievement.belongsToMany(models.User, { through: models.UserAchievement, foreignKey: 'AchievementID' });
    }
    
    // User - Ranking (if both exist)
    if (models.User && models.Ranking) {
      console.log('Setting up User-Ranking associations');
      models.User.hasOne(models.Ranking, { foreignKey: 'UserID' });
      models.Ranking.belongsTo(models.User, { foreignKey: 'UserID' });
    }

    // Chat associations
    if (models.Chat && models.User && models.ConversationParticipant) {
      console.log('Setting up Chat associations');
      models.Chat.belongsToMany(models.User, { 
        through: models.ConversationParticipant, 
        foreignKey: 'ConversationID', 
        as: 'Participants' 
      });
      models.User.belongsToMany(models.Chat, { 
        through: models.ConversationParticipant, 
        foreignKey: 'UserID', 
        as: 'Conversations' 
      });
    }

    // Message associations
    if (models.Message && models.Chat && models.User) {
      console.log('Setting up Message associations');
      models.Chat.hasMany(models.Message, { 
        foreignKey: 'ConversationID', 
        as: 'Messages' 
      });
      models.Message.belongsTo(models.Chat, { 
        foreignKey: 'ConversationID' 
      });
      models.Message.belongsTo(models.User, { 
        foreignKey: 'SenderID', 
        as: 'Sender' 
      });
    }

    // Story associations
    if (models.Story && models.User) {
      console.log('Setting up Story associations');
      models.User.hasMany(models.Story, { foreignKey: 'UserID' });
      models.Story.belongsTo(models.User, { foreignKey: 'UserID' });
    }
    
    // StoryView associations
    if (models.Story && models.StoryView && models.User) {
      console.log('Setting up StoryView associations');
      models.Story.hasMany(models.StoryView, { foreignKey: 'StoryID' });
      models.StoryView.belongsTo(models.Story, { foreignKey: 'StoryID' });
      models.User.hasMany(models.StoryView, { foreignKey: 'ViewerID' });
      models.StoryView.belongsTo(models.User, { foreignKey: 'ViewerID', as: 'Viewer' });
    }

    // StoryLike associations
    if (models.Story && models.StoryLike && models.User) {
      console.log('Setting up StoryLike associations');
      models.Story.hasMany(models.StoryLike, { foreignKey: 'StoryID', as: 'Likes' });
      models.StoryLike.belongsTo(models.Story, { foreignKey: 'StoryID' });
      models.User.hasMany(models.StoryLike, { foreignKey: 'UserID', as: 'StoryLikes' });
      models.StoryLike.belongsTo(models.User, { foreignKey: 'UserID', as: 'Liker' });
    }
    
    console.log('Model associations completed');
    
    // Setup association between PaymentTransaction and Course
    if (models.PaymentTransaction && models.Course) {
      console.log('Setting up PaymentTransaction <-> Course association');
      models.PaymentTransaction.belongsTo(models.Course, { foreignKey: 'CourseID' });
      models.Course.hasMany(models.PaymentTransaction, { foreignKey: 'CourseID' });
    }
    
    // Return the loaded models
    return models;
  } catch (error) {
    console.error('Error setting up associations:', error.message);
    return { User }; // Return at least the User model
  }
};

// Export initial models and setup function
module.exports = {
  sequelize,
  setupAssociations,
  User,
  Chat,
  Message,
  ConversationParticipant,
  MessageStatus,
  UserAchievement,
  Achievement,
  Story,
  StoryView,
  StoryLike
};