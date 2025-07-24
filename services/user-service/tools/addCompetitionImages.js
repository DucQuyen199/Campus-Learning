/*-----------------------------------------------------------------
* File: addCompetitionImages.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const Competition = require('../models/Competition');
const sequelize = require('../config/database');

async function updateCompetitionImages() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Updating competition cover images...');

    // Get all competitions
    const competitions = await Competition.findAll();
    console.log(`Found ${competitions.length} competitions.`);

    // Update CoverImageURL for all competitions
    let updatedCount = 0;
    for (const competition of competitions) {
      if (!competition.CoverImageURL) {
        competition.CoverImageURL = `https://source.unsplash.com/random/1200x400?programming&sig=${competition.CompetitionID}`;
        await competition.save();
        console.log(`Updated CoverImageURL for competition: ${competition.Title}`);
        updatedCount++;
      } else {
        console.log(`Competition already has CoverImageURL: ${competition.Title}`);
      }
    }

    console.log(`Updated ${updatedCount} competitions with new cover images.`);
    console.log('All updates completed successfully!');
    
  } catch (error) {
    console.error('Error updating competition images:', error);
  }
}

// Run the function
updateCompetitionImages().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 
