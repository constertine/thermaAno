import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedAllEvents() {
  console.log('🚀 Seeding 30-day historical baseline dataset into PostGIS...');
  const eventsPath = path.resolve(__dirname, '../../public/data/events.json');
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Facilities
    console.log('📍 Seeding facilities...');
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
    console.log(`✅ Seeded ${facilitiesMap.size} facilities.`);

    // 2. Clear old baseline events
    await client.query("DELETE FROM thermal_events WHERE event_id NOT LIKE 'EVT-LIVE-%';");

    // 3. Batch insert 30-day baseline VIIRS events in chunks of 100
    console.log(`🔥 Seeding ${events.length} 30-day baseline VIIRS thermal anomalies...`);
    const chunkSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < events.length; i += chunkSize) {
      const chunk = events.slice(i, i + chunkSize);
      const valueStrings = [];
      const values = [];
      let paramIdx = 1;

      chunk.forEach((e, idx) => {
        const globalIdx = i + idx;
        const eventId = e.eventId || `EVT-${globalIdx + 1}`;
        const lat = parseFloat(e.latitude);
        const lon = parseFloat(e.longitude);
        if (!lat || !lon) return;

        const satellite = e.satellite || 'VIIRS (NOAA-21 375m)';
        const instrument = e.instrument || 'VIIRS';
        const tier = 'TIER2_POLAR';
        const isFlash = false;
        const isEarly = false;

        const bright_ti4 = parseFloat(e.bright_ti4 || 320);
        const bright_ti5 = parseFloat(e.bright_ti5 || 290);
        const frp = parseFloat(e.frp || 10);
        const acq_date = e.acq_date || '2026-08-15';
        const acq_time = String(e.acq_time || '1200');
        const confidence = typeof e.confidence === 'string' ? e.confidence : `${e.confidence || 85}%`;
        const state = e.state || 'India';
        const facilityName = e.facilityName || 'Industrial Complex';
        const facilityType = e.facilityType || 'Industrial';
        const distM = parseFloat(e.dist_to_facility_m || 2500);
        const distKm = parseFloat(e.dist_to_facility_km || (distM / 1000).toFixed(2));
        const eventType = e.eventType || 'Industrial';
        const predictedClass = e.predicted_class || eventType;
        const predConf = parseFloat(e.prediction_confidence || 85);
        const riskScore = parseFloat(e.risk_score || e.riskScore || 50);
        const risk = (e.risk || (riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW')).toUpperCase();
        const riskLevel = risk === 'CRITICAL' ? 'Critical' : risk === 'HIGH' ? 'High' : risk === 'MEDIUM' ? 'Medium' : 'Low';
        const status = e.status || (risk === 'CRITICAL' ? 'CRITICAL ALERT' : 'MONITORED');
        const persistence = Boolean(e.persistence);

        valueStrings.push(`(
          $${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, ST_SetSRID(ST_MakePoint($${paramIdx+2}, $${paramIdx+1}), 4326),
          $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7},
          $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11},
          $${paramIdx+12}, $${paramIdx+13}, $${paramIdx+14}, $${paramIdx+15},
          $${paramIdx+16}, $${paramIdx+17}, $${paramIdx+18}, $${paramIdx+19},
          $${paramIdx+20}, $${paramIdx+21}, $${paramIdx+22}, $${paramIdx+23},
          $${paramIdx+24}, $${paramIdx+25}, $${paramIdx+26}, $${paramIdx+27},
          $${paramIdx+28}
        )`);

        values.push(
          eventId, lat, lon, bright_ti4, bright_ti5, frp, acq_date, acq_time,
          satellite, instrument, confidence, state, facilityName, facilityType,
          distM, distKm, eventType, predictedClass, predConf, risk, riskScore,
          riskLevel, status, persistence, isEarly, isFlash, tier, 1, false
        );

        paramIdx += 29;
      });

      if (valueStrings.length > 0) {
        const sql = `
          INSERT INTO thermal_events (
            event_id, latitude, longitude, geom, bright_ti4, bright_ti5, frp,
            acq_date, acq_time, satellite, instrument, confidence, state,
            facility_name, facility_type, dist_to_facility_m, dist_to_facility_km,
            event_type, predicted_class, prediction_confidence, risk, risk_score,
            risk_level, status, persistence, is_early_warning, is_flash_trigger,
            satellite_tier, satellite_count, multi_satellite_confirmed
          )
          VALUES ${valueStrings.join(', ')}
          ON CONFLICT (event_id) DO NOTHING;
        `;
        await client.query(sql, values);
        totalInserted += valueStrings.length;
      }
    }

    await client.query('COMMIT');
    console.log(`🎉 Successfully populated 30-day baseline (${totalInserted} events) into PostGIS!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error batch inserting events:', err);
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedAllEvents()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
