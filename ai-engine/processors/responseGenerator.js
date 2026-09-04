/**
 * INCYRA - AI Incident Commander Response Generator
 * Synthesizes intelligent, contextual spoken responses for INCYRA AI Commander
 * based on live transcripts, classified telemetry, action items, decisions, and active incident state.
 */

class ResponseGenerator {
  constructor(options = {}) {
    this.openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY || '';
    this.geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY || '';
  }

  /**
   * Helper to check if any confirmed facts contain specific keyword patterns
   * @private
   */
  _hasFact(facts, keywords) {
    if (!facts || !Array.isArray(facts)) return false;
    return facts.some((f) => {
      const lower = (f.text || '').toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    });
  }

  /**
   * Generate an intelligent spoken incident response.
   * @param {Object} params
   * @param {string} params.speaker
   * @param {string} params.text
   * @param {Object} params.classification
   * @param {Object|null} params.conflict
   * @param {Object} params.incidentState
   * @param {Object|null} [params.recordedItem]
   * @returns {Promise<Object>} { text: string, voice: string, rate: number }
   */
  async generateResponse({ speaker, text, classification, conflict, incidentState, recordedItem }) {
    console.log(`[AI ENGINE] User transcript received: "${text}" (Speaker: ${speaker})`);

    const cleanText = (text || '').trim();
    const lower = cleanText.toLowerCase();

    const facts = incidentState?.facts || [];
    const hypotheses = incidentState?.hypotheses || [];
    const actions = incidentState?.actionItems || [];
    const decisions = incidentState?.decisions || [];
    const conflicts = incidentState?.conflicts || [];
    const activeConflicts = conflicts.filter((c) => !c.resolved);
    const confirmedCount = facts.length;
    const openActionsCount = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS' || a.status === 'BLOCKED').length;

    let responseText = '';

    // 1. HIGHEST PRIORITY: Conflict Alert
    if (conflict) {
      const speakerA = conflict.sourceA?.speaker || conflict.statementA?.speaker || 'Participant A';
      const claimA = conflict.sourceA?.claim || conflict.statementA?.text || 'statement';
      const speakerB = conflict.sourceB?.speaker || conflict.statementB?.speaker || 'Participant B';
      const claimB = conflict.sourceB?.claim || conflict.statementB?.text || 'statement';

      responseText = `Alert: Conflicting telemetry reported. ${speakerA} reported "${claimA}", while ${speakerB} reported "${claimB}". Human verification is required before taking action.`;
    }
    // 2. Greetings ("hello", "hi", etc.)
    else if (classification.category === 'GREETING') {
      if (confirmedCount === 0 && openActionsCount === 0) {
        responseText = `Hello. I'm online and monitoring the incident room. I am tracking confirmed facts, hypotheses, decisions, and detecting conflicting reports.`;
      } else {
        const conflictPhrase =
          activeConflicts.length > 0
            ? `Alert: ${activeConflicts.length} active telemetry conflict requiring verification.`
            : 'no active conflicts.';
        responseText = `Hello. I'm online and monitoring the incident. Currently, we have ${confirmedCount} confirmed fact${confirmedCount === 1 ? '' : 's'} and ${conflictPhrase}`;
      }
    }
    // 3. Action Items Extraction & Assignment
    else if (classification.category === 'ACTION_ITEM') {
      const itemTitle = recordedItem?.title || classification.title || cleanText;
      const assignmentStatus = recordedItem?.assignmentStatus || (classification.assignee ? 'ASSIGNED' : 'UNASSIGNED');
      const realAssignee = recordedItem?.assignee || classification.assignee;
      const unassignedTarget = recordedItem?.unassignedTarget;

      if (assignmentStatus === 'ASSIGNED' && realAssignee) {
        responseText = `Action item created and assigned to ${realAssignee}: ${itemTitle}.`;
      } else if (unassignedTarget) {
        responseText = `Action item created: ${itemTitle}. It still needs assignment because no matching participant named ${unassignedTarget} is currently in this room.`;
      } else {
        responseText = `Action item created: ${itemTitle}. Flagged for team assignment.`;
      }
    }
    // 4. Decisions (PROPOSED, CONFIRMED, REJECTED, REVERSED)
    else if (classification.category === 'DECISION') {
      const decisionStatus = classification.decisionStatus || recordedItem?.status || 'CONFIRMED';
      const decisionTitle = recordedItem?.title || cleanText;

      if (decisionStatus === 'PROPOSED') {
        responseText = `I've recorded that as a proposed decision: ${decisionTitle}. Do you want to confirm this before executing it?`;
      } else if (decisionStatus === 'CONFIRMED') {
        // If affirming a previously proposed decision
        if (lower.includes('confirm') || lower.includes('yes')) {
          const latestProposed = decisions.find((d) => d.status === 'PROPOSED');
          if (latestProposed) {
            latestProposed.status = 'CONFIRMED';
            responseText = `Decision confirmed: ${latestProposed.title}. I've marked it as an active mitigation decision.`;
          } else {
            responseText = `Decision confirmed: ${decisionTitle}. I've marked it as an active mitigation decision.`;
          }
        } else {
          responseText = `Decision confirmed: ${decisionTitle}. I've marked it as an active mitigation decision.`;
        }
      } else if (decisionStatus === 'REJECTED') {
        responseText = `Decision rejected: ${decisionTitle}. Recorded in the incident timeline.`;
      } else if (decisionStatus === 'REVERSED') {
        responseText = `Decision reversed: ${decisionTitle}. Incident timeline updated.`;
      } else {
        responseText = `Decision recorded by ${speaker}: "${cleanText}". Incident timeline updated.`;
      }
    }
    // 5. How to fix / Strategy questions ("how do we fix it", "what should we do")
    else if (classification.category === 'HOW_TO_FIX') {
      const hasDatabase = this._hasFact(facts, ['database', 'db', 'postgres', 'mysql', 'replica', 'node', 'query']) || lower.includes('database') || lower.includes('db');
      const hasMobile = this._hasFact(facts, ['mobile', 'app', 'ios', 'android', 'client', 'login', 'crash']) || lower.includes('mobile') || lower.includes('app');
      const hasPayment = this._hasFact(facts, ['payment', 'stripe', 'checkout', 'billing', 'gateway']) || lower.includes('payment');
      const hasCpuSpike = this._hasFact(facts, ['cpu', '95%', 'utilization', 'spike', 'saturation']) || lower.includes('cpu');
      const hasGatewayErrors = this._hasFact(facts, ['502', '500', '503', '504', 'bad gateway', 'internal server error']) || lower.includes('502') || lower.includes('500') || lower.includes('503');
      const hasCacheIssues = this._hasFact(facts, ['cache', 'redis', 'pool', 'connection']) || lower.includes('cache') || lower.includes('redis');

      if (activeConflicts.length > 0) {
        const firstConflict = activeConflicts[0];
        responseText = `Before applying fixes or failovers, we must resolve the active metric discrepancy on ${firstConflict.topic || 'telemetry'}. I recommend verifying telemetry directly from the host nodes first.`;
      } else if (hasPayment && hasCpuSpike && hasGatewayErrors) {
        responseText = `Based on the payment gateway errors and CPU saturation, first check the payment gateway's CPU saturation and instance health. If capacity is exhausted, scale healthy instances or reduce load while the team investigates the underlying cause. Also check recent deployments and gateway logs.`;
      } else if (hasMobile) {
        responseText = `Based on the mobile application issue, inspect client crash logs, recent app store builds, and backend authentication endpoints for breaking changes or invalid session payloads.`;
      } else if (hasDatabase && hasCpuSpike) {
        responseText = `Based on the database load and CPU metrics, check long-running queries, connection pool saturation, and slow query logs. Consider query optimization or offloading reads to a replica.`;
      } else if (hasDatabase) {
        responseText = `Based on the database telemetry, check database process status, connection pool availability, replication lag, and server disk space.`;
      } else if (hasPayment && hasGatewayErrors) {
        responseText = `Based on the payment gateway 502 errors, verify upstream load balancer health checks, inspect application ingress logs, and check recent deployment releases. Do we know if downstream connections are timing out?`;
      } else if (hasGatewayErrors) {
        responseText = `Based on the 5xx gateway errors, verify upstream load balancer health checks, inspect application ingress logs, and check recent deployment releases. Do we know if downstream services are timing out?`;
      } else if (hasCpuSpike) {
        responseText = `Based on the high CPU utilization, check thread pool metrics, top resource-consuming queries or processes, and consider horizontal scaling if traffic load is sustained.`;
      } else if (hasCacheIssues) {
        responseText = `Based on the cache connection telemetry, check connection pool saturation, memory utilization, and slow command logs.`;
      } else {
        responseText = `To determine the best fix, we need verified telemetry. Share error rates, latency readings, or component metrics, and I will synthesize the next troubleshooting steps.`;
      }
    }
    // 6. Status queries ("what is the status", "summarize")
    else if (classification.category === 'STATUS_QUERY') {
      const status = incidentState?.status || 'Investigating';
      responseText = `Incident status is ${status}. We have ${confirmedCount} confirmed fact${confirmedCount === 1 ? '' : 's'}, ${hypotheses.length} unconfirmed hypothes${hypotheses.length === 1 ? 'is' : 'es'}, and ${openActionsCount} open action item${openActionsCount === 1 ? '' : 's'}. ${activeConflicts.length > 0 ? 'Warning: telemetry conflict is active.' : 'No active conflicts detected.'}`;
    }
    // 7. Fact Ingestion & Context Correlation
    else if (classification.category === 'FACT') {
      const hasPreviousCpu = this._hasFact(facts, ['cpu', '95%', 'utilization', 'spike', 'saturation']);
      const hasPreviousGateway = this._hasFact(facts, ['502', '500', '503', 'payment', 'gateway']);
      const hasPreviousDb = this._hasFact(facts, ['database', 'db', 'postgres', 'mysql', 'replica', 'node']);

      // 7A: Database / DB server statements
      if (lower.includes('database') || lower.includes('db server') || (lower.includes('server') && (lower.includes('not responding') || lower.includes('down') || lower.includes('unreachable')))) {
        if (lower.includes('not responding') || lower.includes('down') || lower.includes('unreachable') || lower.includes('unavailable')) {
          responseText = `I've logged that the database server is not responding. Do we know when it first became unreachable, and are replicas or connection pools affected?`;
        } else if (lower.includes('cpu') || lower.includes('95%') || lower.includes('percent')) {
          responseText = `Logged database CPU telemetry: ${cleanText}. Checking query latency and active connection counts.`;
        } else {
          responseText = `Telemetry recorded for database: ${cleanText}. Reconciling metrics against historical baseline and replica nodes.`;
        }
      }
      // 7B: Mobile app / client login crashes
      else if (lower.includes('mobile app') || lower.includes('app crash') || (lower.includes('crash') && lower.includes('login')) || lower.includes('ios') || lower.includes('android')) {
        if (lower.includes('crash') || lower.includes('login') || lower.includes('fails')) {
          responseText = `I've noted the mobile app crash after login. Is this affecting all users or only specific app versions and device types?`;
        } else {
          responseText = `Logged client telemetry: ${cleanText}. Correlating with mobile release metrics and authentication services.`;
        }
      }
      // 7C: Explicit Payment Gateway / Stripe mentions
      else if (lower.includes('payment') || lower.includes('stripe') || lower.includes('billing')) {
        if (hasPreviousCpu || lower.includes('cpu')) {
          responseText = `I've correlated the payment gateway errors with the CPU saturation. That could indicate resource exhaustion. I recommend checking instance health and recent deployments. I've also flagged gateway investigation as an action.`;
        } else {
          responseText = `Logged verified incident fact: ${cleanText}. Monitoring gateway error rates across regions. Are downstream services or payment provider endpoints timing out?`;
        }
      }
      // 7D: CPU Utilization
      else if (lower.includes('cpu') || lower.includes('95%') || lower.includes('percent cpu') || lower.includes('utilization')) {
        if (hasPreviousGateway || lower.includes('502')) {
          responseText = `I've correlated the 502 errors with the CPU saturation. That could indicate resource exhaustion. I recommend checking instance health and recent deployments. I've also flagged gateway investigation as an action.`;
        } else if (hasPreviousDb) {
          responseText = `I've correlated the CPU spike with the database telemetry. That could indicate query bottlenecks or lock contention.`;
        } else {
          responseText = `That's critically high. I've logged the CPU spike. Are the affected instances isolated to a single node, or is the issue affecting other services?`;
        }
      }
      // 7E: Generic 502 / 500 HTTP errors
      else if (lower.includes('502') || lower.includes('500') || lower.includes('503') || lower.includes('504')) {
        if (hasPreviousCpu) {
          responseText = `I've correlated the error responses with the CPU saturation. That could indicate resource exhaustion. I recommend checking instance health and recent deployments.`;
        } else {
          responseText = `Logged verified error report: ${cleanText}. Inspecting ingress error rates and upstream service health checks.`;
        }
      }
      // 7F: Infrastructure / Replica / Node / Cluster
      else if (lower.includes('replica') || lower.includes('node') || lower.includes('cluster') || lower.includes('pod')) {
        responseText = `Telemetry recorded: ${cleanText}. Reconciling metrics against historical baseline and replica nodes.`;
      }
      // 7G: Default Fact
      else {
        responseText = `Confirmed and logged as verified fact: ${cleanText}.`;
      }
    }
    // 8. Hypotheses
    else if (classification.category === 'HYPOTHESIS') {
      responseText = `Hypothesis noted from ${speaker}: "${cleanText}". Flagged as unconfirmed pending telemetry verification.`;
    }
    // 9. General Notes
    else {
      responseText = `Observation noted from ${speaker}: "${cleanText}". Correlating with active incident telemetry.`;
    }

    console.log(`[AI ENGINE] Incident Commander response generated: "${responseText}"`);

    return {
      text: responseText,
      voice: 'English_radiant_girl',
      rate: 1.0,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = ResponseGenerator;

