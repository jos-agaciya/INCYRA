/**
 * INCYRA - Incident State Model
 * Represents the live intelligence state of an active technical incident.
 * Conforms to both the AI processing engine and the incident command center dashboard.
 */

class IncidentState {
  constructor(incidentId = 'INC-8921') {
    this.incidentId = incidentId;
    this.title = 'Active Incident';
    this.service = 'Under Investigation';
    this.status = 'Investigating'; // Investigating | Identified | Mitigating | Resolved
    this.severity = 'SEV-1';
    this.commander = 'Incident Commander';
    this.declaredAt = new Date().toISOString().substring(11, 16) + ' UTC';
    this.startedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.elapsedSeconds = 0;
    this.version = 1;

    // Core Intelligence Collections (Genuinely Empty at Start)
    this.facts = [];          // Confirmed verified telemetry / logs
    this.hypotheses = [];     // Unconfirmed theories / speculations
    this.decisions = [];      // Agreed decisions and command orders
    this.actionItems = [];    // Assigned tasks with owner, status, priority
    this.conflicts = [];      // Conflicting claims requiring human verification
    this.risks = [];          // Active or monitored risks
    this.timeline = [];       // Chronological log of incident developments
    this.participants = new Map(); // Active participants Map<string, Object>
    this.proposedCriticalAction = null;

    // Dynamic Context Extracted from Live Speech
    this.context = {
      affectedSystems: [],    // e.g. ['Database', 'Server']
      symptoms: [],           // e.g. ['not responding', 'crash']
      errorTypes: [],         // e.g. ['502', '500']
      infrastructure: [],     // e.g. ['postgres', 'redis']
    };

    // Default Briefing and AI Observation
    this.summary = 'INCYRA initialized. Monitoring live incident voice channel.';
    this.aiObservation = {
      title: 'Live Incident Intelligence',
      observation: 'INCYRA online. Monitoring live voice channel for telemetry, hypotheses, action items, and decisions.',
      confidence: '95%',
      lastUpdated: 'Just now',
      listening: true,
    };
  }

  touch() {
    this.updatedAt = new Date().toISOString();
    this.version += 1;
  }

  recordParticipant(name, role = 'Incident Responder', isAI = false) {
    if (!name) return;
    const existing = this.participants.get(name);
    this.participants.set(name, {
      id: existing?.id || `p-${this.participants.size + 1}`,
      name,
      role: isAI ? 'AI Incident Commander' : (existing?.role || role),
      initials: isAI ? 'AI' : name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U',
      isSpeaking: false,
      isActive: true,
      isAI: Boolean(isAI),
      audioLevel: 0,
      lastActive: new Date().toISOString(),
    });
    this.touch();
  }

  /**
   * Look up if a name matches any active registered participant
   * @param {string} name
   * @returns {Object|null}
   */
  findParticipant(name) {
    if (!name || typeof name !== 'string') return null;
    const clean = name.trim().toLowerCase();
    for (const [pName, pObj] of this.participants.entries()) {
      if (pName.toLowerCase() === clean || pName.toLowerCase().includes(clean) || clean.includes(pName.toLowerCase())) {
        return pObj;
      }
    }
    return null;
  }

