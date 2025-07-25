/*-----------------------------------------------------------------
* File: ExamMonitoringLog.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamMonitoringLog = sequelize.define('ExamMonitoringLog', {
  LogID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ParticipantID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ExamParticipants', 
      key: 'ParticipantID'
    }
  },
  EventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [
        [
          'full_screen_exit', 
          'full_screen_return', 
          'tab_switch', 
          'window_blur',
          'window_focus',
          'exam_start',
          'exam_submit',
          'answer_submit',
          'timer_warning',
          'penalty_applied',
          'browser_close',
          'connection_lost',
          'connection_restored'
        ]
      ]
    }
  },
  EventData: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('EventData');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('EventData', value ? JSON.stringify(value) : null);
    }
  },
  Timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ExamMonitoringLogs',
  timestamps: false
});

module.exports = ExamMonitoringLog; 
