/**
 * INCYRA - Incident Controller
 * Handles transcript ingestion, state retrieval, and dynamic Action Item & Decision CRUD operations
 * backed by persistent SQLite storage and isolated per incident room.
 */

const { AIIncidentEngine, defaultEngine } = require('../../../ai-engine');
const IncidentDataModel = require('../db/models/incidentDataModel');
const RoomModel = require('../db/models/roomModel');

// Room / session engines map for true multi-room isolation
const roomEngines = new Map();

function getRoomIdFromReq(req) {
  return (
    req.params?.roomId ||
    req.body?.roomId ||
    req.body?.incidentId ||
    req.query?.roomId ||
    req.query?.incidentId ||
    'INC-8921'
  );
}

function getEngineForRoomId(roomId) {
  const cleanId = roomId || 'INC-8921';
  if (!roomEngines.has(cleanId)) {
    const engine = cleanId === 'INC-8921' || cleanId === 'default' ? defaultEngine : new AIIncidentEngine(cleanId);

    // Hydrate state from DB if room exists
    try {
      const room = RoomModel.findByCodeOrId(cleanId);
      if (room) {
        engine.state.title = room.title;
        engine.state.severity = room.severity;
        engine.state.service = room.service;
        engine.state.status = room.status;

        const facts = IncidentDataModel.getFacts(room.id);
        const hypotheses = IncidentDataModel.getHypotheses(room.id);
        const conflicts = IncidentDataModel.getConflicts(room.id);
        const actions = IncidentDataModel.getActionItems(room.id);
        const decisions = IncidentDataModel.getDecisions(room.id);
        const risks = IncidentDataModel.getRisks(room.id);
        const timeline = IncidentDataModel.getTimelineEvents(room.id);

        if (facts.length > 0) engine.state.facts = facts;
        if (hypotheses.length > 0) engine.state.hypotheses = hypotheses;
        if (conflicts.length > 0) engine.state.conflicts = conflicts;
        if (actions.length > 0) engine.state.actionItems = actions;
        if (decisions.length > 0) engine.state.decisions = decisions;
        if (risks.length > 0) engine.state.risks = risks;
        if (timeline.length > 0) engine.state.timeline = timeline;

        const members = RoomModel.getRoomMembers(room.id);
        members.forEach((m) => {
          engine.state.recordParticipant(m.name, m.role === 'OWNER' ? 'Incident Commander' : 'Incident Responder');
        });
      }
    } catch (err) {
      console.warn('[INCIDENT] Hydration warning for room:', cleanId, err.message);
    }

    roomEngines.set(cleanId, engine);
  }
  return roomEngines.get(cleanId);
}

/**
 * Handle incoming transcript payload
 * POST /api/incident/transcript or POST /api/rooms/:roomId/transcript
 */
async function handleTranscript(req, res) {
  const { speaker, text, timestamp } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "text" field in transcript payload.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const speakerName = speaker || (req.user ? req.user.name : 'You (Incident Commander)');

  const result = await engine.processTranscript({
    speaker: speakerName,
    text: text.trim(),
    timestamp: timestamp || new Date().toISOString().substring(11, 16),
  });

  // Persist created entities to SQLite if valid room
  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      const pItem = result.processedItem;
      const cat = pItem?.classification?.category;

      if (cat === 'FACT' && engine.state.facts.length > 0) {
        IncidentDataModel.saveFact(room.id, engine.state.facts[0]);
      } else if (cat === 'HYPOTHESIS' && engine.state.hypotheses.length > 0) {
        IncidentDataModel.saveHypothesis(room.id, engine.state.hypotheses[0]);
      } else if (cat === 'ACTION_ITEM' && engine.state.actionItems.length > 0) {
        IncidentDataModel.saveActionItem(room.id, engine.state.actionItems[0]);
      } else if (cat === 'DECISION' && engine.state.decisions.length > 0) {
        IncidentDataModel.saveDecision(room.id, engine.state.decisions[0]);
      }

      if (pItem?.conflict) {
        IncidentDataModel.saveConflict(room.id, pItem.conflict);
      }

      if (engine.state.timeline.length > 0) {
        IncidentDataModel.saveTimelineEvent(room.id, engine.state.timeline[0]);
      }

      // Update room metadata in DB if title or service elevated dynamically
      RoomModel.update(room.id, {
        title: engine.state.title,
        service: engine.state.service,
        status: engine.state.status,
      });
    }
  } catch (dbErr) {
    console.warn('[INCIDENT] DB persistence warning:', dbErr.message);
  }

  return res.status(200).json({
    success: true,
    ...result,
    data: result.state,
  });
}

