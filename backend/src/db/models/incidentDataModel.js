/**
 * INCYRA - Incident Data Model
 * Persistent CRUD for room-scoped intelligence (Facts, Hypotheses, Conflicts, Actions, Decisions, Risks, Timeline).
 */

const { getDatabase } = require('../index');

class IncidentDataModel {
  // -------------------------------------------------------------------------
  // FACTS
  // -------------------------------------------------------------------------
  static saveFact(roomId, fact) {
    const db = getDatabase();
    const id = fact.id || `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = fact.createdAt || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO facts (id, room_id, text, speaker, speaker_id, source, category, confidence, verified, confirmed, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        text = excluded.text,
        confidence = excluded.confidence
    `);

    stmt.run(
      id,
      roomId,
      fact.text,
      fact.speaker || 'Unknown',
      fact.speakerId || null,
      fact.source || 'Voice Ingress',
      fact.category || 'General',
      fact.confidence || 95,
      fact.verified ? 1 : 0,
      fact.confirmed ? 1 : 0,
      fact.timestamp || new Date().toISOString().substring(11, 16),
      now
    );

    return { ...fact, id, roomId, createdAt: now };
  }

  static getFacts(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM facts WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      text: row.text,
      speaker: row.speaker,
      speakerId: row.speaker_id,
      source: row.source,
      category: row.category,
      confidence: row.confidence,
      verified: Boolean(row.verified),
      confirmed: Boolean(row.confirmed),
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  }

  // -------------------------------------------------------------------------
  // HYPOTHESES
  // -------------------------------------------------------------------------
  static saveHypothesis(roomId, hypothesis) {
    const db = getDatabase();
    const id = hypothesis.id || `h-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = hypothesis.createdAt || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO hypotheses (id, room_id, text, speaker, proposed_by, proposed_by_id, status, note, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        note = excluded.note
    `);

    stmt.run(
      id,
      roomId,
      hypothesis.text,
      hypothesis.speaker || 'Unknown',
      hypothesis.proposedBy || hypothesis.speaker || 'Participant',
      hypothesis.proposedById || null,
      hypothesis.status || 'UNCONFIRMED',
      hypothesis.note || 'Pending empirical verification',
      hypothesis.timestamp || new Date().toISOString().substring(11, 16),
      now
    );

    return { ...hypothesis, id, roomId, createdAt: now };
  }

  static getHypotheses(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM hypotheses WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      text: row.text,
      speaker: row.speaker,
      proposedBy: row.proposed_by,
      proposedById: row.proposed_by_id,
      status: row.status,
      note: row.note,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  }

  // -------------------------------------------------------------------------
  // CONFLICTS
  // -------------------------------------------------------------------------
  static saveConflict(roomId, conflict) {
    const db = getDatabase();
    const id = conflict.id || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = conflict.detectedAt || conflict.createdAt || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO conflicts (id, room_id, title, topic, status, resolved, statement_a, statement_b, source_a, source_b, recommendation, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        resolved = excluded.resolved,
        status = excluded.status
    `);

    stmt.run(
      id,
      roomId,
      conflict.title || 'TELEMETRY DISCREPANCY',
      conflict.topic || 'Discrepancy',
      conflict.status || 'HUMAN VERIFICATION REQUIRED',
      conflict.resolved ? 1 : 0,
      JSON.stringify(conflict.statementA || {}),
      JSON.stringify(conflict.statementB || {}),
      JSON.stringify(conflict.sourceA || {}),
      JSON.stringify(conflict.sourceB || {}),
      conflict.recommendation || 'Verify telemetry before proceeding.',
      conflict.timestamp || new Date().toISOString().substring(11, 16),
      now
    );

    return { ...conflict, id, roomId, createdAt: now };
  }

  static getConflicts(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM conflicts WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      title: row.title,
      topic: row.topic,
      status: row.status,
      resolved: Boolean(row.resolved),
      statementA: row.statement_a ? JSON.parse(row.statement_a) : null,
      statementB: row.statement_b ? JSON.parse(row.statement_b) : null,
      sourceA: row.source_a ? JSON.parse(row.source_a) : null,
      sourceB: row.source_b ? JSON.parse(row.source_b) : null,
      recommendation: row.recommendation,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  }

  // -------------------------------------------------------------------------
  // ACTION ITEMS
  // -------------------------------------------------------------------------
  static saveActionItem(roomId, action) {
    const db = getDatabase();
    const id = action.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = action.createdAt || new Date().toISOString();
    const updatedAt = action.updatedAt || now;

    const stmt = db.prepare(`
      INSERT INTO action_items (id, room_id, title, description, assignee, assignee_id, assignment_status, unassigned_target, source_speaker, source_speaker_id, status, priority, source_transcript, confidence, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        assignee = excluded.assignee,
        assignee_id = excluded.assignee_id,
        assignment_status = excluded.assignment_status,
        status = excluded.status,
        priority = excluded.priority,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      id,
      roomId,
      (action.title || action.task || 'Action Item').trim(),
      action.description || `Task: ${action.title}`,
      action.assignee || null,
      action.assigneeId || null,
      action.assignmentStatus || (action.assignee ? 'ASSIGNED' : 'UNASSIGNED'),
      action.unassignedTarget || null,
      action.sourceSpeaker || action.speaker || 'Incident Room',
      action.sourceSpeakerId || null,
      action.status || 'OPEN',
      action.priority || 'HIGH',
      action.sourceTranscript || action.title || '',
      action.confidence || 0.9,
      action.timestamp || new Date().toISOString().substring(11, 16),
      now,
      updatedAt
    );

    return { ...action, id, roomId, createdAt: now, updatedAt };
  }

  static updateActionItem(id, updates = {}) {
    const db = getDatabase();
    const currentStmt = db.prepare(`SELECT * FROM action_items WHERE id = ?`);
    const current = currentStmt.get(id);
    if (!current) return null;

    const title = updates.title || current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const assignee = updates.assignee !== undefined ? updates.assignee : current.assignee;
    const assigneeId = updates.assigneeId !== undefined ? updates.assigneeId : current.assignee_id;
    const assignmentStatus = updates.assignmentStatus || (assignee ? 'ASSIGNED' : 'UNASSIGNED');
    const status = updates.status || current.status;
    const priority = updates.priority || current.priority;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE action_items
      SET title = ?, description = ?, assignee = ?, assignee_id = ?, assignment_status = ?, status = ?, priority = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(title, description, assignee, assigneeId, assignmentStatus, status, priority, now, id);

    return this.getActionItemById(id);
  }

  static getActionItemById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM action_items WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return this._mapActionRow(row);
  }

  static deleteActionItem(id) {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM action_items WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  }

  static getActionItems(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM action_items WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map(this._mapActionRow);
  }

  static _mapActionRow(row) {
    return {
      id: row.id,
      roomId: row.room_id,
      title: row.title,
      task: row.title,
      description: row.description,
      assignee: row.assignee,
      owner: row.assignee || 'Unassigned',
      assigneeId: row.assignee_id,
      assignmentStatus: row.assignment_status,
      unassignedTarget: row.unassigned_target,
      sourceSpeaker: row.source_speaker,
      sourceSpeakerId: row.source_speaker_id,
      status: row.status,
      priority: row.priority,
      sourceTranscript: row.source_transcript,
      confidence: row.confidence,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // -------------------------------------------------------------------------
  // DECISIONS
  // -------------------------------------------------------------------------
  static saveDecision(roomId, decision) {
    const db = getDatabase();
    const id = decision.id || `d-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = decision.createdAt || new Date().toISOString();
    const updatedAt = decision.updatedAt || now;

    const stmt = db.prepare(`
      INSERT INTO decisions (id, room_id, title, description, rationale, status, decided_by, decided_by_id, source_speaker, source_transcript, confidence, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        rationale = excluded.rationale,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      id,
      roomId,
      (decision.title || decision.decision || decision.text || 'Decision').trim(),
      decision.description || decision.rationale || 'Decision recorded.',
      decision.rationale || decision.description || 'Agreed operational recovery action.',
      decision.status || 'CONFIRMED',
      decision.decidedBy || decision.madeBy || decision.speaker || 'Incident Commander',
      decision.decidedById || null,
      decision.sourceSpeaker || decision.decidedBy || 'Incident Commander',
      decision.sourceTranscript || decision.text || '',
      decision.confidence || 0.92,
      decision.timestamp || new Date().toISOString().substring(11, 16),
      now,
      updatedAt
    );

    return { ...decision, id, roomId, createdAt: now, updatedAt };
  }

  static updateDecision(id, updates = {}) {
    const db = getDatabase();
    const currentStmt = db.prepare(`SELECT * FROM decisions WHERE id = ?`);
    const current = currentStmt.get(id);
    if (!current) return null;

    const title = updates.title || current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const rationale = updates.rationale !== undefined ? updates.rationale : current.rationale;
    const status = updates.status || current.status;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE decisions
      SET title = ?, description = ?, rationale = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(title, description, rationale, status, now, id);

    return this.getDecisionById(id);
  }

  static getDecisionById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM decisions WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return this._mapDecisionRow(row);
  }

  static deleteDecision(id) {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM decisions WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  }

  static getDecisions(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM decisions WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map(this._mapDecisionRow);
  }

  static _mapDecisionRow(row) {
    return {
      id: row.id,
      roomId: row.room_id,
      title: row.title,
      decision: row.title,
      text: row.title,
      description: row.description,
      rationale: row.rationale,
      status: row.status,
      decidedBy: row.decided_by,
      madeBy: row.decided_by,
      decidedById: row.decided_by_id,
      sourceSpeaker: row.source_speaker,
      sourceTranscript: row.source_transcript,
      confidence: row.confidence,
      timestamp: row.timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // -------------------------------------------------------------------------
  // RISKS
  // -------------------------------------------------------------------------
  static saveRisk(roomId, risk) {
    const db = getDatabase();
    const id = risk.id || `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = risk.createdAt || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO risks (id, room_id, risk, severity, status, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        severity = excluded.severity
    `);

    stmt.run(
      id,
      roomId,
      risk.risk || risk.text,
      risk.severity || 'HIGH',
      risk.status || 'ACTIVE',
      risk.timestamp || new Date().toISOString().substring(11, 16),
      now
    );

    return { ...risk, id, roomId, createdAt: now };
  }

  static getRisks(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM risks WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      risk: row.risk,
      severity: row.severity,
      status: row.status,
      timestamp: row.timestamp,
      createdAt: row.created_at,
    }));
  }

  // -------------------------------------------------------------------------
  // TIMELINE EVENTS
  // -------------------------------------------------------------------------
  static saveTimelineEvent(roomId, event) {
    const db = getDatabase();
    const id = event.id || `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = event.createdAt || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO timeline_events (id, room_id, time, timestamp, type, tag, title, description, content, author, speaker, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      roomId,
      event.time || new Date().toISOString().substring(11, 16),
      event.timestamp || now,
      (event.type || 'NOTE').toLowerCase(),
      event.tag || 'NOTE',
      event.title || 'Event Logged',
      event.description || event.content || '',
      event.content || event.description || '',
      event.author || event.speaker || 'Incident Room',
      event.speaker || event.author || 'Incident Room',
      JSON.stringify(event.metadata || {}),
      now
    );

    return { ...event, id, roomId, createdAt: now };
  }

  static getTimelineEvents(roomId) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM timeline_events WHERE room_id = ? ORDER BY created_at DESC`);
    return stmt.all(roomId).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      time: row.time,
      timestamp: row.timestamp,
      type: row.type,
      tag: row.tag,
      title: row.title,
      description: row.description,
      content: row.content,
      author: row.author,
      speaker: row.speaker,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
    }));
  }

  // -------------------------------------------------------------------------
  // RESET / CLEAR ROOM DATA
  // -------------------------------------------------------------------------
  static clearRoomIncidentData(roomId) {
    const db = getDatabase();
    const deleteTx = db.transaction(() => {
      db.prepare(`DELETE FROM facts WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM hypotheses WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM conflicts WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM action_items WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM decisions WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM risks WHERE room_id = ?`).run(roomId);
      db.prepare(`DELETE FROM timeline_events WHERE room_id = ?`).run(roomId);
    });
    deleteTx();
    return true;
  }
}

module.exports = IncidentDataModel;
