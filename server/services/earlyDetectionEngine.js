import axios from 'axios';
import { query } from '../db/index.js';
import { landcoverAndInfraService } from './landcoverAndInfraService.js';

// Comprehensive Indian Industrial & Energy Infrastructure Hubs
const INDIAN_INFRASTRUCTURE_HUBS = [
  // Power Plants
  { state: "Madhya Pradesh", name: "Singrauli Super Thermal Power Hub", lat: 24.1997, lon: 82.6645, type: "Power Plant", category: "power" },
  { state: "Madhya Pradesh", name: "Vindhyachal Super Thermal Complex", lat: 24.1039, lon: 82.6719, type: "Power Plant", category: "power" },
  { state: "Uttar Pradesh", name: "Anpara Super Thermal Power Station", lat: 24.2008, lon: 82.7661, type: "Power Plant", category: "power" },
  { state: "Uttar Pradesh", name: "Rihand Super Thermal Power Complex", lat: 24.0264, lon: 82.7911, type: "Power Plant", category: "power" },
  { state: "Chhattisgarh", name: "Korba Super Thermal Power Station (NTPC)", lat: 22.3595, lon: 82.6841, type: "Power Plant", category: "power" },
  { state: "Odisha", name: "Talcher Super Thermal & Coalfields", lat: 20.9509, lon: 85.2167, type: "Power Plant", category: "power" },
  { state: "Gujarat", name: "Mundra Thermal Power & Port Hub", lat: 22.8394, lon: 69.7214, type: "Power Plant", category: "power" },
  { state: "Maharashtra", name: "Chandrapur Super Thermal Power Station", lat: 19.9806, lon: 79.2941, type: "Power Plant", category: "power" },
  { state: "Tamil Nadu", name: "Neyveli Lignite Thermal Power Complex", lat: 11.5975, lon: 79.4861, type: "Power Plant", category: "power" },
  { state: "Tamil Nadu", name: "Ennore Thermal Power Station", lat: 13.2081, lon: 80.3256, type: "Power Plant", category: "power" },
  { state: "Andhra Pradesh", name: "Simhadri Super Thermal Power Plant", lat: 17.6014, lon: 83.0847, type: "Power Plant", category: "power" },
  { state: "Andhra Pradesh", name: "Vijjeswaram Natural Gas Power Plant", lat: 16.9778, lon: 81.5951, type: "Power Plant", category: "power" },
  { state: "Telangana", name: "Ramagundam Super Thermal Power Station", lat: 18.7614, lon: 79.4756, type: "Power Plant", category: "power" },
  { state: "Karnataka", name: "Raichur Thermal Power Station", lat: 16.3536, lon: 77.3489, type: "Power Plant", category: "power" },
  { state: "Rajasthan", name: "Suratgarh Super Thermal Power Plant", lat: 29.3242, lon: 73.9031, type: "Power Plant", category: "power" },
  { state: "Rajasthan", name: "Kota Industrial & Thermal Hub", lat: 25.1764, lon: 75.8361, type: "Power Plant", category: "power" },

  // Industrial / Refinery Zones
  { state: "Gujarat", name: "Jamnagar Reliance Refinery Complex", lat: 22.3662, lon: 69.8322, type: "Industrial", category: "industrial" },
  { state: "Gujarat", name: "Hazira Petrochemical & LNG Terminal", lat: 21.1039, lon: 72.6449, type: "Industrial", category: "industrial" },
  { state: "Gujarat", name: "Dahej Petroleum & Chemical Zone", lat: 21.7052, lon: 72.5842, type: "Industrial", category: "industrial" },
  { state: "Gujarat", name: "Ankleshwar Chemical Industrial Estate", lat: 21.6264, lon: 73.0033, type: "Industrial", category: "industrial" },
  { state: "Maharashtra", name: "Trombay Refinery & Chemical Hub (BPCL/HPCL)", lat: 19.0144, lon: 72.9056, type: "Industrial", category: "industrial" },
  { state: "Maharashtra", name: "Tarapur Industrial & Atomic Complex", lat: 19.8242, lon: 72.6958, type: "Industrial", category: "industrial" },
  { state: "Maharashtra", name: "Nagothane Petrochemical Complex (IPCL)", lat: 18.5361, lon: 73.1367, type: "Industrial", category: "industrial" },
  { state: "Jharkhand", name: "Bokaro Steel City Complex", lat: 23.6693, lon: 86.1511, type: "Industrial", category: "industrial" },
  { state: "Jharkhand", name: "Jamshedpur Tata Steel Metallurgy Works", lat: 22.8046, lon: 86.2029, type: "Industrial", category: "industrial" },
  { state: "Odisha", name: "Paradip IOCL Refinery Complex", lat: 20.2644, lon: 86.6711, type: "Industrial", category: "industrial" },
  { state: "Odisha", name: "Rourkela Steel Plant (SAIL)", lat: 22.2253, lon: 84.8683, type: "Industrial", category: "industrial" },
  { state: "Odisha", name: "Jharsuguda Aluminium & Smelter Zone", lat: 21.8554, lon: 84.0061, type: "Industrial", category: "industrial" },
  { state: "West Bengal", name: "Haldia Petrochemicals & Refinery Hub", lat: 22.0644, lon: 88.0617, type: "Industrial", category: "industrial" },
  { state: "West Bengal", name: "Durgapur Steel Complex & Foundry Zone", lat: 23.5204, lon: 87.3119, type: "Industrial", category: "industrial" },
  { state: "Chhattisgarh", name: "Bhilai Steel Plant (SAIL)", lat: 21.1938, lon: 81.3509, type: "Industrial", category: "industrial" },
  { state: "Chhattisgarh", name: "Jindal Steel & Power Raigarh Hub", lat: 21.8974, lon: 83.3950, type: "Industrial", category: "industrial" },
  { state: "Madhya Pradesh", name: "Bina Bharat Oman Oil Refinery", lat: 24.1751, lon: 78.1928, type: "Industrial", category: "industrial" },
  { state: "Madhya Pradesh", name: "Pithampur Industrial Corridor", lat: 22.6144, lon: 75.6881, type: "Industrial", category: "industrial" },
  { state: "Tamil Nadu", name: "SPIC & Tuticorin Petrochemical Hub", lat: 8.7642, lon: 78.1348, type: "Industrial", category: "industrial" },
  { state: "Tamil Nadu", name: "Manali Industrial & Refinery Complex (CPCL)", lat: 13.1672, lon: 80.2644, type: "Industrial", category: "industrial" },
  { state: "Andhra Pradesh", name: "Visakhapatnam Steel & HPCL Refinery", lat: 17.6868, lon: 83.2185, type: "Industrial", category: "industrial" },
  { state: "Karnataka", name: "JSW Steel Toranagallu Complex (Bellary)", lat: 15.1914, lon: 76.6669, type: "Industrial", category: "industrial" },
  { state: "Karnataka", name: "Mangalore Refinery and Petrochemicals (MRPL)", lat: 12.9906, lon: 74.8336, type: "Industrial", category: "industrial" },
  { state: "Rajasthan", name: "Barmer Oil Refinery & Petrochemicals (HPCL)", lat: 25.7533, lon: 71.4181, type: "Industrial", category: "industrial" },
  { state: "Uttar Pradesh", name: "Mathura Indian Oil Refinery", lat: 27.4924, lon: 77.6737, type: "Industrial", category: "industrial" },
  { state: "Punjab", name: "Guru Gobind Singh Refinery (Bhatinda HMEL)", lat: 30.2109, lon: 74.9455, type: "Industrial", category: "industrial" },
  { state: "Haryana", name: "Panipat Indian Oil Petrochemical Complex", lat: 29.3909, lon: 76.9635, type: "Industrial", category: "industrial" },
  { state: "Bihar", name: "Barauni Indian Oil Refinery & Chemical Hub", lat: 25.4664, lon: 85.9869, type: "Industrial", category: "industrial" },
  { state: "Assam", name: "Digboi & Bongaigaon Refinery Corridor", lat: 27.3828, lon: 95.6311, type: "Industrial", category: "industrial" },

  // Mines / Quarries
  { state: "Jharkhand", name: "Dhanbad Coalfield & Jharia Mining Zone", lat: 23.7957, lon: 86.4304, type: "Quarry/Mining", category: "quarry" },
  { state: "Telangana", name: "Singareni Collieries Coal Mining Hub", lat: 17.5511, lon: 80.6189, type: "Quarry/Mining", category: "quarry" },
  { state: "Odisha", name: "Keonjhar Iron Ore Mining Belt", lat: 21.6289, lon: 85.5817, type: "Quarry/Mining", category: "quarry" },
  { state: "Chhattisgarh", name: "Bailadila Iron Ore Mining Complex", lat: 18.6667, lon: 81.2500, type: "Quarry/Mining", category: "quarry" },
  { state: "Rajasthan", name: "Makrana Marble & Mineral Quarry Belt", lat: 27.0425, lon: 74.7214, type: "Quarry/Mining", category: "quarry" }
];

