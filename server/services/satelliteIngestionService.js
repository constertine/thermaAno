import axios from 'axios';
import Papa from 'papaparse';
import { query } from '../db/index.js';
import { evaluateThermalAnomaly } from './earlyDetectionEngine.js';

// India Bounding Box: [minLon, minLat, maxLon, maxLat]
const INDIA_BBOX = '68.0,6.5,97.5,37.0';

// NASA FIRMS Live NRT Satellite Sensor Feeds
const LIVE_SATELLITE_FEEDS = [
  { name: 'VIIRS_NOAA21_NRT', satellite: 'VIIRS (NOAA-21 375m)', instrument: 'VIIRS', tier: 'TIER2_POLAR' },
  { name: 'VIIRS_NOAA20_NRT', satellite: 'VIIRS (NOAA-20 375m)', instrument: 'VIIRS', tier: 'TIER2_POLAR' },
  { name: 'VIIRS_SNPP_NRT', satellite: 'VIIRS (Suomi-NPP 375m)', instrument: 'VIIRS', tier: 'TIER2_POLAR' },
  { name: 'MODIS_NRT', satellite: 'MODIS (Terra/Aqua 1km)', instrument: 'MODIS', tier: 'TIER2_POLAR' }
];

export class SatelliteIngestionService {
  constructor(broadcastCallback) {
    this.broadcastCallback = broadcastCallback;
    this.firmsMapKey = process.env.NASA_FIRMS_MAP_KEY || '6694b687df676df8522d2acc36064495';
    this.processedEvents = new Set();
    this.liveSessionEvents = []; // Starts from 0 live anomalies
    this.isRunning = false;
  }

  getLiveEvents() {
    return this.liveSessionEvents;
  }

