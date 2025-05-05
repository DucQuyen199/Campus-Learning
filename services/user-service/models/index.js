const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Course = require('./Course');
// const CourseModule = require('./CourseModule'); // This file doesn't exist
const CourseLesson = require('./CourseLesson');
const CourseEnrollment = require('./CourseEnrollment');
const PaymentTransaction = require('./PaymentTransaction');
const PaymentHistory = require('./PaymentHistory');
const Report = require('./Report');
// Import exam models
const Exam = require('./Exam');
const ExamQuestion = require('./ExamQuestion');
const ExamParticipant = require('./ExamParticipant');
const ExamAnswer = require('./ExamAnswer');
const ExamMonitoringLog = require('./ExamMonitoringLog');
const ExamAnswerTemplate = require('./ExamAnswerTemplate');
const EssayAnswerAnalysis = require('./EssayAnswerAnalysis');
// Import ranking models
const Ranking = require('./Ranking');
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');
// Import competition models
const Competition = require('./Competition');
const CompetitionProblem = require('./CompetitionProblem');
const CompetitionParticipant = require('./CompetitionParticipant');
const CompetitionSubmission = require('./CompetitionSubmission');
const CompetitionRegistration = require('./CompetitionRegistration');
// Import Story model
const Story = require('./Story');
// Import chat models
const { Chat } = require('./Chat');
const Message = require('./Message');
const ConversationParticipant = require('./ConversationParticipant');
const MessageStatus = require('./MessageStatus');
const LessonProgress = require('./LessonProgress');
// Import Friendship model
console.log('Importing Friendship model...');
let Friendship;
try {
  Friendship = require('./Friendship')(sequelize, require('sequelize').DataTypes);
  console.log('Friendship model imported successfully');
} catch (error) {
  console.error('Error importing Friendship model:', error);
}

