import React from 'react';
import { Flame, Factory, AlertTriangle, Activity, Zap, ShieldAlert } from 'lucide-react';

const iconConfig = {
  active: { icon: Flame, color: '#FF6A3D' },
  industrial: { icon: Factory, color: '#A78BFA' },
  highRisk: { icon: AlertTriangle, color: '#FF3B47' },
  persistent: { icon: Zap, color: '#38BDF8' },
  newEvent: { icon: Activity, color: '#34D399' },
  alerts: { icon: ShieldAlert, color: '#FF9F1C' }
};

export default function StatCard({ title, value, type = 'active' }) {
  const cfg = iconConfig[type] || iconConfig.active;
  const IconComponent = cfg.icon;

  return (
    <div className="stat-card-box">
      {/* Animated Colored Icon between Top Border and Subheading */}
      <div className="stat-icon-wrapper" style={{ color: cfg.color }}>
        <IconComponent size={28} className="animated-stat-icon" />
      </div>

      <div className="stat-heading-sub">{title}</div>
      <div className="stat-giant-value">{value}</div>

      <style>{`
        .stat-card-box {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 35px; /* Curved edges as requested (20-40px range) */
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .stat-card-box:hover {
          border-color: var(--brand);
          box-shadow: 0 0 25px rgba(240, 101, 61, 0.4), 0 0 5px #F0653D; /* Required orange glow */
          transform: translateY(-3px);
        }

        .stat-icon-wrapper {
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--elevated);
          padding: 10px;
          border-radius: 50%;
        }

        @keyframes subtlePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .animated-stat-icon {
          animation: subtlePulse 2.5s infinite ease-in-out;
        }

        .stat-heading-sub {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .stat-giant-value {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
