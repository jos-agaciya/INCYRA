import React from 'react';
import { Users, Bot, Mic, Volume2 } from 'lucide-react';

export default function TeamPanel({ participants = [] }) {
  return (
    <div className="glass-panel" aria-label="Incident Response Team Roster">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Users size={16} className="text-secondary" />
          <span className="panel-title">INCIDENT TEAM</span>
        </div>
        <div className="badge badge-demo">
          <span>{participants.length} MEMBERS</span>
        </div>
      </div>

      <div className="panel-body">
        {participants.map((member) => {
          return (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {member.isAI ? <Bot size={16} className="text-cyan" /> : member.initials}
                </div>

                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    {member.role}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {member.isSpeaking ? (
                  <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>
                    <Volume2 size={11} /> SPEAKING
                  </span>
                ) : member.isActive ? (
                  <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>
                    ACTIVE
                  </span>
                ) : (
                  <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>
                    AWAY
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
