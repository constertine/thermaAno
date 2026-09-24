import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Overview from './pages/Overview';
import AllAnomalies from './pages/AllAnomalies';
import EventDetail from './pages/EventDetail';
import IndustrialFacilities from './pages/IndustrialFacilities';
import PersistentSources from './pages/PersistentSources';
import Alerts from './pages/Alerts';
import Intelligence from './pages/Intelligence';
import Insights from './pages/Insights';

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <div className="app-container">
        <Navbar />

        <main style={{ minHeight: 'calc(100vh - 120px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/all-anomalies" element={<AllAnomalies />} />
            <Route path="/event/:eventId" element={<EventDetail />} />

            <Route
              path="/monitor"
              element={<Navigate to="/monitor/industrial-facilities" replace />}
            />

            <Route
              path="/monitor/industrial-facilities"
              element={<IndustrialFacilities />}
            />

            <Route
              path="/monitor/persistent-sources"
              element={<PersistentSources />}
            />

            <Route
              path="/monitor/alerts"
              element={<Alerts />}
            />

            <Route
              path="/intelligence"
              element={<Intelligence />}
            />

            <Route
              path="/insights"
              element={<Insights />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}