import React from 'react';
import {
  ShieldAlert,
  Radio,
  Clock,
  User,
  Server,
  Activity,
  Menu,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header({
  incident,
  isDemoMode,
  formattedTime,
  theme,
  onToggleTheme,
  onToggleSidebar,
  sidebarCollapsed,
}) {
  return (
    <header className="header-container">
      {/* Left: Section and Mobile toggle */}
      <div className="header-left">
        <button
          className="btn-secondary theme-toggle-btn mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

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
          <div className="badge badge-demo" title="Backend not detected on localhost:5000. Operating on realistic fallback state.">
            <Server size={11} />
            <span>DEMO DATA MODE</span>
          </div>
        )}
      </div>

      {/* Right: Timer, Theme Toggle, Profile */}
      <div className="header-right">
        <div className="incident-timer" title="Elapsed Incident Duration">
          <Clock size={14} className="text-muted" />
          <span>{formattedTime}</span>
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div
          className="btn-secondary theme-toggle-btn"
          title={`Active Session: ${incident.commander || 'Incident Commander'}`}
        >
          <User size={17} strokeWidth={1.8} />
        </div>
      </div>
    </header>
  );
}
