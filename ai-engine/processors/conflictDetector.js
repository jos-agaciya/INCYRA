/**
 * INCYRA - Conflict Detector
 * Detects contradictory claims, conflicting metric reports, or inconsistent observations
 * among incident participants so the team can verify before taking disruptive actions.
 */

class ConflictDetector {
  /**
   * Check if a new statement contradicts prior statements or recorded facts.
   * @param {Object} newEntry - { text, speaker, category }
   * @param {Object} incidentState - Current IncidentState instance
   * @returns {Object|null} Conflict object if detected, otherwise null
   */
  detect(newEntry, incidentState) {
    if (!newEntry || !newEntry.text || !incidentState) {
      return null;
    }

    const newText = newEntry.text.toLowerCase();
    const newSpeaker = newEntry.speaker || 'Unknown';

    // 1. Metric contradiction check: CPU percentages (e.g., 95% vs 40%)
    const cpuMatch = newText.match(/(?:cpu|utilization|load)[^\d]*(\d+)\s*%/i) || newText.match(/(\d+)\s*%[^\w]*(?:cpu|utilization|load)/i);

    if (cpuMatch) {
      const newPercentage = parseInt(cpuMatch[1], 10);
      
      // Search previous facts or timeline items mentioning CPU
      const pastCpuItems = [
        ...incidentState.facts,
        ...incidentState.timeline.filter(t => t.type === 'FACT' || t.type === 'STATEMENT')
      ];

      for (const past of pastCpuItems) {
        if (past.speaker === newSpeaker) continue; // Skip comparing against self

        const pastText = (past.text || past.content || '').toLowerCase();
        const pastMatch = pastText.match(/(?:cpu|utilization|load)[^\d]*(\d+)\s*%/i) || pastText.match(/(\d+)\s*%[^\w]*(?:cpu|utilization|load)/i);

        if (pastMatch) {
          const pastPercentage = parseInt(pastMatch[1], 10);
          // If difference is significant (> 20%)
          if (Math.abs(newPercentage - pastPercentage) >= 20) {
            return {
              topic: 'Conflicting CPU Utilization Telemetry',
              statementA: {
                speaker: past.speaker,
                text: past.text || past.content,
              },
              statementB: {
                speaker: newSpeaker,
                text: newEntry.text,
              },
              recommendation: `Discrepancy detected between ${past.speaker} (${pastPercentage}%) and ${newSpeaker} (${newPercentage}%). Verify CloudWatch / Prometheus metrics before triggering database failovers.`,
            };
          }
        }
      }
    }

    // 2. Service status contradiction check (e.g. "is down" vs "is healthy / only 40%")
    const downKeywords = ['is down', 'completely down', 'outage', 'unreachable'];
    const upKeywords = ['is healthy', 'is normal', 'working fine', 'no errors'];

    const newHasDown = downKeywords.some(kw => newText.includes(kw));
    const newHasUp = upKeywords.some(kw => newText.includes(kw));

    if (newHasDown || newHasUp) {
      for (const fact of incidentState.facts) {
        if (fact.speaker === newSpeaker) continue;
        const factText = (fact.text || '').toLowerCase();
        const factHasDown = downKeywords.some(kw => factText.includes(kw));
        const factHasUp = upKeywords.some(kw => factText.includes(kw));

        if ((newHasDown && factHasUp) || (newHasUp && factHasDown)) {
          return {
            topic: 'Conflicting Service Availability Report',
            statementA: {
              speaker: fact.speaker,
              text: fact.text,
            },
            statementB: {
              speaker: newSpeaker,
              text: newEntry.text,
            },
            recommendation: 'Participants reported conflicting service statuses. Verify health check probes.',
          };
        }
      }
    }

    return null;
  }
}

module.exports = ConflictDetector;
