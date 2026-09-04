/**
 * INCYRA - Room Data Access Model
 * Manages incident rooms, shareable room codes, and persistent memberships.
 */

const { getDatabase } = require('../index');

class RoomModel {
  /**
   * Create a new incident room and associate creator as OWNER
   */
  static create({ id, title, description = '', severity = 'SEV-1', service = 'Under Investigation', ownerId }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanId = id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const roomCode = `inc-${Math.random().toString(36).substring(2, 8)}`;
    const agoraChannel = `agora-room-${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const createTx = db.transaction(() => {
      // 1. Insert room record
      const roomStmt = db.prepare(`
        INSERT INTO rooms (id, room_code, title, description, severity, status, service, owner_id, agora_channel, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Investigating', ?, ?, ?, ?, ?)
      `);
      roomStmt.run(cleanId, roomCode, title.trim(), (description || '').trim(), severity, service, ownerId, agoraChannel, now, now);

      // 2. Insert creator into room_members as OWNER / INCIDENT_COMMANDER
      const memberStmt = db.prepare(`
        INSERT INTO room_members (id, room_id, user_id, role, joined_at, last_active_at)
        VALUES (?, ?, ?, 'OWNER', ?, ?)
      `);
      memberStmt.run(`rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, cleanId, ownerId, now, now);

      return cleanId;
    });

    const roomId = createTx();
    return this.findById(roomId);
  }

  /**
   * Find room by ID
   */
  static findById(id) {
    if (!id) return null;
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * Find room by shareable code or ID
   */
  static findByCodeOrId(codeOrId) {
    if (!codeOrId) return null;
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.id = ? OR r.room_code = ?
    `);
    return stmt.get(codeOrId, codeOrId);
  }

  /**
   * List all rooms that a user owns or is a member of
   */
  static listUserRooms(userId) {
    if (!userId) return [];
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT DISTINCT r.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as member_count,
        (SELECT role FROM room_members WHERE room_id = r.id AND user_id = ?) as user_role
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      INNER JOIN room_members rm ON rm.room_id = r.id
      WHERE rm.user_id = ? OR r.owner_id = ?
      ORDER BY r.updated_at DESC
    `);
    return stmt.all(userId, userId, userId);
  }

  /**
   * Add or update member in room
   */
  static addMember({ roomId, userId, role = 'MEMBER' }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const memberId = `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const stmt = db.prepare(`
      INSERT INTO room_members (id, room_id, user_id, role, joined_at, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(room_id, user_id) DO UPDATE SET
        last_active_at = excluded.last_active_at,
        role = CASE WHEN room_members.role = 'OWNER' THEN 'OWNER' ELSE excluded.role END
    `);

    stmt.run(memberId, roomId, userId, role, now, now);
    return this.getMember(roomId, userId);
  }

  /**
   * Get member record
   */
  static getMember(roomId, userId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT rm.id, rm.room_id as roomId, rm.room_id, rm.user_id as userId, rm.user_id,
             rm.role, rm.joined_at as joinedAt, rm.joined_at, rm.last_active_at as lastActiveAt, rm.last_active_at,
             u.name, u.email, u.avatar_url
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ? AND rm.user_id = ?
    `);
    return stmt.get(roomId, userId);
  }

  /**
   * Get all active members for a room
   */
  static getRoomMembers(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT rm.id, rm.room_id as roomId, rm.room_id, rm.user_id as userId, rm.user_id,
             rm.role, rm.joined_at as joinedAt, rm.joined_at, rm.last_active_at as lastActiveAt, rm.last_active_at,
             u.name, u.email, u.avatar_url
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
      ORDER BY CASE rm.role WHEN 'OWNER' THEN 1 WHEN 'INCIDENT_COMMANDER' THEN 2 ELSE 3 END, rm.joined_at ASC
    `);
    return stmt.all(roomId);
  }


  /**
   * Check if user is a member of room
   */
  static isMember(roomId, userId) {
    if (!roomId || !userId) return false;
    const db = getDatabase();
    const stmt = db.prepare(`SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ?`);
    return Boolean(stmt.get(roomId, userId));
  }

  /**
   * Update room metadata
   */
  static update(id, updates = {}) {
    const db = getDatabase();
    const current = this.findById(id);
    if (!current) return null;

    const title = updates.title || current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const severity = updates.severity || current.severity;
    const status = updates.status || current.status;
    const service = updates.service || current.service;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE rooms
      SET title = ?, description = ?, severity = ?, status = ?, service = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(title, description, severity, status, service, now, id);
    return this.findById(id);
  }
}

module.exports = RoomModel;
