/**
 * INCYRA - Agora Conversational AI REST API Client
 *
 * Implements the server-to-server REST communication with Agora Conversational AI Agent service.
 * Endpoint: POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{PROJECT_OR_APP_ID}/join
 *
 * Security:
 * - Basic Authentication uses Base64(AGORA_CUSTOMER_ID:AGORA_CUSTOMER_SECRET).
 * - Credentials and authorization headers are never logged or exposed in API responses.
 * - Dynamic RTC Token is minted for the agent using AGORA_APP_CERTIFICATE.
 */

const AgoraTokenService = require('../rtc/tokenService');

class AgoraApiClient {
  /**
   * @param {Object} options
   * @param {string} [options.appId] - Agora App ID / Project Identifier
   * @param {string} [options.appCertificate] - Agora App Certificate for RTC token generation
   * @param {string} [options.customerId] - Agora REST Customer ID
   * @param {string} [options.customerSecret] - Agora REST Customer Secret
   * @param {string} [options.pipelineId] - Agora Conversational AI Published Pipeline ID
   * @param {string|number} [options.agentRtcUid] - RTC User ID for the AI Agent
   * @param {string|Array} [options.remoteRtcUids] - Remote RTC User IDs to subscribe to (e.g. ['*'] or [1002])
   * @param {string} [options.asrResourceId] - Deepgram ASR resource ID
   * @param {string} [options.llmResourceId] - OpenAI LLM resource ID
   * @param {string} [options.ttsResourceId] - MiniMax TTS resource ID
   * @param {string} [options.baseUrl] - Base Agora API URL (default: https://api.agora.io)
   */
  constructor(options = {}) {
    this._appId = options.appId;
    this._appCertificate = options.appCertificate;
    this._customerId = options.customerId;
    this._customerSecret = options.customerSecret;
    this._pipelineId = options.pipelineId;
    this._agentRtcUid = options.agentRtcUid;
    this._remoteRtcUids = options.remoteRtcUids;
    this._asrResourceId = options.asrResourceId;
    this._llmResourceId = options.llmResourceId;
    this._ttsResourceId = options.ttsResourceId;
    this.baseUrl = (options.baseUrl || 'https://api.agora.io').replace(/\/+$/, '');
  }

  get appId() {
    return this._appId !== undefined ? this._appId : (process.env.AGORA_APP_ID || '');
  }

  get appCertificate() {
    return this._appCertificate !== undefined ? this._appCertificate : (process.env.AGORA_APP_CERTIFICATE || '');
  }

  get customerId() {
    return this._customerId !== undefined ? this._customerId : (process.env.AGORA_CUSTOMER_ID || '');
  }

  get customerSecret() {
    return this._customerSecret !== undefined ? this._customerSecret : (process.env.AGORA_CUSTOMER_SECRET || '');
  }

  get pipelineId() {
    return this._pipelineId !== undefined ? this._pipelineId : (process.env.AGORA_PIPELINE_ID || '');
  }

  get agentRtcUid() {
    return this._agentRtcUid !== undefined ? this._agentRtcUid : (process.env.AGORA_AGENT_RTC_UID || '');
  }

  get remoteRtcUids() {
    return this._remoteRtcUids !== undefined ? this._remoteRtcUids : (process.env.AGORA_REMOTE_RTC_UIDS || '');
  }

  get asrResourceId() {
    return this._asrResourceId !== undefined ? this._asrResourceId : (process.env.AGORA_ASR_RESOURCE_ID || '');
  }

  get llmResourceId() {
    return this._llmResourceId !== undefined ? this._llmResourceId : (process.env.AGORA_LLM_RESOURCE_ID || '');
  }

  get ttsResourceId() {
    return this._ttsResourceId !== undefined ? this._ttsResourceId : (process.env.AGORA_TTS_RESOURCE_ID || '');
  }