const INDIAN_STATE_CENTERS = [
  ["Rajasthan", 27.0238, 74.2179],
  ["Madhya Pradesh", 22.9734, 78.6569],
  ["Gujarat", 22.2587, 71.1924],
  ["Maharashtra", 19.7515, 75.7139],
  ["Chhattisgarh", 21.2787, 81.8661],
  ["Odisha", 20.9517, 85.0985],
  ["Uttar Pradesh", 26.8467, 80.9462],
  ["Telangana", 18.1124, 79.0193],
  ["Andhra Pradesh", 15.9129, 79.74],
  ["Karnataka", 15.3173, 75.7139],
  ["Tamil Nadu", 11.1271, 78.6569],
  ["Kerala", 10.8505, 76.2711],
  ["Bihar", 25.0961, 85.3131],
  ["Jharkhand", 23.6102, 85.2799],
  ["West Bengal", 22.9868, 87.855],
  ["Punjab", 31.1471, 75.3412],
  ["Haryana", 29.0588, 76.0856],
  ["Himachal Pradesh", 31.1048, 77.1734],
  ["Uttarakhand", 30.0668, 79.0193],
  ["Jammu & Kashmir", 33.7782, 76.5762],
  ["Assam", 26.2006, 92.9376]
];

export function resolveIndianStateFromCoords(lat, lon) {
  // Offshore Oil & Gas Flare Platforms (Arabian Sea & Bay of Bengal)
  if (lat >= 18.2 && lat <= 20.5 && lon >= 70.0 && lon <= 72.5) return "Arabian Sea (Bombay High Offshore)";
  if (lat >= 15.5 && lat <= 17.5 && lon >= 81.8 && lon <= 83.8) return "Bay of Bengal (KG Basin Offshore)";
  if (lat >= 20.5 && lat <= 22.0 && lon >= 71.8 && lon <= 72.8) return "Gulf of Khambhat (Offshore Marine Zone)";

  // Terrestrial States
  if (lat >= 23.0 && lat <= 30.2 && lon >= 69.5 && lon <= 78.3) return "Rajasthan";
  if (lat >= 21.1 && lat <= 26.9 && lon >= 74.0 && lon <= 82.8) return "Madhya Pradesh";
  if (lat >= 20.1 && lat <= 24.7 && lon >= 68.1 && lon <= 74.5) return "Gujarat";
  if (lat >= 15.6 && lat <= 22.0 && lon >= 72.6 && lon <= 80.9) return "Maharashtra";
  if (lat >= 17.8 && lat <= 24.1 && lon >= 80.2 && lon <= 84.4) return "Chhattisgarh";
  if (lat >= 17.8 && lat <= 22.6 && lon >= 81.4 && lon <= 87.5) return "Odisha";
  if (lat >= 23.9 && lat <= 30.4 && lon >= 77.1 && lon <= 84.6) return "Uttar Pradesh";
  if (lat >= 15.8 && lat <= 19.9 && lon >= 77.2 && lon <= 81.8) return "Telangana";
  if (lat >= 12.6 && lat <= 19.2 && lon >= 76.8 && lon <= 84.8) return "Andhra Pradesh";
  if (lat >= 11.5 && lat <= 18.5 && lon >= 74.0 && lon <= 78.6) return "Karnataka";
  if (lat >= 8.0 && lat <= 13.5 && lon >= 76.2 && lon <= 80.3) return "Tamil Nadu";
  if (lat >= 8.3 && lat <= 12.8 && lon >= 74.8 && lon <= 77.4) return "Kerala";
  if (lat >= 24.3 && lat <= 27.5 && lon >= 83.3 && lon <= 88.3) return "Bihar";
  if (lat >= 21.9 && lat <= 25.3 && lon >= 83.3 && lon <= 87.9) return "Jharkhand";
  if (lat >= 21.5 && lat <= 27.2 && lon >= 85.8 && lon <= 89.9) return "West Bengal";
  if (lat >= 29.5 && lat <= 32.5 && lon >= 73.9 && lon <= 76.9) return "Punjab";
  if (lat >= 27.6 && lat <= 30.9 && lon >= 74.5 && lon <= 77.6) return "Haryana";
  if (lat >= 30.4 && lat <= 33.2 && lon >= 75.6 && lon <= 79.0) return "Himachal Pradesh";
  if (lat >= 28.7 && lat <= 31.5 && lon >= 77.6 && lon <= 81.0) return "Uttarakhand";
  if (lat >= 32.2 && lat <= 37.1 && lon >= 73.5 && lon <= 80.3) return "Jammu & Kashmir";
  if (lat >= 24.1 && lat <= 28.0 && lon >= 89.7 && lon <= 96.0) return "Assam";

  return INDIAN_STATE_CENTERS.reduce((nearest, [state, sLat, sLon]) => {
    const dist = (lat - sLat) ** 2 + (lon - sLon) ** 2;
    return dist < nearest.dist ? { state, dist } : nearest;
  }, { state: "Madhya Pradesh", dist: Infinity }).state;
}

