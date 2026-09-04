import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Square,
  RefreshCw,
  Sparkles,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function AIStatusBriefing({
  briefing,
  onRegenerate,
  isRefreshing,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayAudio = () => {
    if (isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    if ('speechSynthesis' in window && briefing?.summary) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(briefing.summary);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer if speech synth unavailable
      setTimeout(() => {
        setIsPlaying(false);
      }, 7000);
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="glass-panel" aria-label="AI Incident Status Briefing">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Sparkles size={16} className="text-cyan" />
          <span className="panel-title">AI STATUS BRIEFING</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {briefing.lastUpdated || '14:44 UTC'}
          </span>
          <div className="badge badge-demo">
            <span>{briefing.version || 'v4'}</span>
          </div>
        </div>
      </div>

      <div className="panel-body">
        <div
          style={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            padding: '0.85rem 1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
          }}
        >
          {briefing.summary}
        </div>

        {/* Audio Visualizer & Control Toolbar */}
        <div className="audio-briefing-wrap">
          <div
            className={`audio-waveform-mini ${isPlaying ? 'audio-playing' : ''}`}
            title={isPlaying ? 'Briefing Audio Playing' : 'Briefing Audio Idle'}
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="audio-bar" />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {isPlaying ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStopAudio}
                title="Stop spoken briefing"
              >
                <Square size={14} />
                <span>STOP</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePlayAudio}
                title="Play spoken briefing"
              >
                <Volume2 size={14} />
                <span>PLAY SPOKEN BRIEFING</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRegenerate}
              disabled={isRefreshing}
              title="Regenerate summary from latest state"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? 'pulse-dot' : ''}
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{isRefreshing ? 'REGENERATING...' : 'REGENERATE SUMMARY'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
