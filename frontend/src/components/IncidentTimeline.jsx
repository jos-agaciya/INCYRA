import React from 'react';
import {
  Clock,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ListTodo,
  CheckSquare,
  Radio,
  Flame,
} from 'lucide-react';

export default function IncidentTimeline({ timeline = [] }) {
  const getEventMeta = (type) => {
    switch (type?.toLowerCase()) {
      case 'fact':
        return {
          icon: CheckCircle,
          dotClass: 'fact',
          tagClass: 'timeline-tag-fact',
          defaultTag: 'FACT',
        };
      case 'hypothesis':
        return {
          icon: HelpCircle,
          dotClass: 'hypothesis',
          tagClass: 'timeline-tag-hypothesis',
          defaultTag: 'HYPOTHESIS',
        };
      case 'conflict':
        return {
          icon: AlertTriangle,
          dotClass: 'conflict',
          tagClass: 'timeline-tag-conflict',
          defaultTag: 'CONFLICT',
        };
      case 'action':
        return {
          icon: ListTodo,
          dotClass: 'action',
          tagClass: 'timeline-tag-action',
          defaultTag: 'ACTION',
        };
      case 'decision':
        return {
          icon: CheckSquare,
          dotClass: 'decision',
          tagClass: 'timeline-tag-decision',
          defaultTag: 'DECISION',
        };
      case 'declaration':
      default:
        return {
          icon: Flame,
          dotClass: 'conflict',
          tagClass: 'timeline-tag-conflict',
          defaultTag: 'INCIDENT',
        };
    }
  };

  return (
    <div className="glass-panel" aria-label="Incident Chronological Timeline">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Clock size={16} className="text-secondary" />
          <span className="panel-title">INCIDENT TIMELINE</span>
        </div>
        <div className="badge badge-demo">
          <span>{timeline.length} LOGGED EVENTS</span>
        </div>
      </div>

      <div className="panel-body">
        <div className="timeline-container">
          <div className="timeline-line" />

          {timeline.map((event, index) => {
            const meta = getEventMeta(event.type);
            const Icon = meta.icon;
            const isFirst = index === 0;

            return (
              <div key={event.id || index} className="timeline-event">
                <div className={`timeline-dot ${meta.dotClass}`}>
                  <Icon size={10} />
                </div>

                <div className="timeline-card">
                  <div className="timeline-meta">
                    <span className="timeline-time">{event.time}</span>
                    <span className={`timeline-tag ${meta.tagClass}`}>
                      {event.tag || meta.defaultTag}
                    </span>
                    {isFirst && (
                      <span
                        className="badge badge-active"
                        style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem' }}
                      >
                        LATEST
                      </span>
                    )}
                    {event.author && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-tertiary)',
                          marginLeft: 'auto',
                        }}
                      >
                        {event.author}
                      </span>
                    )}
                  </div>

                  <p className="timeline-content">
                    <strong>{event.title ? `${event.title} — ` : ''}</strong>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
