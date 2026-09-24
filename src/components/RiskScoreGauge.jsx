import React from 'react';

export default function RiskScoreGauge({ score = 75, risk, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#34D399'; // Low (< 25)
  let derivedRisk = 'LOW';
  if (score >= 75) {
    color = '#FF3B47'; // Critical (>= 75)
    derivedRisk = 'CRITICAL';
  } else if (score >= 50) {
    color = '#FF9F1C'; // High (50+)
    derivedRisk = 'HIGH';
  } else if (score >= 25) {
    color = '#FFD23F'; // Mid (25+)
    derivedRisk = 'MEDIUM';
  }

  const effectiveRisk = (risk || derivedRisk).toUpperCase();

  return (
    <div className="risk-gauge-container">
      <div className="risk-gauge-graphic" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Dynamic Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s ease-in-out',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>

        {/* Center Text overlay */}
        <div className="gauge-center-text">
          <span className="gauge-score mono" style={{ color }}>{score}</span>
          <span className="gauge-max mono">/100</span>
        </div>
      </div>

      <div className="gauge-label">
        <span className="gauge-risk-title">OVERALL RISK SCORE</span>
        <span className={`badge badge-${effectiveRisk.toLowerCase()}`}>{effectiveRisk} SEVERITY</span>    
      </div>

      <style>{`
        .risk-gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: transparent;
        }

        .risk-gauge-graphic {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-center-text {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .gauge-score {
          font-size: 2.2rem;
          font-weight: 700;
        }

        .gauge-max {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .gauge-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.75rem;
        }

        .gauge-risk-title {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
}
