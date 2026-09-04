/**
 * INCYRA - Agora RTC Token Service
 * Generates secure Agora RTC tokens for voice incident rooms.
 * Uses AGORA_APP_ID and AGORA_APP_CERTIFICATE.
 */

const path = require('path');

let RtcTokenBuilder, RtcRole;
try {
  ({ RtcTokenBuilder, RtcRole } = require('agora-token'));
} catch (e) {
  try {
    const backendPath = path.resolve(__dirname, '../../backend/node_modules/agora-token');
    ({ RtcTokenBuilder, RtcRole } = require(backendPath));
  } catch (err) {
    console.error('Failed to load agora-token module:', err.message);
  }
}

class AgoraTokenService {
  /**
   * @param {Object} [config]
   * @param {string} [config.appId]
   * @param {string} [config.appCertificate]
   */
  constructor(config = {}) {
    this._appId = config.appId;
    this._appCertificate = config.appCertificate;
  }

  get appId() {
    return this._appId !== undefined ? this._appId : (process.env.AGORA_APP_ID || '');
  }

  get appCertificate() {
    return this._appCertificate !== undefined ? this._appCertificate : (process.env.AGORA_APP_CERTIFICATE || '');
  }

  /**
   * Generate an RTC Token for a voice incident room.
   * @param {string} channelName - Agora channel / room name (e.g. 'incident-room-101')
   * @param {number} [uid] - User ID (0 or omitted for random positive numeric UID)
   * @param {string} [role] - 'publisher' | 'subscriber' (default: 'publisher')
   * @param {number} [privilegeExpireTime] - Expiration in seconds (default 3600)
   * @returns {{ success: boolean, appId: string, channelName: string, uid: number, token: string, expiresIn: number }}
   */
  generateRtcToken(channelName, uid = 0, role = 'publisher', privilegeExpireTime = 3600) {
    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      const err = new Error('channelName is required to generate an RTC token.');
      err.statusCode = 400;
      throw err;
    }

    if (!this.appId || !this.appCertificate) {
      const err = new Error('Agora App ID and App Certificate are required for RTC token generation.');
      err.statusCode = 503;
      throw err;
    }

    if (!RtcTokenBuilder || !RtcRole) {
      const err = new Error('agora-token dependency is not available.');
      err.statusCode = 500;
      throw err;
    }

    const cleanChannel = channelName.trim();
    const numericUid = uid && Number(uid) > 0 ? Number(uid) : Math.floor(100000 + Math.random() * 900000);
    const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const tokenExpireTime = privilegeExpireTime || 3600;
    const privilegeExpire = tokenExpireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      cleanChannel,
      numericUid,
      rtcRole,
      tokenExpireTime,
      privilegeExpire
    );

    return {
      success: true,
      appId: this.appId,
      channelName: cleanChannel,
      uid: numericUid,
      token,
      expiresIn: tokenExpireTime,
    };
  }
}

module.exports = AgoraTokenService;
