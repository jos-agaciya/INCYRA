import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Camera,
  Check,
  LogOut,
  X,
  Sparkles,
  Server,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVATAR_PRESETS = [
  { id: 'cyan-shield', label: 'Commander', icon: '🛡️' },
  { id: 'emerald-bot', label: 'Engineer', icon: '⚡' },
  { id: 'amber-sec', label: 'Security', icon: '🔒' },
  { id: 'indigo-ops', label: 'SRE Lead', icon: '🌐' },
  { id: 'rose-lead', label: 'Coordinator', icon: '🎯' },
];

export default function ProfileModal({ isOpen, onClose, theme, onToggleTheme }) {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role || 'Incident Commander');
      setAvatar(user.avatar || 'cyan-shield');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (updateProfile) {
      updateProfile({
        name: name.trim(),
        role: role.trim() || 'Incident Commander',
        avatar,
        avatarUrl: avatarUrl.trim(),
      });
    }

    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      setIsEditing(false);
    }, 1000);
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const selectedPreset = AVATAR_PRESETS.find((p) => p.id === avatar) || AVATAR_PRESETS[0];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-standard glass-panel profile-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-badge">
              <User size={18} className="text-cyan" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="modal-title">
                Incident Responder Profile
              </h2>
              <p className="modal-subtitle">Manage your responder identity, command role, and session preferences.</p>
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

        {/* Modal Body */}
        <div className="modal-body">
          {/* Profile Hero Card */}
          <div className="profile-hero-card glass-subcard">
            <div className="profile-avatar-large-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || 'User'}
                  className="profile-avatar-img"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <div className="profile-avatar-large">
                  <span className="profile-avatar-icon">{selectedPreset.icon}</span>
                  <span className="profile-avatar-initials">{getInitials(name || user?.name)}</span>
                </div>
              )}
            </div>

            <div className="profile-hero-info">
              <div className="profile-hero-name-row">
                <h3 className="profile-hero-name">{user?.name || 'Incident Responder'}</h3>
                <span className="badge badge-active">{user?.role || 'Incident Commander'}</span>
              </div>
              <p className="profile-hero-email">
                <Mail size={13} className="text-muted" />
                <span>{user?.email || 'responder@incyra.internal'}</span>
              </p>
              <div className="profile-hero-tags">
                <span className="profile-status-pill">
                  <span className="pulse-dot-cyan"></span>
                  <span>Active Session</span>
                </span>
                <span className="profile-status-pill">
                  <ShieldCheck size={12} className="text-green" />
                  <span>Authenticated</span>
                </span>
              </div>
            </div>
          </div>

          {/* Toggle View / Edit Mode */}
          <div className="profile-tabs-row">
            <button
              type="button"
              className={`profile-tab-btn ${!isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(false)}
            >
              Account Overview
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile Details
            </button>
          </div>

          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">
                  Full Name <span className="text-red">*</span>
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jos Agaciya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-role">
                  Command Role / Title
                </label>
                <div className="input-with-icon">
                  <Briefcase size={16} className="input-icon" />
                  <input
                    id="profile-role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lead Incident Commander, Senior SRE"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>

              {/* Avatar Preset Selector */}
              <div className="form-group">
                <label className="form-label">Select Avatar Preset</label>
                <div className="avatar-presets-grid">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`avatar-preset-btn ${avatar === p.id && !avatarUrl ? 'selected' : ''}`}
                      onClick={() => {
                        setAvatar(p.id);
                        setAvatarUrl('');
                      }}
                      title={p.label}
                    >
                      <span className="preset-icon">{p.icon}</span>
                      <span className="preset-label">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Photo URL */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-avatar-url">
                  Custom Profile Photo URL (Optional)
                </label>
                <div className="input-with-icon">
                  <Camera size={16} className="input-icon" />
                  <input
                    id="profile-avatar-url"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savedFeedback}
                >
                  {savedFeedback ? (
                    <>
                      <Check size={16} className="text-green" />
                      <span>Saved Changes!</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Account Overview Info */
            <div className="profile-info-grid">
              <div className="profile-meta-row glass-subcard">
                <div className="meta-left">
                  <Shield size={16} className="text-cyan" />
                  <div>
                    <span className="meta-title">Platform Role</span>
                    <span className="meta-desc">Incident Response Lead with voice broadcast authority</span>
                  </div>
                </div>
                <span className="meta-val">{user?.role || 'Incident Commander'}</span>
              </div>

              <div className="profile-meta-row glass-subcard">
                <div className="meta-left">
                  <Radio size={16} className="text-green" />
                  <div>
                    <span className="meta-title">Live Voice Engine</span>
                    <span className="meta-desc">Agora RTC v4.23 + Conversational AI Agent</span>
                  </div>
                </div>
                <span className="badge badge-live">ENABLED</span>
              </div>

              <div className="profile-meta-row glass-subcard">
                <div className="meta-left">
                  <Server size={16} className="text-cyan" />
                  <div>
                    <span className="meta-title">Data Storage</span>
                    <span className="meta-desc">SQLite WAL Persistent Incident Intelligence</span>
                  </div>
                </div>
                <span className="badge badge-active">SYNCED</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer profile-modal-footer">
          <button
            type="button"
            className="btn-danger logout-action-btn"
            onClick={() => {
              onClose();
              logout();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
