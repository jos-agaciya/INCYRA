/**
 * INCYRA - Transcript Processor Pipeline
 * Ingests live speech-to-text transcript lines, routes them through classification
 * and conflict detection, and updates the active incident state.
 */

const StatementClassifier = require('./classifier');
const ConflictDetector = require('./conflictDetector');
const SummaryGenerator = require('./summaryGenerator');

class TranscriptProcessor {
  constructor(incidentState) {
    this.incidentState = incidentState;
    this.classifier = new StatementClassifier();
    this.conflictDetector = new ConflictDetector();
    this.summaryGenerator = new SummaryGenerator();
  }

  /**
   * Process an incoming transcript segment.
   * @param {Object} input - { speaker, text, timestamp }
   * @returns {Object} Processing result containing added entities and current state
   */
  process(input) {
    const speaker = input.speaker || 'Unknown Participant';
    const text = (input.text || '').trim();
    const timestamp = input.timestamp || new Date().toISOString();

    if (!text) {
      return {
        success: false,
        error: 'Transcript text is required',
        state: this.incidentState.toJSON(),
      };
    }

    // 1. Record participant activity
    this.incidentState.recordParticipant(speaker);

    // 2. Classify the statement
    const classification = this.classifier.classify(text, speaker);

    let recordedItem = null;
    let eventType = 'STATEMENT';

    // 3. Update Incident State Collections based on classification
    switch (classification.category) {
      case 'FACT':
        recordedItem = this.incidentState.addFact({
          text,
          speaker,
          timestamp,
        });
        eventType = 'FACT';
        break;

      case 'HYPOTHESIS':
        recordedItem = this.incidentState.addHypothesis({
          text,
          speaker,
          timestamp,
        });
        eventType = 'HYPOTHESIS';
        break;

      case 'DECISION':
        recordedItem = this.incidentState.addDecision({
          text,
          speaker,
          timestamp,
        });
        eventType = 'DECISION';
        break;

      case 'ACTION_ITEM':
        recordedItem = this.incidentState.addActionItem({
          task: classification.task || text,
          assignee: classification.assignee,
          speaker,
          priority: classification.priority,
          timestamp,
        });
        eventType = 'ACTION';
        break;

      default:
        eventType = 'NOTE';
        break;
    }

    // 4. Run Conflict Detection against existing incident state
    const conflict = this.conflictDetector.detect(
      { text, speaker, category: classification.category },
      this.incidentState
    );

    let recordedConflict = null;
    if (conflict) {
      recordedConflict = this.incidentState.addConflict(conflict);
      this.incidentState.addTimelineEvent({
        timestamp,
        type: 'CONFLICT',
        speaker: 'AI Conflict Detector',
        content: `Conflict Detected: ${conflict.topic} between ${conflict.statementA.speaker} and ${conflict.statementB.speaker}`,
        metadata: conflict,
      });
    }

    // 5. Append to incident timeline
    this.incidentState.addTimelineEvent({
      timestamp,
      type: eventType,
      speaker,
      content: text,
      metadata: {
        classification,
        itemId: recordedItem ? recordedItem.id : null,
      },
    });

    // 6. Update generated briefing summary
    const updatedSummary = this.summaryGenerator.generateBriefing(this.incidentState);
    this.incidentState.setSummary(updatedSummary);

    return {
      success: true,
      processedItem: {
        speaker,
        text,
        timestamp,
        classification,
        conflict: recordedConflict,
      },
      currentSummary: updatedSummary,
      state: this.incidentState.toJSON(),
    };
  }
}

module.exports = TranscriptProcessor;
