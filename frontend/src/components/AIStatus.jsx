import React from 'react';
import { Brain, Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function AIStatus({ aiObservation }) {
  return (
    <div className="glass-panel ai-monitor-panel" aria-label="AI Incident Monitoring">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Brain size={17} className="text-cyan" />
          <span className="panel-title">INCYRA IS MONITORING</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="badge badge-active">
            <span className="pulse-dot-cyan"></span>
            <span>LISTENING</span>
          </div>
        </div>
      </div>

      <div className="panel-body">
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Listening to the incident room and continuously organizing operational intelligence.
        </p>

        <div className="ai-observation-box">
          <div className="ai-observation-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={13} className="text-cyan" />
              <span className="ai-obs-title">LATEST AI OBSERVATION</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="ai-confidence-pill">
                CONFIDENCE: {aiObservation.confidence || '96%'}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Clock size={11} />
                <span>{aiObservation.lastUpdated || 'Just now'}</span>
              </div>
            </div>
          </div>

          <p style={{ fontWeight: 500 }}>{aiObservation.observation}</p>
        </div>
      </div>
    </div>
  );
}
