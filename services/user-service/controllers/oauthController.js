/*-----------------------------------------------------------------
* File: oauthController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool, sql, query } = require('../config/db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Authenticate with Google
 */
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token không được cung cấp' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if user exists with this Google ID
    let connection = await pool.request()
      .input('provider', 'google')
      .input('providerUserId', googleId)
      .query(`
        SELECT u.*, c.* FROM UserOAuthConnections c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.Provider = @provider AND c.ProviderUserID = @providerUserId
      `);
    
    let user;
    let userId;
    
    // If user with this Google ID exists
    if (connection.recordset.length > 0) {
      user = connection.recordset[0];
      userId = user.UserID;
      
      // Update last used time
      await pool.request()
        .input('connectionId', connection.recordset[0].ConnectionID)
        .query(`
          UPDATE UserOAuthConnections
          SET LastUsedAt = GETDATE()
          WHERE ConnectionID = @connectionId
        `);
    } else {
      // Check if user exists with this email
      const userResult = await pool.request()
        .input('email', email)
        .query('SELECT * FROM Users WHERE Email = @email');
      
      if (userResult.recordset.length > 0) {
        // User exists but hasn't connected Google yet
        user = userResult.recordset[0];
        userId = user.UserID;
        
        // Create connection
        await pool.request()
          .input('userId', userId)
          .input('provider', 'google')
          .input('providerUserId', googleId)
          .input('email', email)
          .input('name', name)
          .input('profilePicture', picture)
          .query(`
            INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt, LastUsedAt)
            VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE(), GETDATE())
          `);
      } else {
        // Create new user
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        const newUserResult = await pool.request()
          .input('username', email.split('@')[0] + '_' + Math.floor(Math.random() * 1000))
          .input('email', email)
          .input('password', hashedPassword)
          .input('fullName', name)
          .input('provider', 'google')
          .input('providerId', googleId)
          .input('emailVerified', 1)
          .input('image', picture)
          .query(`
            INSERT INTO Users (Username, Email, Password, FullName, Provider, ProviderID, EmailVerified, Image, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.UserID
            VALUES (@username, @email, @password, @fullName, @provider, @providerId, @emailVerified, @image, GETDATE(), GETDATE())
          `);
        
        userId = newUserResult.recordset[0].UserID;
        
        // Create OAuth connection
        await pool.request()
          .input('userId', userId)
          .input('provider', 'google')
          .input('providerUserId', googleId)
          .input('email', email)
          .input('name', name)
          .input('profilePicture', picture)
          .query(`
            INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt, LastUsedAt)
            VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE(), GETDATE())
          `);
        
        // Get the newly created user
        const userResult = await pool.request()
          .input('userId', userId)
          .query('SELECT * FROM Users WHERE UserID = @userId');
        
        user = userResult.recordset[0];
      }
    }
    
    // Generate JWT token
    const accessToken = jwt.sign(
      { id: userId, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    await pool.request()
      .input('userId', userId)
      .input('ip', req.ip || '0.0.0.0')
      .query(`
        UPDATE Users
        SET 
          LastLoginAt = GETDATE(),
          LastLoginIP = @ip,
          Status = 'ONLINE'
        WHERE UserID = @userId
      `);
    
    // Return user data and tokens
    return res.json({
      success: true,
      user: {
        id: userId,
        UserID: userId,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        profileImage: user.Image || picture
      },
      token: accessToken,
      refreshToken
    });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực Google', error: error.message });
  }
};

/**
 * Authenticate with Facebook
 */
