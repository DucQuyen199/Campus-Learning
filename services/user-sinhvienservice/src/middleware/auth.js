const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/app');

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }
  
  // Check if auth header has the right format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format. Use Bearer [token]'
    });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add user to request object
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: err.message
    });
  }
};

// Middleware to check user role
const authorize = (roles = []) => {
  // Convert single role to array
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Check if user role is included in allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Insufficient permissions.'
      });
    }
    
    // Authorization successful
    next();
  };
};

// Demo mode middleware
const demoMode = (req, res, next) => {
  req.demoMode = true;
  next();
};

module.exports = {
  authenticate,
  authorize,
  demoMode
}; 