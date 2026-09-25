import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from './db/index.js';
import { initializeDatabase } from './db/initDb.js';
import { SatelliteIngestionService } from './services/satelliteIngestionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/live-events' });

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Track connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 WebSocket client connected. Total clients: ${clients.size}`);

  // Send initial welcome & connection ack
  const currentLive = ingestionService.getLiveEvents();
  ws.send(JSON.stringify({
    type: 'CONNECTION_ACK',
    message: 'Connected to Multi-Satellite Thermal Intelligence Live Stream (INSAT-3DR + Himawari-9 + VIIRS)',
    timestamp: new Date().toISOString(),
    liveCount: currentLive.length
  }));

  // Immediately push all active live satellite events to the freshly connected client
  if (currentLive.length > 0) {
    ws.send(JSON.stringify({
      type: 'INITIAL_LIVE_EVENTS',
      data: currentLive
    }));
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 WebSocket client disconnected. Total clients: ${clients.size}`);
  });
});

// Broadcast helper function
function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Instantiate Satellite Ingestion Service
const ingestionService = new SatelliteIngestionService(broadcast);

// ==================== REST API ENDPOINTS ====================

// 1. Health & Status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let eventCount = 0;
  let facilityCount = 0;

  try {
    const dbRes = await query('SELECT COUNT(*) FROM thermal_events;');
    const facRes = await query('SELECT COUNT(*) FROM industrial_facilities;');
    dbStatus = 'connected (PostGIS active)';
    eventCount = parseInt(dbRes.rows[0].count, 10);
    facilityCount = parseInt(facRes.rows[0].count, 10);
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'online',
    database: dbStatus,
    events_in_db: eventCount,
    facilities_in_db: facilityCount,
    connected_ws_clients: clients.size,
    satellites_active: ['INSAT-3DR (ISRO)', 'Himawari-9 (JMA)', 'VIIRS (NOAA-20/21)', 'MODIS (Terra/Aqua)'],
    timestamp: new Date().toISOString()
  });
});

