/*-----------------------------------------------------------------
* File: run-ssh-gpg-migration.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  try {
    console.log('Skipping SSH and GPG tables migration (not required)...');
    
    // No longer trying to read the missing SQL file
    // Just return success since we don't need to create these tables
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration }; 
