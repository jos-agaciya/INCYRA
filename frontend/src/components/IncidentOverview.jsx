import React from 'react';
import {
  Activity,
  Flame,
  Users,
  ListTodo,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

export default function IncidentOverview({ metrics }) {
  const metricItems = [
    {
      label: 'Incident Status',
      value: metrics.status || 'Investigating',
      sub: 'Triage Active',
      icon: Activity,
      accentClass: 'text-cyan',
      isTextVal: true,
    },
    {
      label: 'Severity',
      value: metrics.severity || 'SEV-1',
      sub: 'Critical Impact',
      icon: Flame,
      accentClass: 'text-red',
      isTextVal: true,
    },
    {
      label: 'Participants',
      value: metrics.participants ?? 1,
      sub: (metrics.participants || 1) === 1 ? '1 Active Responder' : `${metrics.participants} Connected`,
      icon: Users,
      accentClass: 'text-secondary',
    },
    {
      label: 'Open Actions',
      value: metrics.openActions ?? 3,
      sub: 'Assigned',
      icon: ListTodo,
      accentClass: 'text-secondary',
    },
    {
      label: 'Conflicts',
      value: metrics.conflicts ?? 1,
      sub: metrics.conflicts > 0 ? 'Requires Verification' : 'All Reconciled',
      icon: AlertTriangle,
      accentClass: metrics.conflicts > 0 ? 'text-red' : 'text-green',
    },
    {
      label: 'Unresolved Risks',
      value: metrics.unresolvedRisks ?? 2,
      sub: 'Active Mitigation',
      icon: ShieldAlert,
      accentClass: 'text-amber',
    },
  ];

  return (
    <div className="overview-grid" aria-label="Incident Key Metrics">
      {metricItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="glass-panel metric-card">
            <div className="metric-header">
              <span className="metric-label">{item.label}</span>
              <div className="metric-icon-wrap">
                <Icon size={16} strokeWidth={1.8} />
              </div>
            </div>
            <div className="metric-value-row">
              <span
                className="metric-number"
                style={{ fontSize: item.isTextVal ? '1.25rem' : '1.75rem' }}
              >
                {item.value}
              </span>
              <span className="metric-status-sub">{item.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