// We'll set up associations after connection is established
// This will be executed when the server starts
const setupAssociations = () => {
  try {
    console.log('Setting up model associations...');
    
    // User - Friendship associations
    User.hasMany(Friendship, { 
      foreignKey: 'UserID', 
      as: 'SentFriendships' 
    });
    User.hasMany(Friendship, { 
      foreignKey: 'FriendID', 
      as: 'ReceivedFriendships' 
    });
    Friendship.belongsTo(User, { 
      foreignKey: 'UserID', 
      as: 'User' 
    });
    Friendship.belongsTo(User, { 
      foreignKey: 'FriendID', 
      as: 'Friend' 
    });
    
    // User - Course (Instructor)
    User.hasMany(Course, { foreignKey: 'InstructorID', as: 'CreatedCourses' });
    Course.belongsTo(User, { foreignKey: 'InstructorID', as: 'Instructor' });

    // User - CourseEnrollment
    User.hasMany(CourseEnrollment, { foreignKey: 'UserID' });
    CourseEnrollment.belongsTo(User, { foreignKey: 'UserID' });

    // Course - CourseEnrollment
    Course.hasMany(CourseEnrollment, { foreignKey: 'CourseID' });
    CourseEnrollment.belongsTo(Course, { foreignKey: 'CourseID' });

    // CourseLesson - CourseEnrollment (LastAccessedLesson)
    CourseLesson.hasMany(CourseEnrollment, { foreignKey: 'LastAccessedLessonID' });
    CourseEnrollment.belongsTo(CourseLesson, { foreignKey: 'LastAccessedLessonID', as: 'LastAccessedLesson' });

    // CourseEnrollment - LessonProgress
    CourseEnrollment.hasMany(LessonProgress, { foreignKey: 'EnrollmentID' });
    LessonProgress.belongsTo(CourseEnrollment, { foreignKey: 'EnrollmentID' });
    
    // CourseLesson - LessonProgress
    CourseLesson.hasMany(LessonProgress, { foreignKey: 'LessonID' });
    LessonProgress.belongsTo(CourseLesson, { foreignKey: 'LessonID' });

    // User - PaymentTransaction
    User.hasMany(PaymentTransaction, { foreignKey: 'UserID' });
    PaymentTransaction.belongsTo(User, { foreignKey: 'UserID' });

    // Course - PaymentTransaction
    Course.hasMany(PaymentTransaction, { foreignKey: 'CourseID' });
    PaymentTransaction.belongsTo(Course, { foreignKey: 'CourseID' });

    // PaymentTransaction - PaymentHistory
    PaymentTransaction.hasMany(PaymentHistory, { foreignKey: 'TransactionID' });
    PaymentHistory.belongsTo(PaymentTransaction, { foreignKey: 'TransactionID' });
    
    // User - Report (Reporter)
    User.hasMany(Report, { foreignKey: 'ReporterID', as: 'UserReports' });
    Report.belongsTo(User, { foreignKey: 'ReporterID', as: 'Reporter' });

    // Exam associations
    // Course - Exam
    Course.hasMany(Exam, { foreignKey: 'CourseID' });
    Exam.belongsTo(Course, { foreignKey: 'CourseID' });

    // User - Exam (Creator)
    User.hasMany(Exam, { foreignKey: 'CreatedBy', as: 'CreatedExams' });
    Exam.belongsTo(User, { foreignKey: 'CreatedBy', as: 'Creator' });

    // Exam - ExamQuestion
    Exam.hasMany(ExamQuestion, { foreignKey: 'ExamID' });
    ExamQuestion.belongsTo(Exam, { foreignKey: 'ExamID' });

    // Exam - ExamParticipant
    Exam.hasMany(ExamParticipant, { foreignKey: 'ExamID' });
    ExamParticipant.belongsTo(Exam, { foreignKey: 'ExamID' });

    // User - ExamParticipant
    User.hasMany(ExamParticipant, { foreignKey: 'UserID' });
    ExamParticipant.belongsTo(User, { foreignKey: 'UserID' });

    // User - ExamParticipant (Reviewer)
    User.hasMany(ExamParticipant, { foreignKey: 'ReviewedBy', as: 'ReviewedExams' });
    ExamParticipant.belongsTo(User, { foreignKey: 'ReviewedBy', as: 'Reviewer' });

    // ExamParticipant - ExamAnswer
    ExamParticipant.hasMany(ExamAnswer, { foreignKey: 'ParticipantID' });
    ExamAnswer.belongsTo(ExamParticipant, { foreignKey: 'ParticipantID' });

    // ExamQuestion - ExamAnswer
    ExamQuestion.hasMany(ExamAnswer, { foreignKey: 'QuestionID' });
    ExamAnswer.belongsTo(ExamQuestion, { foreignKey: 'QuestionID' });

    // ExamParticipant - ExamMonitoringLog
    ExamParticipant.hasMany(ExamMonitoringLog, { foreignKey: 'ParticipantID' });
    ExamMonitoringLog.belongsTo(ExamParticipant, { foreignKey: 'ParticipantID' });

    // Exam - ExamAnswerTemplate
    Exam.hasMany(ExamAnswerTemplate, { foreignKey: 'ExamID' });
    ExamAnswerTemplate.belongsTo(Exam, { foreignKey: 'ExamID' });

    // User - ExamAnswerTemplate (Creator)
    User.hasMany(ExamAnswerTemplate, { foreignKey: 'CreatedBy' });
    ExamAnswerTemplate.belongsTo(User, { foreignKey: 'CreatedBy', as: 'Creator' });

    // ExamAnswer - EssayAnswerAnalysis
    ExamAnswer.hasOne(EssayAnswerAnalysis, { foreignKey: 'AnswerID' });
    EssayAnswerAnalysis.belongsTo(ExamAnswer, { foreignKey: 'AnswerID' });

    // Ranking associations
    // User - Ranking
    User.hasOne(Ranking, { foreignKey: 'UserID' });
    Ranking.belongsTo(User, { foreignKey: 'UserID' });

    // User - UserAchievement
    User.hasMany(UserAchievement, { foreignKey: 'UserID' });
    UserAchievement.belongsTo(User, { foreignKey: 'UserID' });

    // Achievement - UserAchievement
    Achievement.hasMany(UserAchievement, { foreignKey: 'AchievementID' });
    UserAchievement.belongsTo(Achievement, { foreignKey: 'AchievementID' });

    // Competition associations
    // User - Competition (Organizer)
    User.hasMany(Competition, { foreignKey: 'OrganizedBy', as: 'OrganizedCompetitions' });
    Competition.belongsTo(User, { foreignKey: 'OrganizedBy', as: 'Organizer' });
    
    // Competition - CompetitionProblem
    Competition.hasMany(CompetitionProblem, { foreignKey: 'CompetitionID' });
    CompetitionProblem.belongsTo(Competition, { foreignKey: 'CompetitionID' });
    
    // Competition - CompetitionParticipant
    Competition.hasMany(CompetitionParticipant, { foreignKey: 'CompetitionID' });
    CompetitionParticipant.belongsTo(Competition, { foreignKey: 'CompetitionID' });
    
    // User - CompetitionParticipant
    User.hasMany(CompetitionParticipant, { foreignKey: 'UserID' });
    CompetitionParticipant.belongsTo(User, { foreignKey: 'UserID' });
    
    // CompetitionProblem - CompetitionSubmission
    CompetitionProblem.hasMany(CompetitionSubmission, { foreignKey: 'ProblemID' });
    CompetitionSubmission.belongsTo(CompetitionProblem, { foreignKey: 'ProblemID' });
    
    // CompetitionParticipant - CompetitionSubmission
    CompetitionParticipant.hasMany(CompetitionSubmission, { foreignKey: 'ParticipantID' });
    CompetitionSubmission.belongsTo(CompetitionParticipant, { foreignKey: 'ParticipantID' });

    // Competition - CompetitionRegistration
    Competition.hasMany(CompetitionRegistration, { foreignKey: 'CompetitionID' });
    CompetitionRegistration.belongsTo(Competition, { foreignKey: 'CompetitionID' });

    // User - CompetitionRegistration
    User.hasMany(CompetitionRegistration, { foreignKey: 'UserID' });
    CompetitionRegistration.belongsTo(User, { foreignKey: 'UserID' });

    // User - Story
    User.hasMany(Story, { foreignKey: 'UserID' });
    Story.belongsTo(User, { foreignKey: 'UserID' });

    // Chat associations
    Chat.belongsToMany(User, {
      through: ConversationParticipant,
      foreignKey: 'ConversationID',
      otherKey: 'UserID',
      as: 'Participants'
    });

    User.belongsToMany(Chat, {
      through: ConversationParticipant,
      foreignKey: 'UserID',
      otherKey: 'ConversationID',
      as: 'Conversations'
    });

    Chat.hasMany(Message, {
      foreignKey: 'ConversationID',
      as: 'Messages'
    });

    Message.belongsTo(Chat, {
      foreignKey: 'ConversationID',
      as: 'Conversation'
    });

    Message.belongsTo(User, {
      foreignKey: 'SenderID',
      as: 'Sender'
    });

    User.hasMany(Message, {
      foreignKey: 'SenderID',
      as: 'SentMessages'
    });

    Message.belongsToMany(User, {
      through: MessageStatus,
      foreignKey: 'MessageID',
      otherKey: 'UserID',
      as: 'ReadBy'
    });

    User.belongsToMany(Message, {
      through: MessageStatus,
      foreignKey: 'UserID',
      otherKey: 'MessageID',
      as: 'ReadMessages'
    });

    console.log('Model associations have been established successfully');
  } catch (error) {
    console.error('Error setting up associations:', error);
  }
};

// Export all models and utilities
module.exports = {
  sequelize,
  setupAssociations,
  User,
  Course,
  // CourseModule, // Remove from exports as well
  CourseLesson,
  CourseEnrollment,
  PaymentTransaction,
  PaymentHistory,
  Report,
  // Export exam models
  Exam,
  ExamQuestion,
  ExamParticipant,
  ExamAnswer,
  ExamMonitoringLog,
  ExamAnswerTemplate,
  EssayAnswerAnalysis,
  // Export ranking models
  Ranking,
  Achievement,
  UserAchievement,
  // Export competition models
  Competition,
  CompetitionProblem,
  CompetitionParticipant,
  CompetitionSubmission,
  CompetitionRegistration,
  Story,
  // Export chat models
  Chat,
  Message,
  MessageStatus,
  ConversationParticipant,
  LessonProgress,
  // Export friendship model
  Friendship
};