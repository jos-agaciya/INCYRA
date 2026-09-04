/**
 * INCYRA - Health Controller
 */
const config = require('../config/env');

const startTime = Date.now();

function getHealth(req, res) {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.status(200).json({
    status: 'OK',
    service: 'INCYRA Backend API',
    version: '1.0.0',
    environment: config.nodeEnv,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    capabilities: {
      aiEngine: 'active',
      agoraBridge: 'ready_for_integration',
    },
  });
}

module.exports = {
  getHealth,
};
