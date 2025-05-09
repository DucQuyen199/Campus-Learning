const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

// Import user models
const User = require('./User');
const UserAchievement = require('./UserAchievement');
const Achievement = require('./Achievement');

// Only import models we're sure are Sequelize models
// The other models will be loaded dynamically if they exist and are Sequelize models

// Function to set up model associations
const setupAssociations = () => {
  console.log('Setting up model associations...');
  
  try {
    // Create a map of all models that are Sequelize models
    const models = {
      User
    };
    
    // Dynamically load models only if they are Sequelize models
    const modelFiles = [
      'Achievement', 'UserAchievement', 'Chat', 'Message', 'MessageStatus', 'ConversationParticipant',
      'Course', 'CourseEnrollment', 'CourseLesson', 'LessonProgress',
      'Exam', 'ExamQuestion', 'ExamParticipant', 'ExamAnswer', 'ExamAnswerTemplate', 'ExamMonitoringLog', 'EssayAnswerAnalysis',
      'Story', 'StoryView', 'PaymentHistory', 'PaymentTransaction', 'Friendship', 'Report', 'Ranking'
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
    
    console.log('Model associations completed');
    
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
  // Add any other models we're certain about
  UserAchievement,
  Achievement
};