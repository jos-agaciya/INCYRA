import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  mode = 'critical-action', // 'critical-action' | 'resolve-conflict'
  data = null,
  onClose,
  onConfirm,
}) {
  const [selectedResolution, setSelectedResolution] = useState(
    'Reconciled via DB node exporter telemetry at 42%'
  );
  const [typedVerification, setTypedVerification] = useState('');

  if (!isOpen) return null;

  const isConflict = mode === 'resolve-conflict';

  const handleConfirmAction = () => {
    if (isConflict) {
      onConfirm(data?.id, selectedResolution);
    } else {
      onConfirm(data?.id || 'pca-1');
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-red-subtle)',
                border: '1px solid var(--accent-red-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-red)',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2
                id="modal-title"
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                }}
              >
                {isConflict
                  ? 'HUMAN VERIFICATION — RESOLVE CONFLICT'
                  : 'CRITICAL ACTION PROPOSED'}
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Human-in-the-loop operational guardrail
              </span>
            </div>
          </div>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Visual Hierarchy: AI Proposes -> Human Reviews -> Human Confirms -> Action */}
          <div className="flow-step-bar">
            <span className="flow-step-item">1. AI Proposes</span>
            <ArrowRight size={12} />
            <span className="flow-step-item active">2. Human Reviews</span>
            <ArrowRight size={12} />
            <span className="flow-step-item active">3. Human Confirms</span>
            <ArrowRight size={12} />
            <span className="flow-step-item">4. Action</span>
          </div>

          {isConflict ? (
            <div>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                }}
              >
                You are about to reconcile the telemetry conflict:{' '}
                <strong>{data?.title || 'DATABASE CPU METRIC CONFLICT'}</strong>.
              </p>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  SELECT VERIFIED RESOLUTION:
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolution.includes('42%')}
                    onChange={() =>
                      setSelectedResolution('Reconciled via DB node exporter telemetry at 42%')
                    }
                  />
                  <span>Reconcile to <strong>42% CPU</strong> (Primary node exporter telemetry confirmed accurate)</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                  }}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolution.includes('95%')}
                    onChange={() =>
                      setSelectedResolution('Reconciled to 95% CPU peak on primary node during spike')
                    }
                  />
                  <span>Reconcile to <strong>95% CPU</strong> (Gateway peak reading confirmed during spike)</span>
                </label>
              </div>

              <div
                style={{
                  background: 'var(--accent-red-subtle)',
                  border: '1px solid var(--accent-red-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.78rem',
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Marking this resolved will update the incident timeline and register this value as confirmed telemetry.
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Proposed Action
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {data?.action || 'Restart payment database cluster.'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Target: <code style={{ fontFamily: 'var(--font-mono)' }}>{data?.target || 'db-cluster-primary-us-east-1'}</code>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Reason / Rationale
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {data?.reason || 'Potential recovery action suggested during incident.'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--accent-red-subtle)',
                  border: '1px solid var(--accent-red-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.8rem' }}>
                  <Lock size={14} />
                  <span>MANDATORY HUMAN CONFIRMATION</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  {data?.warning || 'This action requires explicit human approval. INCYRA AI will never independently execute infrastructure state modifications.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            CANCEL
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmAction}
          >
            <CheckCircle2 size={15} />
            <span>{isConflict ? 'CONFIRM & RECONCILE' : 'CONFIRM ACTION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
