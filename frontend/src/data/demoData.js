// INCYRA Clean Initial Incident State (Real Participants Only, Genuinely Empty)

export const initialIncidentData = {
  incident: {
    id: "INC-8921",
    title: "Active Incident",
    service: "Under Investigation",
    status: "Investigating",
    severity: "SEV-1",
    declaredAt: "Just now",
    elapsedSeconds: 0,
    commander: "Incident Commander",
  },
  metrics: {
    status: "Investigating",
    severity: "SEV-1",
    participants: 1,
    openActions: 0,
    completedActions: 0,
    conflicts: 0,
    confirmedDecisions: 0,
    totalDecisions: 0,
    unresolvedRisks: 0,
  },
  participants: [
    {
      id: "local-user",
      name: "You (Incident Commander)",
      role: "Incident Commander",
      initials: "YOU",
      isSpeaking: false,
      isActive: true,
      isLocal: true,
      audioLevel: 0,
    },
  ],
  aiObservation: {
    title: "Live Incident Intelligence",
    observation:
      "INCYRA initialized. Monitoring live incident voice room for telemetry, hypotheses, and action items.",
    confidence: "96%",
    lastUpdated: "Just now",
    listening: true,
  },
  briefing: {
    summary:
      "Incident session initialized. Awaiting participant observations and telemetry reports.",
    lastUpdated: "Just now",
    version: "v1",
  },
  timeline: [],
  facts: [],
  hypotheses: [],
  conflicts: [],
  actions: [],
  decisions: [],
  risks: [],
  proposedCriticalAction: null,
};

