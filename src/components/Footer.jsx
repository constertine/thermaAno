import React from 'react';

export default function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-container">
        <div className="footer-title">THERMAL ANOMALY MONITORING</div>
        <div className="footer-sub text-secondary">Observing Fire. Understanding Risk. Across The Globe.</div>

        <div className="footer-bottom text-secondary" style={{ marginTop: '1.25rem' }}>
          <div>© 2026 Global Thermal Anomaly Intelligence</div>
          <div>Satellite Data · Anomaly Detection · Global Coverage</div>
        </div>
      </div>

      <style>{`
        .global-footer {
          background-color: var(--surface);
          border-top: 1px solid var(--border);
          padding: 2rem 0;
          color: var(--text-secondary);
          margin-top: 160px;
          font-size: 0.8rem;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .footer-title {
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .footer-sub {
          font-size: 0.8rem;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.78rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </footer>
  );
}
