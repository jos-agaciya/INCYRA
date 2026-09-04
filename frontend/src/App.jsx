import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useIncidentData } from './hooks/useIncidentData';
import { apiService } from './services/api';
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
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ShareRoomModal from './components/ShareRoomModal';
import { Loader2 } from 'lucide-react';

function parseUrlRoute() {
  const pathname = window.location.pathname;
  if (pathname === '/login') return { route: 'login', roomId: null };
  if (pathname === '/register') return { route: 'register', roomId: null };
  if (pathname === '/dashboard') return { route: 'dashboard', roomId: null };
  if (pathname.startsWith('/room/')) {
    const roomId = pathname.replace('/room/', '').split('/')[0];
    return { route: 'room', roomId };
  }
  return { route: 'root', roomId: null };
}

function MainApp() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // ------------------------------------------------------------------------
  // THEME MANAGEMENT (Dark default, persisted to localStorage)
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
  // CLIENT ROUTING & NAVIGATION
  // ------------------------------------------------------------------------
  const [navigation, setNavigation] = useState(() => parseUrlRoute());
  const [activeRoom, setActiveRoom] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setNavigation(parseUrlRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((targetRoute, targetRoomId = null) => {
    let path = '/';
    if (targetRoute === 'login') path = '/login';
    else if (targetRoute === 'register') path = '/register';
    else if (targetRoute === 'dashboard') path = '/dashboard';
    else if (targetRoute === 'room' && targetRoomId) path = `/room/${targetRoomId}`;

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setNavigation({ route: targetRoute, roomId: targetRoomId });
  }, []);

  // Auto-join room when opening a room link as an authenticated user
  useEffect(() => {
    if (navigation.route === 'room' && navigation.roomId && isAuthenticated) {
      apiService.joinRoom(navigation.roomId).then((res) => {
        if (res && res.room) {
          setActiveRoom(res.room);
        }
      }).catch((err) => {
        console.warn('[ROOM] Auto-join note:', err.message);
      });
    }
  }, [navigation.route, navigation.roomId, isAuthenticated]);

  // ------------------------------------------------------------------------
  // INTERNAL ROOM NAVIGATION (TABS)
  // ------------------------------------------------------------------------
  const [currentView, setCurrentView] = useState('command-center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ------------------------------------------------------------------------
  // INCIDENT STATE & MUTATIONS (Room-scoped)
  // ------------------------------------------------------------------------
  const activeRoomId = navigation.route === 'room' ? navigation.roomId : null;

  const {
    data,
    roomMembers,
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
  } = useIncidentData(activeRoomId, user);

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
  // ROUTE RESOLUTION
  // ------------------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="auth-page-container">
        <BackgroundCanvas theme={theme} />
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
          <Loader2 size={32} className="spinner text-cyan" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Initializing INCYRA...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated:
  if (!isAuthenticated) {
    if (navigation.route === 'register') {
      return (
        <>
          <BackgroundCanvas theme={theme} />
          <RegisterPage
            onNavigate={navigateTo}
            redirectRoomId={navigation.roomId}
          />
        </>
      );
    }
    // Default to login page
    return (
      <>
        <BackgroundCanvas theme={theme} />
        <LoginPage
          onNavigate={navigateTo}
          redirectRoomId={navigation.roomId}
        />
      </>
    );
  }

  // If authenticated:
  if (navigation.route === 'login' || navigation.route === 'register' || navigation.route === 'root' || navigation.route === 'dashboard') {
    return (
      <>
        <BackgroundCanvas theme={theme} />
        <DashboardPage
          onOpenRoom={(roomId) => navigateTo('room', roomId)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </>
    );
  }

  // ------------------------------------------------------------------------
  // INCIDENT ROOM COMMAND CENTER VIEW
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
            <TeamPanel participants={dynamicTeamMembers} />
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
              participants={dynamicTeamMembers}
              onToggleStatus={toggleActionStatus}
              onCreateAction={createActionItem}
              onUpdateAction={updateActionItem}
              onDeleteAction={deleteActionItem}
              isFullPage={true}
            />
            <DecisionsPanel
              decisions={data.decisions}
              participants={dynamicTeamMembers}
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
            <TeamPanel participants={dynamicTeamMembers} />
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
                  participants={dynamicTeamMembers}
                  onToggleStatus={toggleActionStatus}
                  onCreateAction={createActionItem}
                  onUpdateAction={updateActionItem}
                  onDeleteAction={deleteActionItem}
                />
              </div>

              {/* Right Column: Chronological Incident Timeline & Team */}
              <div className="grid-stack-gap">
                <IncidentTimeline timeline={data.timeline} />
                <TeamPanel participants={dynamicTeamMembers} />
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
          onShareRoom={() => setIsShareModalOpen(true)}
          onBackToDashboard={() => navigateTo('dashboard')}
        />

        {/* Dynamic Content */}
        <main className="content-area">{renderViewContent()}</main>
      </div>

      {/* Share Room Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        room={activeRoom || { id: activeRoomId || data.incident.id, title: data.incident.title, code: activeRoomId }}
      />

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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
