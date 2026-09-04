# INCYRA

### Real-Time AI Voice Incident Commander

INCYRA is an AI-powered incident commander designed to participate in live technical and operational incident rooms. It listens to ongoing conversations in real time and transforms scattered discussions into structured incident intelligence.

## The Problem

During critical incidents such as system outages, teams receive information from multiple participants, tools, and discussions simultaneously. Confirmed facts can get mixed with assumptions, important actions may be missed, responsibilities can become unclear, and conflicting information can delay response.

INCYRA helps teams maintain a shared and continuously updated understanding of the incident.

## Our Solution

INCYRA joins a live incident voice room and acts as an intelligent coordination layer. It processes conversations in real time to identify and organize:

- Confirmed facts
- Hypotheses and assumptions
- Decisions
- Action items
- Task ownership
- Risks and unresolved issues
- Missing or conflicting information

The system maintains a live incident timeline, tracks the progress of actions, provides spoken status summaries, and generates a final incident report.

Critical actions always require explicit human confirmation.

## Key Features

- 🎙️ Real-time incident voice room
- 🤖 AI-powered conversational incident assistant
- 📝 Real-time speech-to-text processing
- 👥 Participant and role recognition
- ✅ Fact vs hypothesis classification
- 📌 Decision and action item extraction
- 👤 Task ownership and status tracking
- ⚠️ Conflict and missing information detection
- 🕒 Continuously updated incident timeline
- 🔊 Spoken AI status summaries
- 🛡️ Human-in-the-loop approval for critical actions
- 📄 Final incident summary with unresolved risks

## Example Scenario

A payment system experiences an outage.

Engineers, support teams, and business stakeholders join an incident room and share information:

> "The payment API is returning 502 errors."

> "Database CPU is currently at 95%."

Later, another participant reports:

> "I'm seeing database CPU at only 40%."

INCYRA records the confirmed API failure, tracks the database issue as an investigation point, detects the conflicting CPU values, flags them for verification, assigns investigation tasks, and updates the incident timeline without assuming which value is correct.

## How It Works

Users join an Incident Voice Room
            ↓
        Agora RTC
            ↓
      INCYRA AI Agent
            ↓
Speech-to-Text → AI Intelligence Engine
            ↓
Facts | Hypotheses | Decisions | Actions
            ↓
Conflict Detection + Incident State
            ↓
Live Dashboard + Incident Timeline
            ↓
Spoken Status Summaries
            ↓
Human Approval for Critical Actions

Tech Stack
Real-Time Communication
Agora RTC
Agora Conversational AI / Agents SDK
AI & Voice
Real-time Speech-to-Text
Large Language Model for incident intelligence
Text-to-Speech
Application
React
Node.js
Real-time backend APIs
Database for incident state and history
Core Principle

INCYRA does not replace incident response teams or independently determine the root cause. It helps humans stay aligned by maintaining a clear distinction between what is confirmed, what is assumed, what remains unresolved, and what actions need to be taken.

Team Member Role
Jos Agaciya J	AI/ML & Incident Intelligence Lead
Venkat Rajh P R	Real-Time Voice & Backend Lead
Nakul R	Frontend & Integration Lead

Built For
EchoSphere Hackathon 2026
Track: Voice AI Incident Commander

Turn chaotic incident conversations into structured, shared operational intelligence.
