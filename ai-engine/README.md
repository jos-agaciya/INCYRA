# INCYRA AI Incident Intelligence Engine

The **AI Incident Intelligence Engine** processes live voice/speech transcripts during an outage and extracts structured operational intelligence in real time.

## Architecture

```
ai-engine/
├── index.js                  # Main AI Incident Engine interface
├── models/
│   └── incidentState.js      # Structured Incident State (facts, hypotheses, decisions, actions, conflicts)
├── processors/
│   ├── classifier.js         # Categorizes statements (Fact, Hypothesis, Decision, Action, Risk)
│   ├── conflictDetector.js   # Detects metric or state contradictions between participants
│   ├── summaryGenerator.js   # Produces voice-ready spoken briefings and summaries
│   └── transcriptProcessor.js# Pipeline orchestrator
└── prompts/
    └── incidentPrompts.js    # LLM prompt schemas for Gemini / OpenAI integration
```

## Intelligence Taxonomy

1. **Facts (`FACT`)**: Confirmed telemetry, verified error codes (e.g. `502 Bad Gateway`, `CPU at 95%`).
2. **Hypotheses (`HYPOTHESIS`)**: Unproven speculations or theories (`"I think the cache might be cold"`).
3. **Decisions (`DECISION`)**: Agreed team decisions or executive orders.
4. **Action Items (`ACTION_ITEM`)**: Assigned tasks with owner, status, and urgency.
5. **Conflicts (`CONFLICT`)**: Inconsistent metrics or reports between participants flagged for human review without guessing.

## Integration Example

```javascript
const { defaultEngine } = require('../ai-engine');

// Ingest transcript from voice STT or mock feed
const result = defaultEngine.processTranscript({
  speaker: 'Alice (Lead)',
  text: 'The payment API is returning 502 errors. Database CPU is at 95%.',
  timestamp: new Date().toISOString()
});

console.log(result.state);
```
