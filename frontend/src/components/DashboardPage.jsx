import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Plus,
  Radio,
  Users,
  Clock,
  Share2,
  ArrowRight,
  LogOut,
  Server,
  Activity,
  AlertTriangle,
  Layers,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import ThemeToggle from './ThemeToggle';
import CreateRoomModal from './CreateRoomModal';
import ShareRoomModal from './ShareRoomModal';
import ProfileModal from './ProfileModal';

export default function DashboardPage({ onOpenRoom, theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareModalRoom, setShareModalRoom] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchRooms = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const roomList = await apiService.listRooms();
      setRooms(roomList);
      setError(null);
    } catch (err) {
      console.error('[DASHBOARD] Failed to load rooms:', err);
      setError('Unable to load incident rooms. Please refresh.');
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    onOpenRoom(newRoom.id);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getSeverityBadgeClass = (sev) => {
    const s = (sev || '').toUpperCase();
    if (s.includes('CRITICAL') || s.includes('0')) return 'badge-sev0';
    if (s.includes('HIGH') || s.includes('1')) return 'badge-sev1';
    if (s.includes('MED') || s.includes('2')) return 'badge-sev2';
    return 'badge-sev3';
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <header className="dashboard-header glass-panel">
        <div className="dashboard-brand">
          <div className="auth-logo-icon">
            <ShieldAlert size={22} className="text-cyan" />
          </div>
          <div>
            <span className="dashboard-title">INCYRA</span>
            <span className="dashboard-subtitle">Incident Command Hub</span>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Clickable Profile Badge */}
          <button
            type="button"
            className="user-profile-badge interactive-profile-btn"
            onClick={() => setIsProfileOpen(true)}
            title={`Signed in as ${user?.name || 'User'} (${user?.email || ''}) — Click to edit profile`}
            aria-label="Open User Profile and Settings"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="user-avatar-circle" />
            ) : (
              <div className="user-avatar-circle">{getInitials(user?.name)}</div>
            )}
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Incident Commander'}</span>
            </div>
            <ChevronDown size={14} className="text-muted hide-mobile" />
          </button>

          <button
            className="btn-secondary logout-btn"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
            <span className="hide-mobile">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="dashboard-body">
        {/* Banner / Action Row */}
        <div className="dashboard-action-banner glass-panel">
          <div className="banner-text">
            <h1 className="banner-title">Active Incident Command Rooms</h1>
            <p className="banner-desc">
              Create and coordinate multi-user live incident rooms powered by real-time voice RTC and INCYRA AI intelligence.
            </p>
          </div>
          <div className="banner-buttons">
            <button
              className="btn-secondary"
              onClick={() => fetchRooms(true)}
              disabled={isRefreshing}
              title="Refresh Rooms List"
            >
              <RefreshCw size={16} className={isRefreshing ? 'spinner' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn-primary create-room-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={18} />
              <span>Create Incident Room</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="dashboard-loading-state glass-panel">
            <Loader2 size={32} className="spinner text-cyan" />
            <p>Loading incident command rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          /* Empty State - No mock incidents, clean prompt */
          <div className="dashboard-empty-state glass-panel">
            <div className="empty-state-icon-circle">
              <Layers size={36} className="text-cyan" />
            </div>
            <h2 className="empty-state-title">No Incident Rooms Yet</h2>
            <p className="empty-state-desc">
              All incident rooms start genuinely empty with zero mock data. Launch a new incident room to collaborate with your team and let INCYRA assist your investigation.
            </p>
            <button
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Create Your First Room</span>
            </button>
          </div>
        ) : (
          /* Grid of Real Rooms */
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card glass-panel">
                <div className="room-card-header">
                  <div className="room-badges">
                    <span className={`badge ${getSeverityBadgeClass(room.severity)}`}>
                      {room.severity || 'HIGH'}
                    </span>
                    <span className="badge badge-active">
                      <span className="pulse-dot-cyan"></span>
                      <span>{room.status || 'ACTIVE'}</span>
                    </span>
                  </div>
                  <button
                    className="room-share-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareModalRoom(room);
                    }}
                    title="Share Room Link"
                    aria-label="Share Room Link"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                <div className="room-card-body" onClick={() => onOpenRoom(room.id)}>
                  <h3 className="room-card-title">{room.title}</h3>
                  {room.description && (
                    <p className="room-card-desc">{room.description}</p>
                  )}

                  <div className="room-card-meta">
                    <div className="room-meta-item" title="Affected System">
                      <Server size={14} className="text-muted" />
                      <span>{room.service || 'System Under Investigation'}</span>
                    </div>
                    <div className="room-meta-item" title="Room Members">
                      <Users size={14} className="text-muted" />
                      <span>{room.memberCount || 1} Member{(room.memberCount || 1) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="room-meta-item" title="Created At">
                      <Clock size={14} className="text-muted" />
                      <span>
                        {new Date(room.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="room-card-footer">
                  <div className="room-role-indicator">
                    {room.ownerId === user?.id ? (
                      <span className="role-tag-owner">Commander (Owner)</span>
                    ) : (
                      <span className="role-tag-member">Team Member</span>
                    )}
                  </div>
                  <button
                    className="btn-primary room-enter-btn"
                    onClick={() => onOpenRoom(room.id)}
                  >
                    <span>Enter Room</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        isOpen={Boolean(shareModalRoom)}
        onClose={() => setShareModalRoom(null)}
        room={shareModalRoom}
      />

      {/* Account & Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}
