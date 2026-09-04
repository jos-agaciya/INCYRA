/**
 * INCYRA API Client Service
 * Communicates with backend endpoints:
 *  - Authentication: /api/auth/register, /api/auth/login, /api/auth/me
 *  - Incident Rooms: /api/rooms, /api/rooms/:roomId, /api/rooms/:roomId/join, /api/rooms/:roomId/members, /api/rooms/:roomId/share
 *  - Incident Intelligence (room-scoped & legacy): /api/incident/*, /api/rooms/:roomId/*
 *  - Agora Voice RTC: /api/agora/token, /api/agora/join, /api/agora/status
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('incyra_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const apiService = {
  // -------------------------------------------------------------------------
  // AUTHENTICATION APIS
  // -------------------------------------------------------------------------
  async register({ name, email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    if (data.token) {
      localStorage.setItem('incyra_token', data.token);
    }
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    if (data.token) {
      localStorage.setItem('incyra_token', data.token);
    }
    return data;
  },

  async getMe() {
    const token = localStorage.getItem('incyra_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      localStorage.removeItem('incyra_token');
      return null;
    }
    const data = await res.json();
    return data.user;
  },

  logout() {
    localStorage.removeItem('incyra_token');
  },

  // -------------------------------------------------------------------------
  // INCIDENT ROOMS APIS
  // -------------------------------------------------------------------------
  async createRoom({ title, description = '', severity = 'SEV-1', service = 'Under Investigation' }) {
    const res = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, description, severity, service }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create room.');
    return data;
  },

  async listRooms() {
    const res = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list rooms.');
    return data.rooms || [];
  },

  async getRoom(roomId) {
    const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Room not found.');
    return data.room;
  },

  async joinRoom(roomId) {
    const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join room.');
    return data;
  },

  async getRoomMembers(roomId) {
    const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/members`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get members.');
    return data.members || [];
  },

  async getShareInfo(roomId) {
    const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/share`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get share info.');
    return data;
  },

  // -------------------------------------------------------------------------
  // HEALTH CHECK
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // INCIDENT INTELLIGENCE STATE (Room-Scoped with Legacy Fallback)
  // -------------------------------------------------------------------------
  async getIncidentState(roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/state` : `${API_BASE_URL}/api/incident/state`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Fetch incident state failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async postTranscript(payload, roomId = null) {
    try {
      const targetRoomId = roomId || payload.roomId;
      const url = targetRoomId ? `${API_BASE_URL}/api/rooms/${targetRoomId}/transcript` : `${API_BASE_URL}/api/incident/transcript`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...payload, roomId: targetRoomId }),
      });
      if (!res.ok) throw new Error(`Post transcript failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async resetIncident(roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/reset` : `${API_BASE_URL}/api/incident/reset`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Reset incident failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  // -------------------------------------------------------------------------
  // ACTION ITEMS (Room-Scoped with Legacy Fallback)
  // -------------------------------------------------------------------------
  async getActionItems(roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/actions` : `${API_BASE_URL}/api/incident/actions`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Get action items failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async createActionItem(actionData, roomId = null) {
    try {
      const targetRoomId = roomId || actionData.roomId;
      const url = targetRoomId ? `${API_BASE_URL}/api/rooms/${targetRoomId}/actions` : `${API_BASE_URL}/api/incident/actions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(actionData),
      });
      if (!res.ok) throw new Error(`Create action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async updateActionItem(id, updates, roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/actions/${id}` : `${API_BASE_URL}/api/incident/actions/${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Update action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async deleteActionItem(id, roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/actions/${id}` : `${API_BASE_URL}/api/incident/actions/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Delete action item failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  // -------------------------------------------------------------------------
  // DECISIONS (Room-Scoped with Legacy Fallback)
  // -------------------------------------------------------------------------
  async getDecisions(roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/decisions` : `${API_BASE_URL}/api/incident/decisions`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Get decisions failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async createDecision(decisionData, roomId = null) {
    try {
      const targetRoomId = roomId || decisionData.roomId;
      const url = targetRoomId ? `${API_BASE_URL}/api/rooms/${targetRoomId}/decisions` : `${API_BASE_URL}/api/incident/decisions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(decisionData),
      });
      if (!res.ok) throw new Error(`Create decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async updateDecision(id, updates, roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/decisions/${id}` : `${API_BASE_URL}/api/incident/decisions/${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Update decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async deleteDecision(id, roomId = null) {
    try {
      const url = roomId ? `${API_BASE_URL}/api/rooms/${roomId}/decisions/${id}` : `${API_BASE_URL}/api/incident/decisions/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Delete decision failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  // -------------------------------------------------------------------------
  // AGORA VOICE RTC APIS
  // -------------------------------------------------------------------------
  async getAgoraToken(channelName, uid = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ channel: channelName, uid }),
      });
      if (!res.ok) throw new Error(`Get Agora token failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  },

  async joinAgoraAgent(channelName, remoteRtcUids = []) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ channel: channelName, remote_rtc_uids: remoteRtcUids }),
      });
      if (!res.ok) throw new Error(`Join Agora agent failed: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      throw err;
    }
  },

  async getAgoraStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Get Agora status failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async getAgoraAgentStatus(agentId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/agent/${agentId}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Get agent status failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async stopAgoraAgent(agentId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agora/stop`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error(`Stop agent failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      throw err;
    }
  },
};
