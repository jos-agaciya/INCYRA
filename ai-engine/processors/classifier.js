/**
 * INCYRA - Incident Statement Classifier
 * Categorizes raw transcript statements into operational intelligence categories:
 * - FACT (Confirmed metrics, errors, verified states)
 * - HYPOTHESIS (Unproven assumptions, theories)
 * - DECISION (Agreed team actions or orders)
 * - ACTION_ITEM (Assigned investigation tasks)
 * - RISK (Potential points of failure/data loss)
 */

class StatementClassifier {
  /**
   * Classify a single statement from a speaker.
   * @param {string} text - Raw speech transcript text
   * @param {string} speaker - Speaker name or identifier
   * @returns {Object} Classified item with category, entities, and confidence
   */
  classify(text, speaker = 'Unknown') {
    if (!text || typeof text !== 'string') {
      return {
        category: 'NOTE',
        text: '',
        speaker,
        confidence: 0,
      };
    }

    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Check for Hypothesis cues (assumptions, speculations, uncertainty)
    const hypothesisKeywords = [
      'i think', 'maybe', 'might be', 'could be', 'probably',
      'suspect', 'my guess', 'hypothesis', 'assuming', 'perhaps',
      'seems like', 'looks like'
    ];
    if (hypothesisKeywords.some(keyword => lower.includes(keyword))) {
      return {
        category: 'HYPOTHESIS',
        text: cleanText,
        speaker,
        confidence: 0.88,
        tags: ['speculation', 'unverified'],
      };
    }

    // 2. Check for Decision cues
    const decisionKeywords = [
      'we decided to', 'we should proceed with', 'let\'s go ahead with',
      'agreed to', 'decision is', 'approved to', 'let\'s rollback',
      'let\'s failover', 'order to'
    ];
    if (decisionKeywords.some(keyword => lower.includes(keyword))) {
      return {
        category: 'DECISION',
        text: cleanText,
        speaker,
        confidence: 0.92,
        tags: ['command', 'alignment'],
      };
    }

    // 3. Check for Action Items / Task assignment cues
    const actionKeywords = [
      'can someone', 'please check', 'please investigate',
      'take a look at', 'i will check', 'i will look into',
      'assigning to', 'action item:', 'task:', 'let\'s check'
    ];
    if (actionKeywords.some(keyword => lower.includes(keyword))) {
      // Extract potential assignee
      let assignee = 'Unassigned';
      const assignMatch = cleanText.match(/(\b[A-Z][a-z]+\b)[,\s]+(?:please|can you|look into|check)/);
      if (assignMatch) {
        assignee = assignMatch[1];
      }

      return {
        category: 'ACTION_ITEM',
        task: cleanText,
        text: cleanText,
        assignee,
        speaker,
        priority: lower.includes('urgent') || lower.includes('immediately') ? 'URGENT' : 'HIGH',
        confidence: 0.89,
      };
    }

    // 4. Check for Fact cues (error codes, specific metrics, confirmed telemetry)
    const factKeywords = [
      '502', '500', '503', '504', '404', 'error', 'exception',
      'cpu is at', 'cpu is currently at', 'memory is at', 'latency is',
      'returning', 'failing', 'status is', 'alert fired', 'logs show',
      'dashboard shows', 'metric is', 'down at', 'cluster is'
    ];
    if (factKeywords.some(keyword => lower.includes(keyword)) || /\d+%/i.test(cleanText)) {
      return {
        category: 'FACT',
        text: cleanText,
        speaker,
        confidence: 0.95,
        tags: ['telemetry', 'confirmed_observation'],
      };
    }

    // 5. Default categorization
    return {
      category: 'NOTE',
      text: cleanText,
      speaker,
      confidence: 0.70,
    };
  }
}

module.exports = StatementClassifier;
