/**
 * INCYRA - SQLite Database Engine
 * Persistent storage using better-sqlite3 with WAL mode and foreign key constraints.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function getDatabasePath() {
  if (process.env.NODE_ENV === 'test' && process.env.INCYRA_TEST_DB === ':memory:') {
    return ':memory:';
  }
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return process.env.DB_PATH || path.join(dataDir, 'incyra.db');
}

function initDatabase(customPath = null) {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();
  const db = new Database(dbPath);

  // Enable performance & integrity pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Incident Rooms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      severity TEXT DEFAULT 'SEV-1',
      status TEXT DEFAULT 'Investigating',
      service TEXT DEFAULT 'Under Investigation',
      owner_id TEXT NOT NULL,
      agora_channel TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Room Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_members (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER', -- OWNER | INCIDENT_COMMANDER | MEMBER
      joined_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      UNIQUE(room_id, user_id),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Confirmed Facts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS facts (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      text TEXT NOT NULL,
      speaker TEXT NOT NULL,
      speaker_id TEXT,
      source TEXT,
      category TEXT DEFAULT 'General',
      confidence REAL DEFAULT 95,
      verified INTEGER DEFAULT 1,
      confirmed INTEGER DEFAULT 1,
      timestamp TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 5. Hypotheses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hypotheses (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      text TEXT NOT NULL,
      speaker TEXT,
      proposed_by TEXT,
      proposed_by_id TEXT,
      status TEXT DEFAULT 'UNCONFIRMED', -- UNCONFIRMED | VALIDATED | DISPROVED
      note TEXT,
      timestamp TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 6. Conflicts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conflicts (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      title TEXT NOT NULL,
      topic TEXT,
      status TEXT DEFAULT 'HUMAN VERIFICATION REQUIRED',
      resolved INTEGER DEFAULT 0,
      statement_a TEXT,
      statement_b TEXT,
      source_a TEXT,
      source_b TEXT,
      recommendation TEXT,
      timestamp TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 7. Action Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      assignee_id TEXT,
      assignment_status TEXT DEFAULT 'UNASSIGNED',
      unassigned_target TEXT,
      source_speaker TEXT,
      source_speaker_id TEXT,
      status TEXT DEFAULT 'OPEN', -- OPEN | IN_PROGRESS | BLOCKED | COMPLETED | CANCELLED
      priority TEXT DEFAULT 'HIGH', -- CRITICAL | HIGH | MEDIUM | LOW
      source_transcript TEXT,
      confidence REAL DEFAULT 0.9,
      timestamp TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 8. Decisions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      rationale TEXT,
      status TEXT DEFAULT 'CONFIRMED', -- PROPOSED | CONFIRMED | REJECTED | REVERSED
      decided_by TEXT,
      decided_by_id TEXT,
      source_speaker TEXT,
      source_transcript TEXT,
      confidence REAL DEFAULT 0.92,
      timestamp TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 9. Risks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      risk TEXT NOT NULL,
      severity TEXT DEFAULT 'HIGH',
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE | MONITORING | RESOLVED
      timestamp TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // 10. Timeline Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      time TEXT,
      timestamp TEXT,
      type TEXT NOT NULL,
      tag TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      author TEXT,
      speaker TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for fast room lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);
    CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
    CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_facts_room ON facts(room_id);
    CREATE INDEX IF NOT EXISTS idx_hypotheses_room ON hypotheses(room_id);
    CREATE INDEX IF NOT EXISTS idx_conflicts_room ON conflicts(room_id);
    CREATE INDEX IF NOT EXISTS idx_actions_room ON action_items(room_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_room ON decisions(room_id);
    CREATE INDEX IF NOT EXISTS idx_risks_room ON risks(room_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_room ON timeline_events(room_id);
  `);

  dbInstance = db;
  return dbInstance;
}

function getDatabase() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
};
