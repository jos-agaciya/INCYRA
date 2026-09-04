import React from 'react';
import { ShieldAlert, AlertTriangle, Clock } from 'lucide-react';

export default function RisksPanel({ risks = [] }) {
  const getSeverityBadge = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'HIGH':
        return <span className="badge badge-sev1">HIGH RISK</span>;
      case 'MEDIUM':
        return <span className="badge badge-amber">MEDIUM RISK</span>;
      case 'LOW':
      default:
        return <span className="badge badge-demo">LOW RISK</span>;
    }
  };

  return (
    <div className="glass-panel" aria-label="Unresolved Incident Risks">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <ShieldAlert size={16} className="text-amber" />
          <span className="panel-title">UNRESOLVED RISKS</span>
        </div>
        <div className="badge badge-amber">
          <span>{risks.length} MONITORED</span>
        </div>
      </div>

      <div className="panel-body">
        {risks.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '0.65rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={14} className="text-amber" />
                <span
                  style={{
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.risk}
                </span>
              </div>
              {getSeverityBadge(item.severity)}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.72rem',
                color: 'var(--text-tertiary)',
              }}
            >
              <span className="badge badge-demo" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                STATUS: {item.status || 'ACTIVE'}
              </span>
              {item.timestamp && (
                <>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} /> Flagged at {item.timestamp}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
