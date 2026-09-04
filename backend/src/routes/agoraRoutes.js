const express = require('express');
const {
  joinAgent,
  generateToken,
  getStatus,
  getAgentLiveStatus,
  stopAgent,
} = require('../controllers/agoraController');

const router = express.Router();

// POST /api/agora/token - Generate secure RTC token for client
router.post('/token', generateToken);

// POST /api/agora/join - Request INCYRA agent to join voice channel
router.post('/join', joinAgent);

// GET /api/agora/status - Check Agora configuration and agent readiness status
router.get('/status', getStatus);

// GET /api/agora/agent/:agentId/status - Query live agent status directly from Agora
router.get('/agent/:agentId/status', getAgentLiveStatus);

// POST /api/agora/stop - Stop agent in channel
router.post('/stop', stopAgent);

module.exports = router;
