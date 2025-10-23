const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');

// Middleware for optional authentication
// Attaches user to req.user if token is present and valid
// Otherwise continues without user (req.user = null)
const optionalAuth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as anonymous user
      req.user = null;
      return next();
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // Token valid but user not found - continue as anonymous
        req.user = null;
        return next();
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (jwtError) {
      // Token invalid or expired - continue as anonymous
      req.user = null;
      next();
    }
  } catch (error) {
    // Any other error - continue as anonymous
    req.user = null;
    next();
  }
};

module.exports = { optionalAuth };
