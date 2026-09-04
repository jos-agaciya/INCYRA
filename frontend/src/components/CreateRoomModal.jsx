import React, { useState } from 'react';
import { ShieldAlert, X, Radio, Server, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [service, setService] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide an incident room title.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.createRoom({
        title: title.trim(),
        description: description.trim(),
        severity,
        service: service.trim() || 'Under Investigation',
      });

      if (response && response.room) {
        onRoomCreated(response.room);
        onClose();
      } else {
        throw new Error('Failed to create incident room.');
      }
    } catch (err) {
      setError(err.message || 'Error creating incident room.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-standard glass-panel">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-badge">
              <ShieldAlert size={18} className="text-cyan" />
            </div>
            <div>
              <h2 id="create-room-title" className="modal-title">
                Create Incident Room
              </h2>
              <p className="modal-subtitle">
                Initialize a dedicated live command room with persistent Agora voice RTC and INCYRA AI intelligence.
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="auth-error-alert" style={{ margin: '1rem 1.5rem 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="incident-title">
                Incident Title <span className="text-red">*</span>
              </label>
              <input
                id="incident-title"
                type="text"
                className="form-input"
                placeholder="e.g. Database Production Replica Lag Spike"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="incident-desc">
                Incident Description (Optional)
              </label>
              <textarea
                id="incident-desc"
                className="form-textarea"
                placeholder="Brief initial summary or reported symptoms..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label" htmlFor="incident-severity">
                  Severity Level
                </label>
                <select
                  id="incident-severity"
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="CRITICAL">CRITICAL (SEV-0)</option>
                  <option value="HIGH">HIGH (SEV-1)</option>
                  <option value="MEDIUM">MEDIUM (SEV-2)</option>
                  <option value="LOW">LOW (SEV-3)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incident-service">
                  Affected Service / System
                </label>
                <input
                  id="incident-service"
                  type="text"
                  className="form-input"
                  placeholder="e.g. PostgreSQL Cluster, Auth API"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="info-box-cyan">
              <Radio size={16} className="text-cyan" />
              <div className="info-box-text">
                <strong>Genuinely Empty Initial State:</strong> The room starts with zero mock facts, risks, actions, or decisions. As you speak, INCYRA will capture live intelligence dynamically.
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <span>Launch Incident Room</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
