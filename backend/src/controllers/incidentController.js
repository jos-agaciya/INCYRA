/**
 * INCYRA - Incident Controller
 * Handles transcript ingestion, state retrieval, and dynamic Action Item & Decision CRUD operations.
 */
const { AIIncidentEngine, defaultEngine } = require('../../../ai-engine');

// Room / session engines map for true multi-room isolation
const roomEngines = new Map();

function getEngineForReq(req) {
  const incidentId = req.body?.incidentId || req.body?.roomId || req.query?.incidentId || req.query?.roomId || req.params?.incidentId;
  if (!incidentId || incidentId === 'default' || incidentId === 'INC-8921') {
    return defaultEngine;
  }
  if (!roomEngines.has(incidentId)) {
    roomEngines.set(incidentId, new AIIncidentEngine(incidentId));
  }
  return roomEngines.get(incidentId);
}

/**
 * Handle incoming transcript payload
 * POST /api/incident/transcript
 */
async function handleTranscript(req, res) {
  const { speaker, text, timestamp } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "text" field in transcript payload.',
    });
  }

  const engine = getEngineForReq(req);
  const result = await engine.processTranscript({
    speaker: speaker || 'You (Incident Commander)',
    text: text.trim(),
    timestamp: timestamp || new Date().toISOString().substring(11, 16),
  });

  return res.status(200).json({
    success: true,
    ...result,
    data: result.state,
  });
}

/**
 * Get the full incident intelligence state
 * GET /api/incident/state
 */
function getIncidentState(req, res) {
  const engine = getEngineForReq(req);
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
 * GET /api/incident/actions
 */
function getActionItems(req, res) {
  const engine = getEngineForReq(req);
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
 * Create an Action Item manually or via API
 * POST /api/incident/actions
 */
function createActionItem(req, res) {
  const { title, description, priority, assignee, status, sourceSpeaker } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "title" for action item.',
    });
  }

  const engine = getEngineForReq(req);
  const item = engine.addActionItem({
    title: title.trim(),
    description: description ? description.trim() : `Manual task: ${title.trim()}`,
    priority: priority || 'HIGH',
    assignee: assignee || null,
    status: status || 'OPEN',
    sourceSpeaker: sourceSpeaker || 'Incident Commander',
  });

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
 * PATCH /api/incident/actions/:id
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

  const engine = getEngineForReq(req);
  const updated = engine.updateActionItem(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Action item with ID "${id}" not found.`,
    });
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
 * DELETE /api/incident/actions/:id
 */
function deleteActionItem(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Action item ID is required.',
    });
  }

  const engine = getEngineForReq(req);
  const deleted = engine.deleteActionItem(id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Action item with ID "${id}" not found.`,
    });
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
 * GET /api/incident/decisions
 */
function getDecisions(req, res) {
  const engine = getEngineForReq(req);
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
 * POST /api/incident/decisions
 */
function createDecision(req, res) {
  const { title, description, rationale, status, decidedBy } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "title" for decision.',
    });
  }

  const engine = getEngineForReq(req);
  const item = engine.addDecision({
    title: title.trim(),
    description: description ? description.trim() : (rationale || 'Operational recovery decision.'),
    rationale: rationale || description || 'Operational recovery decision.',
    status: status || 'CONFIRMED',
    decidedBy: decidedBy || 'Incident Commander',
  });

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
 * PATCH /api/incident/decisions/:id
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

  const engine = getEngineForReq(req);
  const updated = engine.updateDecision(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Decision with ID "${id}" not found.`,
    });
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
 * DELETE /api/incident/decisions/:id
 */
function deleteDecision(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Decision ID is required.',
    });
  }

  const engine = getEngineForReq(req);
  const deleted = engine.deleteDecision(id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: `Decision with ID "${id}" not found.`,
    });
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
 * POST /api/incident/reset
 */
function resetIncidentState(req, res) {
  const engine = getEngineForReq(req);
  console.log(`[STATE] Resetting incident intelligence state`);
  const state = engine.reset();
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
