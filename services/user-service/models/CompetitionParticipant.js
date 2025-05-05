const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Competition = require('./Competition');

const CompetitionParticipant = sequelize.define('CompetitionParticipants', {
  ParticipantID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  CompetitionID: {
    type: DataTypes.BIGINT,
    references: {
      model: Competition,
      key: 'CompetitionID'
    }
  },
  UserID: {
    type: DataTypes.BIGINT,
    references: {
      model: User,
      key: 'UserID'
    }
  },
  RegistrationTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    get() {
      return this.getDataValue('RegistrationTime');
    },
    set(value) {
      if (typeof value === 'string') {
        // Remove timezone information and ensure SQL Server compatible format
        const cleanDate = value.replace(/(\+|-)\d{2}:\d{2}/, '').trim();
        this.setDataValue('RegistrationTime', cleanDate);
      } else if (value instanceof Date) {
        // Convert Date object to SQL Server compatible string
        this.setDataValue('RegistrationTime', value.toISOString().replace('T', ' ').substring(0, 19));
      } else {
        this.setDataValue('RegistrationTime', value);
      }
    }
  },
  Score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Rank: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Status: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['registered', 'active', 'completed', 'disqualified']]
    },
    defaultValue: 'registered'
  },
  StartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    get() {
      return this.getDataValue('StartTime');
    },
    set(value) {
      if (typeof value === 'string') {
        // Remove timezone information and ensure SQL Server compatible format
        const cleanDate = value.replace(/(\+|-)\d{2}:\d{2}/, '').trim();
        this.setDataValue('StartTime', cleanDate);
      } else if (value instanceof Date) {
        // Convert Date object to SQL Server compatible string
        this.setDataValue('StartTime', value.toISOString().replace('T', ' ').substring(0, 19));
      } else {
        this.setDataValue('StartTime', value);
      }
    }
  },
  EndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    get() {
      return this.getDataValue('EndTime');
    },
    set(value) {
      if (typeof value === 'string') {
        // Remove timezone information and ensure SQL Server compatible format
        const cleanDate = value.replace(/(\+|-)\d{2}:\d{2}/, '').trim();
        this.setDataValue('EndTime', cleanDate);
      } else if (value instanceof Date) {
        // Convert Date object to SQL Server compatible string
        this.setDataValue('EndTime', value.toISOString().replace('T', ' ').substring(0, 19));
      } else {
        this.setDataValue('EndTime', value);
      }
    }
  },
  TotalProblemsAttempted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  TotalProblemsSolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    get() {
      return this.getDataValue('CreatedAt');
    },
    set(value) {
      if (typeof value === 'string') {
        // Remove timezone information and ensure SQL Server compatible format
        const cleanDate = value.replace(/(\+|-)\d{2}:\d{2}/, '').trim();
        this.setDataValue('CreatedAt', cleanDate);
      } else if (value instanceof Date) {
        // Convert Date object to SQL Server compatible string
        this.setDataValue('CreatedAt', value.toISOString().replace('T', ' ').substring(0, 19));
      } else {
        this.setDataValue('CreatedAt', value);
      }
    }
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    get() {
      return this.getDataValue('UpdatedAt');
    },
    set(value) {
      if (typeof value === 'string') {
        // Remove timezone information and ensure SQL Server compatible format
        const cleanDate = value.replace(/(\+|-)\d{2}:\d{2}/, '').trim();
        this.setDataValue('UpdatedAt', cleanDate);
      } else if (value instanceof Date) {
        // Convert Date object to SQL Server compatible string
        this.setDataValue('UpdatedAt', value.toISOString().replace('T', ' ').substring(0, 19));
      } else {
        this.setDataValue('UpdatedAt', value);
      }
    }
  }
}, {
  tableName: 'CompetitionParticipants',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

// Define associations
CompetitionParticipant.belongsTo(Competition, { foreignKey: 'CompetitionID' });
CompetitionParticipant.belongsTo(User, { foreignKey: 'UserID' });
Competition.hasMany(CompetitionParticipant, { foreignKey: 'CompetitionID' });
User.hasMany(CompetitionParticipant, { foreignKey: 'UserID' });

module.exports = CompetitionParticipant; 