/**
 * Get the full incident intelligence state
 * GET /api/incident/state or GET /api/rooms/:roomId/state
 */
function getIncidentState(req, res) {
  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const state = engine.getIncidentState();

  return res.status(200).json({
    success: true,
    data: state,
    incident: state.incident,
    metrics: state.metrics,
    facts: state.facts,
    hypotheses: state.hypotheses,
    conflicts: state.conflicts,
    actions: state.actions,
    decisions: state.decisions,
    risks: state.risks,
    timeline: state.timeline,
    briefing: state.briefing,
    aiObservation: state.aiObservation,
    participants: state.participants,
  });
}

/**
 * Get Action Items
 * GET /api/incident/actions or GET /api/rooms/:roomId/actions
 */
function getActionItems(req, res) {
  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const state = engine.getIncidentState();
  const actions = state.actions || [];
  const openCount = actions.filter((a) => a.status === 'OPEN').length;
  const inProgressCount = actions.filter((a) => a.status === 'IN_PROGRESS').length;
  const blockedCount = actions.filter((a) => a.status === 'BLOCKED').length;
  const completedCount = actions.filter((a) => a.status === 'COMPLETED').length;

  return res.status(200).json({
    success: true,
    data: actions,
    actions,
    counts: {
      total: actions.length,
      open: openCount,
      inProgress: inProgressCount,
      blocked: blockedCount,
      completed: completedCount,
    },
    metrics: state.metrics,
  });
}

/**
 * Create an Action Item
 * POST /api/incident/actions or POST /api/rooms/:roomId/actions
 */
function createActionItem(req, res) {
  const { title, description, priority, assignee, status, sourceSpeaker } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "title" for action item.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const speakerName = sourceSpeaker || (req.user ? req.user.name : 'Incident Commander');

  const item = engine.addActionItem({
    title: title.trim(),
    description: description ? description.trim() : `Manual task: ${title.trim()}`,
    priority: priority || 'HIGH',
    assignee: assignee || null,
    status: status || 'OPEN',
    sourceSpeaker: speakerName,
  });

  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      IncidentDataModel.saveActionItem(room.id, item);
      if (engine.state.timeline.length > 0) {
        IncidentDataModel.saveTimelineEvent(room.id, engine.state.timeline[0]);
      }
    }
  } catch (e) {
    console.warn('[INCIDENT] DB action save warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(201).json({
    success: true,
    message: 'Action item created successfully.',
    data: item,
    action: item,
    state,
  });
}

/**
 * Update an Action Item
 * PATCH /api/incident/actions/:id or PATCH /api/rooms/:roomId/actions/:id
 */
function updateActionItem(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Action item ID is required.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const updated = engine.updateActionItem(id, updates);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Action item with ID "${id}" not found.`,
    });
  }

  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      IncidentDataModel.updateActionItem(id, updates);
      if (engine.state.timeline.length > 0) {
        IncidentDataModel.saveTimelineEvent(room.id, engine.state.timeline[0]);
      }
    }
  } catch (e) {
    console.warn('[INCIDENT] DB action update warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(200).json({
    success: true,
    message: 'Action item updated successfully.',
    data: updated,
    action: updated,
    state,
  });
}

/**
 * Delete an Action Item
 * DELETE /api/incident/actions/:id or DELETE /api/rooms/:roomId/actions/:id
 */
function deleteActionItem(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Action item ID is required.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const deleted = engine.deleteActionItem(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Action item with ID "${id}" not found.`,
    });
  }

  try {
    IncidentDataModel.deleteActionItem(id);
  } catch (e) {
    console.warn('[INCIDENT] DB action delete warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(200).json({
    success: true,
    message: 'Action item removed successfully.',
    state,
  });
}

/**
 * Get Decisions
 * GET /api/incident/decisions or GET /api/rooms/:roomId/decisions
 */
