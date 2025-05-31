const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/database');

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  // Skip auth for login routes
  if (req.path === '/api/auth/login' || req.path === '/api/auth/refresh') {
    return next();
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const pool = await poolPromise;
    
    // Check if user exists and has admin role
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId || decoded.UserID)
      .query('SELECT * FROM Users WHERE UserID = @userId AND Role = \'ADMIN\' AND AccountStatus = \'ACTIVE\'');
    
    if (result.recordset.length === 0) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Add user info to request
    req.user = result.recordset[0];
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Refresh token handler middleware
const refreshTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_key'
    );
    
    // Check if it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Verify user exists and is active
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query('SELECT * FROM Users WHERE UserID = @userId AND AccountStatus = \'ACTIVE\'');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Generate new token pair
    const user = result.recordset[0];
    const token = jwt.sign(
      { userId: user.UserID, role: user.Role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: user.UserID, role: user.Role, tokenType: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
      { expiresIn: '30d' }
    );
    
    // Return new tokens
    return res.status(200).json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to authenticate user token with better error handling
const authenticateToken = async (req, res, next) => {
  try {
    // Skip for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    } catch (jwtError) {
      // Handle different JWT errors more specifically
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Token expired. Please refresh token.',
          code: 'TOKEN_EXPIRED' 
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    const pool = await poolPromise;
    
    // Check if user exists
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId || decoded.UserID)
      .query('SELECT * FROM Users WHERE UserID = @userId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user account is active
    if (result.recordset[0].AccountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is not active.' });
    }

    // Add user info to request
    req.user = result.recordset[0];
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.UserID) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT * FROM Users 
        WHERE UserID = @userId 
        AND Role = 'ADMIN' 
        AND AccountStatus = 'ACTIVE'
      `);

    if (!result.recordset[0]) {
      return res.status(403).json({ message: 'Requires admin privileges' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).json({ message: 'Error checking admin privileges' });
  }
};

// CORS middleware
const enableCORS = (req, res, next) => {
  const allowedOrigins = ['http://localhost:5005', 'http://127.0.0.1:5005'];
  
  // Check if the request origin is allowed
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = {
  verifyAdmin,
  authenticateToken,
  isAdmin,
  enableCORS,
  refreshTokenHandler
}; 