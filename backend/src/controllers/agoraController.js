/**
 * INCYRA - Agora Controller
 * Handles HTTP requests for Agora voice channels, token generation, and Conversational AI agent integration.
 */

const { defaultAgentManager, defaultTokenService } = require('../../../agora');

/**
 * Request INCYRA Conversational AI Agent to join an Agora RTC voice channel
 * POST /api/agora/join
 */
async function joinAgent(req, res, next) {
  try {
    const { channelName } = req.body;

    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "channelName" in request body.',
      });
    }

    const cleanChannel = channelName.trim();
    const agentRtcUid = Number(process.env.AGORA_AGENT_RTC_UID || 1001);
    console.log(`[AGORA AGENT] Agent start request sent for channel: "${cleanChannel}" (Agent UID: ${agentRtcUid})`);

    const result = await defaultAgentManager.joinIncidentAgent(cleanChannel);
    console.log(`[AGORA AGENT] Agent started successfully: agentId=${result.agent?.agentId}, status=${result.agent?.status}, channel="${cleanChannel}"`);

    return res.status(200).json({
      ...result,
      agentRtcUid,
    });
  } catch (err) {
    console.error(`[AGORA AGENT ERROR] Failed to start agent: ${err.message}`);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to join Agora channel',
      ...(err.missing && { missingVariables: err.missing }),
    });
  }
}

/**
 * Generate Agora RTC token for frontend client
 * POST /api/agora/token
 */
async function generateToken(req, res, next) {
  try {
    const { channelName, uid, role } = req.body;

    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "channelName" in request body.',
      });
    }

    const cleanChannel = channelName.trim();
    const agentRtcUid = Number(process.env.AGORA_AGENT_RTC_UID || 1001);

    // Ensure client UID never collides with Agent UID
    let clientUid = uid ? Number(uid) : 0;
    if (!clientUid || clientUid === agentRtcUid) {
      clientUid = Math.floor(200000 + Math.random() * 700000);
    }

    console.log(`[TOKEN API] Generating client RTC token: channel="${cleanChannel}", uid=${clientUid}, role=${role || 'publisher'}`);
    const result = defaultTokenService.generateRtcToken(
      cleanChannel,
      clientUid,
      role || 'publisher'
    );

    return res.status(200).json({
      ...result,
      agentRtcUid,
    });
  } catch (err) {
    console.error(`[TOKEN API] Error generating RTC token:`, err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to generate RTC token',
    });
  }
}

/**
 * Get safe integration and configuration status
 * GET /api/agora/status
 */
function getStatus(req, res) {
  const status = defaultAgentManager.getAgentStatus();
  return res.status(200).json({
    success: true,
    data: status,
  });
}

/**
 * Query live agent status directly from Agora REST API
 * GET /api/agora/agent/:agentId/status
 */
async function getAgentLiveStatus(req, res) {
  try {
    const { agentId } = req.params;
    const result = await defaultAgentManager.getLiveAgentStatus(agentId);
    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to fetch live agent status',
    });
  }
}

/**
 * Stop agent in a specific incident voice channel
 * POST /api/agora/stop
 */
async function stopAgent(req, res, next) {
  try {
    const { channelName } = req.body;

    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "channelName" in request body.',
      });
    }

    const cleanChannel = channelName.trim();
    console.log(`[AGORA LIFECYCLE] Stop requested by explicit user action for channel: "${cleanChannel}"`);
    const result = await defaultAgentManager.stopIncidentAgent(cleanChannel);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to stop Agora agent session',
    });
  }
}

module.exports = {
  joinAgent,
  generateToken,
  getStatus,
  getAgentLiveStatus,
  stopAgent,
};