  /**
   * Dynamically extract incident context from real speech
   * @param {string} text
   */
  extractDynamicContext(text) {
    if (!text || typeof text !== 'string') return;
    const lower = text.toLowerCase();

    // 1. Detect affected systems / services
    const systemPatterns = [
      { name: 'Database Engine', keywords: ['database', 'db server', 'postgres', 'postgresql', 'mysql', 'mongodb', 'aurora', 'rds', 'sqlite'] },
      { name: 'Payment Gateway', keywords: ['payment gateway', 'stripe', 'paypal', 'payment api', 'billing service', 'checkout service'] },
      { name: 'Mobile Application', keywords: ['mobile app', 'ios app', 'android app', 'ios client', 'mobile client', 'react native'] },
      { name: 'Authentication Service', keywords: ['auth service', 'authentication', 'oauth', 'sso', 'login service', 'identity provider'] },
      { name: 'API Ingress / Gateway', keywords: ['api gateway', 'ingress', 'load balancer', 'nginx', 'traefik', 'alb', 'envoy', 'api server', 'api'] },
      { name: 'Cache Layer', keywords: ['redis', 'memcached', 'cache cluster', 'cache pool'] },
      { name: 'Search Engine', keywords: ['elasticsearch', 'opensearch', 'search cluster', 'solr'] },
      { name: 'Message Broker', keywords: ['kafka', 'rabbitmq', 'sqs', 'event queue'] },
      { name: 'Storage / CDN', keywords: ['s3', 'storage bucket', 'cdn', 'cloudfront', 'blob storage'] },
    ];

    for (const sys of systemPatterns) {
      if (sys.keywords.some((kw) => lower.includes(kw))) {
        if (!this.context.affectedSystems.includes(sys.name)) {
          this.context.affectedSystems.push(sys.name);
        }
        // If current service is default, elevate to detected service
        if (this.service === 'Under Investigation' || this.service === 'General Ingress') {
          this.service = sys.name;
        }
        // If current title is default, elevate to detected title
        if (this.title === 'Active Incident' || this.title === 'Incident Under Investigation') {
          this.title = `${sys.name} Incident`;
        }
      }
    }

    // 2. Detect symptoms & error types
    const symptomKeywords = [
      'not responding', 'down', 'crash', 'crashes', 'crashed', 'timeout', 'timed out',
      'unreachable', 'unavailable', 'latency spike', 'slow response', 'memory leak',
      'cpu spike', 'high cpu', 'disk full', 'connection refused', 'corrupted', 'hung', 'stuck',
      '502', '500', '503', '504', '404', '401', '403', 'bad gateway', 'internal server error'
    ];

    for (const sym of symptomKeywords) {
      if (lower.includes(sym) && !this.context.symptoms.includes(sym)) {
        this.context.symptoms.push(sym);
      }
    }
  }

  addFact(fact) {
    const timeStr = new Date().toISOString().substring(11, 16);
    this.extractDynamicContext(fact.text);
    const item = {
      id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: fact.text,
      source: fact.source || (fact.speaker ? `${fact.speaker} (Voice)` : 'Telemetry Ingress'),
      speaker: fact.speaker || 'Unknown',
      category: fact.category || 'General',
      timestamp: fact.timestamp || timeStr,
      confidence: fact.confidence || 95,
      verified: true,
      confirmed: true,
      createdAt: new Date().toISOString(),
    };
    this.facts.unshift(item); // Latest first for dashboard
    this.touch();
    return item;
  }

