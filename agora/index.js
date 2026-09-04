/**
 * INCYRA - Agora RTC & Conversational AI Module
 * Public interface exporting Agora services, clients, and managers.
 */

const AgoraApiClient = require('./conversational-ai/agoraApiClient');
const AgoraAgentManager = require('./conversational-ai/agentManager');
const AgoraChannelManager = require('./rtc/channelManager');
const AgoraTokenService = require('./rtc/tokenService');

// Singleton instances for application-wide use
const defaultChannelManager = new AgoraChannelManager();
const defaultApiClient = new AgoraApiClient();
const defaultTokenService = new AgoraTokenService();
const defaultAgentManager = new AgoraAgentManager({
  apiClient: defaultApiClient,
  channelManager: defaultChannelManager,
});

module.exports = {
  AgoraApiClient,
  AgoraAgentManager,
  AgoraChannelManager,
  AgoraTokenService,
  defaultAgentManager,
  defaultChannelManager,
  defaultApiClient,
  defaultTokenService,
};
