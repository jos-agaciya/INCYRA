/**
 * INCYRA - Agora RTC Channel Manager (Stub / Foundation)
 * Tracks active voice incident channels, joined participants, and active audio streams.
 */

class AgoraChannelManager {
  constructor() {
    this.activeChannels = new Map();
  }

  /**
   * Register a new incident voice room channel.
   * @param {string} channelName
   * @param {Object} metadata
   */
  createChannel(channelName, metadata = {}) {
    if (this.activeChannels.has(channelName)) {
      return this.activeChannels.get(channelName);
    }

    const channel = {
      channelName,
      createdAt: new Date().toISOString(),
      participants: new Set(),
      metadata,
      status: 'ACTIVE',
    };

    this.activeChannels.set(channelName, channel);
    return channel;
  }

  /**
   * Add participant to voice channel.
   */
  joinParticipant(channelName, uid, username) {
    const channel = this.createChannel(channelName);
    channel.participants.add({ uid, username, joinedAt: new Date().toISOString() });
    return channel;
  }

  /**
   * Get active channel info.
   */
  getChannel(channelName) {
    return this.activeChannels.get(channelName) || null;
  }
}

module.exports = AgoraChannelManager;
