/*-----------------------------------------------------------------
* File: ExamParticipant.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamParticipant = sequelize.define('ExamParticipant', {
  ParticipantID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ExamID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  UserID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  StartedAt: {
    type: DataTypes.DATE
  },
  CompletedAt: {
    type: DataTypes.DATE
  },
  TimeSpent: {
    type: DataTypes.INTEGER
  },
  Score: {
    type: DataTypes.INTEGER
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'registered',
    validate: {
      isIn: {
        args: [['registered', 'in_progress', 'completed', 'reviewed']],
        msg: "Status must be one of: registered, in_progress, completed, reviewed"
      }
    }
  },
  Feedback: {
    type: DataTypes.TEXT
  },
  ReviewedBy: {
    type: DataTypes.BIGINT
  },
  ReviewedAt: {
    type: DataTypes.DATE
  },
  PenaltyApplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  PenaltyReason: {
    type: DataTypes.STRING(255)
  },
  PenaltyPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'ExamParticipants',
  timestamps: false,
  hooks: {
    beforeCreate: (participant) => {
      console.log('Creating new ExamParticipant:', JSON.stringify(participant));
    },
    beforeUpdate: (participant) => {
      console.log('Updating ExamParticipant:', participant.ParticipantID, 'Status:', participant.Status);
    }
  }
});

module.exports = ExamParticipant; 
