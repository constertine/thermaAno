import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ThermalMap from '../components/ThermalMap';
import { loadEventsData, subscribeToLiveStream } from '../services/dataService';
import { AlertTriangle } from 'lucide-react';

export default function Overview() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventsData().then(data => {
      setEvents(data);
      setLoading(false);
    });

    const unsubscribe = subscribeToLiveStream((newEvent) => {
      setEvents(prev => [newEvent, ...prev.filter(e => e.eventId !== newEvent.eventId)]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const priorityEvents = useMemo(() => {
    return [...(events || [])]
      .sort((a, b) => (parseFloat(b.risk_score || b.riskScore || 0)) - (parseFloat(a.risk_score || a.riskScore || 0)))
      .slice(0, 3);
  }, [events]);

  return (
    <div className="main-content page-overview">
      {/* SCREENSHOT 3 HEADER */}
      <div className="overview-header">
        <h1 className="overview-title">National Thermal Intelligence</h1>
        <p className="overview-sub text-secondary">
          Real time situational overview across India ({events.length} 30-day baseline + live detections)
        </p>
      </div>

      {/* MAP & PRIORITY EVENTS GRID */}
      <div className="map-and-sidebar-grid">
        <div className="map-frame-box">
          <ThermalMap events={events} height="700px" />
        </div>

        <div className="overview-sidebar panel-card">
          <div className="sidebar-section">
            <div className="sidebar-label">DYNAMIC RISK SPECTRUM</div>
            <div className="legend-grid">
              <div className="legend-item"><span className="dot" style={{ backgroundColor: '#dc2626' }}></span><span>Critical (≥ 0.80)</span></div>
              <div className="legend-item"><span className="dot" style={{ backgroundColor: '#f97316' }}></span><span>High (0.60 – 0.79)</span></div>
              <div className="legend-item"><span className="dot" style={{ backgroundColor: '#facc15' }}></span><span>Medium (0.40 – 0.59)</span></div>
              <div className="legend-item"><span className="dot" style={{ backgroundColor: '#22c55e' }}></span><span>Low (&lt; 0.40)</span></div>
            </div>
          </div>

          <hr className="sidebar-divider" />

          {/* PRIORITY EVENTS */}
          <div className="sidebar-section">
            <div className="sidebar-header-row">
              <div className="sidebar-label">PRIORITY EVENTS</div>
              <div className="dots-icon">•••</div>
            </div>

            <div className="priority-events-list">
              {priorityEvents.map(evt => (
                <div key={evt.id || evt.eventId} className="priority-item" onClick={() => navigate(`/event/${evt.id || evt.eventId}`)}>
                  <div className="priority-item-header">
                    <span className="priority-title" style={{ color: evt.risk === 'CRITICAL' ? '#FF3B47' : '#FF9F1C' }}>
                      {evt.predicted_class || evt.eventType || 'Thermal Anomaly'}
                    </span>
                    <AlertTriangle size={16} style={{ color: evt.risk === 'CRITICAL' ? '#FF3B47' : '#FF9F1C' }} />
                  </div>
                  <div className="priority-meta text-secondary">{evt.facilityName || evt.state} · FRP: {evt.frp} MW</div>
                  <div className="priority-meta text-secondary">Detected {evt.acq_date} {evt.acq_time || ''}</div>
                </div>
              ))}
            </div>

            <div className="view-more-row" onClick={() => navigate('/all-anomalies')}>
              <span>View more →</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .page-overview {
          padding-top: 1rem;
        }

        .overview-header {
          margin-bottom: 1.5rem;
        }

        .overview-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-top:20px;
        }

        .overview-sub {
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .map-and-sidebar-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          padding:15px;
        }

        .map-frame-box {
          border: 1px solid var(--brand);
          border-radius: var(--radius-large); /* 50px curved edge */
          overflow: hidden;
          box-shadow: 0 0 25px rgba(240, 101, 61, 0.25);
        }

        .overview-sidebar {
          border-radius: var(--radius-large);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .sidebar-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem 1rem;
          margin-top: 0.85rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
        }

        .legend-item .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .sidebar-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dots-icon {
          color: var(--text-secondary);
          letter-spacing: 0.1em;
        }

        .priority-events-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 0.85rem;
        }

        .priority-item {
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .priority-item:hover {
          border-color: var(--brand);
          box-shadow: 0 0 15px rgba(240, 101, 61, 0.3);
        }

        .priority-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .priority-title {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .priority-meta {
          font-size: 0.78rem;
        }

        .view-more-row {
          margin-top: 1rem;
          text-align: right;
          color: var(--brand);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 1200px) {
          .map-and-sidebar-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
