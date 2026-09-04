import React, { useState, useMemo } from 'react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Plus,
  Filter,
  Check,
  Sparkles,
  X,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';

export default function ActionItemsPanel({
  actions = [],
  participants = [],
  onToggleStatus,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
  isFullPage = false,
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');
  const [newActionPriority, setNewActionPriority] = useState('HIGH');
  const [newActionAssignee, setNewActionAssignee] = useState('');

  // Extract real participant names (NO fake users)
  const realParticipantList = useMemo(() => {
    const list = [];
    if (participants && Array.isArray(participants)) {
      participants.forEach((p) => {
        if (p && p.name && !list.includes(p.name)) {
          list.push(p.name);
        }
      });
    }
    if (list.length === 0) {
      list.push('You (Incident Commander)');
    }
    return list;
  }, [participants]);

  // Compute real dynamic summary counts
  const summaryCounts = useMemo(() => {
    const total = actions.length;
    const open = actions.filter((a) => a.status === 'OPEN').length;
    const inProgress = actions.filter((a) => a.status === 'IN_PROGRESS').length;
    const blocked = actions.filter((a) => a.status === 'BLOCKED').length;
    const completed = actions.filter((a) => a.status === 'COMPLETED').length;
    return { total, open, inProgress, blocked, completed };
  }, [actions]);

  // Filter items
  const filteredActions = useMemo(() => {
    if (filterStatus === 'ALL') return actions;
    return actions.filter((a) => a.status === filterStatus);
  }, [actions, filterStatus]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    if (onCreateAction) {
      onCreateAction({
        title: newActionTitle.trim(),
        description: newActionDescription.trim() || undefined,
        priority: newActionPriority,
        assignee: newActionAssignee || null,
        status: 'OPEN',
        sourceSpeaker: 'Incident Commander',
      });
    }

    setNewActionTitle('');
    setNewActionDescription('');
    setNewActionPriority('HIGH');
    setNewActionAssignee('');
    setIsCreateModalOpen(false);
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || 'HIGH').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return <span className="badge badge-priority-critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-priority-high">HIGH</span>;
      case 'MEDIUM':
      case 'MED':
        return <span className="badge badge-priority-medium">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="badge badge-priority-low">LOW</span>;
    }
  };

  return (
    <div className="glass-panel" aria-label="Incident Action Items Command">
      {/* Header */}
      <div className="panel-header" style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="panel-title-wrap">
          <ListTodo size={18} className="text-cyan" />
          <div>
            <span className="panel-title" style={{ fontSize: '0.95rem' }}>ACTION ITEMS</span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Track and coordinate tasks generated during the live incident
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="badge badge-active" style={{ fontSize: '0.7rem' }}>
            <span>{summaryCounts.open + summaryCounts.inProgress} ACTIVE</span>
          </div>
          <button
            type="button"
            className="intel-action-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem' }}
          >
            <Plus size={14} /> Create Action
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ padding: '1.25rem' }}>
        {/* Dynamic Summary Metric Cards */}
        <div className="intel-summary-grid">
          <div
            className={`intel-stat-card ${filterStatus === 'OPEN' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'OPEN' ? 'ALL' : 'OPEN'))}
            title="Filter by Open items"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">OPEN</span>
              <span className="intel-stat-count" style={{ color: '#38bdf8' }}>{summaryCounts.open}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
              <Clock size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS'))}
            title="Filter by In Progress items"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">IN PROGRESS</span>
              <span className="intel-stat-count" style={{ color: '#f59e0b' }}>{summaryCounts.inProgress}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <AlertCircle size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'BLOCKED' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'BLOCKED' ? 'ALL' : 'BLOCKED'))}
            title="Filter by Blocked items"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">BLOCKED</span>
              <span className="intel-stat-count" style={{ color: '#ef4444' }}>{summaryCounts.blocked}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <ShieldAlert size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'COMPLETED' ? 'ALL' : 'COMPLETED'))}
            title="Filter by Completed items"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">COMPLETED</span>
              <span className="intel-stat-count" style={{ color: '#10b981' }}>{summaryCounts.completed}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="intel-filter-bar">
          <div className="intel-filter-tabs">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`intel-tab-btn ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            Showing {filteredActions.length} of {actions.length} action items
          </div>
        </div>

        {/* Action Items List */}
        {filteredActions.length === 0 ? (
          <div className="intel-empty-state">
            <div className="intel-empty-icon-wrap">
              <ListTodo size={24} />
            </div>
            <h4 className="intel-empty-title">No action items {filterStatus !== 'ALL' ? `in ${filterStatus.replace('_', ' ')}` : 'yet'}</h4>
            <p className="intel-empty-desc">
              INCYRA intelligently extracts actionable tasks from the live incident conversation and coordinates them here in real time.
            </p>

            <div className="intel-empty-listening-box">
              <strong><Sparkles size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} /> LIVE SPEECH EXTRACTION ACTIVE:</strong>
              <div>Say phrases such as:</div>
              <div className="intel-empty-phrases">
                <span className="intel-phrase-chip">"Investigate the service logs"</span>
                <span className="intel-phrase-chip">"I'll check the error rate"</span>
                <span className="intel-phrase-chip">"Can someone verify database connectivity?"</span>
                <span className="intel-phrase-chip">"We need to check the recent deployment"</span>
              </div>
            </div>

            <button
              type="button"
              className="intel-action-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ marginTop: '0.5rem' }}
            >
              <Plus size={14} /> Create Action Item Manually
            </button>
          </div>
        ) : (
          <div className="action-cards-list">
            {filteredActions.map((item) => {
              const isDone = item.status === 'COMPLETED';
              const isBlocked = item.status === 'BLOCKED';
              const hasAssignee = Boolean(item.assignee || item.owner);
              const assigneeName = item.assignee || item.owner;

              return (
                <div
                  key={item.id}
                  className={`action-card ${isDone ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}`}
                >
                  <div className="action-card-header">
                    <div className="action-card-left">
                      <button
                        type="button"
                        className={`action-card-checkbox ${isDone ? 'checked' : ''}`}
                        onClick={() => {
                          if (onToggleStatus) onToggleStatus(item.id);
                          else if (onUpdateAction) onUpdateAction(item.id, { status: isDone ? 'OPEN' : 'COMPLETED' });
                        }}
                        title={isDone ? 'Reopen task' : 'Mark as completed'}
                        aria-label={`Toggle completion for ${item.title}`}
                      >
                        {isDone && <Check size={13} strokeWidth={3} />}
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          {getPriorityBadge(item.priority)}
                          <span className="action-card-title">{item.title}</span>
                        </div>

                        {item.description && item.description !== item.title && (
                          <div className="action-card-description">{item.description}</div>
                        )}

                        {item.sourceTranscript && (
                          <div className="source-transcript-tag">
                            <MessageSquare size={11} />
                            <span>Spoken: "{item.sourceTranscript}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Controls */}
                    <div className="action-card-controls">
                      {/* Status Selector */}
                      <select
                        className="action-select-status"
                        value={item.status || 'OPEN'}
                        onChange={(e) => {
                          if (onUpdateAction) onUpdateAction(item.id, { status: e.target.value });
                        }}
                        aria-label="Change action item status"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      {/* Real Participant Assignee Selector */}
                      <select
                        className="action-select-assignee"
                        value={assigneeName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (onUpdateAction) {
                            onUpdateAction(item.id, {
                              assignee: val || null,
                              assignmentStatus: val ? 'ASSIGNED' : 'UNASSIGNED',
                            });
                          }
                        }}
                        aria-label="Assign to real participant"
                      >
                        <option value="">(Unassigned)</option>
                        {realParticipantList.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>

                      {onDeleteAction && (
                        <button
                          type="button"
                          className="decision-btn-mini"
                          onClick={() => onDeleteAction(item.id)}
                          title="Delete action item"
                          style={{ padding: '0.3rem', color: 'var(--text-tertiary)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="action-card-meta">
                    {hasAssignee ? (
                      <span className="action-meta-pill assigned">
                        <UserCheck size={11} /> Assigned: <strong>{assigneeName}</strong>
                      </span>
                    ) : (
                      <span className="action-meta-pill unassigned">
                        <UserX size={11} /> <strong>UNASSIGNED</strong> — Needs Assignment
                      </span>
                    )}

                    {item.sourceSpeaker && (
                      <span className="action-meta-pill">
                        <User size={11} /> Source: {item.sourceSpeaker}
                      </span>
                    )}

                    {item.confidence && (
                      <span className="action-meta-pill" style={{ color: 'var(--accent-cyan)' }}>
                        <Sparkles size={11} /> {item.confidence}% AI Confidence
                      </span>
                    )}

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                      <Clock size={11} /> {item.updatedAt || item.createdAt || 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Action Item Modal */}
      {isCreateModalOpen && (
        <div className="intel-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="intel-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <ListTodo size={18} className="text-cyan" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Create Incident Action Item
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="intel-modal-form-group">
                  <label className="intel-modal-label">Task Title *</label>
                  <input
                    type="text"
                    className="intel-modal-input"
                    placeholder="e.g., Inspect ingress error rate telemetry"
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="intel-modal-form-group">
                  <label className="intel-modal-label">Description & Steps</label>
                  <textarea
                    className="intel-modal-textarea"
                    placeholder="Specific investigation steps, URLs, or metric targets..."
                    value={newActionDescription}
                    onChange={(e) => setNewActionDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="intel-modal-form-group">
                    <label className="intel-modal-label">Priority</label>
                    <select
                      className="intel-modal-select"
                      value={newActionPriority}
                      onChange={(e) => setNewActionPriority(e.target.value)}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="intel-modal-form-group">
                    <label className="intel-modal-label">Assignee (Real Team Only)</label>
                    <select
                      className="intel-modal-select"
                      value={newActionAssignee}
                      onChange={(e) => setNewActionAssignee(e.target.value)}
                    >
                      <option value="">(Leave Unassigned)</option>
                      {realParticipantList.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="decision-btn-mini"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="intel-action-btn-primary"
                  disabled={!newActionTitle.trim()}
                >
                  <Plus size={14} /> Add Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
