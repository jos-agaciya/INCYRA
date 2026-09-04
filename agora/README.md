# INCYRA Agora Voice & Conversational AI Integration

This module manages server-side integration between **INCYRA** and the **Agora Conversational AI Agent Service** (and future Agora RTC voice rooms).

---

## 1. Architecture Flow

```
Frontend (Web / Dashboard)
    ↓
INCYRA Backend (Express API)
    ↓  (Server-to-Server REST with Basic Auth)
Agora REST API (/v2/projects/{AGORA_APP_ID}/join)
    ↓
Published INCYRA Conversational AI Agent
    ↓
Agora RTC Voice Channel (Incident War Room)
```

---

## 2. Directory Structure

```
agora/
├── index.js                     # Unified module export (clients, managers, singletons)
├── rtc/
│   ├── tokenService.js          # Token generation stub for RTC voice access
│   └── channelManager.js        # In-memory incident voice room & session tracker
├── conversational-ai/
│   ├── agoraApiClient.js        # Agora Conversational AI REST API client (join/manage)
│   └── agentManager.js          # High-level coordinator for agent channel joins & state
└── README.md                    # Integration guide & architecture documentation
```

---

## 3. How Authentication & Join Works

1. **Published Agent Pipeline**: The conversational voice agent (ASR + LLM + TTS) is configured and published inside the Agora Console under a specific `AGORA_PIPELINE_ID`.
2. **Server-Side Basic Auth**:
   - The backend encodes `AGORA_CUSTOMER_ID:AGORA_CUSTOMER_SECRET` into a Base64 Basic Authorization header:
     `Authorization: Basic <base64(CUSTOMER_ID:CUSTOMER_SECRET)>`
   - **Critical Security Principle**: Credentials remain strictly on the backend. The frontend never receives Customer Secrets or App Certificates.
3. **Join Request**:
   - Backend sends `POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{AGORA_APP_ID}/join`
   - Request Body:
     ```json
     {
       "name": "channel-name",
       "pipeline_id": "your_agora_pipeline_id"
     }
     ```
4. **Agent Enters Channel**: The Agora agent joins the voice room as an AI participant, listening to live conversation and providing voice feedback.

---

## 4. Environment Configuration

Configure the following variables in `.env` (use placeholders in `.env.example`):

```env
# Agora Credentials
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
AGORA_PIPELINE_ID=your_pipeline_id
```

---

## 5. API Endpoints

### Request Agent to Join Channel
* **Method**: `POST /api/agora/join`
* **Request Body**:
  ```json
  {
    "channelName": "incident-room-alpha"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "INCYRA agent join request submitted",
    "channelName": "incident-room-alpha",
    "agent": {
      "agentId": "...",
      "status": "JOINING"
    }
  }
  ```

### Check Agora Integration Status
* **Method**: `GET /api/agora/status`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "configured": true,
      "pipelineConfigured": true,
      "agentIntegration": "ready",
      "activeChannels": []
    }
  }
  ```

---

## 6. Relationship with the INCYRA AI Engine & Next Steps

* **Current State**: The `ai-engine/` module independently processes and categorizes incident intelligence (`FACT`, `HYPOTHESIS`, `DECISION`, `ACTION_ITEM`, `CONFLICT`). The Agora REST integration allows the published voice agent to join channels on demand.
* **Next Integration Step**: Connect live Agora Speech-to-Text (STT) real-time data stream/webhooks directly into `ai-engine/processors/transcriptProcessor.js` so spoken dialogue automatically updates the incident intelligence state in real time.