const ML_API_URL = process.env.ML_PREDICTION_API_URL || 'https://thermal-anomaly-api.onrender.com/predict';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate distance in km to closest power plant, industrial zone, and quarry
 */
function calculateSpatialDistances(lat, lon) {
  let minPower = Infinity;
  let minIndustrial = Infinity;
  let minQuarry = Infinity;
  let nearest = INDIAN_INFRASTRUCTURE_HUBS[0];
  let minOverall = Infinity;

  for (const hub of INDIAN_INFRASTRUCTURE_HUBS) {
    const d = haversineKm(lat, lon, hub.lat, hub.lon);
    if (d < minOverall) {
      minOverall = d;
      nearest = hub;
    }
    if (hub.category === 'power' && d < minPower) minPower = d;
    if (hub.category === 'industrial' && d < minIndustrial) minIndustrial = d;
    if (hub.category === 'quarry' && d < minQuarry) minQuarry = d;
  }

  return {
    nearestHub: nearest,
    distOverallKm: parseFloat(minOverall.toFixed(2)),
    distPowerPlantKm: parseFloat(minPower.toFixed(2)),
    distIndustrialZoneKm: parseFloat(minIndustrial.toFixed(2)),
    distQuarryKm: parseFloat(minQuarry.toFixed(2))
  };
}

