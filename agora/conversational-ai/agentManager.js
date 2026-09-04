/**
 * INCYRA - Agora Conversational AI Agent Manager (Stub / Foundation)
 * Coordinates the INCYRA AI Agent's presence in Agora voice channels:
 * - Connecting Agora Conversational AI / Agents SDK
 * - Streaming live STT into the AI Incident Intelligence Engine
 * - Broadcasting spoken AI summaries/warnings back into the channel
 */

class AgoraAgentManager {
  constructor(config = {}) {
    this.agentId = config.agentId || 'incyra-commander-01';
    this.status = 'DISCONNECTED'; // DISCONNECTED | CONNECTING | LISTENING | SPEAKING
    this.activeChannel = null;
  }

  /**
   * Start the AI voice agent in an Agora incident voice room.
   * @param {string} channelName
   */
  async joinIncidentChannel(channelName) {
    this.activeChannel = channelName;
    this.status = 'LISTENING';
    return {
      success: true,
      agentId: this.agentId,
      channelName,
      status: this.status,
      message: `Agora Conversational AI agent initialized for channel "${channelName}". (Stub)`,
    };
  }

  /**
   * Broadcast a spoken message into the channel via Agora TTS.
   * @param {string} spokenText
   */
  async broadcastSpokenMessage(spokenText) {
    if (this.status === 'DISCONNECTED') {
      throw new Error('Agent is not connected to any Agora channel.');
    }

    return {
      success: true,
      spokenText,
      timestamp: new Date().toISOString(),
      channel: this.activeChannel,
    };
  }

  /**
   * Leave current voice room.
   */
  async leaveChannel() {
    const prevChannel = this.activeChannel;
    this.activeChannel = null;
    this.status = 'DISCONNECTED';
    return {
      success: true,
      channel: prevChannel,
      status: this.status,
    };
  }
}

module.exports = AgoraAgentManager;
