import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log('🚀 Connecting to Neon PostgreSQL and initializing PostGIS...');
  const client = await getClient();
  try {
    // 1. Enable PostGIS Extension
    console.log('📦 Enabling PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Check PostGIS version
    const versionRes = await client.query('SELECT PostGIS_Version();');
    console.log(`✅ PostGIS Enabled successfully! Version: ${versionRes.rows[0].postgis_version}`);

    // 2. Read and apply schema
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
    console.log('📋 Creating tables and spatial indexes...');
    await client.query(schemaSql);
    await client.query('ALTER TABLE thermal_events ADD COLUMN IF NOT EXISTS risk VARCHAR(32);');
    await client.query('ALTER TABLE thermal_events ADD COLUMN IF NOT EXISTS grid_key VARCHAR(64);');
    await client.query('ALTER TABLE thermal_events ADD COLUMN IF NOT EXISTS class_probabilities JSONB;');
    await client.query('ALTER TABLE thermal_events ADD COLUMN IF NOT EXISTS key_signals JSONB;');
    console.log('✅ Schema tables (facilities, thermal_events, early_warnings) verified.');

    // 3. Seed Industrial Facilities & Events if empty
    const countRes = await client.query('SELECT COUNT(*) FROM industrial_facilities;');
    const facilityCount = parseInt(countRes.rows[0].count, 10);

    if (facilityCount === 0) {
      console.log('🌱 Seeding initial industrial facilities from events dataset...');
      const eventsPath = path.resolve(__dirname, '../../public/data/events.json');
      if (fs.existsSync(eventsPath)) {
        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
        const facilitiesMap = new Map();

        events.forEach(e => {
          const name = e.facilityName || 'Industrial Facility';
          if (!facilitiesMap.has(name) && e.latitude && e.longitude) {
            facilitiesMap.set(name, {
              name,
              facility_type: e.facilityType || e.eventType || 'Industrial',
              power: e.power || '',
              industrial: e.industrial || '',
              landuse: e.landuse || '',
              operator: e.operator || '',
              state: e.state || 'India',
              latitude: parseFloat(e.nearestFacilityLat || e.latitude),
              longitude: parseFloat(e.nearestFacilityLon || e.longitude),
              hazard_rating: e.risk === 'CRITICAL' ? 90 : e.risk === 'HIGH' ? 70 : 40
            });
          }
        });

        for (const fac of facilitiesMap.values()) {
          await client.query(`
            INSERT INTO industrial_facilities (name, facility_type, power, industrial, landuse, operator, state, latitude, longitude, geom, hazard_rating)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($9, $8), 4326), $10)
            ON CONFLICT DO NOTHING;
          `, [
            fac.name, fac.facility_type, fac.power, fac.industrial, fac.landuse,
            fac.operator, fac.state, fac.latitude, fac.longitude, fac.hazard_rating
          ]);
        }
        console.log(`✅ Seeded ${facilitiesMap.size} unique industrial facilities with PostGIS spatial points.`);
      }
    } else {
      console.log(`ℹ️ Industrial facilities already populated (${facilityCount} facilities).`);
    }

    // Check thermal_events count
    const eventCountRes = await client.query('SELECT COUNT(*) FROM thermal_events;');
    const eventCount = parseInt(eventCountRes.rows[0].count, 10);

    if (eventCount === 0) {
      console.log('🌱 Seeding baseline thermal events...');
      const eventsPath = path.resolve(__dirname, '../../public/data/events.json');
      if (fs.existsSync(eventsPath)) {
        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8')).slice(0, 500); // seed top 500
        for (const e of events) {
          const eventId = e.eventId || `EVT-${e.id}`;
          const lat = parseFloat(e.latitude);
          const lon = parseFloat(e.longitude);
          if (!lat || !lon) continue;

          await client.query(`
            INSERT INTO thermal_events (
              event_id, latitude, longitude, geom, bright_ti4, bright_ti5, frp,
              acq_date, acq_time, satellite, instrument, confidence, state,
              facility_name, facility_type, dist_to_facility_m, dist_to_facility_km,
              event_type, predicted_class, prediction_confidence, risk_score, risk_level,
              status, persistence, is_early_warning, is_flash_trigger, satellite_tier,
              satellite_count, multi_satellite_confirmed
            )
            VALUES (
              $1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6,
              $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16,
              $17, $18, $19, $20, $21,
              $22, $23, $24, $25, $26,
              $27, $28
            )
            ON CONFLICT (event_id) DO NOTHING;
          `, [
            eventId, lat, lon, e.bright_ti4 || 320, e.bright_ti5 || 290, e.frp || 10,
            e.acq_date || '2026-08-15', String(e.acq_time || '1200'), e.satellite || 'VIIRS',
            e.instrument || 'VIIRS', e.confidence || '90%', e.state || 'India',
            e.facilityName || 'Industrial Complex', e.facilityType || 'Industrial',
            e.dist_to_facility_m || 2500, e.dist_to_facility_km || 2.5,
            e.eventType || 'Industrial', e.predicted_class || 'Industrial',
            e.prediction_confidence || 85, e.risk_score || e.riskScore || 50,
            e.risk || e.risk_level || 'Medium', e.status || 'MONITORED',
            Boolean(e.persistence), Boolean(e.is_early_warning), Boolean(e.is_flash_trigger),
            'TIER2_POLAR', 1, false
          ]);
        }
        console.log(`✅ Seeded baseline thermal events into PostGIS.`);
      }
    } else {
      console.log(`ℹ️ Thermal events already populated (${eventCount} records).`);
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run directly if called from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
