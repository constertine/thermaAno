import React, { useState, useEffect } from 'react';
import { loadEventsData, getPersistentSources } from '../services/dataService';
import { Flame } from 'lucide-react';

export default function PersistentSources() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventsData().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const persistentSources = getPersistentSources(events);

  return (
    <div className="main-content page-persistent-sources">
      <div className="page-header" style={{marginTop:"25px"}}>
        <h1 className="page-title">Persistent Thermal Sources</h1>
        <p className="page-sub text-secondary">
          Long running thermal sources refineries, flares, power plants, steel & mining areas
        </p>
      </div>

      {/* Screenshot 5 Persistent Sources Curved Table */}
      <div className="panel-card chart-card-box table-panel-curved">
        <div className="tech-table-container">
          <table className="tech-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Event type</th>
                <th>State</th>
                <th>Duration</th>
                <th>Avg power</th>
                <th>Peak power</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {persistentSources.slice(0, 10).map((src, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{src.facility}</td>
                  <td><span className="badge badge-medium">{src.eventType}</span></td>
                  <td>{src.state}</td>
                  <td style={{ color: '#38BDF8' }}>{src.durationDays}d</td>
                  <td style={{ color: 'var(--text-primary)' }}>{src.avgPower} MW</td>
                  <td style={{ color: '#FF6A3D', fontWeight: 700 }}>{src.peakPower} MW</td>
                  <td>
                    <span className={`badge badge-${src.severity.toLowerCase()}`}>{src.severity}</span>
                  </td>
                  <td style={{ color: '#38BDF8', fontWeight: 600 }}>Persistent</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .page-persistent-sources { padding-top: 1rem; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; }
        .page-sub { font-size: 0.9rem; margin-top: 0.25rem; }

        .table-panel-curved {
          border: 1px solid var(--brand) !important;
          border-radius: 40px;
          padding: 0 auto;
          overflow: hidden;
          box-shadow: 0 0 25px rgba(240, 101, 61, 0.25);
        }

        .tech-table-container { border: none !important; }
      `}</style>
    </div>
  );
}