  resetLiveStream() {
    this.liveSessionEvents = [];
    this.processedEvents.clear();
    console.log('🔄 Live stream reset to 0.');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🛰️ Live Real-World Satellite Ingestion Active (NASA FIRMS VIIRS NOAA-21/20 + SNPP + MODIS)...');

    // 1. Initial Live Data Pull from all active satellite sensors
    this.syncAllLiveSatellites(false).catch(err => console.warn('Initial satellite sync notice:', err.message));

    // 2. Poll live NASA FIRMS feeds every 10 minutes (matching NASA NRT orbital swath cadence)
    setInterval(() => {
      this.syncAllLiveSatellites(false).catch(err => console.warn('Periodic satellite sync notice:', err.message));
    }, 10 * 60 * 1000);

    // 3. Purge obsolete records older than 30 days once every 6 hours
    setInterval(() => {
      this.purgeExpiredRecords().catch(err => console.warn('30-day purge notice:', err.message));
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Fetch Real-Time Thermal Anomalies from All Active Satellite Feeds across India
   */
  async syncAllLiveSatellites(isInitial = false) {
    if (!this.firmsMapKey) return;
    console.log('📡 Ingesting real-time thermal anomaly coordinates from NASA FIRMS satellites across India...');

    for (const feed of LIVE_SATELLITE_FEEDS) {
      try {
        const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${this.firmsMapKey}/${feed.name}/${INDIA_BBOX}/1`;
        const res = await axios.get(url, { timeout: 15000 });

        if (res.data && typeof res.data === 'string' && res.data.includes('latitude')) {
          const parsed = Papa.parse(res.data, { header: true, dynamicTyping: true });
          const rows = parsed.data.filter(r => r.latitude && r.longitude);
          console.log(`✅ [${feed.satellite}] Received ${rows.length} active live thermal detections in India region.`);

          // Process in parallel batches of 10 for rapid non-blocking evaluation
          const chunkSize = 10;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (row) => {
              const rawLat = parseFloat(row.latitude);
              const rawLon = parseFloat(row.longitude);
              const acqDate = row.acq_date || new Date().toISOString().split('T')[0];
              const acqTime = row.acq_time ? String(row.acq_time).padStart(4, '0') : '1200';
              const dedupKey = `${rawLat.toFixed(3)}_${rawLon.toFixed(3)}_${acqDate}_${acqTime}`;

              if (this.processedEvents.has(dedupKey)) return;
              this.processedEvents.add(dedupKey);

              const bright_ti4 = parseFloat(row.bright_ti4 || row.brightness || 325.0);
              const bright_ti5 = parseFloat(row.bright_ti5 || row.bright_t31 || 285.0);
              const frp = parseFloat(row.frp || 4.5);
              const confidence = row.confidence != null ? String(row.confidence) : 'nominal';

              await this.processRealAnomaly({
                latitude: rawLat,
                longitude: rawLon,
                bright_ti4,
                bright_ti5,
                frp,
                satellite: feed.satellite,
                instrument: feed.instrument,
                tier: feed.tier,
                confidence,
                acq_date: acqDate,
                acq_time: `${acqTime.slice(0, 2)}:${acqTime.slice(2, 4)}`
              }, !isInitial);
            }));
          }
        }
      } catch (feedErr) {
        console.warn(`NASA FIRMS feed notice for ${feed.name}:`, feedErr.message);
      }
    }
  }

  /**
   * Process Real Thermal Anomaly through ML Model, Save to PostGIS, and Broadcast via WebSocket
   */
  async processRealAnomaly(raw, broadcast = true) {
    try {
      // 1. Evaluate spatial infrastructure distances and run through trained ML Model API
      const evaluation = await evaluateThermalAnomaly(raw);
      const eventId = `EVT-LIVE-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

      const fullEvent = {
        ...evaluation,
        id: eventId,
        eventId,
        event_id: eventId,
        firmsId: eventId,
        acq_date: raw.acq_date,
        acq_time: raw.acq_time,
        satellite: raw.satellite,
        instrument: raw.instrument,
        state: evaluation.state || 'India',
        facilityName: evaluation.facilityName || 'Thermal Activity Zone',
        facilityType: evaluation.facilityType || 'Monitored Area',
        timestamp: new Date().toISOString()
      };

      // 2. Save into PostgreSQL PostGIS Database
      try {
        await query(`
          INSERT INTO thermal_events (
            event_id, latitude, longitude, geom, bright_ti4, bright_ti5, frp,
            acq_date, acq_time, satellite, instrument, confidence, state,
            facility_name, facility_type, dist_to_facility_m, dist_to_facility_km,
            event_type, predicted_class, prediction_confidence, risk, risk_score, risk_level,
            status, persistence, is_early_warning, is_flash_trigger, satellite_tier,
            satellite_count, multi_satellite_confirmed, grid_key, class_probabilities, key_signals
          )
          VALUES (
            $1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27,
            $28, $29, $30, $31, $32
          )
          ON CONFLICT (event_id) DO NOTHING;
        `, [
          fullEvent.eventId, fullEvent.latitude, fullEvent.longitude,
          fullEvent.bright_ti4, fullEvent.bright_ti5, fullEvent.frp,
          fullEvent.acq_date, fullEvent.acq_time, fullEvent.satellite,
          fullEvent.instrument, fullEvent.confidence, fullEvent.state,
          fullEvent.facilityName, fullEvent.facilityType,
          fullEvent.dist_to_facility_m, fullEvent.dist_to_facility_km,
          fullEvent.eventType, fullEvent.predicted_class,
          fullEvent.prediction_confidence, fullEvent.risk, fullEvent.riskScore,
          fullEvent.risk_level, fullEvent.status,
          false, fullEvent.is_early_warning, fullEvent.is_flash_trigger,
          fullEvent.satellite_tier, 1, fullEvent.multi_satellite_confirmed,
          fullEvent.grid_key,
          fullEvent.class_probabilities ? JSON.stringify(fullEvent.class_probabilities) : null,
          fullEvent.key_signals ? JSON.stringify(fullEvent.key_signals) : null
        ]);

        if (fullEvent.is_early_warning || fullEvent.risk === 'CRITICAL' || fullEvent.risk === 'HIGH') {
          await query(`
            INSERT INTO early_warnings (warning_id, event_id, facility_name, state, initial_source, z_score, frp_delta, severity, message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING;
          `, [
            `WARN-${fullEvent.eventId}`, fullEvent.eventId, fullEvent.facilityName, fullEvent.state,
            fullEvent.satellite, fullEvent.z_score, fullEvent.frp, fullEvent.risk,
            `Live ${fullEvent.predicted_class} thermal detection in ${fullEvent.state} (${fullEvent.frp} MW)`
          ]);
        }
      } catch (dbErr) {
        console.warn('Database save skipped:', dbErr.message);
      }

      // 3. Keep in live session memory stream
      this.liveSessionEvents = [fullEvent, ...this.liveSessionEvents.filter(e => e.eventId !== fullEvent.eventId).slice(0, 999)];

      // 4. Broadcast Real-Time Event via WebSocket to Frontend
      if (broadcast && this.broadcastCallback) {
        this.broadcastCallback({
          type: 'NEW_THERMAL_EVENT',
          data: fullEvent
        });
      }

      return fullEvent;
    } catch (err) {
      console.error('Error processing live anomaly:', err);
    }
  }

  /**
   * Purge records beyond 30 days to maintain strict rolling 30-day window
   */
  async purgeExpiredRecords() {
    try {
      const res = await query(`
        DELETE FROM thermal_events
        WHERE created_at < NOW() - INTERVAL '30 days';
      `);
      console.log(`🧹 30-Day Window Maintenance: Purged ${res.rowCount || 0} expired thermal records.`);
    } catch (err) {
      console.warn('30-Day purge error:', err.message);
    }
  }
}
