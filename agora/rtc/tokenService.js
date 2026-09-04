/**
 * INCYRA - Agora RTC Token Service (Stub / Foundation)
 * Generates Agora RTC tokens for secure voice channel access.
 * Implementation will use `agora-access-token` or Agora REST API in the next phase.
 */

class AgoraTokenService {
  constructor(config = {}) {
    this.appId = config.appId || process.env.AGORA_APP_ID || '';
    this.appCertificate = config.appCertificate || process.env.AGORA_APP_CERTIFICATE || '';
  }

  /**
   * Generate an RTC Token for a voice incident room.
   * @param {string} channelName - Agora channel / room name (e.g. 'incident-room-101')
   * @param {string|number} uid - User ID (0 for auto-assign)
   * @param {string} role - 'publisher' | 'subscriber'
   * @param {number} privilegeExpireTime - Expiration time in seconds (default 3600)
   * @returns {Object} Token payload or placeholder
   */
  generateRtcToken(channelName, uid = 0, role = 'publisher', privilegeExpireTime = 3600) {
    if (!this.appId || !this.appCertificate) {
      return {
        success: false,
        warning: 'Agora credentials not yet configured. Returning mock development token.',
        token: `mock-token-${channelName}-${uid}-${Date.now()}`,
        channelName,
        uid,
        role,
        expiresIn: privilegeExpireTime,
      };
    }

    // TODO (Phase 2): Generate production token using agora-token SDK
    return {
      success: true,
      token: `agora-token-${channelName}-${uid}`,
      channelName,
      uid,
      role,
      expiresIn: privilegeExpireTime,
    };
  }
}

module.exports = AgoraTokenService;
