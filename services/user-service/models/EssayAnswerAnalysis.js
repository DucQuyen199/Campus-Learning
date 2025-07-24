/*-----------------------------------------------------------------
* File: EssayAnswerAnalysis.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EssayAnswerAnalysis = sequelize.define('EssayAnswerAnalysis', {
  AnalysisID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  AnswerID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  MatchPercentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  KeywordsMatched: {
    type: DataTypes.INTEGER
  },
  TotalKeywords: {
    type: DataTypes.INTEGER
  },
  ContentSimilarity: {
    type: DataTypes.DECIMAL(5, 2)
  },
  GrammarScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  AnalyzedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  AutoGradedScore: {
    type: DataTypes.INTEGER
  },
  FinalScore: {
    type: DataTypes.INTEGER
  },
  ReviewerComments: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'EssayAnswerAnalysis',
  timestamps: false
});

module.exports = EssayAnswerAnalysis; 
