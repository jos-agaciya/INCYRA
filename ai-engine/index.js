/**
 * INCYRA - AI Incident Intelligence Engine
 * Entry point module providing live transcript processing and incident intelligence state.
 */

const IncidentState = require('./models/incidentState');
const TranscriptProcessor = require('./processors/transcriptProcessor');
const prompts = require('./prompts/incidentPrompts');

class AIIncidentEngine {
  constructor(initialIncidentId) {
    this.state = new IncidentState(initialIncidentId);
    this.processor = new TranscriptProcessor(this.state);
  }

  /**
   * Ingest a transcript line and return updated intelligence
   * @param {Object} input - { speaker: string, text: string, timestamp?: string }
   */
  processTranscript(input) {
    return this.processor.process(input);
  }

  /**
   * Get current structured incident state
   */
  getIncidentState() {
    return this.state.toJSON();
  }

  /**
   * Get prompt templates for LLM integrations
   */
  getPrompts() {
    return prompts;
  }

  /**
   * Reset incident intelligence state
   */
  reset() {
    this.state.reset();
    return this.state.toJSON();
  }
}

// Export singleton instance for app-wide use and the class for custom instantiation
const defaultEngine = new AIIncidentEngine();

module.exports = {
  AIIncidentEngine,
  defaultEngine,
  prompts,
};
