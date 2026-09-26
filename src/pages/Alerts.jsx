import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadEventsData, getAlerts, subscribeToLiveStream } from '../services/dataService';
import { ShieldAlert, Eye, Flame, Radio, Zap, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Alerts() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EARLY' | 'CRITICAL' | 'HIGH'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // 25, 50, 100, or all
  const [livePulse, setLivePulse] = useState(false);

  useEffect(() => {
    loadEventsData().then(data => {
      setEvents(data);
      setLoading(false);
    });

    // Subscribe to live multi-satellite stream
    const unsubscribe = subscribeToLiveStream(
      (newEvent) => {
        setEvents((prev) => [newEvent, ...prev.filter(e => e.eventId !== newEvent.eventId)]);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 2000);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const alerts = useMemo(() => getAlerts(events), [events]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterType === 'LIVE' && !a.is_live) return false;
      if (filterType === 'EARLY' && !(a.is_early_warning || a.satellite?.includes('INSAT') || a.satellite?.includes('Himawari'))) return false;
      if (filterType === 'CRITICAL' && a.risk !== 'CRITICAL') return false;
      if (filterType === 'HIGH' && a.risk !== 'HIGH') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchLocation = (a.location || '').toLowerCase().includes(query);
        const matchType = (a.eventType || '').toLowerCase().includes(query);
        const matchSat = (a.satellite || '').toLowerCase().includes(query);
        const matchId = (a.eventId || '').toLowerCase().includes(query);
        if (!matchLocation && !matchType && !matchSat && !matchId) return false;
      }

      return true;
    });
  }, [alerts, filterType, searchQuery]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  // Pagination calculation
  const totalAlerts = filteredAlerts.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalAlerts / pageSize);
  const displayedAlerts = pageSize === 'ALL' 
    ? filteredAlerts 
    : filteredAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="main-content page-alerts">
      <div className="page-header" style={{ marginTop: "25px" }}>
        <div className="header-flex">
          <div>
            <h1 className="page-title">Real-Time Alerts & Early Warnings</h1>
            <p className="page-sub text-secondary">
              Live multi-satellite streaming alerts across all Indian industrial facilities & forest reserves
            </p>
          </div>

          <div className="live-status-pill">
            <span className={`pulse-dot ${livePulse ? 'active-pulse' : ''}`}></span>
            <Radio size={14} className="text-brand" />
            <span className="mono font-xs">STREAM: LIVE POSTGIS FEED</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="alert-controls-row">
          <div className="alert-filter-tabs">
            <button
              className={`alert-tab-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              className={`alert-tab-btn ${filterType === 'LIVE' ? 'active' : ''}`}
              onClick={() => setFilterType('LIVE')}
              style={{ color: filterType === 'LIVE' ? '#FF3B47' : undefined }}
            >
              <span className="pulse-dot" style={{ width: 6, height: 6 }}></span>
              <span>🔴 Live Detections ({alerts.filter(a => a.is_live).length})</span>
            </button>
            <button
              className={`alert-tab-btn ${filterType === 'EARLY' ? 'active' : ''}`}
              onClick={() => setFilterType('EARLY')}
            >
              <Zap size={13} className="text-warning" />
              <span>Early Warnings ({alerts.filter(a => a.is_early_warning || a.satellite?.includes('INSAT') || a.satellite?.includes('Himawari')).length})</span>
            </button>
            <button
              className={`alert-tab-btn ${filterType === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setFilterType('CRITICAL')}
            >
              <ShieldAlert size={13} className="text-critical" />
              <span>Critical ({alerts.filter(a => a.risk === 'CRITICAL').length})</span>
            </button>
            <button
              className={`alert-tab-btn ${filterType === 'HIGH' ? 'active' : ''}`}
              onClick={() => setFilterType('HIGH')}
            >
              High Risk ({alerts.filter(a => a.risk === 'HIGH').length})
            </button>
          </div>

          <div className="search-and-pagesize">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon text-secondary" />
              <input
                type="text"
                className="tech-input alert-search-input"
                placeholder="Search facility, state, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="tech-select alert-pagesize-select"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            >
              <option value={25}>Show 25</option>
              <option value={50}>Show 50</option>
              <option value={100}>Show 100</option>
              <option value="ALL">Show All ({totalAlerts})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Curved Alert Box Container */}
      <div className="panel-card chart-card-box alerts-curved-container">
        <div className="alerts-meta-bar">
          <span className="mono text-secondary font-xs">
            SHOWING {displayedAlerts.length} OF {totalAlerts} FILTERED ALERTS
          </span>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn btn-sm btn-secondary page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="mono font-xs">
                PAGE {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="alerts-list-inner">
          {displayedAlerts.length === 0 ? (
            <div className="text-center text-secondary py-5 mono">NO ALERTS FOUND MATCHING CRITERIA</div>
          ) : (
            displayedAlerts.map(alert => {
              const isFastGeo = alert.is_early_warning || alert.satellite?.includes('INSAT') || alert.satellite?.includes('Himawari');

              return (
                <div key={alert.id || alert.eventId} className={`alert-row-item ${isFastGeo ? 'early-warning-row' : ''}`}>
                  <div className="alert-left-info">
                    {isFastGeo ? (
                      <Zap size={22} style={{ color: '#FF9F1C' }} />
                    ) : (
                      <ShieldAlert size={22} style={{ color: alert.risk === 'CRITICAL' ? '#FF3B47' : '#FF9F1C' }} />
                    )}
                    <div>
                      <div className="alert-title-text" style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{alert.location}</span>
                        {alert.state && <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{alert.state}</span>}
                        {alert.pixelCount > 1 && <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>🔥 {alert.pixelCount} Satellite Pixels</span>}
                      </div>
                      <div className="alert-sub-meta text-secondary">
                        <span className="sensor-source-tag mono">
                          🛰️ {alert.satellite || 'VIIRS NOAA-21'}
                        </span>
                        {alert.latitude && alert.longitude && (
                          <span className="mono" style={{ color: 'var(--brand)', marginLeft: 6, marginRight: 6 }}>
                            📍 {parseFloat(alert.latitude).toFixed(3)}°N, {parseFloat(alert.longitude).toFixed(3)}°E
                          </span>
                        )}
                        {' · '}{alert.eventType} · FRP: <strong style={{ color: '#FF6A3D' }}>{alert.frp} MW</strong> · {alert.date} {alert.time || ''}
                      </div>
                      {alert.reason && (
                        <div className="alert-reason-text" style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '0.35rem', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #FF6A3D' }}>
                          <strong style={{ color: '#FF9F1C' }}>Diagnosis:</strong> {alert.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="alert-right-actions">
                    {alert.is_live && (
                      <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="pulse-dot" style={{ width: 6, height: 6, background: '#fff' }}></span>
                        LIVE DETECTED
                      </span>
                    )}
                    {isFastGeo && (
                      <span className="badge badge-warning">⚡ FLASH TRIGGER</span>
                    )}
                    <span className={`badge badge-${alert.risk.toLowerCase()}`}>{alert.risk}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/event/${alert.id || alert.eventId}`, { state: { event: alert } })}>
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Pagination Bar */}
        {totalPages > 1 && (
          <div className="alerts-meta-bar" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span className="mono text-secondary font-xs">
              SHOWING {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalAlerts)} OF {totalAlerts} ALERTS
            </span>

            <div className="pagination-controls">
              <button
                className="btn btn-sm btn-secondary page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="mono font-xs">
                PAGE {currentPage} OF {totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .page-alerts { padding-top: 1rem; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.75rem; font-weight: 800; }
        .page-sub { font-size: 0.9rem; margin-top: 0.25rem; }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--elevated);
          border: 1px solid var(--border);
          padding: 6px 12px;
          border-radius: 20px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34D399;
          display: inline-block;
          animation: pulseGreen 1.5s infinite;
        }

        .pulse-dot.active-pulse {
          background: #FF9F1C;
          box-shadow: 0 0 10px #FF9F1C;
        }

        @keyframes pulseGreen {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }

        .alert-controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .alert-filter-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .alert-tab-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }

        .alert-tab-btn:hover {
          color: var(--text-primary);
          border-color: var(--brand);
        }

        .alert-tab-btn.active {
          background: var(--elevated);
          color: var(--text-primary);
          border-color: #FF3B47;
          box-shadow: 0 0 10px rgba(255, 59, 71, 0.2);
        }

        .search-and-pagesize {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
        }

        .alert-search-input {
          padding-left: 30px;
          height: 36px;
          width: 240px;
        }

        .alert-pagesize-select {
          height: 36px;
        }

        .alerts-curved-container {
          border: 1px solid #ff301e;
          border-radius: 40px;
          padding: 1.5rem;
          min-height: 480px;
          box-shadow: 0 0 25px rgba(250, 21, 0, 0.3);
        }

        .alerts-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-btn {
          padding: 4px 10px;
          font-size: 0.75rem;
        }

        .alerts-list-inner {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .alert-row-item {
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-small);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }

        .alert-row-item:hover {
          border-color: var(--brand);
          box-shadow: 0 0 15px rgba(250, 21, 0, 0.4);
        }

        .early-warning-row {
          border-left: 4px solid #FF9F1C;
        }

        .sensor-source-tag {
          color: #FF9F1C;
          font-size: 0.75rem;
          background: var(--page-bg);
          padding: 1px 6px;
          border-radius: 3px;
        }

        .alert-left-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .alert-sub-meta {
          font-size: 0.82rem;
          margin-top: 0.2rem;
        }

        .alert-right-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .alert-controls-row {
            flex-direction: column;
            align-items: stretch;
          }

          .search-and-pagesize {
            flex-direction: column;
          }

          .alert-search-input {
            width: 100%;
          }

          .alert-row-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .alert-right-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
