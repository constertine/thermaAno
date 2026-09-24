import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { landcoverAndInfraService } from '../server/services/landcoverAndInfraService.js';
import { resolveIndianStateFromCoords } from '../server/services/earlyDetectionEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function enrichAllBaselineEvents() {
  console.log('🚀 Enriching all 1,541 historical baseline events with Sentinel-2 Landcover & 41,142 OSM Industrial Features...');
  
  const eventsPath = path.resolve(__dirname, '../public/data/events.json');
  const rawData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  
  let count = 0;
  const enriched = [];

  for (const item of rawData) {
    const lat = parseFloat(item.latitude);
    const lon = parseFloat(item.longitude);
    const state = resolveIndianStateFromCoords(lat, lon);

    // Extract Sentinel-2 landcover and 41,142 OSM industrial features
    const lc = await landcoverAndInfraService.getSentinel2LandcoverFeatures(lat, lon);

    const isOffshore = lat >= 18.0 && lat <= 20.5 && lon >= 70.0 && lon <= 72.5;
    const isGulf = lat >= 20.5 && lat <= 22.0 && lon >= 71.8 && lon <= 72.8;

    let eventType = item.eventType || 'Industrial';
    let predictedClass = item.predicted_class || eventType;
    let facilityName = item.facilityName || 'Industrial Complex';
    let landcoverClass = lc.landcoverClass;
    let reason = item.reason;

    if (isOffshore) {
      eventType = 'Gas Flare';
      predictedClass = 'Offshore Petroleum Flaring';
      facilityName = 'Bombay High Offshore Flare Platform (ONGC)';
      landcoverClass = 'Marine Water (Offshore Platform)';
      reason = `High-temperature offshore marine gas flaring (FRP: ${parseFloat(item.frp || 25).toFixed(1)} MW) at Bombay High field in the Arabian Sea.`;
    } else if (isGulf) {
      eventType = 'Gas Flare';
      predictedClass = 'Offshore Gas Flare';
      facilityName = 'Gulf of Khambhat Marine Extraction Flare';
      landcoverClass = 'Marine Water (Coastal Industrial Flaring)';
      reason = `Coastal marine petroleum gas flaring (FRP: ${parseFloat(item.frp || 20).toFixed(1)} MW) in Gulf of Khambhat.`;
    } else if (lc.distIndustrialZoneKm <= 2.5 && lc.nearestIndustrialZoneName) {
      facilityName = lc.nearestIndustrialZoneName;
      eventType = 'Industrial';
      predictedClass = 'Industrial';
    } else if (lc.distPowerPlantKm <= 2.5 && lc.nearestPowerPlantName) {
      facilityName = lc.nearestPowerPlantName;
      eventType = 'Power Plant';
      predictedClass = 'Power Plant';
    } else if (lc.distQuarryKm <= 2.0 && lc.nearestQuarryName) {
      facilityName = lc.nearestQuarryName;
      eventType = 'Mining';
      predictedClass = 'Quarry/Mining';
    }

    enriched.push({
      ...item,
      state,
      eventType,
      predicted_class: predictedClass,
      facilityName,
      location: isOffshore ? 'Arabian Sea (Bombay High Offshore)' : `${facilityName}, ${state}`,
      landcover_class: landcoverClass,
      landcover_probabilities: lc.landcoverProbabilities,
      ndvi_proxy: lc.ndviProxy,
      ndbi_proxy: lc.ndbiProxy,
      dist_power_plant_km: lc.distPowerPlantKm,
      dist_industrial_zone_km: lc.distIndustrialZoneKm,
      dist_quarry_km: lc.distQuarryKm,
      dist_brick_kiln_km: lc.distBrickKilnKm,
      dist_oil_gas_km: lc.distOilGasKm,
      reason: reason || item.reason || `Radiometric thermal anomaly (FRP: ${parseFloat(item.frp || 10).toFixed(1)} MW) at ${facilityName}, ${state}.`,
      diagnosis: reason || item.diagnosis || `Radiometric thermal anomaly (FRP: ${parseFloat(item.frp || 10).toFixed(1)} MW) at ${facilityName}, ${state}.`
    });

    count++;
  }

  // Save back to public/data/events.json and dist/data/events.json
  fs.writeFileSync(eventsPath, JSON.stringify(enriched, null, 2), 'utf8');
  const distPath = path.resolve(__dirname, '../dist/data/events.json');
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, JSON.stringify(enriched, null, 2), 'utf8');
  }

  console.log(`✅ Successfully enriched all ${count} baseline events with Sentinel-2 + OSM dataset.`);
}

enrichAllBaselineEvents().catch(console.error);
