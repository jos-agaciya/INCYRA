/**
 * INCYRA - Incident State Model
 * Represents the live intelligence state of an active technical incident.
 */

class IncidentState {
  constructor(incidentId = 'INC-' + Date.now().toString().slice(-6)) {
    this.incidentId = incidentId;
    this.title = 'Active Technical Incident';
    this.status = 'INVESTIGATING'; // INVESTIGATING | IDENTIFIED | MITIGATING | RESOLVED
    this.severity = 'SEV-1';
    this.startedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    
    // Core Intelligence Collections
    this.facts = [];          // Confirmed verified information
    this.hypotheses = [];     // Assumptions & points needing verification
    this.decisions = [];      // Agreed decisions and command orders
    this.actionItems = [];    // Assigned tasks with owner and status
    this.conflicts = [];      // Conflicting claims requiring human verification
    this.timeline = [];       // Chronological log of incident developments
    this.participants = new Map(); // Active speakers and their roles
    this.summary = 'Incident initiated. Monitoring incoming audio stream.';
  }

  touch() {
    this.updatedAt = new Date().toISOString();
  }

  recordParticipant(name, role = 'Participant') {
    if (!name) return;
    this.participants.set(name, {
      name,
      role,
      lastActive: new Date().toISOString(),
    });
    this.touch();
  }

  addFact(fact) {
    const item = {
      id: `fact-${this.facts.length + 1}`,
      text: fact.text,
      speaker: fact.speaker || 'Unknown',
      category: fact.category || 'General',
      confirmed: true,
      timestamp: fact.timestamp || new Date().toISOString(),
    };
    this.facts.push(item);
    this.touch();
    return item;
  }

  addHypothesis(hypothesis) {
    const item = {
      id: `hypo-${this.hypotheses.length + 1}`,
      text: hypothesis.text,
      speaker: hypothesis.speaker || 'Unknown',
      status: 'UNCONFIRMED', // UNCONFIRMED | VALIDATED | DISPROVED
      timestamp: hypothesis.timestamp || new Date().toISOString(),
    };
    this.hypotheses.push(item);
    this.touch();
    return item;
  }

  addDecision(decision) {
    const item = {
      id: `dec-${this.decisions.length + 1}`,
      text: decision.text,
      decider: decision.speaker || decision.decider || 'Team',
      status: 'EXECUTING',
      timestamp: decision.timestamp || new Date().toISOString(),
    };
    this.decisions.push(item);
    this.touch();
    return item;
  }

  addActionItem(action) {
    const item = {
      id: `action-${this.actionItems.length + 1}`,
      task: action.task || action.text,
      assignee: action.assignee || 'Unassigned',
      status: action.status || 'PENDING', // PENDING | IN_PROGRESS | COMPLETED
      priority: action.priority || 'HIGH',
      timestamp: action.timestamp || new Date().toISOString(),
    };
    this.actionItems.push(item);
    this.touch();
    return item;
  }

  addConflict(conflict) {
    const item = {
      id: `conflict-${this.conflicts.length + 1}`,
      topic: conflict.topic || 'Discrepancy',
      statementA: conflict.statementA,
      statementB: conflict.statementB,
      status: 'FLAGGED', // FLAGGED | RESOLVED
      detectedAt: new Date().toISOString(),
      recommendation: conflict.recommendation || 'Verify source data before acting.',
    };
    this.conflicts.push(item);
    this.touch();
    return item;
  }

  addTimelineEvent(event) {
    const item = {
      id: `evt-${this.timeline.length + 1}`,
      timestamp: event.timestamp || new Date().toISOString(),
      type: event.type || 'NOTE', // FACT | HYPOTHESIS | DECISION | ACTION | CONFLICT | NOTE
      speaker: event.speaker || 'System',
      content: event.content || event.text,
      metadata: event.metadata || {},
    };
    this.timeline.push(item);
    this.touch();
    return item;
  }

  setSummary(summaryText) {
    this.summary = summaryText;
    this.touch();
  }

  toJSON() {
    return {
      incidentId: this.incidentId,
      title: this.title,
      status: this.status,
      severity: this.severity,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      factsCount: this.facts.length,
      hypothesesCount: this.hypotheses.length,
      decisionsCount: this.decisions.length,
      actionItemsCount: this.actionItems.length,
      conflictsCount: this.conflicts.length,
      participants: Array.from(this.participants.values()),
      facts: this.facts,
      hypotheses: this.hypotheses,
      decisions: this.decisions,
      actionItems: this.actionItems,
      conflicts: this.conflicts,
      timeline: this.timeline,
      summary: this.summary,
    };
  }

  reset() {
    this.facts = [];
    this.hypotheses = [];
    this.decisions = [];
    this.actionItems = [];
    this.conflicts = [];
    this.timeline = [];
    this.participants.clear();
    this.summary = 'Incident state reset. Ready for live stream.';
    this.touch();
  }
}

module.exports = IncidentState;
