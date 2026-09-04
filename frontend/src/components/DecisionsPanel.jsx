import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  Clock,
  User,
  AlertTriangle,
  Plus,
  Sparkles,
  X,
  MessageSquare,
  RotateCcw,
  Check,
  Ban,
  Trash2,
} from 'lucide-react';

export default function DecisionsPanel({
  decisions = [],
  participants = [],
  onCreateDecision,
  onUpdateDecision,
  onDeleteDecision,
  isFullPage = false,
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionDescription, setNewDecisionDescription] = useState('');
  const [newDecisionStatus, setNewDecisionStatus] = useState('CONFIRMED');
  const [newDecidedBy, setNewDecidedBy] = useState('Incident Commander');

  // Real participants list
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
      list.push('Incident Commander');
      list.push('You (Incident Commander)');
    }
    return list;
  }, [participants]);

  // Dynamic summary counts
  const summaryCounts = useMemo(() => {
    const total = decisions.length;
    const proposed = decisions.filter((d) => d.status === 'PROPOSED').length;
    const confirmed = decisions.filter((d) => d.status === 'CONFIRMED' || !d.status).length;
    const rejected = decisions.filter((d) => d.status === 'REJECTED').length;
    const reversed = decisions.filter((d) => d.status === 'REVERSED').length;
    return { total, proposed, confirmed, rejected, reversed };
  }, [decisions]);

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    if (filterStatus === 'ALL') return decisions;
    if (filterStatus === 'CONFIRMED') {
      return decisions.filter((d) => d.status === 'CONFIRMED' || !d.status);
    }
    return decisions.filter((d) => d.status === filterStatus);
  }, [decisions, filterStatus]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newDecisionTitle.trim()) return;

    if (onCreateDecision) {
      onCreateDecision({
        title: newDecisionTitle.trim(),
        description: newDecisionDescription.trim() || 'Operational mitigation decision.',
        status: newDecisionStatus,
        decidedBy: newDecidedBy,
      });
    }

    setNewDecisionTitle('');
    setNewDecisionDescription('');
    setNewDecisionStatus('CONFIRMED');
    setNewDecidedBy('Incident Commander');
    setIsCreateModalOpen(false);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'CONFIRMED').toUpperCase();
    switch (s) {
      case 'PROPOSED':
        return <span className="badge badge-decision-proposed">PROPOSED</span>;
      case 'CONFIRMED':
        return <span className="badge badge-decision-confirmed">CONFIRMED</span>;
      case 'REJECTED':
        return <span className="badge badge-decision-rejected">REJECTED</span>;
      case 'REVERSED':
        return <span className="badge badge-decision-reversed">REVERSED</span>;
      default:
        return <span className="badge badge-demo">{s}</span>;
    }
  };

  return (
    <div className="glass-panel" aria-label="Incident Decisions Log">
      {/* Header */}
      <div className="panel-header" style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="panel-title-wrap">
          <CheckSquare size={18} className="text-cyan" />
          <div>
            <span className="panel-title" style={{ fontSize: '0.95rem' }}>DECISIONS LOG</span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Confirmed operational & mitigation actions during incident
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="badge badge-live" style={{ fontSize: '0.7rem' }}>
            <span>{summaryCounts.confirmed} CONFIRMED</span>
          </div>
          <button
            type="button"
            className="intel-action-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem' }}
          >
            <Plus size={14} /> Record Decision
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ padding: '1.25rem' }}>
        {/* Dynamic Summary Cards */}
        <div className="intel-summary-grid">
          <div
            className={`intel-stat-card ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
            title="View all decisions"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">TOTAL</span>
              <span className="intel-stat-count">{summaryCounts.total}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-primary)' }}>
              <CheckSquare size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'PROPOSED' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'PROPOSED' ? 'ALL' : 'PROPOSED'))}
            title="Filter by Proposed decisions"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">PROPOSED</span>
              <span className="intel-stat-count" style={{ color: '#f59e0b' }}>{summaryCounts.proposed}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <AlertTriangle size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'CONFIRMED' ? 'ALL' : 'CONFIRMED'))}
            title="Filter by Confirmed decisions"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">CONFIRMED</span>
              <span className="intel-stat-count" style={{ color: '#10b981' }}>{summaryCounts.confirmed}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ShieldCheck size={18} />
            </div>
          </div>

          <div
            className={`intel-stat-card ${filterStatus === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setFilterStatus((prev) => (prev === 'REJECTED' ? 'ALL' : 'REJECTED'))}
            title="Filter by Rejected decisions"
          >
            <div className="intel-stat-content">
              <span className="intel-stat-label">REJECTED</span>
              <span className="intel-stat-count" style={{ color: '#ef4444' }}>{summaryCounts.rejected}</span>
            </div>
            <div className="intel-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Ban size={18} />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="intel-filter-bar">
          <div className="intel-filter-tabs">
            {['ALL', 'CONFIRMED', 'PROPOSED', 'REJECTED', 'REVERSED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`intel-tab-btn ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            Showing {filteredDecisions.length} of {decisions.length} decisions
          </div>
        </div>

        {/* Decisions List */}
        {filteredDecisions.length === 0 ? (
          <div className="intel-empty-state">
            <div className="intel-empty-icon-wrap">
              <ShieldCheck size={24} />
            </div>
            <h4 className="intel-empty-title">No decisions recorded {filterStatus !== 'ALL' ? `in ${filterStatus}` : 'yet'}</h4>
            <p className="intel-empty-desc">
              INCYRA listens for proposed mitigation strategies and confirmed decisions in the voice room, creating an auditable timeline log.
            </p>

            <div className="intel-empty-listening-box">
              <strong><Sparkles size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} /> DECISION INTELLIGENCE ACTIVE:</strong>
              <div>Listen for phrases such as:</div>
              <div className="intel-empty-phrases">
                <span className="intel-phrase-chip">"Let's initiate a failover"</span>
                <span className="intel-phrase-chip">"We decided to rollback the recent release"</span>
                <span className="intel-phrase-chip">"The mitigation plan is approved"</span>
                <span className="intel-phrase-chip">"We decided not to restart the cluster"</span>
              </div>
            </div>

            <button
              type="button"
              className="intel-action-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ marginTop: '0.5rem' }}
            >
              <Plus size={14} /> Record Decision Manually
            </button>
          </div>
        ) : (
          <div className="decision-cards-list">
            {filteredDecisions.map((item) => {
              const titleText = item.title || item.decision;
              const descText = item.description || item.rationale;
              const decider = item.decidedBy || item.madeBy || 'Incident Commander';
              const status = (item.status || 'CONFIRMED').toUpperCase();

              return (
                <div key={item.id} className="decision-card">
                  <div className="decision-card-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        {getStatusBadge(status)}
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {titleText}
                        </span>
                      </div>

                      {descText && descText !== titleText && (
                        <div className="decision-card-description">{descText}</div>
                      )}

                      {item.sourceTranscript && (
                        <div className="source-transcript-tag">
                          <MessageSquare size={11} />
                          <span>Spoken: "{item.sourceTranscript}"</span>
                        </div>
                      )}
                    </div>

                    {/* Status Transition Controls */}
                    <div className="decision-card-controls">
                      <div className="decision-btn-group">
                        {status !== 'CONFIRMED' && (
                          <button
                            type="button"
                            className="decision-btn-mini confirm"
                            onClick={() => onUpdateDecision && onUpdateDecision(item.id, { status: 'CONFIRMED' })}
                            title="Confirm Decision"
                          >
                            <Check size={11} /> Confirm
                          </button>
                        )}
                        {status !== 'REJECTED' && (
                          <button
                            type="button"
                            className="decision-btn-mini reject"
                            onClick={() => onUpdateDecision && onUpdateDecision(item.id, { status: 'REJECTED' })}
                            title="Reject Decision"
                          >
                            <Ban size={11} /> Reject
                          </button>
                        )}
                        {status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="decision-btn-mini reverse"
                            onClick={() => onUpdateDecision && onUpdateDecision(item.id, { status: 'REVERSED' })}
                            title="Reverse Decision"
                          >
                            <RotateCcw size={11} /> Reverse
                          </button>
                        )}
                      </div>

                      {onDeleteDecision && (
                        <button
                          type="button"
                          className="decision-btn-mini"
                          onClick={() => onDeleteDecision(item.id)}
                          title="Delete decision"
                          style={{ padding: '0.3rem', color: 'var(--text-tertiary)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="decision-card-meta">
                    <span className="decision-meta-pill">
                      <User size={11} /> Decided by: <strong>{decider}</strong>
                    </span>

                    {item.confidence && (
                      <span className="decision-meta-pill" style={{ color: 'var(--accent-cyan)' }}>
                        <Sparkles size={11} /> {item.confidence}% AI Confidence
                      </span>
                    )}

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                      <Clock size={11} /> {item.timestamp || item.createdAt || 'Recorded'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Decision Modal */}
      {isCreateModalOpen && (
        <div className="intel-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="intel-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <ShieldCheck size={18} className="text-cyan" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Record Incident Decision
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
                  <label className="intel-modal-label">Decision Title *</label>
                  <input
                    type="text"
                    className="intel-modal-input"
                    placeholder="e.g., Failover traffic to secondary availability zone"
                    value={newDecisionTitle}
                    onChange={(e) => setNewDecisionTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="intel-modal-form-group">
                  <label className="intel-modal-label">Rationale & Context</label>
                  <textarea
                    className="intel-modal-textarea"
                    placeholder="Why this decision was made and what telemetry supported it..."
                    value={newDecisionDescription}
                    onChange={(e) => setNewDecisionDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="intel-modal-form-group">
                    <label className="intel-modal-label">Initial Status</label>
                    <select
                      className="intel-modal-select"
                      value={newDecisionStatus}
                      onChange={(e) => setNewDecisionStatus(e.target.value)}
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROPOSED">PROPOSED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div className="intel-modal-form-group">
                    <label className="intel-modal-label">Decided By</label>
                    <select
                      className="intel-modal-select"
                      value={newDecidedBy}
                      onChange={(e) => setNewDecidedBy(e.target.value)}
                    >
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
                  disabled={!newDecisionTitle.trim()}
                >
                  <Check size={14} /> Record Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
