const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import SQL connection from server.js
const sqlConnection = require('../sever');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login route - support both regular and Gmail login
router.post('/login', async (req, res) => {
  try {
    const { username, password, email, provider } = req.body;

    // Check if this is a Gmail login
    const isGmailLogin = provider === 'google' || provider === 'gmail';

    // Validate input based on login type
    if (isGmailLogin) {
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email không được để trống cho đăng nhập với Gmail' 
        });
      }
    } else {
      // Regular login requires username/email and password
      if (!username && !email) {
        return res.status(400).json({ 
          success: false,
          message: 'Vui lòng nhập tên đăng nhập hoặc email' 
        });
      }
      
      if (!password) {
        return res.status(400).json({ 
          success: false,
          message: 'Vui lòng nhập mật khẩu' 
        });
      }
    }

    console.log(`Attempting login for ${isGmailLogin ? 'Gmail: ' + email : 'username: ' + (username || email)}`);

    // Query database for user
    const pool = await sqlConnection.connect();
    
    let result;
    
    if (isGmailLogin) {
      // Gmail login - search by email
      result = await pool.request()
        .input('email', sql.VarChar, email)
        .query(`
          SELECT * FROM Users 
          WHERE Email = @email
        `);
        
      // If user doesn't exist and this is a Gmail login, we can auto-register
      if (result.recordset.length === 0) {
        console.log(`Creating new user for Gmail login: ${email}`);
        
        // Extract name from email (before @ symbol)
        const defaultUsername = email.split('@')[0];
        const defaultFullName = defaultUsername.charAt(0).toUpperCase() + defaultUsername.slice(1);
        
        // Create user with email provider
        const newUser = await pool.request()
          .input('username', sql.VarChar, defaultUsername)
          .input('email', sql.VarChar, email)
          .input('password', sql.VarChar, '') // Empty password for OAuth users
          .input('fullName', sql.NVarChar, defaultFullName)
          .input('provider', sql.VarChar, 'google')
          .input('emailVerified', sql.Bit, 1) // Gmail users are verified
          .query(`
            INSERT INTO Users (
              Username, Email, Password, FullName,
              Provider, EmailVerified, Role, Status, 
              AccountStatus, CreatedAt, UpdatedAt
            )
            OUTPUT INSERTED.*
            VALUES (
              @username, @email, @password, @fullName,
              @provider, @emailVerified, 'STUDENT', 'ONLINE',
              'ACTIVE', GETDATE(), GETDATE()
            )
          `);
          
        user = newUser.recordset[0];
      } else {
        user = result.recordset[0];
      }
    } else {
      // Regular login - search by username or email
      result = await pool.request()
        .input('identifier', sql.VarChar, username || email)
        .query(`
          SELECT * FROM Users 
          WHERE Username = @identifier OR Email = @identifier
        `);
        
      user = result.recordset[0];
  
      // Check if user exists
      if (!user) {
        console.log(`User not found: ${username || email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Tên đăng nhập/email hoặc mật khẩu không đúng' 
        });
      }
  
      console.log(`User found: ${user.Username}, checking password...`);
  
      // Compare password - For production, use bcrypt.compare instead
      const isMatch = await bcrypt.compare(password, user.Password);
      
      // If bcrypt comparison fails, try plain text comparison as fallback
      // This is for backward compatibility and should be removed in production
      const plainTextMatch = !isMatch && user.Password === password;
      
      if (!isMatch && !plainTextMatch) {
        console.log('Password does not match');
        return res.status(401).json({ 
          success: false,
          message: 'Tên đăng nhập/email hoặc mật khẩu không đúng' 
        });
      }
    }

    console.log('Authentication successful, generating token...');

    // Update last login time
    try {
      await pool.request()
        .input('userId', sql.BigInt, user.UserID)
        .input('lastLoginIP', sql.VarChar, req.ip || '0.0.0.0')
        .query(`
          UPDATE Users
          SET LastLoginAt = GETDATE(), LastLoginIP = @lastLoginIP, Status = 'ONLINE'
          WHERE UserID = @userId
        `);
        
      console.log(`Updated last login for user ${user.UserID}`);
    } catch (err) {
      console.error('Failed to update last login info:', err);
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        role: user.Role
      }
    };

    // Create and sign JWT token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) {
          console.error('Token generation error:', err);
          throw err;
        }
        
        // Generate refresh token (longer expiration)
        const refreshToken = jwt.sign(
          { 
            user: {
              id: user.UserID,
              role: user.Role,
              tokenType: 'refresh'
            }
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        
        // Return token and user data
        res.json({
          success: true,
          token,
          refreshToken,
          user: {
            id: user.UserID,
            UserID: user.UserID,
            Username: user.Username,
            FullName: user.FullName,
            Email: user.Email,
            PhoneNumber: user.PhoneNumber,
            Role: user.Role,
            Status: user.Status,
            Image: user.Image || user.Avatar,
            Bio: user.Bio,
            Provider: user.Provider
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({ valid: false });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const pool = await sqlConnection.connect();
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.user.id)
      .query(`
        SELECT * FROM Users
        WHERE UserID = @userId
      `);
    
    const user = result.recordset[0];
    
    if (!user) {
      return res.json({ valid: false });
    }
    
    // Return verification status and user data
    res.json({
      valid: true,
      user: {
        id: user.UserID,
        UserID: user.UserID,
        Username: user.Username,
        FullName: user.FullName,
        Email: user.Email,
        PhoneNumber: user.PhoneNumber,
        Role: user.Role,
        Status: user.Status,
        Image: user.Image || user.Avatar
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.json({ valid: false });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin' 
      });
    }

    // Check if username or email already exists
    const pool = await sqlConnection.connect();
    const checkResult = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT * FROM Users
        WHERE Username = @username OR Email = @email
      `);

    if (checkResult.recordset.length > 0) {
      const existingUser = checkResult.recordset[0];
      if (existingUser.Username === username) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã tồn tại'
        });
      }
      if (existingUser.Email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const insertResult = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('fullName', sql.NVarChar, fullName)
      .query(`
        INSERT INTO Users (
          Username, Email, Password, FullName, 
          Role, Status, AccountStatus, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.UserID
        VALUES (
          @username, @email, @password, @fullName,
          'STUDENT', 'OFFLINE', 'ACTIVE', GETDATE(), GETDATE()
        )
      `);

    const userId = insertResult.recordset[0].UserID;

    // Generate token for auto-login after registration
    const payload = {
      user: {
        id: userId,
        username,
        role: 'STUDENT'
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        
        // Include token in response for auto-login
        res.status(201).json({
          success: true,
          message: 'Đăng ký thành công',
          token,
          user: {
            id: userId,
            UserID: userId,
            Username: username,
            Email: email,
            FullName: fullName,
            Role: 'STUDENT'
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    // Get user ID from token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user.id;
        
        // Update user status to offline
        const pool = await sqlConnection.connect();
        await pool.request()
          .input('userId', sql.BigInt, userId)
          .query(`
            UPDATE Users
            SET Status = 'OFFLINE', LastLoginAt = GETDATE()
            WHERE UserID = @userId
          `);
      } catch (err) {
        console.error('Error updating user status on logout:', err);
      }
    }
    
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng xuất',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router; 