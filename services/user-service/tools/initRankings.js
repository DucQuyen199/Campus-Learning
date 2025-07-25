/*-----------------------------------------------------------------
* File: initRankings.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Script to initialize ranking records for users
 * Run with: npm run init-rankings
 */

const { User, Ranking } = require('../models');
const sequelize = require('../config/database');

async function initRankings() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    console.log('Fetching all users...');
    const users = await User.findAll({
      attributes: ['UserID', 'Username', 'FullName']
    });
    console.log(`Found ${users.length} users`);
    
    let created = 0;
    let existing = 0;
    
    for (const user of users) {
      // Check if user already has a ranking
      const existingRanking = await Ranking.findOne({
        where: { UserID: user.UserID }
      });
      
      if (existingRanking) {
        existing++;
        continue;
      }
      
      // Create a new ranking record for this user
      await Ranking.create({
        UserID: user.UserID,
        Tier: 'BRONZE',
        TotalPoints: 0,
        EventPoints: 0,
        CoursePoints: 0,
        ProblemsSolved: 0,
        Accuracy: 0,
        Wins: 0,
        WeeklyScore: 0,
        MonthlyScore: 0,
        LastCalculatedAt: '2023-04-07'  // Use a simple date with no time component
      });
      
      created++;
      console.log(`Created ranking for user ${user.Username || user.FullName}`);
    }
    
    console.log(`Created ${created} new rankings`);
    console.log(`Skipped ${existing} existing rankings`);
  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Execute the function
initRankings();

