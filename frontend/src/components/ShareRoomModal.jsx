import React, { useState } from 'react';
import { Share2, Copy, Check, X, Shield, Users, Radio } from 'lucide-react';

export default function ShareRoomModal({ isOpen, onClose, room }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !room) return null;

  const shareUrl = `${window.location.origin}/room/${room.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const input = document.getElementById('share-url-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-room-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-standard glass-panel">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-badge">
              <Share2 size={18} className="text-cyan" />
            </div>
            <div>
              <h2 id="share-room-title" className="modal-title">
                Share Incident Room
              </h2>
              <p className="modal-subtitle">
                Invite team members and specialists to collaborate live in this incident command room.
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="share-room-meta-card">
            <div className="share-meta-row">
              <span className="share-meta-label">Incident</span>
              <span className="share-meta-value font-semibold">{room.title}</span>
            </div>
            <div className="share-meta-row">
              <span className="share-meta-label">Room Code</span>
              <code className="share-code-tag">{room.code || room.id}</code>
            </div>
            <div className="share-meta-row">
              <span className="share-meta-label">Agora Channel</span>
              <code className="share-code-tag">{room.agoraChannel || `agora-incident-${room.id}`}</code>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label" htmlFor="share-url-input">
              Shareable Link
            </label>
            <div className="copy-link-box">
              <input
                id="share-url-input"
                type="text"
                className="form-input share-url-input"
                value={shareUrl}
                readOnly
              />
              <button
                type="button"
                className={`btn-copy ${copied ? 'btn-copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="share-features-list">
            <div className="share-feature-item">
              <Users size={16} className="text-cyan" />
              <div>
                <strong>Shared Voice RTC & Intelligence:</strong> Invited users join the exact same voice channel and interact with INCYRA in real time.
              </div>
            </div>
            <div className="share-feature-item">
              <Shield size={16} className="text-cyan" />
              <div>
                <strong>Secure Access:</strong> Teammates will be prompted to log in or register before entering the room, ensuring real authenticated rosters.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
