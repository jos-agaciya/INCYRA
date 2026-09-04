import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function CriticalActionBanner({ proposedAction, onReview }) {
  if (!proposedAction) return null;

  return (
    <div className="critical-banner" role="alert">
      <div className="critical-banner-left">
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-red)',
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-red)',
              }}
            >
              CRITICAL ACTION PROPOSED (HUMAN APPROVAL REQUIRED)
            </span>
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {proposedAction.action}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-danger"
        onClick={onReview}
        style={{ flexShrink: 0 }}
      >
        <span>REVIEW ACTION</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
