# INCYRA Agora Voice & Conversational AI Integration

This module prepares the infrastructure for connecting INCYRA to **Agora RTC** (voice rooms) and **Agora Conversational AI / Agents SDK**.

## Architecture Overview

```
agora/
├── index.js                     # Module entry point
├── rtc/
│   ├── tokenService.js          # Token generator for client & bot authentication
│   └── channelManager.js        # Incident voice room channel state tracking
├── conversational-ai/
│   └── agentManager.js          # Agora Conversational AI Agent lifecycle coordinator
└── README.md                    # Integration guide & roadmap
```

## Future Implementation Roadmap

1. **RTC Voice Channels (`/agora/rtc`)**:
   - Install `agora-access-token` for generating dynamic join tokens.
   - Provide backend token endpoint `GET /api/agora/token?channel=xxx`.

2. **Agora Conversational AI / Agents SDK (`/agora/conversational-ai`)**:
   - Connect Agora Real-Time Speech-to-Text (STT) stream directly into `ai-engine/processors/transcriptProcessor.js`.
   - Send spoken commander briefings and conflict warnings back to the voice channel using Agora Text-to-Speech (TTS).

3. **Frontend Connection**:
   - Frontend Agora Web SDK joins the voice channel, renders participant speaking states, and listens for live incident alerts.
