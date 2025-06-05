/**
 * Script to set HasPasskey to false for all users where it's NULL
 */
require('dotenv').config();
const { pool, sql } = require('../config/db');

async function updatePasskeyStatus() {
  try {
    console.log('Connecting to database...');
    await pool.connect();
    
    console.log('Updating users with NULL HasPasskey...');
    const result = await pool.request()
      .query(`
        UPDATE Users
        SET HasPasskey = 0
        WHERE HasPasskey IS NULL
      `);
    
    console.log(`Updated ${result.rowsAffected[0]} users.`);
    
    // Verify the update
    const verifyResult = await pool.request()
      .query(`
        SELECT UserID, Username, Email, HasPasskey
        FROM Users
        WHERE Email = 'q1@gmail.com'
      `);
    
    console.log('Verification result:', verifyResult.recordset);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating passkey status:', error);
    process.exit(1);
  }
}

updatePasskeyStatus(); 