  addHypothesis(hypothesis) {
    const timeStr = new Date().toISOString().substring(11, 16);
    this.extractDynamicContext(hypothesis.text);
    const item = {
      id: `h-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: hypothesis.text,
      speaker: hypothesis.speaker || 'Unknown',
      proposedBy: hypothesis.speaker || hypothesis.proposedBy || 'Participant',
      status: 'UNCONFIRMED', // UNCONFIRMED | VALIDATED | DISPROVED
      timestamp: hypothesis.timestamp || timeStr,
      note: hypothesis.note || 'Pending empirical verification',
      createdAt: new Date().toISOString(),
    };
    this.hypotheses.unshift(item);
    this.touch();
    return item;
  }

  /**
   * Add a Decision (PROPOSED, CONFIRMED, REJECTED, REVERSED)
   * @param {Object} decision
   */
  addDecision(decision) {
    const timeStr = new Date().toISOString().substring(11, 16);
    const title = (decision.title || decision.decision || decision.text || 'Operational Decision').trim();
    const status = decision.status || 'CONFIRMED';
    const decider = decision.decidedBy || decision.madeBy || decision.speaker || 'Incident Commander';

    const item = {
      id: decision.id || `d-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      decision: title, // backwards compat
      text: title, // backwards compat
      description: decision.description || decision.rationale || `Decided by ${decider}.`,
      rationale: decision.rationale || decision.description || 'Agreed operational recovery action.',
      status, // PROPOSED | CONFIRMED | REJECTED | REVERSED
      decidedBy: decider,
      madeBy: decider,
      decidedById: decision.decidedById || null,
      sourceSpeaker: decision.sourceSpeaker || decider,
      sourceTranscript: decision.sourceTranscript || decision.text || '',
      confidence: decision.confidence || 0.92,
      incidentId: this.incidentId,
      timestamp: decision.timestamp || timeStr,
      createdAt: decision.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.decisions.unshift(item);
    this.touch();

    // Append decision to timeline
    let decTitle = `Decision ${status}: ${title}`;
    if (status === 'CONFIRMED') decTitle = `Decision Confirmed: ${title}`;
    else if (status === 'PROPOSED') decTitle = `Decision Proposed: ${title}`;
    else if (status === 'REJECTED') decTitle = `Decision Rejected: ${title}`;

    this.addTimelineEvent({
      time: timeStr,
      type: 'DECISION',
      tag: 'DECISION',
      title: decTitle,
      description: `${item.description} (Decided by ${decider})`,
      author: decider,
      speaker: decider,
      metadata: { decisionId: item.id, status },
    });

    return item;
  }

  /**
   * Update an existing decision
   * @param {string} id
   * @param {Object} updates
   */
  updateDecision(id, updates = {}) {
    const idx = this.decisions.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    const current = this.decisions[idx];
    const prevStatus = current.status;
    const nextStatus = updates.status || current.status;

    const updated = {
      ...current,
      ...updates,
      title: updates.title || current.title,
      decision: updates.title || current.title,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    this.decisions[idx] = updated;
    this.touch();

    // Log timeline event for status transition
    if (prevStatus !== nextStatus) {
      const timeStr = new Date().toISOString().substring(11, 16);
      let transTitle = `Decision ${nextStatus}: ${updated.title}`;
      if (nextStatus === 'CONFIRMED') transTitle = `Decision Confirmed: ${updated.title}`;
      else if (nextStatus === 'REJECTED') transTitle = `Decision Rejected: ${updated.title}`;
      else if (nextStatus === 'REVERSED') transTitle = `Decision Reversed: ${updated.title}`;

      this.addTimelineEvent({
        time: timeStr,
        type: 'DECISION',
        tag: 'DECISION',
        title: transTitle,
        description: `Decision "${updated.title}" transitioned from ${prevStatus} to ${nextStatus}.`,
        author: updates.decidedBy || current.decidedBy || 'Incident Commander',
        metadata: { decisionId: updated.id, prevStatus, nextStatus },
      });
    }

    return updated;
  }

  /**
   * Delete / remove a decision
   * @param {string} id
   */
  deleteDecision(id) {
    const idx = this.decisions.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const removed = this.decisions[idx];
    this.decisions.splice(idx, 1);
    this.touch();

    const timeStr = new Date().toISOString().substring(11, 16);
    this.addTimelineEvent({
      time: timeStr,
      type: 'NOTE',
      tag: 'DECISION',
      title: `Decision Removed`,
      description: `Decision "${removed.title}" was removed from the incident record.`,
      author: 'Incident Commander',
    });

    return true;
  }

  /**
   * Add an Action Item
   * @param {Object} action
   */
  addActionItem(action) {
    const timeStr = new Date().toISOString().substring(11, 16);
    const title = (action.title || action.task || action.text || 'Action Item').trim();
    const speaker = action.sourceSpeaker || action.speaker || 'Incident Room';
    const rawAssignee = action.assignee || action.owner || null;

    // Check if assignee matches a real registered participant
    let realAssignee = null;
    let assigneeId = action.assigneeId || null;
    let assignmentStatus = 'UNASSIGNED';

    if (rawAssignee && rawAssignee !== 'Unassigned') {
      const match = this.findParticipant(rawAssignee);
      if (match) {
        realAssignee = match.name;
        assigneeId = match.id;
        assignmentStatus = 'ASSIGNED';
      } else {
        // Person mentioned is NOT currently in the room
        realAssignee = null;
        assigneeId = null;
        assignmentStatus = 'UNASSIGNED';
      }
    }

    const item = {
      id: action.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      task: title, // backwards compat
      description: action.description || `Task generated from live speech: "${action.sourceTranscript || title}"`,
      assignee: realAssignee,
      owner: realAssignee || 'Unassigned', // backwards compat
      assigneeId,
      assignmentStatus, // ASSIGNED | UNASSIGNED
      unassignedTarget: rawAssignee && !realAssignee ? rawAssignee : null,
      sourceSpeaker: speaker,
      sourceSpeakerId: action.sourceSpeakerId || null,
      status: action.status || 'OPEN', // OPEN | IN_PROGRESS | BLOCKED | COMPLETED | CANCELLED
      priority: action.priority || 'HIGH', // CRITICAL | HIGH | MEDIUM | LOW
      sourceTranscript: action.sourceTranscript || action.text || title,
      confidence: action.confidence || 0.9,
      incidentId: this.incidentId,
      timestamp: action.timestamp || timeStr,
      createdAt: action.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.actionItems.unshift(item);
    this.touch();

    // Log timeline event for action creation
    this.addTimelineEvent({
      time: timeStr,
      type: 'ACTION',
      tag: 'ACTION',
      title: `Action Created: ${title} (${item.priority})`,
      description: `${item.description}${realAssignee ? ` — Assigned to ${realAssignee}` : ' — (Unassigned, requires team pickup)'}`,
      author: speaker,
      speaker,
      metadata: { actionId: item.id, priority: item.priority, assignmentStatus },
    });

    return item;
  }

  /**
   * Update an existing action item
   * @param {string} id
   * @param {Object} updates
   */
  updateActionItem(id, updates = {}) {
    const idx = this.actionItems.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = this.actionItems[idx];
    const prevStatus = current.status;
    const prevAssignee = current.assignee;

    let nextAssignee = current.assignee;
    let nextAssigneeId = current.assigneeId;
    let nextAssignmentStatus = current.assignmentStatus;

    if (updates.assignee !== undefined) {
      if (!updates.assignee || updates.assignee === 'Unassigned') {
        nextAssignee = null;
        nextAssigneeId = null;
        nextAssignmentStatus = 'UNASSIGNED';
      } else {
        const match = this.findParticipant(updates.assignee);
        if (match) {
          nextAssignee = match.name;
          nextAssigneeId = match.id;
          nextAssignmentStatus = 'ASSIGNED';
        } else {
          nextAssignee = updates.assignee;
          nextAssignmentStatus = 'ASSIGNED';
        }
      }
    }

    const updated = {
      ...current,
      ...updates,
      title: updates.title || current.title,
      task: updates.title || current.title,
      assignee: nextAssignee,
      owner: nextAssignee || 'Unassigned',
      assigneeId: nextAssigneeId,
      assignmentStatus: nextAssignmentStatus,
      status: updates.status || current.status,
      priority: updates.priority || current.priority,
      updatedAt: new Date().toISOString(),
    };

    this.actionItems[idx] = updated;
    this.touch();

    const timeStr = new Date().toISOString().substring(11, 16);

    // Timeline event if status changed
    if (prevStatus !== updated.status) {
      let statusTitle = `Action Status: ${updated.title} (${updated.status})`;
      if (updated.status === 'COMPLETED') {
        statusTitle = `Action Completed: ${updated.title}`;
      } else if (updated.status === 'BLOCKED') {
        statusTitle = `Action Blocked: ${updated.title}`;
      } else if (updated.status === 'IN_PROGRESS') {
        statusTitle = `Action In Progress: ${updated.title}`;
      }

      this.addTimelineEvent({
        time: timeStr,
        type: 'ACTION',
        tag: 'ACTION',
        title: statusTitle,
        description: `Task status updated from ${prevStatus} to ${updated.status}.${updated.assignee ? ` Assigned: ${updated.assignee}` : ''}`,
        author: 'Incident Responder',
        metadata: { actionId: updated.id, prevStatus, nextStatus: updated.status },
      });
    }

    // Timeline event if assignee changed
    if (prevAssignee !== updated.assignee && updated.assignee) {
      this.addTimelineEvent({
        time: timeStr,
        type: 'ACTION',
        tag: 'ACTION',
        title: `Action Assigned: ${updated.title}`,
        description: `Task assigned to ${updated.assignee}.`,
        author: 'Incident Commander',
        metadata: { actionId: updated.id, assignee: updated.assignee },
      });
    }

    return updated;
  }

  /**
   * Delete / cancel an action item
   * @param {string} id
   */
  deleteActionItem(id) {
    const idx = this.actionItems.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    const removed = this.actionItems[idx];
    this.actionItems.splice(idx, 1);
    this.touch();

    const timeStr = new Date().toISOString().substring(11, 16);
    this.addTimelineEvent({
      time: timeStr,
      type: 'NOTE',
      tag: 'ACTION',
      title: `Action Removed`,
      description: `Action item "${removed.title}" was removed from the incident board.`,
      author: 'Incident Commander',
    });

    return true;
  }

  addConflict(conflict) {
    const timeStr = new Date().toISOString().substring(11, 16);
    const item = {
      id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: (conflict.topic || 'TELEMETRY DISCREPANCY').toUpperCase(),
      topic: conflict.topic || 'Discrepancy',
      status: 'HUMAN VERIFICATION REQUIRED',
      resolved: false,
      timestamp: conflict.timestamp || timeStr,
      sourceA: {
        speaker: conflict.statementA?.speaker || 'Participant A',
        role: conflict.statementA?.role || 'Engineer',
        claim: conflict.statementA?.text || conflict.statementA?.claim || 'Statement A',
      },
      sourceB: {
        speaker: conflict.statementB?.speaker || 'Participant B',
        role: conflict.statementB?.role || 'Engineer',
        claim: conflict.statementB?.text || conflict.statementB?.claim || 'Statement B',
      },
      recommendation: conflict.recommendation || 'Verify source telemetry before taking disruptive actions.',
      detectedAt: new Date().toISOString(),
    };
    this.conflicts.unshift(item);
    this.touch();
    return item;
  }

  addRisk(risk) {
    const timeStr = new Date().toISOString().substring(11, 16);
    const item = {
      id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      risk: risk.risk || risk.text,
      severity: risk.severity || 'HIGH',
      status: risk.status || 'ACTIVE',
      timestamp: risk.timestamp || timeStr,
      createdAt: new Date().toISOString(),
    };
    this.risks.unshift(item);
    this.touch();
    return item;
  }

  addTimelineEvent(event) {
    const timeStr = new Date().toISOString().substring(11, 16);
    const eventType = (event.type || 'NOTE').toLowerCase();
    
    let tag = 'NOTE';
    if (eventType === 'fact') tag = 'FACT';
    else if (eventType === 'hypothesis') tag = 'HYPOTHESIS';
    else if (eventType === 'decision') tag = 'DECISION';
    else if (eventType === 'action') tag = 'ACTION';
    else if (eventType === 'conflict') tag = 'CONFLICT';
    else if (eventType === 'declaration') tag = 'INCIDENT';

    const item = {
      id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: event.time || timeStr,
      timestamp: event.timestamp || new Date().toISOString(),
      type: eventType,
      tag: event.tag || tag,
      title: event.title || `${tag} Logged`,
      description: event.description || event.content || event.text || '',
      content: event.content || event.description || event.text || '',
      author: event.author || event.speaker || 'Incident Room',
      speaker: event.speaker || event.author || 'Incident Room',
      metadata: event.metadata || {},
    };
    this.timeline.unshift(item); // Latest first for dashboard timeline
    this.touch();
    return item;
  }

  setSummary(summaryText) {
    this.summary = summaryText;
    const timeStr = new Date().toISOString().substring(11, 16) + ' UTC';
    
    const activeConflicts = this.conflicts.filter(c => !c.resolved);
    if (activeConflicts.length > 0) {
      this.aiObservation = {
        title: 'Live Incident Intelligence',
        observation: `Alert: ${activeConflicts[0].title}. ${activeConflicts[0].recommendation || 'Human verification required before proceeding.'}`,
        confidence: '97%',
        lastUpdated: 'Just now',
        listening: true,
      };
    } else {
      this.aiObservation = {
        title: 'Live Incident Intelligence',
        observation: summaryText,
        confidence: '95%',
        lastUpdated: 'Just now',
        listening: true,
      };
    }

    this.touch();
  }

  setProposedCriticalAction(action) {
    this.proposedCriticalAction = action;
    this.touch();
  }

  get actions() {
    return this.actionItems;
  }

  getActionItems() {
    return this.actionItems;
  }

  getDecisions() {
    return this.decisions;
  }

  get metrics() {
    const participantsList = Array.from(this.participants.values());
    const openActionsCount = this.actionItems.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS' || a.status === 'BLOCKED').length;
    const completedActionsCount = this.actionItems.filter(a => a.status === 'COMPLETED').length;
    const activeConflictsCount = this.conflicts.filter(c => !c.resolved).length;
    const confirmedDecisionsCount = this.decisions.filter(d => d.status === 'CONFIRMED').length;

    return {
      status: this.status,
      severity: this.severity,
      participants: Math.max(participantsList.length, 1),
      openActions: openActionsCount,
      completedActions: completedActionsCount,
      conflicts: activeConflictsCount,
      confirmedDecisions: confirmedDecisionsCount,
      totalDecisions: this.decisions.length,
      unresolvedRisks: this.risks.filter(r => r.status !== 'RESOLVED').length,
    };
  }

  toJSON() {
    const timeStr = new Date().toISOString().substring(11, 16) + ' UTC';
    const participantsList = Array.from(this.participants.values());
    const openActionsCount = this.actionItems.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS' || a.status === 'BLOCKED').length;
    const completedActionsCount = this.actionItems.filter(a => a.status === 'COMPLETED').length;
    const activeConflictsCount = this.conflicts.filter(c => !c.resolved).length;
    const confirmedDecisionsCount = this.decisions.filter(d => d.status === 'CONFIRMED').length;

    return {
      incidentId: this.incidentId,
      incident: {
        id: this.incidentId,
        title: this.title,
        service: this.service,
        status: this.status,
        severity: this.severity,
        declaredAt: this.declaredAt,
        elapsedSeconds: this.elapsedSeconds,
        commander: this.commander,
      },
      metrics: {
        status: this.status,
        severity: this.severity,
        participants: Math.max(participantsList.length, 1),
        openActions: openActionsCount,
        completedActions: completedActionsCount,
        conflicts: activeConflictsCount,
        confirmedDecisions: confirmedDecisionsCount,
        totalDecisions: this.decisions.length,
        unresolvedRisks: this.risks.filter(r => r.status !== 'RESOLVED').length,
      },
      briefing: {
        summary: this.summary,
        lastUpdated: timeStr,
        version: `v${this.version}`,
      },
      aiObservation: this.aiObservation,
      factsCount: this.facts.length,
      hypothesesCount: this.hypotheses.length,
      decisionsCount: this.decisions.length,
      actionItemsCount: this.actionItems.length,
      conflictsCount: activeConflictsCount,
      participants: participantsList,
      facts: this.facts,
      hypotheses: this.hypotheses,
      decisions: this.decisions,
      actions: this.actionItems,       // Primary for frontend
      actionItems: this.actionItems,   // Backwards compat for tests
      conflicts: this.conflicts,
      risks: this.risks,
      timeline: this.timeline,
      summary: this.summary,
      proposedCriticalAction: this.proposedCriticalAction,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  reset() {
    this.title = 'Active Incident';
    this.service = 'Under Investigation';
    this.status = 'Investigating';
    this.severity = 'SEV-1';
    this.facts = [];
    this.hypotheses = [];
    this.decisions = [];
    this.actionItems = [];
    this.conflicts = [];
    this.risks = [];
    this.timeline = [];
    this.participants.clear();
    this.context = {
      affectedSystems: [],
      symptoms: [],
      errorTypes: [],
      infrastructure: [],
    };
    this.proposedCriticalAction = null;
    this.version = 1;
    this.startedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.summary = 'Incident state reset. Ready for live audio stream.';
    this.aiObservation = {
      title: 'Live Incident Intelligence',
      observation: 'Incident session initialized. Awaiting participant speech.',
      confidence: '95%',
      lastUpdated: 'Just now',
      listening: true,
    };
    this.touch();
  }
}

module.exports = IncidentState;
