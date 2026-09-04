/**
 * INCYRA - Agora Conversational AI Agent Manager
 *
 * Coordinates the INCYRA AI Agent's presence in Agora voice channels:
 * - Communicates with Agora Conversational AI REST API
 * - Manages agent join requests for incident voice rooms
 * - Tracks runtime session state in memory
 * - Provides safe status and diagnostics without exposing credentials
 */

const AgoraApiClient = require('./agoraApiClient');
const AgoraChannelManager = require('../rtc/channelManager');

class AgoraAgentManager {
  /**
   * @param {Object} [options]
   * @param {AgoraApiClient} [options.apiClient]
   * @param {AgoraChannelManager} [options.channelManager]
   */
  constructor(options = {}) {
    this.apiClient = options.apiClient || new AgoraApiClient();
    this.channelManager = options.channelManager || new AgoraChannelManager();
  }

  /**
   * Safe status check of Agora Conversational AI configuration.
   * NEVER exposes actual secret values.
   */
  getConfigurationStatus() {
    const check = this.apiClient.checkConfiguration();
    return {
      configured: check.configured,
      appIdConfigured: Boolean(this.apiClient.appId),
      customerIdConfigured: Boolean(this.apiClient.customerId),
      customerSecretConfigured: Boolean(this.apiClient.customerSecret),
      pipelineConfigured: Boolean(this.apiClient.pipelineId),
      agentIntegration: check.configured ? 'ready' : 'missing_configuration',
      missing: check.missing,
    };
  }

  /**
   * Request the published INCYRA Agora AI agent to join an incident voice channel.
   *
   * @param {string} channelName - Agora RTC voice channel name
   * @param {Object} [options]
   * @param {string} [options.pipelineId] - Optional custom pipeline ID override
   * @returns {Promise<Object>} Safe response containing status and sanitized agent info
   */
  async joinIncidentAgent(channelName, options = {}) {
    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      const err = new Error('channelName is required and cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const cleanChannelName = channelName.trim();

    // Check if an agent session is already active in this channel to prevent duplicate joins on rerender
    const existing = this.channelManager.getChannel(cleanChannelName, true);
    if (existing && existing.agentJoined && existing.status === 'AGENT_JOINED' && existing.agentSession) {
      console.log(`[AGORA LIFECYCLE] Agent kept alive: channel="${cleanChannelName}", agentId=${existing.agentSession.agentId}`);
      return {
        success: true,
        message: 'INCYRA agent already joined and active in channel',
        channelName: cleanChannelName,
        agent: existing.agentSession,
      };
    }

    // Verify configuration
    const configStatus = this.getConfigurationStatus();
    if (!configStatus.configured) {
      const err = new Error(`Agora Conversational AI is not fully configured. Missing: ${configStatus.missing.join(', ')}`);
      err.statusCode = 503;
      err.missing = configStatus.missing;
      throw err;
    }

    // Call Agora Conversational AI REST API
    const result = await this.apiClient.joinChannel(cleanChannelName, options.pipelineId);

    // Sanitize response data from Agora
    const agoraData = result.data || {};
    const safeAgent = {
      agentId: agoraData.agent_id || agoraData.id || agoraData.agentId || 'incyra-agent',
      status: agoraData.status || 'RUNNING',
      joinResponse: agoraData,
    };

    // Update in-memory runtime channel tracking
    this.channelManager.createOrUpdateChannel(cleanChannelName, {
      status: 'AGENT_JOINED',
      agentJoined: true,
      agentSession: safeAgent,
    });

    console.log(`[AGORA LIFECYCLE] Agent joined: channel="${cleanChannelName}", agentId=${safeAgent.agentId}`);

    return {
      success: true,
      message: 'INCYRA agent join request submitted',
      channelName: cleanChannelName,
      agent: safeAgent,
    };
  }

  /**
   * Get live runtime status directly from Agora for an active agent ID
   * @param {string} agentId
   */
  async getLiveAgentStatus(agentId) {
    if (!agentId) {
      const err = new Error('agentId is required.');
      err.statusCode = 400;
      throw err;
    }

    return await this.apiClient.getAgentSession(agentId);
  }

  /**
   * Get runtime status for a specific channel or overall agent integration.
   * @param {string} [channelName]
   */
  getAgentStatus(channelName) {
    const configStatus = this.getConfigurationStatus();

    if (channelName) {
      const channel = this.channelManager.getChannel(channelName);
      return {
        configured: configStatus.configured,
        agentIntegration: configStatus.agentIntegration,
        channel: channel || { channelName, status: 'NOT_FOUND', agentJoined: false },
      };
    }

    return {
      configured: configStatus.configured,
      pipelineConfigured: configStatus.pipelineConfigured,
      agentIntegration: configStatus.agentIntegration,
      activeChannels: this.channelManager.getAllActiveChannels(),
    };
  }

  /**
   * Stop / leave incident agent from channel (runtime tracking & clean extension point).
   * @param {string} channelName
   */
  async stopIncidentAgent(channelName) {
    if (!channelName) {
      const err = new Error('channelName is required to stop agent.');
      err.statusCode = 400;
      throw err;
    }

    const cleanChannel = channelName.trim();
    const existing = this.channelManager.getChannel(cleanChannel, true);
    if (existing && existing.agentSession && existing.agentSession.agentId) {
      try {
        await this.apiClient.leaveAgentSession(existing.agentSession.agentId);
      } catch (leaveErr) {
        console.warn(`[AGENT API] Note while leaving Agora agent session:`, leaveErr.message);
      }
    }

    this.channelManager.setAgentStatus(cleanChannel, 'STOPPED');
    console.log(`[AGORA LIFECYCLE] Agent stopped: channel="${cleanChannel}"`);

    return {
      success: true,
      message: `INCYRA agent session stopped for channel "${cleanChannel}".`,
      channelName: cleanChannel,
      status: 'STOPPED',
    };
  }
}

module.exports = AgoraAgentManager;
