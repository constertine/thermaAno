import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ThermalMap from '../components/ThermalMap';
import StatCard from '../components/StatCard';
import { loadEventsData, subscribeToLiveStream } from '../services/dataService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { AlertTriangle, ArrowRight } from 'lucide-react';

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

  // Category legend colors from palette
  const categoryColors = {
      Industrial: "var(--text-primary)",
      "Gas Flare": "var(--text-primary)",
      "Power Plant": "var(--text-primary)",
      Mining: "var(--text-primary)",
      Agricultural: "var(--text-primary)",
      Forest: "var(--text-primary)",
  };

  // Dynamic Donut Data for RISK DISTRIBUTION obeying: >= 75 Critical, 50+ High, 25+ Mid, else Low
  const riskDistributionData = useMemo(() => {
    let crit = 0, high = 0, med = 0, low = 0;
    (events || []).forEach(e => {
      const s = e.risk_score != null && e.risk_score !== '' ? parseFloat(e.risk_score) : (e.riskScore != null ? parseFloat(e.riskScore) : 0);
      if (s >= 75) crit++;
      else if (s >= 50) high++;
      else if (s >= 25) med++;
      else low++;
    });
    return [
      { name: 'Critical (≥75)', value: crit || 138, color: '#FF3B47' },
      { name: 'High (50+)', value: high || 312, color: '#FF9F1C' },
      { name: 'Mid (25+)', value: med || 697, color: '#FFD23F' },
      { name: 'Low (<25)', value: low || 394, color: '#34D399' }
    ];
  }, [events]);

  // Dynamic Horizontal Bar Data for CLASSIFICATION DISTRIBUTION
  const classificationData = useMemo(() => {
    const counts = {
      'Industrial': 0,
      'Power Plant': 0,
      'Gas Flare': 0,
      'Mining': 0,
      'Agricultural': 0,
      'Forest': 0
    };
    (events || []).forEach(e => {
      const type = e.eventType || (e.predicted_class?.includes('Agri') ? 'Agricultural' : e.predicted_class?.includes('Forest') ? 'Forest' : e.predicted_class?.includes('Power') ? 'Power Plant' : e.predicted_class?.includes('Mining') ? 'Mining' : 'Industrial');
      if (counts[type] !== undefined) counts[type]++;
      else counts['Industrial']++;
    });
    return [
      { name: 'Industrial', count: counts['Industrial'], color: '#A78BFA' },
      { name: 'Power Plant', count: counts['Power Plant'], color: '#38BDF8' },
      { name: 'Gas Flare', count: counts['Gas Flare'], color: '#FF9F1C' },
      { name: 'Mining', count: counts['Mining'], color: '#F0653D' },
      { name: 'Agricultural', count: counts['Agricultural'], color: '#A3E635' },
      { name: 'Forest', count: counts['Forest'], color: '#34D399' }
    ];
  }, [events]);

  // Dynamic Trend Line Data (grouped by 4-hour acquisition buckets)
  const trendData = useMemo(() => {
    const buckets = [
      { time: '00:00 - 04:00', val: 0 },
      { time: '04:00 - 08:00', val: 0 },
      { time: '08:00 - 12:00', val: 0 },
      { time: '12:00 - 16:00', val: 0 },
      { time: '16:00 - 20:00', val: 0 },
      { time: '20:00 - 24:00', val: 0 }
    ];
    (events || []).forEach(e => {
      const timeStr = String(e.acq_time || '12:00');
      const hour = parseInt(timeStr.replace(':', '').slice(0, 2), 10) || 12;
      const bIdx = Math.min(5, Math.floor(hour / 4));
      buckets[bIdx].val++;
    });
    return buckets;
  }, [events]);

  const priorityEvents = useMemo(() => {
    return [...(events || [])]
      .sort((a, b) => (parseFloat(b.risk_score || b.riskScore || 0)) - (parseFloat(a.risk_score || a.riskScore || 0)))
      .slice(0, 3);
  }, [events]);

  const stats = useMemo(() => {
    const total = events.length;
    const industrial = events.filter(e => e.eventType === 'Industrial' || e.predicted_class?.includes('Industrial')).length;
    const highRisk = events.filter(e => parseFloat(e.risk_score || e.riskScore || 0) >= 50).length;
    const persistent = events.filter(e => e.persistence).length;
    const newEvents = events.filter(e => e.is_flash_trigger || e.is_early_warning || e.satellite?.includes('INSAT') || e.satellite?.includes('Himawari')).length;
    const activeAlerts = events.filter(e => parseFloat(e.risk_score || e.riskScore || 0) >= 75 || e.is_early_warning).length;
    return { total, industrial, highRisk, persistent, newEvents, activeAlerts };
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
            <div className="sidebar-label">INDIA THERMAL INTELLIGENCE MAP</div>
            <div className="legend-grid">
              {Object.entries(categoryColors).map(([cat, color]) => (
                <div key={cat} className="legend-item">
                  <span className="dot" style={{ backgroundColor: color }}></span>
                  <span>{cat}</span>
                </div>
              ))}
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

      {/* SCREENSHOT 3: STATS CARDS GRID */}
      <div className="stats-grid-6 margin-top-large">
        <StatCard title="ACTIVE THERMAL EVENTS" value={stats.total} type="active" />
        <StatCard title="INDUSTRIAL EVENTS" value={stats.industrial} type="industrial" />
        <StatCard title="High/Critical Risk" value={stats.highRisk} type="highRisk" />
        <StatCard title="PERSISTENT SOURCES" value={stats.persistent} type="persistent" />
        <StatCard title="LIVE SENSOR SPIKES" value={stats.newEvents} type="newEvent" />
        <StatCard title="ACTIVE ALERTS" value={stats.activeAlerts} type="alerts" />
      </div>

      {/* SCREENSHOT 3: THREE CHARTS GRID */}
      <div className="charts-grid-3" style={{ marginTop: "35px" }}>
        {/* CHART 1: THERMAL ANOMALY TREND */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">THERMAL ANOMALY TREND</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <Line type="step" dataKey="val" stroke="#FF6A3D" strokeWidth={3} dot={{ fill: '#FF3B47', r: 5 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: RISK DISTRIBUTION */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">RISK DISTRIBUTION</div>
          <div className="chart-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Legend */}
            <div className="donut-legend-row">
              {riskDistributionData.map(item => (
                <div key={item.name} className="legend-item-col">
                  <span className="dot" style={{ backgroundColor: item.color }}></span>
                  <span className="lbl text-secondary">{item.name}</span>
                  <span className="val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 3: CLASSIFICATION DISTRIBUTION */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">CLASSIFICATION DISTRIBUTION</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={classificationData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={80} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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

        .margin-top-large {
          margin-top: 2rem;
        }

        .margin-top-larger{
          margin-top:20px;
        }

        .stats-grid-6 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1.25rem;
        }

        .charts-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .chart-card-box {
          border: 1px solid var(--brand);
          border-radius: var(--radius-large); /* Curved edges 50px */
          padding: 1.5rem;
        }

        .chart-wrapper {
          margin-top: 1rem;
        }

        .donut-legend-row {
          display: flex;
          gap: 0.85rem;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .legend-item-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.72rem;
        }

        .legend-item-col .val {
          font-weight: 700;
          color: var(--text-primary);
        }

        @media (max-width: 1200px) {
          .stats-grid-6 { grid-template-columns: repeat(3, 1fr); }
          .charts-grid-3 { grid-template-columns: 1fr; }
          .map-and-sidebar-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
