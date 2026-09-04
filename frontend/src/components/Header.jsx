import React from 'react';
import {
  ShieldAlert,
  Radio,
  Clock,
  User,
  Server,
  Activity,
  Menu,
  Share2,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Header({
  incident,
  isDemoMode,
  formattedTime,
  theme,
  onToggleTheme,
  onToggleSidebar,
  sidebarCollapsed,
  onShareRoom,
  onBackToDashboard,
}) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="header-container">
      {/* Left: Dashboard back button, Section title and Mobile toggle */}
      <div className="header-left">
        <button
          className="btn-secondary theme-toggle-btn mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

        {onBackToDashboard && (
          <button
            className="btn-secondary back-dashboard-btn"
            onClick={onBackToDashboard}
            title="Back to Incident Dashboard"
          >
            <ChevronLeft size={16} />
            <span className="hide-mobile">Dashboard</span>
          </button>
        )}

        <div className="header-title-badge">
          <div className="header-category">
            <ShieldAlert size={12} className="text-muted" />
            <span>INCIDENT COMMAND CENTER</span>
          </div>
          <div className="header-incident-name">
            <span>{incident.title || 'Active Incident'}</span>
          </div>
        </div>
      </div>

      {/* Center: Live Status Indicators */}
      <div className="header-center">
        <div className="badge badge-active">
          <span className="pulse-dot-cyan"></span>
          <span>{incident.status?.toUpperCase() || 'ACTIVE'}</span>
        </div>

        <div className="badge badge-sev1">
          <span className="pulse-dot-red"></span>
          <span>{incident.severity || 'SEV-1'}</span>
        </div>

        <div className="badge badge-live">
          <Radio size={12} />
          <span>LIVE CONNECTION</span>
        </div>

        {isDemoMode && (
          <div className="badge badge-demo" title="Backend operating in local fallback state.">
            <Server size={11} />
            <span>LOCAL MODE</span>
          </div>
        )}
      </div>

      {/* Right: Share Room, Timer, Theme Toggle, Profile */}
      <div className="header-right">
        {onShareRoom && (
          <button
            className="btn-secondary share-room-header-btn"
            onClick={onShareRoom}
            title="Share Room Link"
          >
            <Share2 size={15} className="text-cyan" />
            <span>Share Room</span>
          </button>
        )}

        <div className="incident-timer" title="Elapsed Incident Duration">
          <Clock size={14} className="text-muted" />
          <span>{formattedTime}</span>
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div
          className="user-profile-header-pill"
          title={`Active Session: ${user?.name || incident.commander || 'Incident Responder'}`}
        >
          <div className="user-avatar-circle-sm">
            {getInitials(user?.name || incident.commander)}
          </div>
          <span className="user-header-name hide-mobile">
            {user?.name || incident.commander || 'Responder'}
          </span>
        </div>
      </div>
    </header>
  );
}
