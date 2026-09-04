import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Clock,
  BrainCircuit,
  ListTodo,
  Users,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
}) {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'live-incident', label: 'Live Incident', icon: Radio },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'intelligence', label: 'Intelligence', icon: BrainCircuit },
    { id: 'action-items', label: 'Action Items', icon: ListTodo },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand" title="INCYRA AI Incident Commander">
          <div className="brand-icon-wrapper" aria-label="INCYRA Brand Mark">
            <ShieldAlert size={20} className="brand-logo-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-name">INCYRA</span>
              <span className="brand-subtitle">AI INCIDENT COMMANDER</span>
            </div>
          )}
        </div>

        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <Icon size={18} className="nav-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer: AI Agent status */}
      <div className="sidebar-footer">
        <div className="ai-status-indicator">
          {!isCollapsed ? (
            <>
              <span className="ai-status-label">AI AGENT</span>
              <div className="ai-online-badge">
                <span className="pulse-dot"></span>
                <span>ONLINE</span>
              </div>
            </>
          ) : (
            <div className="ai-online-badge" title="AI Agent: Online" style={{ margin: '0 auto' }}>
              <span className="pulse-dot"></span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
