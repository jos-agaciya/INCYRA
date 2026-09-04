import React from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  Users,
  Volume2,
  Bot,
  Loader2,
} from 'lucide-react';

export default function LiveVoiceRoom({
  participants = [],
  isConnected,
  isMuted,
  isConnecting = false,
  channelName = 'agora-incident-8921',
  onJoinRoom,
  onLeaveRoom,
  onToggleMute,
}) {
  return (
    <div className="glass-panel voice-room-card" aria-label="Live Incident Voice Room">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Radio size={16} className="text-cyan" />
          <span className="panel-title">LIVE INCIDENT ROOM</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="badge badge-live">
            <span className="pulse-dot"></span>
            <span>
              {isConnecting
                ? 'CONNECTING...'
                : isConnected
                ? 'ROOM CONNECTED'
                : 'ROOM DISCONNECTED'}
            </span>
          </div>
          <div className="badge badge-demo">
            <Users size={11} />
            <span>{participants.length} PARTICIPANTS</span>
          </div>
        </div>
      </div>

      <div className="panel-body">
        {/* Participants Grid */}
        <div className="voice-grid">
          {participants.length > 0 ? (
            participants.map((p) => {
              const isSpeakingNow = isConnected && p.isSpeaking;
              return (
                <div
                  key={p.id || p.uid}
                  className={`glass-subcard participant-tile ${
                    isSpeakingNow ? 'speaking' : ''
                  }`}
                >
                  <div className="participant-avatar-wrap">
                    {isSpeakingNow && <div className="speaking-ring" />}
                    <div className="participant-avatar">
                      {p.isAI ? <Bot size={22} className="text-cyan" /> : p.initials}
                    </div>
                  </div>
                  <span className="participant-name" title={p.name}>
                    {p.name}
                  </span>
                  <span className="participant-role" title={p.role}>
                    {p.role}
                  </span>

                  {isSpeakingNow ? (
                    <span className="participant-speaking-tag">
                      <Volume2 size={11} />
                      <span>SPEAKING</span>
                    </span>
                  ) : (
                    <span
                      className="participant-role"
                      style={{
                        marginTop: '0.4rem',
                        fontSize: '0.65rem',
                        opacity: p.isActive ? 0.7 : 0.4,
                      }}
                    >
                      {p.isActive ? 'CONNECTED' : 'STANDBY'}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.84rem',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
              }}
            >
              <Radio size={22} style={{ margin: '0 auto 0.4rem', opacity: 0.6 }} className="text-cyan" />
              <div>Room offline. Click <strong>JOIN VOICE ROOM</strong> to connect with INCYRA AI Commander.</div>
            </div>
          )}
        </div>

        {/* Voice Room Controls */}
        <div className="voice-controls-bar">
          <div className="voice-status-group">
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Channel: <code style={{ fontFamily: 'var(--font-mono)' }}>{channelName}</code>
            </span>
          </div>

          <div className="voice-btn-group">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
                </button>

                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="btn btn-danger"
                  title="Leave voice room"
                >
                  <PhoneOff size={15} />
                  <span>LEAVE ROOM</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onJoinRoom}
                disabled={isConnecting}
                className="btn btn-primary"
                title="Connect to incident voice room"
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall size={15} />
                    <span>JOIN VOICE ROOM</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
