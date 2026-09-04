import React, { useState, useEffect } from 'react';
import { useIncidentData } from './hooks/useIncidentData';
import BackgroundCanvas from './components/BackgroundCanvas';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import IncidentOverview from './components/IncidentOverview';
import LiveVoiceRoom from './components/LiveVoiceRoom';
import AIStatus from './components/AIStatus';
import AIStatusBriefing from './components/AIStatusBriefing';
import ConflictsPanel from './components/ConflictsPanel';
import IncidentTimeline from './components/IncidentTimeline';
import FactsPanel from './components/FactsPanel';
import HypothesesPanel from './components/HypothesesPanel';
import ActionItemsPanel from './components/ActionItemsPanel';
import DecisionsPanel from './components/DecisionsPanel';
import RisksPanel from './components/RisksPanel';
import TeamPanel from './components/TeamPanel';
import ConfirmationModal from './components/ConfirmationModal';
import CriticalActionBanner from './components/CriticalActionBanner';

export default function App() {
  // ------------------------------------------------------------------------
  // THEME MANAGEMENT (Dark default, persisted to localStorage, grey glass in light)
  // ------------------------------------------------------------------------
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('incyra_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('incyra_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ------------------------------------------------------------------------
  // NAVIGATION & RESPONSIVE SIDEBAR
  // ------------------------------------------------------------------------
  const [currentView, setCurrentView] = useState('command-center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ------------------------------------------------------------------------
  // INCIDENT STATE & MUTATIONS
  // ------------------------------------------------------------------------
  const {
    data,
    isDemoMode,
    isBackendConnected,
    isLoading,
    isRefreshing,
    formattedElapsedTime,
    channelName,
    voiceConnected,
    isVoiceConnecting,
    isMuted,
    voiceParticipants,
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
  } = useIncidentData();

  // Real Dynamic Team Members (based purely on real connected Agora participants)
  const activeTeamMembers = React.useMemo(() => {
    if (voiceParticipants && voiceParticipants.length > 0) {
      return voiceParticipants;
    }
    if (data.participants && data.participants.length > 0) {
      return data.participants;
    }
    return [
      {
        id: 'local-user',
        name: 'You (Incident Commander)',
        role: 'Incident Commander',
        initials: 'YOU',
        isLocal: true,
        isActive: true,
        isSpeaking: false,
      },
    ];
  }, [voiceParticipants, data.participants]);

  // ------------------------------------------------------------------------
  // MODAL MANAGEMENT
  // ------------------------------------------------------------------------
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'critical-action', // 'critical-action' | 'resolve-conflict'
    data: null,
  });

  const handleOpenCriticalActionModal = () => {
    setModalState({
      isOpen: true,
      mode: 'critical-action',
      data: data.proposedCriticalAction,
    });
  };

  const handleOpenConflictModal = (conflict) => {
    setModalState({
      isOpen: true,
      mode: 'resolve-conflict',
      data: conflict,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmModal = (id, extra) => {
    if (modalState.mode === 'resolve-conflict') {
      resolveConflict(id, extra);
    } else {
      confirmCriticalAction(id);
    }
  };

  // ------------------------------------------------------------------------
  // VIEW RENDERER
  // ------------------------------------------------------------------------
  const renderViewContent = () => {
    switch (currentView) {
      case 'live-incident':
        return (
          <div className="grid-stack-gap">
            <LiveVoiceRoom
              participants={voiceParticipants}
              isConnected={voiceConnected}
              isConnecting={isVoiceConnecting}
              channelName={channelName}
              isMuted={isMuted}
              onJoinRoom={handleJoinVoice}
              onLeaveRoom={handleLeaveVoice}
              onToggleMute={handleToggleMute}
            />
            <div className="subgrid-2col">
              <AIStatus aiObservation={data.aiObservation} />
              <AIStatusBriefing
                briefing={data.briefing}
                onRegenerate={regenerateSummary}
                isRefreshing={isRefreshing}
              />
            </div>
            <TeamPanel participants={activeTeamMembers} />
          </div>
        );

      case 'timeline':
        return (
          <div className="grid-stack-gap">
            <IncidentTimeline timeline={data.timeline} />
          </div>
        );

      case 'intelligence':
        return (
          <div className="grid-stack-gap">
            <AIStatus aiObservation={data.aiObservation} />
            <AIStatusBriefing
              briefing={data.briefing}
              onRegenerate={regenerateSummary}
              isRefreshing={isRefreshing}
            />
            <ConflictsPanel
              conflicts={data.conflicts.filter((c) => !c.resolved)}
              onInitiateResolve={handleOpenConflictModal}
            />
            <div className="subgrid-2col">
              <FactsPanel facts={data.facts} />
              <HypothesesPanel hypotheses={data.hypotheses} />
            </div>
          </div>
        );

      case 'action-items':
        return (
          <div className="grid-stack-gap">
            <ActionItemsPanel
              actions={data.actions}
              participants={activeTeamMembers}
              onToggleStatus={toggleActionStatus}
              onCreateAction={createActionItem}
              onUpdateAction={updateActionItem}
              onDeleteAction={deleteActionItem}
              isFullPage={true}
            />
            <DecisionsPanel
              decisions={data.decisions}
              participants={activeTeamMembers}
              onCreateDecision={createDecision}
              onUpdateDecision={updateDecision}
              onDeleteDecision={deleteDecision}
              isFullPage={true}
            />
          </div>
        );

      case 'team':
        return (
          <div className="grid-stack-gap">
            <TeamPanel participants={activeTeamMembers} />
            <LiveVoiceRoom
              participants={voiceParticipants}
              isConnected={voiceConnected}
              isConnecting={isVoiceConnecting}
              channelName={channelName}
              isMuted={isMuted}
              onJoinRoom={handleJoinVoice}
              onLeaveRoom={handleLeaveVoice}
              onToggleMute={handleToggleMute}
            />
          </div>
        );

      case 'reports':
        return (
          <div className="grid-stack-gap">
            <div className="glass-panel">
              <div className="panel-header">
                <span className="panel-title">INCIDENT POST-MORTEM & EXECUTIVE SUMMARY</span>
                <div className="badge badge-demo"><span>GENERATED BY INCYRA AI</span></div>
              </div>
              <div className="panel-body">
                <div style={{ lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  <p style={{ marginBottom: '0.75rem' }}>
                    <strong>Incident ID:</strong> {data.incident.id} — {data.incident.title}
                  </p>
                  <p style={{ marginBottom: '0.75rem' }}>
                    <strong>Severity:</strong> {data.incident.severity} | <strong>Commander:</strong> {data.incident.commander}
                  </p>
                  <p style={{ marginBottom: '0.75rem' }}>
                    <strong>Current Intelligence Status:</strong> {data.briefing.summary}
                  </p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Core Principle: INCYRA recorded all telemetry facts, segregated unverified hypotheses, flagged conflicting reports for human verification, and maintained complete accountability before executing critical actions.
                  </p>
                </div>
              </div>
            </div>
            <RisksPanel risks={data.risks} />
          </div>
        );

      case 'command-center':
      default:
        return (
          <>
            {/* High-Level Overview Metric Cards */}
            <IncidentOverview metrics={data.metrics} />

            {/* Proposed Critical Action Banner (If awaiting human review) */}
            <CriticalActionBanner
              proposedAction={data.proposedCriticalAction}
              onReview={handleOpenCriticalActionModal}
            />

            {/* Main Command Center Split Grid */}
            <div className="dashboard-main-grid">
              {/* Left Column: Live Operations & Intelligence */}
              <div className="grid-stack-gap">
                {/* 1. Live Voice Room */}
                <LiveVoiceRoom
                  participants={voiceParticipants}
                  isConnected={voiceConnected}
                  isConnecting={isVoiceConnecting}
                  channelName={channelName}
                  isMuted={isMuted}
                  onJoinRoom={handleJoinVoice}
                  onLeaveRoom={handleLeaveVoice}
                  onToggleMute={handleToggleMute}
                />

                {/* 2. AI Live Status & Monitoring */}
                <AIStatus aiObservation={data.aiObservation} />

                {/* 3. AI Status Spoken Briefing */}
                <AIStatusBriefing
                  briefing={data.briefing}
                  onRegenerate={regenerateSummary}
                  isRefreshing={isRefreshing}
                />

                {/* 4. Conflicts Requiring Verification (Prominent) */}
                <ConflictsPanel
                  conflicts={data.conflicts.filter((c) => !c.resolved)}
                  onInitiateResolve={handleOpenConflictModal}
                />

                {/* 5. Facts vs Hypotheses 2-Column Split */}
                <div className="subgrid-2col">
                  <FactsPanel facts={data.facts} />
                  <HypothesesPanel hypotheses={data.hypotheses} />
                </div>

                {/* 6. Action Items */}
                <ActionItemsPanel
                  actions={data.actions}
                  participants={activeTeamMembers}
                  onToggleStatus={toggleActionStatus}
                  onCreateAction={createActionItem}
                  onUpdateAction={updateActionItem}
                  onDeleteAction={deleteActionItem}
                />
              </div>

              {/* Right Column: Chronological Incident Timeline & Team */}
              <div className="grid-stack-gap">
                <IncidentTimeline timeline={data.timeline} />
                <TeamPanel participants={activeTeamMembers} />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="app-container">
      {/* 3D / Abstract Domain Canvas Background */}
      <BackgroundCanvas theme={theme} />

      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Floating Glass Header */}
        <Header
          incident={data.incident}
          isDemoMode={isDemoMode}
          formattedTime={formattedElapsedTime()}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Dynamic Content */}
        <main className="content-area">{renderViewContent()}</main>
      </div>

      {/* Human-in-the-loop Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        data={modalState.data}
        onClose={handleCloseModal}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
