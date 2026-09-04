import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ConflictsPanel({ conflicts = [], onInitiateResolve }) {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="glass-panel" aria-label="Conflicts Panel">
        <div className="panel-header">
          <div className="panel-title-wrap">
            <AlertTriangle size={16} className="text-secondary" />
            <span className="panel-title">CONFLICTS REQUIRING VERIFICATION</span>
          </div>
          <div className="badge badge-live">
            <span>0 ACTIVE CONFLICTS</span>
          </div>
        </div>
        <div className="panel-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <CheckCircle2 size={32} className="text-green" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No active discrepancies</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            All participant telemetry claims are currently reconciled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel conflict-card" aria-label="Conflicts Requiring Verification">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <AlertTriangle size={16} className="text-red" />
          <span className="panel-title">CONFLICTS REQUIRING VERIFICATION</span>
        </div>
        <div className="badge badge-sev1">
          <span className="pulse-dot-red"></span>
          <span>HUMAN VERIFICATION REQUIRED</span>
        </div>
      </div>

      <div className="panel-body">
        {conflicts.map((conflict) => {
          return (
            <div key={conflict.id} className="conflict-item">
              <div className="conflict-header">
                <span className="conflict-title">{conflict.title}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-red)',
                    fontWeight: 600,
                  }}
                >
                  DETECTED: {conflict.timestamp || '14:38'}
                </span>
              </div>

              {/* Claims Comparison Split */}
              <div className="conflict-split">
                <div className="conflict-speaker-box">
                  <div className="speaker-label">
                    {conflict.sourceA?.speaker} ({conflict.sourceA?.role})
                  </div>
                  <div className="speaker-claim">
                    "{conflict.sourceA?.claim}"
                  </div>
                </div>

                <div className="conflict-speaker-box">
                  <div className="speaker-label">
                    {conflict.sourceB?.speaker} ({conflict.sourceB?.role})
                  </div>
                  <div className="speaker-claim">
                    "{conflict.sourceB?.claim}"
                  </div>
                </div>
              </div>

              {/* Action row with Mark Resolved button */}
              <div className="conflict-action-row">
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ShieldAlert size={13} className="text-red" />
                  <span>AI flags metric divergence. Commander confirmation required to reconcile.</span>
                </span>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onInitiateResolve(conflict)}
                  style={{
                    borderColor: 'var(--accent-red-border)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                  title="Reconcile discrepancy with human review"
                >
                  <CheckCircle2 size={14} className="text-red" />
                  <span>MARK RESOLVED</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
