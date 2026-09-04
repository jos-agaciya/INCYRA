/**
 * INCYRA - Agora RTC Channel Manager
 * Tracks active voice incident channels, joined participants, and agent session states in memory.
 */

class AgoraChannelManager {
  constructor() {
    this.activeChannels = new Map();
  }

  /**
   * Register or update an incident voice room channel with safe runtime metadata.
   * @param {string} channelName
   * @param {Object} [details]
   */
  createOrUpdateChannel(channelName, details = {}) {
    const existing = this.activeChannels.get(channelName) || {};

    const updated = {
      channelName,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: details.status || existing.status || 'ACTIVE',
      agentJoined: details.agentJoined !== undefined ? details.agentJoined : existing.agentJoined || false,
      agentSession: details.agentSession || existing.agentSession || null,
      participantsCount: details.participantsCount || (existing.participants ? existing.participants.size : 0),
      metadata: {
        ...(existing.metadata || {}),
        ...(details.metadata || {}),
      },
    };

    this.activeChannels.set(channelName, updated);
    return this.getSanitizedChannel(channelName);
  }

  /**
   * Get sanitized channel info without any sensitive values.
   * @param {string} channelName
   * @param {boolean} [raw=false]
   */
  getChannel(channelName, raw = false) {
    if (raw) {
      return this.activeChannels.get(channelName) || null;
    }
    return this.getSanitizedChannel(channelName);
  }

  /**
   * Get all active channels in sanitized format.
   */
  getAllActiveChannels() {
    const channels = [];
    for (const [name] of this.activeChannels) {
      const sanitized = this.getSanitizedChannel(name);
      if (sanitized) channels.push(sanitized);
    }
    return channels;
  }

  /**
   * Mark a channel agent as disconnected / stopped.
   * @param {string} channelName
   */
  setAgentStatus(channelName, status) {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      channel.status = status;
      channel.updatedAt = new Date().toISOString();
      if (status === 'LEFT' || status === 'STOPPED') {
        channel.agentJoined = false;
        channel.agentSession = null;
      }
      return this.getSanitizedChannel(channelName);
    }
    return null;
  }

  /**
   * Helper to sanitize channel objects before returning through API.
   * @private
   */
  getSanitizedChannel(channelName) {
    const channel = this.activeChannels.get(channelName);
    if (!channel) return null;

    return {
      channelName: channel.channelName,
      status: channel.status,
      agentJoined: channel.agentJoined,
      agentSession: channel.agentSession ? {
        agentId: channel.agentSession.agentId,
        status: channel.agentSession.status,
      } : null,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      metadata: channel.metadata || {},
    };
  }

  /**
   * Clear all channel states.
   */
  reset() {
    this.activeChannels.clear();
  }
}

module.exports = AgoraChannelManager;
