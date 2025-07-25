/*-----------------------------------------------------------------
* File: sshController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool } = require('../config/db');
const crypto = require('crypto');

// Helper function to validate SSH key format
const isValidSSHKey = (key) => {
  const trimmedKey = key.trim();
  return (
    (trimmedKey.startsWith('ssh-rsa ') || 
     trimmedKey.startsWith('ssh-ed25519 ') || 
     trimmedKey.startsWith('ssh-dss ') ||
     trimmedKey.startsWith('ecdsa-sha2-nistp')) && 
    trimmedKey.length > 50
  );
};

// Generate SSH key fingerprint
const generateKeyFingerprint = (key) => {
  try {
    // Extract the key parts
    const parts = key.split(' ');
    if (parts.length < 2) return null;
    
    // Decode the public key
    const keyBuffer = Buffer.from(parts[1], 'base64');
    
    // Generate SHA256 fingerprint
    const hash = crypto.createHash('sha256');
    hash.update(keyBuffer);
    const fingerprint = hash.digest('base64');
    
    return `SHA256:${fingerprint}`;
  } catch (error) {
    console.error('Error generating key fingerprint:', error);
    return null;
  }
};

// Get a user's SSH keys
exports.getUserSSHKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First try to create the table if it doesn't exist
    try {
      const createTableQuery = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSSHKeys')
        BEGIN
          CREATE TABLE UserSSHKeys (
            KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
            UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
            Title NVARCHAR(100) NOT NULL,
            KeyType VARCHAR(20) NOT NULL,
            KeyValue NVARCHAR(MAX) NOT NULL,
            Fingerprint VARCHAR(100) NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            LastUsedAt DATETIME NULL,
            DeletedAt DATETIME NULL,
            CONSTRAINT UQ_UserSSHKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
          )
        END
      `;
      
      await pool.request().query(createTableQuery);
    } catch (error) {
      console.error('Error creating UserSSHKeys table (if not exists):', error);
    }
    
    // Check if columns exist
    let hasKeyType = true;
    let hasDeletedAt = true;
    
    try {
      // Check if the required columns exist
      const checkColumnsQuery = `
        SELECT 
          CASE WHEN COL_LENGTH('UserSSHKeys', 'KeyType') IS NOT NULL THEN 1 ELSE 0 END AS HasKeyType,
          CASE WHEN COL_LENGTH('UserSSHKeys', 'DeletedAt') IS NOT NULL THEN 1 ELSE 0 END AS HasDeletedAt
      `;
      
      const columnCheck = await pool.request().query(checkColumnsQuery);
      
      if (columnCheck.recordset.length > 0) {
        hasKeyType = columnCheck.recordset[0].HasKeyType === 1;
        hasDeletedAt = columnCheck.recordset[0].HasDeletedAt === 1;
      }
    } catch (error) {
      console.error('Error checking columns:', error);
      // If there's an error, assume the table doesn't exist
      hasKeyType = false;
      hasDeletedAt = false;
    }
    
    // Build the query based on column availability
    let query = `
      SELECT KeyID, Title, Fingerprint, CreatedAt
    `;
    
    if (hasKeyType) {
      query += `, KeyType`;
    }
    
    if (hasDeletedAt) {
      query += `, LastUsedAt FROM UserSSHKeys WHERE UserID = @userId AND DeletedAt IS NULL ORDER BY CreatedAt DESC`;
    } else {
      query += `, LastUsedAt FROM UserSSHKeys WHERE UserID = @userId ORDER BY CreatedAt DESC`;
    }
    
    const request = pool.request();
    request.input('userId', userId);
    
    const result = await request.query(query);
    
    return res.json({ 
      success: true,
      keys: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching SSH keys:', error);
    
    // If table doesn't exist yet or query error, return empty array
    return res.json({
      success: true,
      keys: []
    });
  }
};

// Add a new SSH key
exports.addSSHKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, key } = req.body;
    
    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    if (!key || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'SSH key is required'
      });
    }
    
    // Validate SSH key format
    if (!isValidSSHKey(key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SSH key format'
      });
    }
    
    // Generate fingerprint
    const fingerprint = generateKeyFingerprint(key);
    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate key fingerprint'
      });
    }
    
    // Get key type
    const keyType = key.trim().split(' ')[0];
    
    // Check if table exists, create if not
    let tableExists = false;
    try {
      const checkTableQuery = `
        SELECT COUNT(*) AS TableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'UserSSHKeys'
      `;
      const tableCheck = await pool.request().query(checkTableQuery);
      tableExists = tableCheck.recordset[0].TableCount > 0;
      
      if (!tableExists) {
        const createTableQuery = `
          CREATE TABLE UserSSHKeys (
            KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
            UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
            Title NVARCHAR(100) NOT NULL,
            KeyType VARCHAR(20) NOT NULL,
            KeyValue NVARCHAR(MAX) NOT NULL,
            Fingerprint VARCHAR(100) NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            LastUsedAt DATETIME NULL,
            DeletedAt DATETIME NULL,
            CONSTRAINT UQ_UserSSHKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
          )
        `;
        
        await pool.request().query(createTableQuery);
        console.log('Created UserSSHKeys table');
      }
    } catch (error) {
      console.error('Error checking or creating UserSSHKeys table:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating SSH keys table',
        error: error.message
      });
    }
    
    // Insert the key
    try {
      const insertQuery = `
        INSERT INTO UserSSHKeys (UserID, Title, KeyType, KeyValue, Fingerprint)
        VALUES (@userId, @title, @keyType, @keyValue, @fingerprint);
        
        SELECT SCOPE_IDENTITY() AS KeyID;
      `;
      
      const request = pool.request();
      request.input('userId', userId);
      request.input('title', title);
      request.input('keyType', keyType);
      request.input('keyValue', key);
      request.input('fingerprint', fingerprint);
      
      const result = await request.query(insertQuery);
      const keyId = result.recordset[0].KeyID;
      
      return res.status(201).json({
        success: true,
        message: 'SSH key added successfully',
        key: {
          id: keyId,
          title,
          keyType,
          fingerprint,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error inserting SSH key:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding SSH key',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in addSSHKey:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

// Delete an SSH key
exports.deleteSSHKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;
    
    // Check if the table exists
    try {
      const checkTableQuery = `
        SELECT COUNT(*) AS TableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'UserSSHKeys'
      `;
      const tableCheck = await pool.request().query(checkTableQuery);
      const tableExists = tableCheck.recordset[0].TableCount > 0;
      
      if (!tableExists) {
        return res.status(404).json({
          success: false,
          message: 'SSH keys table not found'
        });
      }
    } catch (error) {
      console.error('Error checking if UserSSHKeys table exists:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking SSH keys table',
        error: error.message
      });
    }
    
    // Check if DeletedAt column exists
    let hasDeletedAt = true;
    try {
      const checkColumnQuery = `
        SELECT COUNT(*) AS ColumnCount
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'UserSSHKeys' AND COLUMN_NAME = 'DeletedAt'
      `;
      
      const columnCheck = await pool.request().query(checkColumnQuery);
      hasDeletedAt = columnCheck.recordset[0].ColumnCount > 0;
    } catch (error) {
      console.error('Error checking if DeletedAt column exists:', error);
      hasDeletedAt = false;
    }
    
    let result;
    if (hasDeletedAt) {
      // Soft delete using DeletedAt column
      const deleteQuery = `
        UPDATE UserSSHKeys
        SET DeletedAt = GETDATE()
        WHERE KeyID = @keyId AND UserID = @userId AND DeletedAt IS NULL
      `;
      
      const request = pool.request();
      request.input('keyId', keyId);
      request.input('userId', userId);
      
      result = await request.query(deleteQuery);
    } else {
      // Hard delete if DeletedAt column doesn't exist
      const deleteQuery = `
        DELETE FROM UserSSHKeys
        WHERE KeyID = @keyId AND UserID = @userId
      `;
      
      const request = pool.request();
      request.input('keyId', keyId);
      request.input('userId', userId);
      
      result = await request.query(deleteQuery);
    }
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'SSH key not found or already deleted'
      });
    }
    
    return res.json({
      success: true,
      message: 'SSH key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SSH key:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting SSH key',
      error: error.message
    });
  }
};

// Get a user's GPG keys
exports.getUserGPGKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First try to create the table if it doesn't exist
    try {
      const createTableQuery = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserGPGKeys')
        BEGIN
          CREATE TABLE UserGPGKeys (
            KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
            UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
            Title NVARCHAR(100) NOT NULL,
            KeyType VARCHAR(20) NOT NULL,
            KeyValue NVARCHAR(MAX) NOT NULL,
            Fingerprint VARCHAR(100) NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            ExpiresAt DATETIME NULL,
            DeletedAt DATETIME NULL,
            CONSTRAINT UQ_UserGPGKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
          )
        END
      `;
      
      await pool.request().query(createTableQuery);
    } catch (error) {
      console.error('Error creating UserGPGKeys table (if not exists):', error);
    }
    
    // Check if columns exist
    let hasKeyType = true;
    let hasDeletedAt = true;
    
    try {
      // Check if the required columns exist
      const checkColumnsQuery = `
        SELECT 
          CASE WHEN COL_LENGTH('UserGPGKeys', 'KeyType') IS NOT NULL THEN 1 ELSE 0 END AS HasKeyType,
          CASE WHEN COL_LENGTH('UserGPGKeys', 'DeletedAt') IS NOT NULL THEN 1 ELSE 0 END AS HasDeletedAt
      `;
      
      const columnCheck = await pool.request().query(checkColumnsQuery);
      
      if (columnCheck.recordset.length > 0) {
        hasKeyType = columnCheck.recordset[0].HasKeyType === 1;
        hasDeletedAt = columnCheck.recordset[0].HasDeletedAt === 1;
      }
    } catch (error) {
      console.error('Error checking columns:', error);
      // If there's an error, assume the table doesn't exist
      hasKeyType = false;
      hasDeletedAt = false;
    }
    
    // Build the query based on column availability
    let query = `
      SELECT KeyID, Title, Fingerprint, CreatedAt
    `;
    
    if (hasKeyType) {
      query += `, KeyType`;
    }
    
    if (hasDeletedAt) {
      query += `, ExpiresAt FROM UserGPGKeys WHERE UserID = @userId AND DeletedAt IS NULL ORDER BY CreatedAt DESC`;
    } else {
      query += `, ExpiresAt FROM UserGPGKeys WHERE UserID = @userId ORDER BY CreatedAt DESC`;
    }
    
    const request = pool.request();
    request.input('userId', userId);
    
    const result = await request.query(query);
    
    return res.json({ 
      success: true,
      keys: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching GPG keys:', error);
    
    // If table doesn't exist yet or query error, return empty array
    return res.json({
      success: true,
      keys: []
    });
  }
};

// Add a new GPG key
exports.addGPGKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, key } = req.body;
    
    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    if (!key || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'GPG key is required'
      });
    }
    
    // TODO: Add GPG key validation
    
    // Check if table exists, create if not
    let tableExists = false;
    try {
      const checkTableQuery = `
        SELECT COUNT(*) AS TableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'UserGPGKeys'
      `;
      const tableCheck = await pool.request().query(checkTableQuery);
      tableExists = tableCheck.recordset[0].TableCount > 0;
      
      if (!tableExists) {
        const createTableQuery = `
          CREATE TABLE UserGPGKeys (
            KeyID BIGINT IDENTITY(1,1) PRIMARY KEY,
            UserID BIGINT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
            Title NVARCHAR(100) NOT NULL,
            KeyType VARCHAR(20) NOT NULL,
            KeyValue NVARCHAR(MAX) NOT NULL,
            Fingerprint VARCHAR(100) NOT NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            ExpiresAt DATETIME NULL,
            DeletedAt DATETIME NULL,
            CONSTRAINT UQ_UserGPGKeys_User_Fingerprint UNIQUE (UserID, Fingerprint)
          )
        `;
        
        await pool.request().query(createTableQuery);
        console.log('Created UserGPGKeys table');
      }
    } catch (error) {
      console.error('Error checking or creating UserGPGKeys table:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating GPG keys table',
        error: error.message
      });
    }
    
    try {
      // Insert the key with placeholder values for now
      const insertQuery = `
        INSERT INTO UserGPGKeys (UserID, Title, KeyType, KeyValue, Fingerprint)
        VALUES (@userId, @title, 'gpg', @keyValue, @fingerprint);
        
        SELECT SCOPE_IDENTITY() AS KeyID;
      `;
      
      // Generate a simple fingerprint (in real implementation, parse the actual GPG key)
      const fingerprint = crypto.createHash('sha256').update(key).digest('hex').substring(0, 40).toUpperCase();
      
      const request = pool.request();
      request.input('userId', userId);
      request.input('title', title);
      request.input('keyValue', key);
      request.input('fingerprint', fingerprint);
      
      const result = await request.query(insertQuery);
      const keyId = result.recordset[0].KeyID;
      
      return res.status(201).json({
        success: true,
        message: 'GPG key added successfully',
        key: {
          id: keyId,
          title,
          keyType: 'gpg',
          fingerprint,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error inserting GPG key:', error);
      return res.status(500).json({
        success: false,
        message: 'Error adding GPG key',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in addGPGKey:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

// Delete a GPG key
exports.deleteGPGKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.keyId;
    
    // Check if the table exists
    try {
      const checkTableQuery = `
        SELECT COUNT(*) AS TableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'UserGPGKeys'
      `;
      const tableCheck = await pool.request().query(checkTableQuery);
      const tableExists = tableCheck.recordset[0].TableCount > 0;
      
      if (!tableExists) {
        return res.status(404).json({
          success: false,
          message: 'GPG keys table not found'
        });
      }
    } catch (error) {
      console.error('Error checking if UserGPGKeys table exists:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking GPG keys table',
        error: error.message
      });
    }
    
    // Check if DeletedAt column exists
    let hasDeletedAt = true;
    try {
      const checkColumnQuery = `
        SELECT COUNT(*) AS ColumnCount
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'UserGPGKeys' AND COLUMN_NAME = 'DeletedAt'
      `;
      
      const columnCheck = await pool.request().query(checkColumnQuery);
      hasDeletedAt = columnCheck.recordset[0].ColumnCount > 0;
    } catch (error) {
      console.error('Error checking if DeletedAt column exists:', error);
      hasDeletedAt = false;
    }
    
    let result;
    if (hasDeletedAt) {
      // Soft delete using DeletedAt column
      const deleteQuery = `
        UPDATE UserGPGKeys
        SET DeletedAt = GETDATE()
        WHERE KeyID = @keyId AND UserID = @userId AND DeletedAt IS NULL
      `;
      
      const request = pool.request();
      request.input('keyId', keyId);
      request.input('userId', userId);
      
      result = await request.query(deleteQuery);
    } else {
      // Hard delete if DeletedAt column doesn't exist
      const deleteQuery = `
        DELETE FROM UserGPGKeys
        WHERE KeyID = @keyId AND UserID = @userId
      `;
      
      const request = pool.request();
      request.input('keyId', keyId);
      request.input('userId', userId);
      
      result = await request.query(deleteQuery);
    }
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'GPG key not found or already deleted'
      });
    }
    
    return res.json({
      success: true,
      message: 'GPG key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting GPG key:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting GPG key',
      error: error.message
    });
  }
}; 
