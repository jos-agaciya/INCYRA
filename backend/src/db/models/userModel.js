/**
 * INCYRA - User Data Access Model
 * Handles user creation, email lookups, and profile queries.
 */

const { getDatabase } = require('../index');

class UserModel {
  /**
   * Create a new user record
   */
  static create({ id, name, email, passwordHash, avatarUrl = null }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const userId = id || `u_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, name.trim(), email.trim().toLowerCase(), passwordHash, avatarUrl, now, now);

    return this.findById(userId);
  }

  /**
   * Find user by unique email (case-insensitive)
   */
  static findByEmail(email) {
    if (!email) return null;
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`);
    return stmt.get(email.trim());
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    if (!id) return null;
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
    return stmt.get(id);
  }

  /**
   * Strip sensitive fields from user object
   */
  static toSafeJSON(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return {
      id: safe.id,
      name: safe.name,
      email: safe.email,
      avatarUrl: safe.avatar_url,
      createdAt: safe.created_at,
      updatedAt: safe.updated_at,
    };
  }
}

module.exports = UserModel;
