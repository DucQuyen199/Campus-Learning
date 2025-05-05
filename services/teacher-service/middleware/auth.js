const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/database');
require('dotenv').config();

// Verify JWT and ensure user is a teacher
const verifyTeacher = (req, res, next) => {
  // Skip auth for the login route
  if (req.path === '/auth/login') {
    return next();
  }
  
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is a teacher
    poolPromise.then(pool => {
      pool.request()
        .input('userId', sql.BigInt, decoded.userId)
        .query(`
          SELECT UserID, Username, Email, FullName, Role, Status
          FROM Users
          WHERE UserID = @userId AND DeletedAt IS NULL AND Status = 'active'
        `)
        .then(result => {
          if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
          }
          
          const user = result.recordset[0];
          
          // Check if user is a teacher
          if (user.Role !== 'TEACHER') {
            return res.status(403).json({ message: 'Access denied. Not authorized as a teacher.' });
          }
          
          // Set user in request
          req.user = user;
          next();
        })
        .catch(err => {
          console.error('Database error in auth middleware:', err);
          res.status(500).json({ message: 'Server error during authentication.' });
        });
    }).catch(err => {
      console.error('Database connection error in auth middleware:', err);
      res.status(500).json({ message: 'Server error during authentication.' });
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

module.exports = {
  verifyTeacher
}; 