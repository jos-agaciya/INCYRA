import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FactsPanel({ facts = [] }) {
  return (
    <div className="glass-panel" aria-label="Confirmed Facts">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <ShieldCheck size={16} className="text-green" />
          <span className="panel-title">CONFIRMED FACTS</span>
        </div>
        <div className="badge badge-live">
          <span>{facts.length} VERIFIED</span>
        </div>
      </div>

      <div className="panel-body">
        {facts.map((fact) => (
          <div key={fact.id} className="fact-item">
            <div className="fact-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="fact-text">{fact.text}</p>
              <div className="fact-meta-row">
                <span>Source: {fact.source}</span>
                <span>•</span>
                <span>{fact.timestamp}</span>
                <span>•</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {fact.confidence}% Confidence
                </span>
                {fact.verified && (
                  <>
                    <span>•</span>
                    <span className="badge badge-live" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
                      VERIFIED
                    </span>
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