  /**
   * Parses AGORA_REMOTE_RTC_UIDS into a valid array. Defaults to ['*'] if unspecified.
   * @returns {Array<string|number>}
   */
  parseRemoteRtcUids() {
    const raw = this.remoteRtcUids;
    if (!raw || (typeof raw === 'string' && raw.trim() === '')) {
      return ['*'];
    }

    if (Array.isArray(raw)) {
      return raw;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          // fallback
        }
      }
      if (trimmed === '*' || trimmed === '"*"') {
        return ['*'];
      }
      return trimmed
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
        .map((item) => {
          if (item === '*') return '*';
          const num = Number(item);
          return isNaN(num) ? item : num;
        });
    }

    return ['*'];
  }

  /**
   * Checks if required credentials and resource IDs are configured.
   * @returns {{ configured: boolean, missing: string[] }}
   */
  checkConfiguration() {
    const missing = [];
    if (!this.appId) missing.push('AGORA_APP_ID');
    if (!this.customerId) missing.push('AGORA_CUSTOMER_ID');
    if (!this.customerSecret) missing.push('AGORA_CUSTOMER_SECRET');
    if (!this.pipelineId) missing.push('AGORA_PIPELINE_ID');
    if (!this.agentRtcUid) missing.push('AGORA_AGENT_RTC_UID');
    if (!this.asrResourceId) missing.push('AGORA_ASR_RESOURCE_ID');
    if (!this.llmResourceId) missing.push('AGORA_LLM_RESOURCE_ID');
    if (!this.ttsResourceId) missing.push('AGORA_TTS_RESOURCE_ID');

    return {
      configured: missing.length === 0,
      missing,
    };
  }

  /**
   * Generates Basic Authentication header value.
   * NEVER log or expose this value.
   * @returns {string} "Basic <base64>"
   */
  getBasicAuthHeader() {
    if (!this.customerId || !this.customerSecret) {
      throw new Error('Agora Customer ID and Customer Secret are required for authentication.');
    }
    const credentials = `${this.customerId}:${this.customerSecret}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Builds the complete properties structure required by Agora Conversational AI Agent.
   * @returns {Object}
   */
  buildDefaultProperties() {
    return {
      asr: {
        vendor: 'deepgram',
        params: {
          resource_id: this.asrResourceId,
          model: 'nova-3',
          keyterm: '',
          language: 'en',
        },
      },
      llm: {
        vendor: 'openai',
        params: {
          model: 'gpt-4o-mini',
          resource_id: this.llmResourceId,
        },
        system_messages: [
          {
            role: 'system',
            content:
              'You are INCYRA, a real-time AI Incident Commander assisting teams during technical and operational incidents. Listen carefully to all participants and maintain a shared understanding of the incident. Distinguish confirmed facts from hypotheses and assumptions. Track decisions, action items, task owners, unresolved risks, missing information and conflicting statements. Maintain a continuously updated incident timeline. Never claim to know the root cause unless it is explicitly confirmed by a participant or supported by verified evidence. When information conflicts, clearly highlight the conflict and request human verification. Provide concise spoken status summaries when appropriate. Before any critical action is executed, require explicit human confirmation. Stay calm, neutral, precise and concise.',
          },
        ],
        greeting_message:
          "INCYRA online. I'm monitoring the incident room and tracking confirmed facts, hypotheses, decisions, actions, and unresolved risks. Please state the current incident status.",
        failure_message: 'Please hold on a second.',
      },
      tts: {
        vendor: 'minimax',
        params: {
          model: 'speech-2.6-turbo',
          resource_id: this.ttsResourceId,
          voice_id: 'English_captivating_female1',
        },
      },
    };
  }

  /**
   * Constructs the final outgoing request body payload sent to Agora REST API.
   *
   * @param {string} channelName
   * @param {string} [customPipelineId]
   * @param {Object} [customProperties]
   * @returns {Object} Final payload with top-level name, agent_rtc_uid, remote_rtc_uids, pipeline_id, and properties
   */
  buildRequestBody(channelName, customPipelineId = null, customProperties = {}) {
    const cleanChannelName = (channelName || '').trim();
    const activePipelineId = customPipelineId || this.pipelineId;
    const rtcUidNum = Number(this.agentRtcUid);
    const remoteUids = this.parseRemoteRtcUids();

    // Generate valid RTC token for the agent if certificate is configured
    let agentToken = '';
    if (this.appId && this.appCertificate) {
      try {
        const tokenService = new AgoraTokenService({
          appId: this.appId,
          appCertificate: this.appCertificate,
        });
        const tokenObj = tokenService.generateRtcToken(cleanChannelName, rtcUidNum, 'publisher', 3600);
        agentToken = tokenObj.token;
      } catch (err) {
        console.warn('[INCYRA] Note: Could not generate agent token:', err.message);
      }
    }

    const defaultProps = this.buildDefaultProperties();
    const properties = {
      channel: cleanChannelName,
      token: agentToken,
      agent_rtc_uid: String(rtcUidNum),
      remote_rtc_uids: remoteUids.map((u) => String(u)),
      idle_timeout: 3600,
      ...defaultProps,
      ...customProperties,
      ...(customProperties.asr && { asr: { ...defaultProps.asr, ...customProperties.asr } }),
      ...(customProperties.llm && { llm: { ...defaultProps.llm, ...customProperties.llm } }),
      ...(customProperties.tts && { tts: { ...defaultProps.tts, ...customProperties.tts } }),
    };

    return {
      name: cleanChannelName,
      agent_rtc_uid: rtcUidNum,
      remote_rtc_uids: remoteUids,
      pipeline_id: activePipelineId,
      properties,
    };
  }

  /**
   * Requests Agora Conversational AI Agent to join an RTC voice channel.
   *
   * @param {string} channelName - Name of the Agora RTC channel (incident voice room)
   * @param {string} [customPipelineId] - Optional override for pipeline ID
   * @param {Object} [customProperties] - Optional additional/override properties
   * @returns {Promise<{ success: boolean, status: number, data: Object }>}
   */
  async joinChannel(channelName, customPipelineId = null, customProperties = {}) {
    if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
      const err = new Error('channelName is required and must be a non-empty string.');
      err.statusCode = 400;
      throw err;
    }

    const configCheck = this.checkConfiguration();
    if (!configCheck.configured) {
      const err = new Error(`Agora integration is not configured. Missing: ${configCheck.missing.join(', ')}`);
      err.statusCode = 503;
      err.missing = configCheck.missing;
      throw err;
    }

    const rtcUidNum = Number(this.agentRtcUid);
    if (!this.agentRtcUid || isNaN(rtcUidNum) || rtcUidNum <= 0 || !Number.isInteger(rtcUidNum)) {
      const err = new Error('AGORA_AGENT_RTC_UID must be a valid positive integer.');
      err.statusCode = 400;
      throw err;
    }

    const endpointUrl = `${this.baseUrl}/api/conversational-ai-agent/v2/projects/${encodeURIComponent(this.appId)}/join`;
    const requestBody = this.buildRequestBody(channelName, customPipelineId, customProperties);

    let response;
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      const err = new Error(`Failed to communicate with Agora API: ${networkError.message}`);
      err.statusCode = 502;
      throw err;
    }

    let responseData;
    const rawText = await response.text();
    try {
      responseData = rawText ? JSON.parse(rawText) : {};
    } catch {
      responseData = { message: rawText };
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && (responseData.message || responseData.msg || responseData.detail || responseData.error)) ||
        `Agora API error (HTTP ${response.status})`;

      const err = new Error(errorMessage);
      err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 502;
      err.agoraResponse = responseData;
      throw err;
    }

    return {
      success: true,
      status: response.status,
      data: responseData,
    };
  }

  /**
   * Query live agent session status from Agora REST API
   * GET /api/conversational-ai-agent/v2/projects/{appId}/agents/{agentId}
   * @param {string} agentId
   */
  async getAgentSession(agentId) {
    if (!agentId || typeof agentId !== 'string') {
      const err = new Error('agentId is required.');
      err.statusCode = 400;
      throw err;
    }

    const endpointUrl = `${this.baseUrl}/api/conversational-ai-agent/v2/projects/${encodeURIComponent(this.appId)}/agents/${encodeURIComponent(agentId.trim())}`;
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const rawText = await response.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { message: rawText };
    }

    if (!response.ok) {
      const err = new Error(data.message || `Failed to fetch agent status (${response.status})`);
      err.statusCode = response.status;
      err.agoraResponse = data;
      throw err;
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  }

  /**
   * Stop an active agent session via Agora REST API
   * POST /api/conversational-ai-agent/v2/projects/{appId}/agents/{agentId}/leave
   * @param {string} agentId
   */
  async leaveAgentSession(agentId) {
    if (!agentId || typeof agentId !== 'string') {
      const err = new Error('agentId is required.');
      err.statusCode = 400;
      throw err;
    }

    const endpointUrl = `${this.baseUrl}/api/conversational-ai-agent/v2/projects/${encodeURIComponent(this.appId)}/agents/${encodeURIComponent(agentId.trim())}/leave`;
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.getBasicAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const rawText = await response.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { message: rawText };
    }

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  }
}

module.exports = AgoraApiClient;
