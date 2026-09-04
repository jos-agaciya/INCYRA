import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initialIncidentData } from '../data/demoData';
import { apiService } from '../services/api';
import { agoraService } from '../services/agora';

export function useIncidentData(activeRoomId = null, currentUser = null) {
  const [data, setData] = useState(initialIncidentData);
  const [roomMembers, setRoomMembers] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Elapsed incident timer (seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Once-per-session room greeting flag
  const hasSpokenInitialGreeting = useRef(false);

  // Voice room RTC state
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rtcParticipants, setRtcParticipants] = useState([]);
  const [speakingMap, setSpeakingMap] = useState({});

  // Dynamic channel name
  const channelName = useMemo(() => {
    if (activeRoomId) {
      return `agora-incident-${activeRoomId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }
    if (data.incident && data.incident.id) {
      return `agora-incident-${data.incident.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }
    return 'agora-incident-inc8921';
  }, [activeRoomId, data.incident]);

  // Tick the live incident timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed time as HH:MM:SS
  const formattedElapsedTime = useCallback(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  }, [elapsedSeconds]);

  // Helper to normalize backend state into frontend structure
  const applyBackendState = useCallback((backendState) => {
    if (!backendState) return;
    const raw = backendState.data || backendState;

    setData((prev) => {
      const incident = raw.incident || {
        ...prev.incident,
        id: raw.incidentId || activeRoomId || prev.incident.id,
        title: raw.title || prev.incident.title,
        status: raw.status || prev.incident.status,
        severity: raw.severity || prev.incident.severity,
        service: raw.service || prev.incident.service,
        commander: raw.commander || prev.incident.commander,
      };

      const actions = raw.actions || raw.actionItems || [];
      const decisions = raw.decisions || [];
      const openActionsCount = actions.filter((a) => a.status === 'OPEN' || a.status === 'IN_PROGRESS' || a.status === 'BLOCKED').length;
      const completedActionsCount = actions.filter((a) => a.status === 'COMPLETED').length;
      const confirmedDecisionsCount = decisions.filter((d) => d.status === 'CONFIRMED').length;

      const metrics = raw.metrics || {
        status: incident.status,
        severity: incident.severity,
        participants: raw.participants?.length || prev.metrics.participants || 1,
        openActions: openActionsCount,
        completedActions: completedActionsCount,
        conflicts: (raw.conflicts || []).filter((c) => !c.resolved).length,
        confirmedDecisions: confirmedDecisionsCount,
        totalDecisions: decisions.length,
        unresolvedRisks: (raw.risks || []).filter((r) => r.status !== 'RESOLVED').length,
      };

      const briefing = raw.briefing || {
        summary: raw.summary || prev.briefing.summary,
        lastUpdated: new Date().toISOString().substring(11, 16) + ' UTC',
        version: `v${raw.version || 1}`,
      };

      const aiObservation = raw.aiObservation || {
        title: 'Live Incident Intelligence',
        observation: raw.summary || prev.aiObservation.observation,
        confidence: '95%',
        lastUpdated: 'Just now',
        listening: true,
      };

      return {
        ...prev,
        incident,
        metrics,
        briefing,
        aiObservation,
        facts: raw.facts !== undefined ? raw.facts : prev.facts,
        hypotheses: raw.hypotheses !== undefined ? raw.hypotheses : prev.hypotheses,
        conflicts: raw.conflicts !== undefined ? raw.conflicts : prev.conflicts,
        actions: actions,
        decisions: decisions,
        risks: raw.risks !== undefined ? raw.risks : prev.risks,
        timeline: raw.timeline !== undefined ? raw.timeline : prev.timeline,
        proposedCriticalAction: raw.proposedCriticalAction !== undefined ? raw.proposedCriticalAction : prev.proposedCriticalAction,
      };
    });
  }, [activeRoomId]);

  // Fetch incident state from backend
  const fetchState = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const response = await apiService.getIncidentState(activeRoomId);
      if (response && response.success) {
        applyBackendState(response);
        setIsDemoMode(false);
        setIsBackendConnected(true);
        setError(null);
      }

      // If activeRoomId, also fetch room members
      if (activeRoomId) {
        const members = await apiService.getRoomMembers(activeRoomId).catch(() => []);
        setRoomMembers(members);
      }
    } catch (err) {
      console.warn('[STATE] Backend state fetch note:', err.message);
      setIsBackendConnected(false);
      setIsDemoMode(true);
    } finally {
      setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, [activeRoomId, applyBackendState]);

  // Initial load and periodic background poll
  useEffect(() => {
    fetchState();
    const pollInterval = setInterval(() => {
      fetchState(false);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [fetchState]);

  // Subscribe to Live Transcripts from Speech Recognition & Agora RTC DataStream
  useEffect(() => {
    const unsubTranscript = agoraService.handleTranscript(async (transcriptPayload) => {
      try {
        console.log(`[TRANSCRIPT PIPELINE] Ingesting speech utterance for room "${activeRoomId}": "${transcriptPayload.text}" (speaker: ${transcriptPayload.speaker})`);
        const payloadWithRoom = {
          ...transcriptPayload,
          roomId: activeRoomId,
          speaker: currentUser?.name || transcriptPayload.speaker || 'Incident Responder',
        };
        const result = await apiService.postTranscript(payloadWithRoom, activeRoomId);
        if (result && result.success) {
          const updatedState = result.state || result.data;
          if (updatedState) {
            applyBackendState(updatedState);
            setIsBackendConnected(true);
            setIsDemoMode(false);
            console.log(`[TRANSCRIPT PIPELINE] Live incident state updated for room ${activeRoomId}`);
          }

          // Trigger INCYRA AI Spoken Voice Response
          const spokenText = result.spokenResponse || result.aiResponse?.text;
          if (spokenText) {
            console.log(`[AI RESPONSE PIPELINE] Playing spoken response: "${spokenText}"`);
            agoraService.playAIVoiceResponse(spokenText);
          }
        }
      } catch (err) {
        console.error('[TRANSCRIPT PIPELINE] Error dispatching live transcript to backend:', err);
      }
    });

    return () => {
      unsubTranscript();
    };
  }, [activeRoomId, currentUser, applyBackendState]);

  // Subscribe to Agora RTC Service events
  useEffect(() => {
    const unsubConnection = agoraService.handleConnectionState((state) => {
      setVoiceConnected(state === 'CONNECTED');
      if (state === 'CONNECTED' || state === 'DISCONNECTED') {
        setIsVoiceConnecting(false);
      }
    });

    const unsubParticipants = agoraService.handleParticipantUpdate((participants) => {
      setRtcParticipants(participants);
    });

    const unsubVolume = agoraService.handleVolumeIndicator(({ uid, level, isSpeaking }) => {
      setSpeakingMap((prev) => ({
        ...prev,
        [uid]: isSpeaking,
      }));
    });

    return () => {
      unsubConnection();
      unsubParticipants();
      unsubVolume();
    };
  }, []);

  // ------------------------------------------------------------------------
  // ACTION ITEMS MUTATIONS (Room-Scoped)
  // ------------------------------------------------------------------------
  const createActionItem = useCallback(async (actionData) => {
    try {
      const payload = {
        ...actionData,
        roomId: activeRoomId,
      };
      const res = await apiService.createActionItem(payload, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        // Optimistic local fallback
        setData((prev) => {
          const newItem = {
            id: `act-${Date.now()}`,
            roomId: activeRoomId,
            title: actionData.title,
            description: actionData.description || '',
            priority: actionData.priority || 'HIGH',
            assignee: actionData.assignee || null,
            status: actionData.status || 'OPEN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const updatedActions = [newItem, ...prev.actions];
          return {
            ...prev,
            actions: updatedActions,
            metrics: {
              ...prev.metrics,
              openActions: updatedActions.filter((a) => a.status !== 'COMPLETED').length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[ACTION ITEM] Error creating action item:', err);
    }
  }, [activeRoomId, applyBackendState]);

  const updateActionItem = useCallback(async (actionId, updates) => {
    try {
      const res = await apiService.updateActionItem(actionId, updates, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        setData((prev) => {
          const updatedActions = prev.actions.map((a) => (a.id === actionId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
          return {
            ...prev,
            actions: updatedActions,
            metrics: {
              ...prev.metrics,
              openActions: updatedActions.filter((a) => a.status !== 'COMPLETED').length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[ACTION ITEM] Error updating action item:', err);
    }
  }, [activeRoomId, applyBackendState]);

  const deleteActionItem = useCallback(async (actionId) => {
    try {
      const res = await apiService.deleteActionItem(actionId, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        setData((prev) => {
          const updatedActions = prev.actions.filter((a) => a.id !== actionId);
          return {
            ...prev,
            actions: updatedActions,
            metrics: {
              ...prev.metrics,
              openActions: updatedActions.filter((a) => a.status !== 'COMPLETED').length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[ACTION ITEM] Error deleting action item:', err);
    }
  }, [activeRoomId, applyBackendState]);

  const toggleActionStatus = useCallback((actionId) => {
    const item = data.actions.find((a) => a.id === actionId);
    if (!item) return;

    let nextStatus = 'OPEN';
    if (item.status === 'OPEN') nextStatus = 'IN_PROGRESS';
    else if (item.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
    else nextStatus = 'OPEN';

    updateActionItem(actionId, { status: nextStatus });
  }, [data.actions, updateActionItem]);

  // ------------------------------------------------------------------------
  // DECISIONS MUTATIONS (Room-Scoped)
  // ------------------------------------------------------------------------
  const createDecision = useCallback(async (decisionData) => {
    try {
      const payload = {
        ...decisionData,
        roomId: activeRoomId,
        decidedBy: currentUser?.name || decisionData.decidedBy || 'Incident Commander',
      };
      const res = await apiService.createDecision(payload, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        setData((prev) => {
          const newItem = {
            id: `d-${Date.now()}`,
            roomId: activeRoomId,
            title: decisionData.title,
            description: decisionData.description || decisionData.rationale || '',
            status: decisionData.status || 'CONFIRMED',
            decidedBy: payload.decidedBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const updatedDecisions = [newItem, ...prev.decisions];
          return {
            ...prev,
            decisions: updatedDecisions,
            metrics: {
              ...prev.metrics,
              confirmedDecisions: updatedDecisions.filter((d) => d.status === 'CONFIRMED').length,
              totalDecisions: updatedDecisions.length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[DECISION] Error creating decision:', err);
    }
  }, [activeRoomId, currentUser, applyBackendState]);

  const updateDecision = useCallback(async (decisionId, updates) => {
    try {
      const res = await apiService.updateDecision(decisionId, updates, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        setData((prev) => {
          const updatedDecisions = prev.decisions.map((d) => (d.id === decisionId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
          return {
            ...prev,
            decisions: updatedDecisions,
            metrics: {
              ...prev.metrics,
              confirmedDecisions: updatedDecisions.filter((d) => d.status === 'CONFIRMED').length,
              totalDecisions: updatedDecisions.length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[DECISION] Error updating decision:', err);
    }
  }, [activeRoomId, applyBackendState]);

  const deleteDecision = useCallback(async (decisionId) => {
    try {
      const res = await apiService.deleteDecision(decisionId, activeRoomId);
      if (res && res.success && res.state) {
        applyBackendState(res.state);
      } else {
        setData((prev) => {
          const updatedDecisions = prev.decisions.filter((d) => d.id !== decisionId);
          return {
            ...prev,
            decisions: updatedDecisions,
            metrics: {
              ...prev.metrics,
              confirmedDecisions: updatedDecisions.filter((d) => d.status === 'CONFIRMED').length,
              totalDecisions: updatedDecisions.length,
            },
          };
        });
      }
    } catch (err) {
      console.error('[DECISION] Error deleting decision:', err);
    }
  }, [activeRoomId, applyBackendState]);

  // Mark conflict resolved
  const resolveConflict = useCallback((conflictId, resolutionChoice = 'Reconciled via verified telemetry') => {
    const approver = currentUser?.name || 'Incident Commander';
    setData((prev) => {
      const updatedConflicts = prev.conflicts.map((c) => {
        if (c.id !== conflictId) return c;
        return { ...c, resolved: true, status: 'RESOLVED BY HUMAN VERIFICATION', resolution: resolutionChoice };
      });

      const newTimelineEvent = {
        id: `tl-${Date.now()}`,
        time: new Date().toISOString().substring(11, 16),
        type: 'fact',
        tag: 'RESOLVED',
        title: 'Conflict verified & resolved',
        description: `Discrepancy resolved: ${resolutionChoice}. Recorded as verified telemetry.`,
        author: approver,
      };

      const newFact = {
        id: `f-${Date.now()}`,
        text: `Conflict resolved: ${resolutionChoice}.`,
        source: `Human Verification (${approver})`,
        timestamp: new Date().toISOString().substring(11, 16),
        confidence: 100,
        verified: true,
      };

      return {
        ...prev,
        conflicts: updatedConflicts,
        timeline: [newTimelineEvent, ...prev.timeline],
        facts: [newFact, ...prev.facts],
        metrics: {
          ...prev.metrics,
          conflicts: updatedConflicts.filter((c) => !c.resolved).length,
        },
      };
    });
  }, [currentUser]);

  // Confirm proposed critical action
  const confirmCriticalAction = useCallback((actionId) => {
    const approver = currentUser?.name || 'Incident Commander';
    setData((prev) => {
      const newDecision = {
        id: `d-${Date.now()}`,
        title: `Approved and executed: ${prev.proposedCriticalAction?.action || 'Critical Action'}`,
        decision: `Approved and executed: ${prev.proposedCriticalAction?.action || 'Critical Action'}`,
        madeBy: approver,
        decidedBy: approver,
        timestamp: new Date().toISOString().substring(11, 16),
        status: 'CONFIRMED',
        rationale: 'Human-in-the-loop approved recovery procedure.',
      };

      const newTimelineEvent = {
        id: `tl-${Date.now()}`,
        time: new Date().toISOString().substring(11, 16),
        type: 'decision',
        tag: 'CRITICAL ACTION',
        title: prev.proposedCriticalAction?.action || 'Critical Action Approved',
        description: `Executed with explicit human confirmation by ${approver}. Recovery procedure initiated.`,
        author: approver,
      };

      return {
        ...prev,
        proposedCriticalAction: null,
        decisions: [newDecision, ...prev.decisions],
        timeline: [newTimelineEvent, ...prev.timeline],
      };
    });
  }, [currentUser]);

  // Regenerate AI Status Briefing
  const regenerateSummary = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setData((prev) => {
      const timeStr = new Date().toISOString().substring(11, 16) + ' UTC';
      const activeConflicts = prev.conflicts.filter((c) => !c.resolved);
      const isConflictPending = activeConflicts.length > 0;
      const title = prev.incident?.title || 'Active Incident';
      const status = prev.incident?.status || 'Investigating';
      const newSummary = isConflictPending
        ? `Current incident status: ${title} under investigation. Telemetry conflict active: ${activeConflicts[0].title}. ${prev.metrics.openActions} action items in progress.`
        : `Current incident status: ${title} (${status}). Confirmed facts logged: ${prev.facts.length}. Action items remaining: ${prev.metrics.openActions}.`;

      return {
        ...prev,
        briefing: {
          summary: newSummary,
          lastUpdated: timeStr,
          version: `v${Math.floor(Math.random() * 90 + 10)}`,
        },
      };
    });
    setIsRefreshing(false);
  }, []);

  // Real Agora Voice Room Handlers
  const handleJoinVoice = useCallback(async () => {
    setIsVoiceConnecting(true);
    console.log(`[RTC] Initiating voice room connection for channel: "${channelName}"`);
    try {
      // 1. Fetch dynamic RTC token for the browser user from backend
      console.log(`[RTC] Requesting user RTC token for channel: "${channelName}"`);
      const tokenData = await apiService.getAgoraToken(channelName);
      console.log(`[RTC] user token received (UID: ${tokenData.uid})`);

      if (tokenData.agentRtcUid) {
        agoraService.setKnownAgentUid(tokenData.agentRtcUid);
      }

      // 2. Request Conversational AI Agent to enter the room
      console.log(`[AGENT] join request sent for channel: "${channelName}"`);
      try {
        const agentRes = await apiService.joinAgoraAgent(channelName);
        console.log(`[AGENT] join response received: status=${agentRes.agent?.status || 'RUNNING'}`);
        if (agentRes.agentRtcUid) {
          agoraService.setKnownAgentUid(agentRes.agentRtcUid);
        }
      } catch (agentErr) {
        console.warn(`[AGENT] Agent join warning: ${agentErr.message}`);
      }

      // 3. Connect browser client via Agora RTC Web SDK
      console.log(`[RTC] Connecting browser client to channel: "${tokenData.channelName}" with UID: ${tokenData.uid}...`);
      await agoraService.joinChannel({
        appId: tokenData.appId,
        channelName: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
      });

      console.log(`[RTC] Successfully connected to voice room: "${tokenData.channelName}"`);
      setVoiceConnected(true);
      setIsDemoMode(false);
      setIsBackendConnected(true);

      // Trigger initial AI Incident Commander room greeting once
      if (!hasSpokenInitialGreeting.current) {
        hasSpokenInitialGreeting.current = true;
        setTimeout(() => {
          agoraService.playAIVoiceResponse(
            "Hello, I'm INCYRA. I'm monitoring this incident room. Share any observations or telemetry, and I'll track the facts, identify conflicts, and help coordinate the investigation."
          );
        }, 1200);
      }
    } catch (err) {
      console.error('[RTC] Voice room connection error:', err);
      alert(`Voice Room Connection Note: ${err.message}`);
      setVoiceConnected(false);
    } finally {
      setIsVoiceConnecting(false);
    }
  }, [channelName]);

  const handleLeaveVoice = useCallback(async () => {
    try {
      console.log(`[RTC] Leaving voice room channel: "${channelName}"`);
      hasSpokenInitialGreeting.current = false;
      await agoraService.leaveChannel();
      await apiService.stopAgoraAgent(channelName).catch(() => {});
    } catch (err) {
      console.error('[RTC] Error leaving voice room:', err);
    } finally {
      setVoiceConnected(false);
      setIsMuted(false);
    }
  }, [channelName]);

  const handleToggleMute = useCallback(async () => {
    try {
      const res = await agoraService.muteMicrophone();
      setIsMuted(res.isMuted);
    } catch (err) {
      console.error('[RTC] Mute toggle error:', err);
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Real connected Agora RTC participants with live speaking detection
  const voiceParticipants = useMemo(() => {
    if (!voiceConnected) {
      return [];
    }
    return rtcParticipants.map((p) => ({
      ...p,
      isSpeaking: Boolean(speakingMap[p.uid]),
    }));
  }, [voiceConnected, rtcParticipants, speakingMap]);

  // Combined real team members from Room Database and RTC presence (ZERO fake users)
  const dynamicTeamMembers = useMemo(() => {
    // If voice RTC is connected and has participants, prioritize live RTC status
    if (voiceConnected && voiceParticipants.length > 0) {
      return voiceParticipants;
    }

    // If persistent room members exist from DB, map them cleanly
    if (roomMembers && roomMembers.length > 0) {
      return roomMembers.map((m) => {
        const isCurrent = currentUser && m.id === currentUser.id;
        const initials = m.name
          ? m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
          : 'U';
        const roleLabel = m.role === 'OWNER' || m.role === 'INCIDENT_COMMANDER' ? 'Incident Commander' : 'Member';
        return {
          id: m.id,
          name: isCurrent ? `${m.name} (You)` : m.name,
          role: roleLabel,
          initials,
          isLocal: isCurrent,
          isActive: true,
          isSpeaking: false,
        };
      });
    }

    // Default to current authenticated user
    const currentName = currentUser?.name || 'You';
    const currentInitials = currentUser?.name
      ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'YOU';
    return [
      {
        id: currentUser?.id || 'local-user',
        name: `${currentName} (Incident Commander)`,
        role: 'Incident Commander',
        initials: currentInitials,
        isLocal: true,
        isActive: true,
        isSpeaking: false,
      },
    ];
  }, [voiceConnected, voiceParticipants, roomMembers, currentUser]);

  return {
    data,
    roomMembers,
    isDemoMode,
    isBackendConnected,
    isLoading,
    isRefreshing,
    error,
    elapsedSeconds,
    formattedElapsedTime,
    channelName,
    voiceConnected,
    isVoiceConnecting,
    isMuted,
    voiceParticipants,
    dynamicTeamMembers,
    createActionItem,
    updateActionItem,
    deleteActionItem,
    toggleActionStatus,
    createDecision,
    updateDecision,
    deleteDecision,
    resolveConflict,
    confirmCriticalAction,
    regenerateSummary,
    handleJoinVoice,
    handleLeaveVoice,
    handleToggleMute,
    refreshState: () => fetchState(true),
  };
}
