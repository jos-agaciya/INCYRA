/**
 * INCYRA - Agora RTC & Conversational AI Module
 * Public interface exporting Agora services and managers.
 */

const AgoraTokenService = require('./rtc/tokenService');
const AgoraChannelManager = require('./rtc/channelManager');
const AgoraAgentManager = require('./conversational-ai/agentManager');

module.exports = {
  AgoraTokenService,
  AgoraChannelManager,
  AgoraAgentManager,
};
