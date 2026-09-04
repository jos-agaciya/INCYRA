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

    // 1. Check for Greetings
    const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'online?'];
    const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/);
    if (words.length <= 4 && greetingKeywords.some((g) => words.includes(g) || lower === g)) {
      return {
        category: 'GREETING',
        text: cleanText,
        speaker,
        confidence: 0.96,
        tags: ['greeting', 'conversational'],
      };
    }

    // 2. Check for How-to-Fix / Strategic Action Questions
    const fixKeywords = [
      'how do we fix', 'how can we fix', 'how to fix', 'how do we resolve',
      'what should we do', 'what is the next step', 'what are the next steps',
      'what do we do now', 'how do we proceed', 'what is the root cause',
      'where should we look', 'what do you recommend', 'what do you suggest',
      'how to mitigate', 'what to check first'
    ];
    if (fixKeywords.some((keyword) => lower.includes(keyword)) || (lower.startsWith('how') && lower.includes('fix'))) {
      return {
        category: 'HOW_TO_FIX',
        text: cleanText,
        speaker,
        confidence: 0.94,
        tags: ['inquiry', 'resolution_guidance'],
      };
    }

    // 3. Check for Status / Summary Queries
    const statusKeywords = [
      'what is the status', 'what\'s the status', 'status update',
      'give me a summary', 'summarize the situation', 'what do we have so far',
      'what facts do we have', 'current status'
    ];
    if (statusKeywords.some((keyword) => lower.includes(keyword))) {
      return {
        category: 'STATUS_QUERY',
        text: cleanText,
        speaker,
        confidence: 0.93,
        tags: ['inquiry', 'status_briefing'],
      };
    }

    // 4. Check for Hypothesis cues (assumptions, speculations, uncertainty)
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

    // 4. Check for Decision cues (CONFIRMED, PROPOSED, REJECTED, REVERSED)
    const confirmedDecisionKeywords = [
      'we decided to', 'we are rolling back', 'okay, we are', 'rollback has been approved',
      'decision is confirmed', 'decision confirmed', 'yes, confirm it', 'confirm it',
      'approved to', 'agreed to', 'let\'s go ahead with', 'order to rollback',
      'decision is to', 'confirmed:'
    ];
    const rejectedDecisionKeywords = [
      'we decided not to', 'decided not to', 'reject the', 'do not restart',
      'do not rollback', 'decided against', 'decision rejected'
    ];
    const reversedDecisionKeywords = [
      'reverse the decision', 'reverse the previous', 'cancel the decision',
      'cancel the rollback', 'reverse decision'
    ];
    const proposedDecisionKeywords = [
      'let\'s scale', 'let\'s failover', 'let\'s rollback', 'let\'s restart',
      'we could scale', 'we could rollback', 'should we rollback', 'should we scale',
      'i propose', 'propose we', 'we should proceed with', 'what if we scale'
    ];

    if (rejectedDecisionKeywords.some(kw => lower.includes(kw))) {
      return {
        category: 'DECISION',
        decisionStatus: 'REJECTED',
        text: cleanText,
        speaker,
        confidence: 0.94,
        tags: ['decision', 'rejected'],
      };
    }

    if (reversedDecisionKeywords.some(kw => lower.includes(kw))) {
      return {
        category: 'DECISION',
        decisionStatus: 'REVERSED',
        text: cleanText,
        speaker,
        confidence: 0.94,
        tags: ['decision', 'reversed'],
      };
    }

    if (confirmedDecisionKeywords.some(kw => lower.includes(kw))) {
      return {
        category: 'DECISION',
        decisionStatus: 'CONFIRMED',
        text: cleanText,
        speaker,
        confidence: 0.95,
        tags: ['decision', 'confirmed'],
      };
    }

    if (proposedDecisionKeywords.some(kw => lower.includes(kw))) {
      return {
        category: 'DECISION',
        decisionStatus: 'PROPOSED',
        text: cleanText,
        speaker,
        confidence: 0.91,
        tags: ['decision', 'proposed'],
      };
    }

    // 5. Check for Action Items / Task assignment cues
    const actionKeywords = [
      'can someone', 'please check', 'please investigate', 'check the',
      'investigate the', 'take a look at', 'i\'ll check', 'i will check',
      'i will look into', 'i\'ll investigate', 'i will handle', 'i\'ll handle',
      'we need to scale', 'we need to check', 'we need to', 'assigning to',
      'action item:', 'task:', 'verify the redis', 'verify the database',
      'can you check', 'can you look'
    ];

    // Check for "Name, check/investigate/take a look" pattern
    const directAssignPattern = /^([A-Z][a-z]+)[,\s]+(?:please\s+)?(?:check|investigate|look into|verify|inspect|scale|restart|take a look)/i;
    const directMatch = cleanText.match(directAssignPattern);

    if (directMatch || actionKeywords.some(kw => lower.includes(kw))) {
      let mentionedAssignee = null;
      if (directMatch) {
        mentionedAssignee = directMatch[1];
      } else {
        const assignMatch = cleanText.match(/(\b[A-Z][a-z]+\b)[,\s]+(?:please|can you|look into|check|investigate)/);
        if (assignMatch) {
          mentionedAssignee = assignMatch[1];
        } else if (lower.includes("i'll") || lower.includes('i will')) {
          mentionedAssignee = speaker;
        }
      }

      let priority = 'HIGH';
      if (lower.includes('critical') || lower.includes('emergency') || lower.includes('sev-1')) {
        priority = 'CRITICAL';
      } else if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('asap')) {
        priority = 'HIGH';
      } else if (lower.includes('when possible') || lower.includes('low priority')) {
        priority = 'LOW';
      } else if (lower.includes('can someone') || lower.includes('verify')) {
        priority = 'MEDIUM';
      }

      return {
        category: 'ACTION_ITEM',
        task: cleanText,
        title: cleanText.replace(/^action item:\s*/i, ''),
        text: cleanText,
        assignee: mentionedAssignee,
        speaker,
        priority,
        confidence: 0.90,
      };
    }

    // 7. Check for Fact cues (error codes, specific metrics, confirmed telemetry, outages, crashes)
    const factKeywords = [
      '502', '500', '503', '504', '404', '401', '403', 'error', 'exception',
      'cpu is at', 'cpu is currently at', 'cpu usage', 'memory is at', 'latency is',
      'returning', 'failing', 'status is', 'alert fired', 'logs show',
      'dashboard shows', 'metric is', 'down at', 'cluster is', 'percent cpu',
      'not responding', 'down', 'crash', 'crashes', 'crashed', 'timeout', 'timed out',
      'unreachable', 'unavailable', 'latency spike', 'slow response', 'memory leak',
      'connection refused', 'corrupted', 'oom', 'out of memory', 'disk full'
    ];
    if (factKeywords.some(keyword => lower.includes(keyword)) || /\d+%/i.test(cleanText) || /\d+\s*percent/i.test(cleanText)) {
      return {
        category: 'FACT',
        text: cleanText,
        speaker,
        confidence: 0.95,
        tags: ['telemetry', 'confirmed_observation'],
      };
    }

    // 8. Default categorization
    return {
      category: 'NOTE',
      text: cleanText,
      speaker,
      confidence: 0.70,
    };
  }
}

module.exports = StatementClassifier;