// 2. Get Live Real-Time Stream Events (Active Session / Real NASA FIRMS NRT)
app.get('/api/events/live', async (req, res) => {
  try {
    let liveEvents = ingestionService.getLiveEvents();
    if (liveEvents.length === 0) {
      await ingestionService.syncAllLiveSatellites(false);
      liveEvents = ingestionService.getLiveEvents();
    }
    res.json({
      success: true,
      count: liveEvents.length,
      events: liveEvents
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. Force Immediate Live Re-Sync from NASA FIRMS Satellites
app.post('/api/events/sync-live', async (req, res) => {
  try {
    console.log('📡 Manual trigger: Re-syncing all NASA FIRMS satellite feeds across India...');
    await ingestionService.syncAllLiveSatellites(false);
    const liveEvents = ingestionService.getLiveEvents();
    res.json({
      success: true,
      message: `NASA FIRMS sync complete. Total active live detections across India: ${liveEvents.length}`,
      count: liveEvents.length,
      events: liveEvents
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get 30-Day Historical Baseline Dataset (Strictly Baseline, No Live Pollution)
app.get(['/api/events/30days', '/api/events/baseline'], async (req, res) => {
  const limit = parseInt(req.query.limit || '2000', 10);
  try {
    const result = await query(`
      SELECT * FROM thermal_events
      WHERE event_id NOT LIKE 'EVT-LIVE-%'
      ORDER BY id ASC
      LIMIT $1;
    `, [limit]);

    if (result.rows.length > 0) {
      return res.json({
        success: true,
        count: result.rows.length,
        events: result.rows.map(r => ({
          ...r,
          id: r.id,
          eventId: r.event_id,
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
          frp: parseFloat(r.frp),
          bright_ti4: parseFloat(r.bright_ti4),
          bright_ti5: parseFloat(r.bright_ti5),
          riskScore: parseFloat(r.risk_score),
          dist_to_facility_km: parseFloat(r.dist_to_facility_km),
          dist_to_facility_m: parseFloat(r.dist_to_facility_m),
          facilityName: r.facility_name,
          facilityType: r.facility_type,
          eventType: r.event_type
        }))
      });
    }

    // Fallback to local JSON if DB empty
    const fs = await import('fs');
    const path = await import('path');
    const eventsPath = path.resolve(__dirname, '../public/data/events.json');
    const localEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    res.json({
      success: true,
      count: localEvents.length,
      events: localEvents
    });
  } catch (err) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const eventsPath = path.resolve(__dirname, '../public/data/events.json');
      const localEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
      res.json({
        success: true,
        count: localEvents.length,
        events: localEvents
      });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// 3. Get Active Alerts (Critical + Early Warnings)
app.get('/api/alerts/active', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM thermal_events
      WHERE UPPER(COALESCE(risk, risk_level)) IN ('CRITICAL', 'HIGH') OR is_early_warning = true
      ORDER BY created_at DESC
      LIMIT 50;
    `);

    res.json({
      success: true,
      count: result.rows.length,
      alerts: result.rows.map(r => ({
        id: r.id,
        eventId: r.event_id,
        eventType: r.event_type,
        location: `${r.facility_name || 'Industrial Facility'}, ${r.state}`,
        date: r.acq_date,
        time: r.acq_time,
        risk: r.risk,
        riskScore: parseFloat(r.risk_score),
        confidence: r.confidence,
        frp: parseFloat(r.frp),
        status: r.status,
        is_early_warning: r.is_early_warning,
        satellite: r.satellite
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Industrial Facilities Reference List
app.get('/api/facilities', async (req, res) => {
  try {
    const result = await query('SELECT * FROM industrial_facilities ORDER BY hazard_rating DESC LIMIT 200;');
    res.json({
      success: true,
      count: result.rows.length,
      facilities: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. On-Demand ML Prediction Proxy Endpoint
app.post('/api/predict', async (req, res) => {
  try {
    const { evaluateThermalAnomaly } = await import('./services/earlyDetectionEngine.js');
    const result = await evaluateThermalAnomaly(req.body);
    res.json({
      success: true,
      prediction: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. 30-Day Dataset Sync & Prune Endpoint
app.post('/api/events/sync-30days', async (req, res) => {
  try {
    const { seedAllEvents } = await import('./db/seedAllEvents.js');
    await seedAllEvents();
    res.json({
      success: true,
      message: '30-day baseline dataset updated in PostgreSQL and obsolete records purged.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Live Satellite Point Ingestion Endpoint (INSAT-3DR, Himawari-9, or Ground Sensors)
app.post('/api/ingest/live-point', async (req, res) => {
  const { latitude, longitude, bright_ti4, bright_ti5, frp, satellite = 'INSAT-3DR', confidence = 'nominal' } = req.body || {};
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'latitude and longitude are required' });
  }
  try {
    const fullEvent = await ingestionService.processRealAnomaly({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      bright_ti4: parseFloat(bright_ti4 || 335.0),
      bright_ti5: parseFloat(bright_ti5 || 288.0),
      frp: parseFloat(frp || 15.0),
      satellite,
      instrument: satellite.includes('INSAT') || satellite.includes('Himawari') ? 'MIR/TIR' : 'VIIRS',
      tier: satellite.includes('INSAT') || satellite.includes('Himawari') ? 'TIER1_GEO' : 'TIER2_POLAR',
      confidence: String(confidence),
      acq_date: new Date().toISOString().split('T')[0],
      acq_time: new Date().toTimeString().slice(0, 5)
    });
    res.json({
      success: true,
      message: `Live ${satellite} thermal anomaly ingested, classified via ML model, and broadcasted.`,
      event: fullEvent
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve built React frontend in production if dist/ exists
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Handle Port Conflict & Server Errors Gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another running server instance.`);
    console.log(`Tip: Stop the existing process with 'lsof -ti:${PORT} | xargs kill -9' or configure a different PORT.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down Thermal Intelligence server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating Thermal Intelligence server...');
  server.close(() => process.exit(0));
});

// Start Server & Ingestion
async function startServer() {
  server.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket Live Stream ready on ws://localhost:${PORT}/ws/live-events`);
    try {
      await initializeDatabase();
    } catch (err) {
      console.warn('⚠️ Database initialization notice:', err.message);
    }
    ingestionService.start();
  });
}

startServer();
