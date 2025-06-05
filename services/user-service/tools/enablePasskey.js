/**
 * Script to enable passkey for a specific user
 * Usage: node tools/enablePasskey.js <email>
 */
require('dotenv').config();
const { pool, sql } = require('../config/db');
const crypto = require('crypto');

// Generate a random credential ID
function generateRandomCredentialId() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate a random public key
function generateRandomPublicKey() {
  return crypto.randomBytes(32).toString('base64');
}

async function enablePasskeyForUser(email) {
  if (!email) {
    console.error('Email is required. Usage: node tools/enablePasskey.js <email>');
    process.exit(1);
  }

  try {
    console.log(`Enabling passkey for user with email: ${email}`);
    await pool.connect();
    
    // First, check if the user exists
    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID, Username, Email, HasPasskey
        FROM Users
        WHERE Email = @email OR Username = @email
      `);
    
    if (userResult.recordset.length === 0) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    const user = userResult.recordset[0];
    console.log('Found user:', user);
    
    // Create a dummy credential
    const credential = {
      id: generateRandomCredentialId(),
      publicKey: generateRandomPublicKey(),
      algorithm: 'ES256',
      counter: 0,
      createdAt: new Date().toISOString()
    };
    
    // Update the user with the credential
    await pool.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('credentials', sql.NVarChar, JSON.stringify([credential]))
      .input('hasPasskey', sql.Bit, 1)
      .query(`
        UPDATE Users
        SET PasskeyCredentials = @credentials,
            HasPasskey = @hasPasskey
        WHERE UserID = @userId
      `);
    
    console.log('Passkey enabled successfully.');
    
    // Verify the update
    const verifyResult = await pool.request()
      .input('userId', sql.BigInt, user.UserID)
      .query(`
        SELECT UserID, Username, Email, HasPasskey, PasskeyCredentials
        FROM Users
        WHERE UserID = @userId
      `);
    
    console.log('Updated user:', verifyResult.recordset[0]);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error enabling passkey:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
enablePasskeyForUser(email); 