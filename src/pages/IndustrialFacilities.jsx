import React, { useState, useEffect } from 'react';
import { loadEventsData, getIndustrialFacilities } from '../services/dataService';
import { Factory, ArrowUpDown } from 'lucide-react';

export default function IndustrialFacilities() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventsData().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const facilities = getIndustrialFacilities(events);

  return (
    <div className="main-content page-industrial-facilities">
      <div className="page-header" style={{marginTop:"25px"}}>
        <h1 className="page-title">Industrial Facilities</h1>
      </div>

      {/* Screenshot 5 Curved Table Container with Orange Border */}
      <div className="panel-card chart-card-box table-panel-curved">
        <div className="tech-table-container">
          <table className="tech-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Type</th>
                <th>State</th>
                <th>Nearby events</th>
                <th>Highest risk</th>
                <th>Persistent</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {facilities.slice(0, 10).map((fac, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fac.facility}</td>
                  <td>{fac.type}</td>
                  <td>{fac.state}</td>
                  <td style={{ fontWeight: 700, color: '#FF6A3D' }}>{fac.eventsCount}</td>
                  <td>
                    <span className={`badge badge-${fac.highestRisk.toLowerCase()}`}>
                      {fac.highestRisk}
                    </span>
                  </td>
                  <td style={{ color: '#38BDF8' }}>{fac.eventsCount * 12}d</td>
                  <td className="text-secondary">{fac.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .page-industrial-facilities { padding-top: 1rem; }
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
