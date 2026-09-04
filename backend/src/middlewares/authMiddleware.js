/**
 * INCYRA - Authentication Middleware
 * Enforces JWT token verification and attaches safe user profile to request.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../db/models/userModel');

/**
 * Required authentication middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required. Please log in.',
    });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token. Please log in again.',
      });
    }

    const user = UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or deactivated.',
      });
    }

    req.user = UserModel.toSafeJSON(user);
    next();
  });
}

/**
 * Optional authentication middleware (allows anonymous requests but attaches user if token provided)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (!err && decoded) {
      const user = UserModel.findById(decoded.id);
      req.user = user ? UserModel.toSafeJSON(user) : null;
    } else {
      req.user = null;
    }
    next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
};
