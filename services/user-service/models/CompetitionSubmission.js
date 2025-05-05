const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CompetitionProblem = require('./CompetitionProblem');
const CompetitionParticipant = require('./CompetitionParticipant');

const CompetitionSubmission = sequelize.define('CompetitionSubmission', {
  SubmissionID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ProblemID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: CompetitionProblem,
      key: 'ProblemID'
    }
  },
  ParticipantID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: CompetitionParticipant,
      key: 'ParticipantID'
    }
  },
  SourceCode: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'compiling', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error']]
    }
  },
  Score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ExecutionTime: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  MemoryUsed: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ErrorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SubmittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  JudgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'CompetitionSubmissions',
  timestamps: false
});

// Define associations
CompetitionSubmission.belongsTo(CompetitionProblem, { foreignKey: 'ProblemID' });
CompetitionProblem.hasMany(CompetitionSubmission, { foreignKey: 'ProblemID' });

CompetitionSubmission.belongsTo(CompetitionParticipant, { foreignKey: 'ParticipantID' });
CompetitionParticipant.hasMany(CompetitionSubmission, { foreignKey: 'ParticipantID' });

module.exports = CompetitionSubmission; 