/**
 * Map ML Model predicted class to platform UI eventType
 */
function mapClassToEventType(predictedClass = '') {
  const p = predictedClass.toLowerCase();
  if (p.includes('power') || p.includes('station')) return 'Power Plant';
  if (p.includes('flare') || p.includes('gas')) return 'Gas Flare';
  if (p.includes('mining') || p.includes('quarry') || p.includes('extraction')) return 'Mining';
  if (p.includes('industrial') || p.includes('kiln')) return 'Industrial';
  if (p.includes('agri') || p.includes('crop')) return 'Agricultural';
  if (p.includes('wildfire') || p.includes('forest')) return 'Forest';
  return 'Other';
}

/**
 * Early Detection & Risk Scoring Engine with External ML Model Integration
 */
export async function evaluateThermalAnomaly(anomalyData) {
  const {
    latitude,
    longitude,
    bright_ti4 = 320,
    bright_ti5 = 285,
    frp = 5.0,
    satellite = 'VIIRS (N21)',
    tier = 'TIER2_POLAR',
    confidence = 'nominal',
    acq_date
  } = anomalyData;

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const gridKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const acqDateStr = acq_date || new Date().toISOString().split('T')[0];
  const actualState = resolveIndianStateFromCoords(lat, lon);

  // 1. Compute Spatial Distances from 41,142 OSM Industrial Features & Sentinel-2 Landcover
  const lcFeatures = await landcoverAndInfraService.getSentinel2LandcoverFeatures(lat, lon);
  const { nearestHub, distOverallKm } = calculateSpatialDistances(lat, lon);
  const distPowerPlantKm = lcFeatures.distPowerPlantKm;
  const distIndustrialZoneKm = lcFeatures.distIndustrialZoneKm;
  const distQuarryKm = lcFeatures.distQuarryKm;
  const distBrickKilnKm = lcFeatures.distBrickKilnKm;
  const distOilGasKm = lcFeatures.distOilGasKm;

  // 2. Resolve Nearest Verified Facility (OSM Industrial Master + PostGIS Infrastructure)
  let nearestFacility = {
    name: (lcFeatures.distOverallKm <= 3.5 && lcFeatures.nearestInfraName) ? lcFeatures.nearestInfraName : nearestHub.name,
    type: (lcFeatures.distOverallKm <= 3.5 && lcFeatures.nearestInfraType) ? lcFeatures.nearestInfraType.replace('_', ' ') : nearestHub.type,
    distance_m: lcFeatures.distOverallKm * 1000,
    dist_km: lcFeatures.distOverallKm,
    hazard_rating: 60,
    lat: nearestHub.lat,
    lon: nearestHub.lon,
    state: actualState
  };

  try {
    const spatialRes = await query(`
      SELECT 
        name, 
        facility_type, 
        state,
        hazard_rating,
        latitude,
        longitude,
        ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
      FROM industrial_facilities
      ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
    `, [lon, lat]);

    if (spatialRes.rows.length > 0) {
      const row = spatialRes.rows[0];
      const dbDistM = parseFloat(row.distance_m || 25000);
      const dbDistKm = parseFloat((dbDistM / 1000).toFixed(2));
      
      if (dbDistKm < nearestFacility.dist_km) {
        nearestFacility = {
          name: row.name,
          type: row.facility_type || 'Industrial',
          distance_m: dbDistM,
          dist_km: dbDistKm,
          hazard_rating: parseInt(row.hazard_rating || 50, 10),
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
          state: row.state || actualState
        };
      }
    }
  } catch (err) {
    // Fallback to spatial calculations
  }

  // 3. Call External ML Model API (POST https://thermal-anomaly-api.onrender.com/predict) with Landcover & OSM
  const confidenceStr = typeof confidence === 'string' ? confidence : 'nominal';
  const mlPayload = {
    frp: parseFloat(Number(frp).toFixed(2)),
    bright_ti4: parseFloat(Number(bright_ti4).toFixed(2)),
    bright_ti5: parseFloat(Number(bright_ti5).toFixed(2)),
    confidence: confidenceStr,
    latitude: parseFloat(lat.toFixed(4)),
    longitude: parseFloat(lon.toFixed(4)),
    grid_key: gridKey,
    acq_date: acqDateStr,
    dist_power_plant_km: distPowerPlantKm,
    dist_industrial_zone_km: distIndustrialZoneKm,
    dist_quarry_km: distQuarryKm,
    dist_brick_kiln_km: distBrickKilnKm,
    dist_oil_gas_km: distOilGasKm,
    landcover_class: lcFeatures.landcoverClass,
    ndvi: lcFeatures.ndviProxy,
    ndbi: lcFeatures.ndbiProxy,
    landcover_prob_built: lcFeatures.landcoverProbabilities.built,
    landcover_prob_crops: lcFeatures.landcoverProbabilities.crops,
    landcover_prob_forest: lcFeatures.landcoverProbabilities.trees_forest,
    landcover_prob_bare: lcFeatures.landcoverProbabilities.bare_ground
  };

  let mlResponse = null;
  try {
    const apiRes = await axios.post(ML_API_URL, mlPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 2500
    });
    if (apiRes.data && apiRes.data.predicted_class) {
      mlResponse = apiRes.data;
    }
  } catch (err) {
    // Fast internal inference fallback
  }

  // 4. Derive Classification & Risk from ML Model (or fallback)
  let predictedClass;
  let riskScore;
  let classProbabilities = null;
  let keySignals = null;
  let predictionConfidence;

  if (mlResponse) {
    predictedClass = mlResponse.predicted_class;
    // Scale 0-1 risk_score from model to 0-100
    riskScore = Math.min(99, Math.max(12, Math.round((parseFloat(mlResponse.risk_score) || 0.5) * 100)));
    classProbabilities = mlResponse.class_probabilities || {};
    keySignals = mlResponse.key_signals || {};
    const prob = classProbabilities[predictedClass];
    predictionConfidence = prob != null ? Math.round(prob * 100) : 88;
  } else {
    // Local Fallback Heuristic
    const deltaT = bright_ti4 - bright_ti5;
    if (nearestFacility.distance_m <= 5000) {
      predictedClass = 'Industrial';
    } else if (deltaT > 45 && frp > 15) {
      predictedClass = 'Wildfire';
    } else {
      predictedClass = 'Agricultural Burning';
    }

    let baseRisk = 20 + Math.min(35, frp * 1.6);
    if (nearestFacility.distance_m < 1000) baseRisk += 30;
    else if (nearestFacility.distance_m < 3000) baseRisk += 22;
    else if (nearestFacility.distance_m < 7000) baseRisk += 12;
    if (bright_ti4 > 350) baseRisk += 20;
    else if (bright_ti4 > 335) baseRisk += 12;
    riskScore = Math.min(99, Math.max(15, Math.round(baseRisk)));
    predictionConfidence = 85;
  }

  const eventType = mapClassToEventType(predictedClass);

  // 5. Early Warning & Multi-Satellite Fusion Triggers
  const isGeostationary = tier === 'TIER1_GEO' || satellite.includes('INSAT') || satellite.includes('Himawari');
  const isIncidentalProximity = nearestFacility.distance_m <= 3500 || distPowerPlantKm <= 3.5 || distIndustrialZoneKm <= 3.5;
  const zScore = parseFloat((((bright_ti4 - 300) / 15) + (frp / 10)).toFixed(2));
  const isEarlyWarning = (isGeostationary || zScore > 2.5) && (isIncidentalProximity || riskScore >= 70);

  // Risk Categories
  let riskLevel = 'Low';
  let riskCategory = 'LOW';
  if (riskScore >= 75) {
    riskLevel = 'Critical';
    riskCategory = 'CRITICAL';
  } else if (riskScore >= 50) {
    riskLevel = 'High';
    riskCategory = 'HIGH';
  } else if (riskScore >= 25) {
    riskLevel = 'Medium';
    riskCategory = 'MEDIUM';
  }

  const status = isEarlyWarning
    ? 'EARLY WARNING'
    : riskCategory === 'CRITICAL'
      ? 'CRITICAL ALERT'
      : riskCategory === 'HIGH'
        ? 'UNDER INVESTIGATION'
        : 'MONITORED';

  const isFacilityProximity = nearestFacility.distance_m <= 5000;
  const facilityDisplayName = isFacilityProximity
    ? nearestFacility.name
    : `${predictedClass} (${actualState} · ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
  const locationStr = isFacilityProximity
    ? `${nearestFacility.name}, ${actualState}`
    : `${actualState} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;

  // Explicit Diagnosis & Physical Reason for Anomaly
  let reason = '';
  if (predictedClass === 'Industrial' || predictedClass === 'Gas Flare') {
    reason = isFacilityProximity 
      ? `High-temperature radiometric thermal emission (FRP: ${frp.toFixed(1)} MW) at ${nearestFacility.name}.`
      : `High-temperature industrial thermal anomaly (FRP: ${frp.toFixed(1)} MW, Brightness: ${bright_ti4.toFixed(1)} K) in ${actualState}.`;
  } else if (predictedClass === 'Power Plant') {
    reason = `Intense superheated thermal discharge (FRP: ${frp.toFixed(1)} MW) near power generation infrastructure.`;
  } else if (predictedClass === 'Agricultural Burning' || predictedClass === 'Agricultural') {
    reason = `Open crop residue / stubble biomass fire signature (ΔT: ${(bright_ti4 - bright_ti5).toFixed(1)} K, FRP: ${frp.toFixed(1)} MW) in rural farmland.`;
  } else if (predictedClass === 'Wildfire' || predictedClass === 'Forest') {
    reason = `Rapid forest canopy biomass thermal spike detected in vegetative reserve zone (FRP: ${frp.toFixed(1)} MW).`;
  } else if (predictedClass === 'Mining/Extraction' || predictedClass === 'Mining') {
    reason = `High-heat surface mining / quarry extraction thermal signature (FRP: ${frp.toFixed(1)} MW).`;
  } else {
    reason = `Unclassified thermal infrared radiometric spike (FRP: ${frp.toFixed(1)} MW, Brightness: ${bright_ti4.toFixed(1)} K).`;
  }

  return {
    latitude: lat,
    longitude: lon,
    grid_key: gridKey,
    bright_ti4: parseFloat(bright_ti4.toFixed(2)),
    bright_ti5: parseFloat(bright_ti5.toFixed(2)),
    frp: parseFloat(frp.toFixed(2)),
    satellite,
    instrument: isGeostationary ? 'MIR/TIR' : 'VIIRS',
    satellite_tier: tier,
    confidence: typeof confidence === 'number' ? `${confidence}%` : confidence,
    state: actualState,
    location: locationStr,
    facilityName: facilityDisplayName,
    facilityType: isFacilityProximity ? nearestFacility.type : 'Monitored Thermal Zone',
    reason,
    diagnosis: reason,
    nearestFacilityLat: nearestFacility.lat,
    nearestFacilityLon: nearestFacility.lon,
    dist_to_facility_m: nearestFacility.distance_m,
    dist_to_facility_km: nearestFacility.dist_km,
    dist_power_plant_km: distPowerPlantKm,
    dist_industrial_zone_km: distIndustrialZoneKm,
    dist_quarry_km: distQuarryKm,
    dist_brick_kiln_km: distBrickKilnKm,
    dist_oil_gas_km: distOilGasKm,
    landcover_class: lcFeatures.landcoverClass,
    landcover_probabilities: lcFeatures.landcoverProbabilities,
    ndvi_proxy: lcFeatures.ndviProxy,
    ndbi_proxy: lcFeatures.ndbiProxy,
    eventType,
    predicted_class: predictedClass,
    prediction_confidence: predictionConfidence,
    class_probabilities: classProbabilities,
    key_signals: keySignals,
    risk: riskCategory,
    risk_level: riskLevel,
    riskScore,
    risk_score: riskScore,
    status,
    is_live: true,
    is_early_warning: isEarlyWarning,
    is_flash_trigger: isGeostationary,
    z_score: zScore,
    multi_satellite_confirmed: tier === 'TIER3_FUSED'
  };
}
