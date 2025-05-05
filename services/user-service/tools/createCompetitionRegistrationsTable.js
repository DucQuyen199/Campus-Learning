/**
 * Script to create CompetitionRegistrations table if it doesn't exist
 * Run with: node tools/createCompetitionRegistrationsTable.js
 */

const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function createCompetitionRegistrationsTable() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    console.log('Checking if CompetitionRegistrations table exists...');
    
    // Define the table structure
    const CompetitionRegistration = sequelize.define('CompetitionRegistration', {
      RegistrationID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserID: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      CompetitionID: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      RegistrationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      Status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'REGISTERED'
      },
      Score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      ProblemsSolved: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      Ranking: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      CreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      UpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'CompetitionRegistrations',
      timestamps: true,
      createdAt: 'CreatedAt',
      updatedAt: 'UpdatedAt'
    });
    
    // Create the table if it doesn't exist (force: false)
    await CompetitionRegistration.sync({ force: false });
    console.log('CompetitionRegistrations table synchronized successfully.');
    
  } catch (error) {
    console.error('Error creating CompetitionRegistrations table:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Execute the function
createCompetitionRegistrationsTable(); 