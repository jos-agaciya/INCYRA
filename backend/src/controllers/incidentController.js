/**
 * INCYRA - Incident Controller
 * Receives transcript feeds (from mock tests or Agora voice STT) and interacts with AI Engine.
 */
const { defaultEngine } = require('../../../ai-engine');

/**
 * Handle incoming transcript payload
 * POST /api/incident/transcript
 */
function handleTranscript(req, res) {
  const { speaker, text, timestamp } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "text" field in transcript payload.',
    });
  }

  const result = defaultEngine.processTranscript({
    speaker: speaker || 'Participant',
    text: text.trim(),
    timestamp: timestamp || new Date().toISOString(),
  });

  return res.status(200).json(result);
}

/**
 * Get the full incident intelligence state
 * GET /api/incident/state
 */
function getIncidentState(req, res) {
  const state = defaultEngine.getIncidentState();
  return res.status(200).json({
    success: true,
    data: state,
  });
}

/**
 * Reset the incident state for new test run or incident
 * POST /api/incident/reset
 */
function resetIncidentState(req, res) {
  const state = defaultEngine.reset();
  return res.status(200).json({
    success: true,
    message: 'Incident intelligence state has been reset.',
    data: state,
  });
}

module.exports = {
  handleTranscript,
  getIncidentState,
  resetIncidentState,
};