function getDecisions(req, res) {
  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const state = engine.getIncidentState();
  const decisions = state.decisions || [];
  const proposedCount = decisions.filter((d) => d.status === 'PROPOSED').length;
  const confirmedCount = decisions.filter((d) => d.status === 'CONFIRMED').length;
  const rejectedCount = decisions.filter((d) => d.status === 'REJECTED').length;
  const reversedCount = decisions.filter((d) => d.status === 'REVERSED').length;

  return res.status(200).json({
    success: true,
    data: decisions,
    decisions,
    counts: {
      total: decisions.length,
      proposed: proposedCount,
      confirmed: confirmedCount,
      rejected: rejectedCount,
      reversed: reversedCount,
    },
    metrics: state.metrics,
  });
}

/**
 * Create a Decision
 * POST /api/incident/decisions or POST /api/rooms/:roomId/decisions
 */
function createDecision(req, res) {
  const { title, description, rationale, status, decidedBy } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "title" for decision.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const decider = decidedBy || (req.user ? req.user.name : 'Incident Commander');

  const item = engine.addDecision({
    title: title.trim(),
    description: description ? description.trim() : (rationale || 'Operational recovery decision.'),
    rationale: rationale || description || 'Operational recovery decision.',
    status: status || 'CONFIRMED',
    decidedBy: decider,
  });

  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      IncidentDataModel.saveDecision(room.id, item);
      if (engine.state.timeline.length > 0) {
        IncidentDataModel.saveTimelineEvent(room.id, engine.state.timeline[0]);
      }
    }
  } catch (e) {
    console.warn('[INCIDENT] DB decision save warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(201).json({
    success: true,
    message: 'Decision recorded successfully.',
    data: item,
    decision: item,
    state,
  });
}

/**
 * Update a Decision
 * PATCH /api/incident/decisions/:id or PATCH /api/rooms/:roomId/decisions/:id
 */
function updateDecision(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Decision ID is required.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const updated = engine.updateDecision(id, updates);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Decision with ID "${id}" not found.`,
    });
  }

  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      IncidentDataModel.updateDecision(id, updates);
      if (engine.state.timeline.length > 0) {
        IncidentDataModel.saveTimelineEvent(room.id, engine.state.timeline[0]);
      }
    }
  } catch (e) {
    console.warn('[INCIDENT] DB decision update warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(200).json({
    success: true,
    message: 'Decision updated successfully.',
    data: updated,
    decision: updated,
    state,
  });
}

/**
 * Delete a Decision
 * DELETE /api/incident/decisions/:id or DELETE /api/rooms/:roomId/decisions/:id
 */
function deleteDecision(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Decision ID is required.',
    });
  }

  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  const deleted = engine.deleteDecision(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Decision with ID "${id}" not found.`,
    });
  }

  try {
    IncidentDataModel.deleteDecision(id);
  } catch (e) {
    console.warn('[INCIDENT] DB decision delete warning:', e.message);
  }

  const state = engine.getIncidentState();

  return res.status(200).json({
    success: true,
    message: 'Decision removed successfully.',
    state,
  });
}

/**
 * Reset the incident state for new session or incident
 * POST /api/incident/reset or POST /api/rooms/:roomId/reset
 */
function resetIncidentState(req, res) {
  const roomId = getRoomIdFromReq(req);
  const engine = getEngineForRoomId(roomId);
  console.log(`[STATE] Resetting incident intelligence state for room:`, roomId);
  const state = engine.reset();

  try {
    const room = RoomModel.findByCodeOrId(roomId);
    if (room) {
      IncidentDataModel.clearRoomIncidentData(room.id);
    }
  } catch (e) {
    console.warn('[INCIDENT] DB reset warning:', e.message);
  }

  return res.status(200).json({
    success: true,
    message: 'Incident intelligence state has been reset.',
    data: state,
    incident: state.incident,
    metrics: state.metrics,
    facts: state.facts,
    hypotheses: state.hypotheses,
    conflicts: state.conflicts,
    actions: state.actions,
    decisions: state.decisions,
    risks: state.risks,
    timeline: state.timeline,
    briefing: state.briefing,
    aiObservation: state.aiObservation,
  });
}

module.exports = {
  handleTranscript,
  getIncidentState,
  getActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  getDecisions,
  createDecision,
  updateDecision,
  deleteDecision,
  resetIncidentState,
};
