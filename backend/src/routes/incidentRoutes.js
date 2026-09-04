const express = require('express');
const {
  handleTranscript,
  getIncidentState,
  resetIncidentState,
} = require('../controllers/incidentController');

const router = express.Router();

// POST /api/incident/transcript - Ingest speech/mock transcript
router.post('/transcript', handleTranscript);

// GET /api/incident/state - Fetch live structured incident intelligence
router.get('/state', getIncidentState);

// POST /api/incident/reset - Reset incident state
router.post('/reset', resetIncidentState);

module.exports = router;
