/**
 * INCYRA API Client Service
 * Communicates with backend endpoints:
 *  GET  /api/health
 *  GET  /api/incident/state
 *  POST /api/incident/transcript
 *  POST /api/incident/reset
 *  GET  /api/incident/actions
 *  POST /api/incident/actions
 *  PATCH /api/incident/actions/:id
 *  DELETE /api/incident/actions/:id
 *  GET  /api/incident/decisions
 *  POST /api/incident/decisions
 *  PATCH /api/incident/decisions/:id
 *  DELETE /api/incident/decisions/:id
 *  POST /api/agora/token
 *  POST /api/agora/join
 *  GET  /api/agora/status
 *  GET  /api/agora/agent/:agentId/status
 *  POST /api/agora/stop
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiService = {
  /**
   * Health check
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  },

  /**
   * Fetch live incident state
   */
  async getIncidentState() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/state`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Fetch incident state failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Send speech-to-text transcript utterance to backend
   * @param {{ speaker: string, text: string, timestamp?: string }} payload
   */
  async postTranscript(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Post transcript failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Reset or reseed incident state
   */
  async resetIncident() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Reset incident failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Action Items API
   */
  async getActionItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/actions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Fetch action items failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async createActionItem(actionData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      });
      if (!res.ok) throw new Error(`Create action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async updateActionItem(id, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/actions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Update action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async deleteActionItem(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/actions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Delete action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  /**
   * Decisions API
   */
  async getDecisions() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/decisions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Fetch decisions failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async createDecision(decisionData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionData),
      });
      if (!res.ok) throw new Error(`Create decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async updateDecision(id, updates) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/decisions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Update decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async deleteDecision(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incident/decisions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Delete decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  /**
   * Fetch secure Agora RTC token for channel & UID
   * @param {string} channelName
   * @param {number} [uid]
   */
  async getAgoraToken(channelName, uid = 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to fetch RTC token (${res.status})`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Request published INCYRA Conversational AI agent to enter Agora channel
   * @param {string} channelName
   */
  async joinAgoraAgent(channelName) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Agora agent join failed (${res.status})`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Get Agora integration readiness status
   */
  async getAgoraStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Query live agent session status from Agora
   * @param {string} agentId
   */
  async getAgentLiveStatus(agentId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/agent/${encodeURIComponent(agentId)}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Stop agent session in channel
   * @param {string} channelName
   */
  async stopAgoraAgent(channelName) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
