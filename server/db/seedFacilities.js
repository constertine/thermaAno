import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedFullDataset() {
  console.log('🌱 Populating industrial facilities & baseline thermal events into PostGIS...');
  const eventsPath = path.resolve(__dirname, '../../public/data/events.json');
  if (!fs.existsSync(eventsPath)) {
    console.error('Events JSON file not found at', eventsPath);
    return;
  }

  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  console.log(`Loaded ${events.length} records from events.json`);

  const facilitiesMap = new Map();
  events.forEach(e => {
    const name = e.facilityName || 'Industrial Facility';
    if (!facilitiesMap.has(name) && e.latitude && e.longitude) {
      facilitiesMap.set(name, {
        name,
        facility_type: e.facilityType || e.eventType || 'Industrial Complex',
        power: e.power || '',
        industrial: e.industrial || '',
        landuse: e.landuse || 'industrial',
        operator: e.operator || '',
        state: e.state || 'India',
        latitude: parseFloat(e.nearestFacilityLat || e.latitude),
        longitude: parseFloat(e.nearestFacilityLon || e.longitude),
        hazard_rating: e.risk === 'CRITICAL' ? 90 : e.risk === 'HIGH' ? 70 : 40
      });
    }
  });

  console.log(`Inserting ${facilitiesMap.size} unique industrial facilities...`);
  for (const fac of facilitiesMap.values()) {
    try {
      await query(`
        INSERT INTO industrial_facilities (name, facility_type, power, industrial, landuse, operator, state, latitude, longitude, geom, hazard_rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($9, $8), 4326), $10)
        ON CONFLICT DO NOTHING;
      `, [
        fac.name, fac.facility_type, fac.power, fac.industrial, fac.landuse,
        fac.operator, fac.state, fac.latitude, fac.longitude, fac.hazard_rating
      ]);
    } catch (err) {
      // ignore individual duplicate
    }
  }

  console.log(`Inserting thermal events...`);
  let inserted = 0;
  for (const e of events.slice(0, 1000)) {
    const eventId = e.eventId || `EVT-${e.id}`;
    const lat = parseFloat(e.latitude);
    const lon = parseFloat(e.longitude);
    if (!lat || !lon) continue;

    try {
      await query(`
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
      inserted++;
    } catch (err) {
      // continue
    }
  }

  console.log(`✅ Seeded ${inserted} thermal events and facilities into PostGIS!`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedFullDataset()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
