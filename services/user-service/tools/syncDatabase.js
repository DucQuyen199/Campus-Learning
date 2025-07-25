/*-----------------------------------------------------------------
* File: syncDatabase.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sequelize, setupAssociations } = require('../models');

async function syncDatabase() {
  try {
    console.log('Setting up model associations...');
    setupAssociations();
    
    console.log('Synchronizing database...');
    // alter: true will update existing tables
    // force: true would drop tables first (USE WITH CAUTION)
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully!');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
syncDatabase(); 
