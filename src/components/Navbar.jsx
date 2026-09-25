import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import ApiStatusBadge from './ApiStatusBadge';

export default function Navbar() {
  const location = useLocation();
  const [isMonitorMenuOpen, setIsMonitorMenuOpen] = useState(false);
  const monitorMenuRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!monitorMenuRef.current?.contains(event.target)) {
        setIsMonitorMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky-navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <NavLink to="/" className="navbar-brand">
          <span className="brand-title">🔥 FIRE Anomalies</span>
        </NavLink>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        {/* Navigation Links */}
        <nav className={`navbar-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink 
            to="/overview" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Overview
          </NavLink>

          <div
            ref={monitorMenuRef}
            className={`nav-dropdown-group ${isMonitorMenuOpen ? 'open' : ''}`}
          >
            <NavLink 
              to="/monitor/industrial-facilities" 
              className={() => `nav-link ${location.pathname.startsWith('/monitor') ? 'active' : ''}`}
              onClick={(event) => {
                event.preventDefault();
                setIsMonitorMenuOpen((isOpen) => !isOpen);
              }}
            >
              Monitor ▾
            </NavLink>
            <div className="nav-dropdown-menu">
              <NavLink to="/monitor/industrial-facilities" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Industrial Facilities</NavLink>
              <NavLink to="/monitor/persistent-sources" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Persistent Sources</NavLink>
              <NavLink to="/monitor/alerts" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Alerts & Early Warnings</NavLink>
            </div>
          </div>

          <NavLink 
            to="/intelligence" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Analytics
          </NavLink>

          <NavLink 
            to="/insights" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Intelligence Reports
          </NavLink>

          <NavLink 
            to="/all-anomalies" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            All Anomalies
          </NavLink>

          <div className="navbar-status-slot">
            <ApiStatusBadge />
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>

      <style>{`
        .sticky-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background-color: var(--surface); /* #2A2A2A */
          border-bottom: 1px solid var(--border);
          height: 60px;
          display: flex;
          align-items: center;
        }

        .navbar-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-brand {
          text-decoration: none;
        }

        .brand-title {
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.01em;
          color: var(--text-primary);
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: var(--text-primary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--text-primary);
          background-color: var(--elevated);
        }

        .theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 16px;
          background-color: var(--elevated);
          color: var(--text-primary);
          cursor: pointer;
        }

        .theme-toggle:hover {
          background-color: var(--surface);
          border-color: var(--border);
        }

        .nav-dropdown-group {
          position: relative;
        }

        .nav-dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          min-width: 180px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          padding: 0.5rem 0;
          z-index: 1100;
        }

        .nav-dropdown-group:hover .nav-dropdown-menu,
        .nav-dropdown-group.open .nav-dropdown-menu {
          display: block;
        }

        .dropdown-item {
          display: block;
          padding: 0.6rem 1.25rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .mobile-menu-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
        }

        .hamburger-bar {
          width: 22px;
          height: 2px;
          background-color: var(--text-primary);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        @media (max-width: 960px) {
          .mobile-menu-toggle {
            display: flex;
          }

          .navbar-nav {
            display: none;
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            flex-direction: column;
            align-items: stretch;
            padding: 1.5rem;
            gap: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 1000;
          }

          .navbar-nav.mobile-open {
            display: flex;
          }

          .nav-dropdown-menu {
            position: static;
            background: var(--elevated);
            box-shadow: none;
            border: none;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </header>
  );
}
