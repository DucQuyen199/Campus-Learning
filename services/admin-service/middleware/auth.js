const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/database');

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  // Skip auth for login routes
  if (req.path === '/api/auth/login') {
    return next();
  }

  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const pool = await poolPromise;
    
    // Check if user exists and has admin role
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId || decoded.UserID)
      .query('SELECT * FROM Users WHERE UserID = @userId AND Role = \'ADMIN\'');
    
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

// Middleware to authenticate user token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
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
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token' });
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
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5005';
  
  // Check if the request origin is allowed
  const origin = req.headers.origin;
  if (origin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
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
  enableCORS
}; 