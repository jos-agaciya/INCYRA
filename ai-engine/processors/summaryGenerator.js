/**
 * INCYRA - Summary Generator
 * Aggregates live incident state into concise, voice-ready spoken briefings
 * and written executive summaries.
 */

class SummaryGenerator {
  /**
   * Generate concise spoken briefing from incident state.
   * @param {Object} incidentState - IncidentState instance
   * @returns {string} Natural language briefing suitable for voice synthesis / text
   */
  generateBriefing(incidentState) {
    if (!incidentState) {
      return 'Incident state unavailable.';
    }

    const factsCount = incidentState.facts.length;
    const hypoCount = incidentState.hypotheses.length;
    const conflictsCount = incidentState.conflicts.length;
    const actionsCount = incidentState.actionItems.length;

    let parts = [];
    parts.push(`Status is ${incidentState.status}.`);

    if (factsCount > 0) {
      parts.push(`${factsCount} confirmed fact${factsCount > 1 ? 's' : ''} logged.`);
    }

    if (hypoCount > 0) {
      parts.push(`${hypoCount} unconfirmed hypothes${hypoCount > 1 ? 'es' : 'is'} under investigation.`);
    }

    if (conflictsCount > 0) {
      parts.push(`Alert: ${conflictsCount} conflicting data point${conflictsCount > 1 ? 's' : ''} detected requiring team verification.`);
    }

    if (actionsCount > 0) {
      const pending = incidentState.actionItems.filter(a => a.status === 'PENDING').length;
      parts.push(`${pending} pending action item${pending > 1 ? 's' : ''} assigned.`);
    }

    if (parts.length === 1) {
      return `Incident is ${incidentState.status}. Awaiting further observations from the incident channel.`;
    }

    return parts.join(' ');
  }
}

module.exports = SummaryGenerator;