exports.facebookAuth = async (req, res) => {
  try {
    const { accessToken: fbAccessToken } = req.body;
    
    if (!fbAccessToken) {
      return res.status(400).json({ success: false, message: 'Token không được cung cấp' });
    }
    
    // Verify Facebook token by getting user data
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbAccessToken}`);
    const { id: facebookId, name, email, picture } = response.data;
    const profilePicture = picture?.data?.url;
    
    // Check if user exists with this Facebook ID
    let connection = await pool.request()
      .input('provider', 'facebook')
      .input('providerUserId', facebookId)
      .query(`
        SELECT u.*, c.* FROM UserOAuthConnections c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.Provider = @provider AND c.ProviderUserID = @providerUserId
      `);
    
    let user;
    let userId;
    
    // If user with this Facebook ID exists
    if (connection.recordset.length > 0) {
      user = connection.recordset[0];
      userId = user.UserID;
      
      // Update last used time
      await pool.request()
        .input('connectionId', connection.recordset[0].ConnectionID)
        .query(`
          UPDATE UserOAuthConnections
          SET LastUsedAt = GETDATE()
          WHERE ConnectionID = @connectionId
        `);
    } else if (email) {
      // Check if user exists with this email
      const userResult = await pool.request()
        .input('email', email)
        .query('SELECT * FROM Users WHERE Email = @email');
      
      if (userResult.recordset.length > 0) {
        // User exists but hasn't connected Facebook yet
        user = userResult.recordset[0];
        userId = user.UserID;
        
        // Create connection
        await pool.request()
          .input('userId', userId)
          .input('provider', 'facebook')
          .input('providerUserId', facebookId)
          .input('email', email)
          .input('name', name)
          .input('profilePicture', profilePicture)
          .query(`
            INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt, LastUsedAt)
            VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE(), GETDATE())
          `);
      } else {
        // Create new user
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        const newUserResult = await pool.request()
          .input('username', (email ? email.split('@')[0] : 'fb_user') + '_' + Math.floor(Math.random() * 1000))
          .input('email', email)
          .input('password', hashedPassword)
          .input('fullName', name)
          .input('provider', 'facebook')
          .input('providerId', facebookId)
          .input('emailVerified', email ? 1 : 0)
          .input('image', profilePicture)
          .query(`
            INSERT INTO Users (Username, Email, Password, FullName, Provider, ProviderID, EmailVerified, Image, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.UserID
            VALUES (@username, @email, @password, @fullName, @provider, @providerId, @emailVerified, @image, GETDATE(), GETDATE())
          `);
        
        userId = newUserResult.recordset[0].UserID;
        
        // Create OAuth connection
        await pool.request()
          .input('userId', userId)
          .input('provider', 'facebook')
          .input('providerUserId', facebookId)
          .input('email', email)
          .input('name', name)
          .input('profilePicture', profilePicture)
          .query(`
            INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt, LastUsedAt)
            VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE(), GETDATE())
          `);
        
        // Get the newly created user
        const userResult = await pool.request()
          .input('userId', userId)
          .query('SELECT * FROM Users WHERE UserID = @userId');
        
        user = userResult.recordset[0];
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Tài khoản Facebook không có email. Vui lòng sử dụng phương thức đăng nhập khác.' 
      });
    }
    
    // Generate JWT token
    const accessToken = jwt.sign(
      { id: userId, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data and tokens
    return res.json({
      success: true,
      user: {
        id: userId,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        profileImage: user.Image || profilePicture
      },
      token: accessToken,
      refreshToken
    });
    
  } catch (error) {
    console.error('Facebook authentication error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực Facebook', error: error.message });
  }
};

/**
 * Get user's OAuth connections
 */
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use the query helper function instead of pool.query
    const connections = await query(
      `
      SELECT ConnectionID, Provider, Email, Name, ProfilePicture, CreatedAt, LastUsedAt
      FROM UserOAuthConnections
      WHERE UserID = @userId
    `, { userId });
    
    return res.json({
      success: true,
      connections: connections || []
    });
    
  } catch (error) {
    console.error('Error getting OAuth connections:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin kết nối', error: error.message });
  }
};

/**
 * Connect Google account to existing user
 */
exports.connectGoogle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token không được cung cấp' });
    }
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    // Check if this Google account is already connected to another user
    const existingConnection = await pool.query(`
      SELECT * FROM UserOAuthConnections
      WHERE Provider = @provider AND ProviderUserID = @providerUserId
    `, {
      provider: 'google',
      providerUserId: googleId
    });
    
    if (existingConnection && existingConnection.length > 0) {
      const connectedUserId = existingConnection[0].UserID;
      
      if (connectedUserId !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản Google này đã được kết nối với người dùng khác'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản Google này đã được kết nối với tài khoản của bạn'
        });
      }
    }
    
    // Check if user already has a Google connection
    const userConnection = await pool.query(`
      SELECT * FROM UserOAuthConnections
      WHERE UserID = @userId AND Provider = @provider
    `, {
      userId,
      provider: 'google'
    });
    
    if (userConnection && userConnection.length > 0) {
      // Update existing connection
      await pool.query(`
        UPDATE UserOAuthConnections
        SET ProviderUserID = @providerUserId,
            Email = @email,
            Name = @name,
            ProfilePicture = @profilePicture,
            UpdatedAt = GETDATE()
        WHERE ConnectionID = @connectionId
      `, {
        connectionId: userConnection[0].ConnectionID,
        providerUserId: googleId,
        email,
        name,
        profilePicture: picture
      });
    } else {
      // Create new connection
      await pool.query(`
        INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt)
        VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE())
      `, {
        userId,
        provider: 'google',
        providerUserId: googleId,
        email,
        name,
        profilePicture: picture
      });
    }
    
    return res.json({
      success: true,
      message: 'Kết nối tài khoản Google thành công'
    });
    
  } catch (error) {
    console.error('Error connecting Google account:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi kết nối tài khoản Google', error: error.message });
  }
};

/**
 * Connect Facebook account to existing user
 */
exports.connectFacebook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessToken: fbAccessToken } = req.body;
    
    if (!fbAccessToken) {
      return res.status(400).json({ success: false, message: 'Token không được cung cấp' });
    }
    
    // Verify Facebook token by getting user data
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbAccessToken}`);
    const { id: facebookId, name, email, picture } = response.data;
    const profilePicture = picture?.data?.url;
    
    // Check if this Facebook account is already connected to another user
    const existingConnection = await pool.query(`
      SELECT * FROM UserOAuthConnections
      WHERE Provider = @provider AND ProviderUserID = @providerUserId
    `, {
      provider: 'facebook',
      providerUserId: facebookId
    });
    
    if (existingConnection && existingConnection.length > 0) {
      const connectedUserId = existingConnection[0].UserID;
      
      if (connectedUserId !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản Facebook này đã được kết nối với người dùng khác'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản Facebook này đã được kết nối với tài khoản của bạn'
        });
      }
    }
    
    // Check if user already has a Facebook connection
    const userConnection = await pool.query(`
      SELECT * FROM UserOAuthConnections
      WHERE UserID = @userId AND Provider = @provider
    `, {
      userId,
      provider: 'facebook'
    });
    
    if (userConnection && userConnection.length > 0) {
      // Update existing connection
      await pool.query(`
        UPDATE UserOAuthConnections
        SET ProviderUserID = @providerUserId,
            Email = @email,
            Name = @name,
            ProfilePicture = @profilePicture,
            UpdatedAt = GETDATE()
        WHERE ConnectionID = @connectionId
      `, {
        connectionId: userConnection[0].ConnectionID,
        providerUserId: facebookId,
        email,
        name,
        profilePicture
      });
    } else {
      // Create new connection
      await pool.query(`
        INSERT INTO UserOAuthConnections (UserID, Provider, ProviderUserID, Email, Name, ProfilePicture, CreatedAt, UpdatedAt)
        VALUES (@userId, @provider, @providerUserId, @email, @name, @profilePicture, GETDATE(), GETDATE())
      `, {
        userId,
        provider: 'facebook',
        providerUserId: facebookId,
        email,
        name,
        profilePicture
      });
    }
    
    return res.json({
      success: true,
      message: 'Kết nối tài khoản Facebook thành công'
    });
    
  } catch (error) {
    console.error('Error connecting Facebook account:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi kết nối tài khoản Facebook', error: error.message });
  }
};

/**
 * Disconnect provider from user account
 */
exports.disconnectProvider = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    
    if (!provider || !['google', 'facebook'].includes(provider.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Nhà cung cấp không hợp lệ' });
    }
    
    // Check if user has the connection
    const connection = await pool.query(`
      SELECT * FROM UserOAuthConnections
      WHERE UserID = @userId AND Provider = @provider
    `, { 
      userId, 
      provider: provider.toLowerCase() 
    });
    
    if (!connection || connection.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy kết nối ${provider} cho người dùng này`
      });
    }
    
    // Delete the connection
    await pool.query(`
      DELETE FROM UserOAuthConnections
      WHERE UserID = @userId AND Provider = @provider
    `, { 
      userId, 
      provider: provider.toLowerCase() 
    });
    
    return res.json({
      success: true,
      message: `Đã ngắt kết nối tài khoản ${provider}`
    });
    
  } catch (error) {
    console.error('Error disconnecting provider:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi ngắt kết nối tài khoản', error: error.message });
  }
}; 
