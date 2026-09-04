/**
 * INCYRA - Transcript Processor Pipeline
 * Ingests live speech-to-text transcript lines, routes them through classification,
 * conflict detection, and conversational AI response generation.
 */

const StatementClassifier = require('./classifier');
const ConflictDetector = require('./conflictDetector');
const SummaryGenerator = require('./summaryGenerator');
const ResponseGenerator = require('./responseGenerator');

class TranscriptProcessor {
  constructor(incidentState) {
    this.incidentState = incidentState;
    this.classifier = new StatementClassifier();
    this.conflictDetector = new ConflictDetector();
    this.summaryGenerator = new SummaryGenerator();
    this.responseGenerator = new ResponseGenerator();
  }

  /**
   * Process an incoming transcript segment.
   * @param {Object} input - { speaker, text, timestamp }
   * @returns {Promise<Object>} Processing result containing added entities, current state, and AI response
   */
  async process(input) {
    const speaker = input.speaker || 'Incident Responder';
    const text = (input.text || '').trim();
    const timestamp = input.timestamp || new Date().toISOString().substring(11, 16);

    if (!text) {
      return {
        success: false,
        error: 'Transcript text is required',
        state: this.incidentState.toJSON(),
      };
    }

    console.log(`[TRANSCRIPT] real transcript received: speaker="${speaker}", text="${text}"`);

    // 1. Record participant activity
    const isAI = speaker.toLowerCase().includes('incyra') || speaker.toLowerCase().includes('agent');
    this.incidentState.recordParticipant(speaker, isAI ? 'AI Incident Commander' : 'Incident Responder', isAI);

    // 2. Classify the statement
    const classification = this.classifier.classify(text, speaker);
    console.log(`[AI ENGINE] classification result: ${classification.category} (confidence: ${classification.confidence})`);

    let recordedItem = null;
    let eventType = 'NOTE';
    let eventTitle = 'Statement Logged';
    let eventDescription = text;

    // 3. Update Incident State Collections based on classification
    switch (classification.category) {
      case 'FACT':
        recordedItem = this.incidentState.addFact({
          text,
          speaker,
          source: `${speaker} (Voice)`,
          timestamp,
        });
        eventType = 'FACT';
        eventTitle = 'Confirmed Telemetry / Fact';
        eventDescription = text;
        break;

      case 'HYPOTHESIS':
        recordedItem = this.incidentState.addHypothesis({
          text,
          speaker,
          proposedBy: speaker,
          timestamp,
        });
        eventType = 'HYPOTHESIS';
        eventTitle = 'Hypothesis Proposed';
        eventDescription = text;
        break;

      case 'DECISION':
        recordedItem = this.incidentState.addDecision({
          title: classification.text,
          text: classification.text,
          status: classification.decisionStatus || 'CONFIRMED',
          decidedBy: speaker,
          sourceSpeaker: speaker,
          sourceTranscript: text,
          confidence: classification.confidence || 0.92,
          timestamp,
        });
        eventType = 'DECISION';
        eventTitle = `Decision (${recordedItem.status})`;
        eventDescription = `${text} (Decided by ${speaker})`;
        break;

      case 'ACTION_ITEM':
        recordedItem = this.incidentState.addActionItem({
          task: classification.title || classification.task || text,
          title: classification.title || classification.task || text,
          assignee: classification.assignee || null,
          priority: classification.priority || 'HIGH',
          sourceSpeaker: speaker,
          sourceTranscript: text,
          confidence: classification.confidence || 0.90,
          timestamp,
        });
        eventType = 'ACTION';
        eventTitle = `Action Item (${recordedItem.priority})`;
        eventDescription = `${recordedItem.title}${recordedItem.assignee ? ` (Assigned to: ${recordedItem.assignee})` : (recordedItem.unassignedTarget ? ` (Unassigned — ${recordedItem.unassignedTarget} not in room)` : ' (Unassigned)')}`;
        break;

      default:
        eventType = 'NOTE';
        eventTitle = 'Operational Observation';
        eventDescription = text;
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
      console.log(`[AI ENGINE] conflict detected: ${conflict.topic} between ${conflict.statementA.speaker} and ${conflict.statementB.speaker}`);
      this.incidentState.addTimelineEvent({
        time: timestamp,
        timestamp: new Date().toISOString(),
        type: 'CONFLICT',
        tag: 'CONFLICT',
        title: (conflict.topic || 'Telemetry Discrepancy').toUpperCase(),
        description: `Discrepancy: ${conflict.statementA.speaker} reported "${conflict.statementA.text}" vs ${conflict.statementB.speaker} reported "${conflict.statementB.text}". ${conflict.recommendation || 'Human verification required.'}`,
        author: 'AI Conflict Detector',
        speaker: 'AI Conflict Detector',
        metadata: conflict,
      });
    }

    // 5. Append statement to incident timeline
    this.incidentState.addTimelineEvent({
      time: timestamp,
      timestamp: new Date().toISOString(),
      type: eventType,
      tag: eventType,
      title: eventTitle,
      description: eventDescription,
      content: text,
      author: speaker,
      speaker,
      metadata: {
        classification,
        itemId: recordedItem ? recordedItem.id : null,
      },
    });

    // 6. Generate Contextual AI Incident Commander Spoken Response
    let aiResponse = null;
    if (!isAI) {
      aiResponse = await this.responseGenerator.generateResponse({
        speaker,
        text,
        classification,
        conflict: recordedConflict,
        incidentState: this.incidentState,
        recordedItem,
      });

      // Update AI Observation with the latest AI response
      this.incidentState.aiObservation = {
        title: 'Live Incident Intelligence',
        observation: aiResponse.text,
        confidence: '98%',
        lastUpdated: 'Just now',
        listening: true,
      };
    }

    // 7. Update generated briefing summary
    const updatedSummary = this.summaryGenerator.generateBriefing(this.incidentState);
    this.incidentState.setSummary(updatedSummary);

    const fullState = this.incidentState.toJSON();
    console.log(`[STATE] updated: version=${fullState.version}, facts=${fullState.facts.length}, hypotheses=${fullState.hypotheses.length}, conflicts=${fullState.conflicts.length}, actions=${fullState.actions.length}`);

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
      aiResponse,
      spokenResponse: aiResponse ? aiResponse.text : null,
      data: fullState,
      state: fullState,
    };
  }
}

module.exports = TranscriptProcessor;
