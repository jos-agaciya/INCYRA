import React from 'react';
import { HelpCircle, Brain, AlertCircle } from 'lucide-react';

export default function HypothesesPanel({ hypotheses = [] }) {
  return (
    <div className="glass-panel" aria-label="Hypotheses and Assumptions">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <HelpCircle size={16} className="text-amber" />
          <span className="panel-title">HYPOTHESES & ASSUMPTIONS</span>
        </div>
        <div className="badge badge-amber">
          <span>{hypotheses.length} UNCONFIRMED</span>
        </div>
      </div>

      <div className="panel-body">
        {hypotheses.map((item) => (
          <div key={item.id} className="hypothesis-item">
            <div className="hypothesis-icon-wrap">
              <HelpCircle size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.text}
                </p>
                <span className="badge badge-amber" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                  {item.status || 'UNCONFIRMED'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginTop: '0.3rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-tertiary)',
                }}
              >
                <span>Proposed by: {item.proposedBy}</span>
                <span>•</span>
                <span>{item.timestamp}</span>
                {item.note && (
                  <>
                    <span>•</span>
                    <span style={{ fontStyle: 'italic' }}>{item.note}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
