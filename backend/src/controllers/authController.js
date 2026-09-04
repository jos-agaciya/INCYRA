/**
 * INCYRA - Authentication Controller
 * Handles user registration, login with bcrypt password verification, and profile retrieval.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../db/models/userModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required (minimum 2 characters).',
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // 2. Check for duplicate email
    const existing = UserModel.findByEmail(email.trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create user in SQLite
    const user = UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    const safeUser = UserModel.toSafeJSON(user);

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, name: safeUser.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[AUTH] Registration error:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again.',
    });
  }
}

/**
 * Log in an existing user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // 1. Look up user by email
    const user = UserModel.findByEmail(email.trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // 2. Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const safeUser = UserModel.toSafeJSON(user);

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, name: safeUser.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
function me(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  me,
};
