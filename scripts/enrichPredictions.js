import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, "../public/data/events.json");
const csvPath = path.resolve(__dirname, "../public/data/events.csv");

// State centroids for nearest state resolution
const stateCenters = [
  { state: "Tamil Nadu", lat: 11.1271, lon: 78.6569 },
  { state: "Kerala", lat: 10.8505, lon: 76.2711 },
  { state: "Karnataka", lat: 15.3173, lon: 75.7139 },
  { state: "Andhra Pradesh", lat: 15.9129, lon: 79.74 },
  { state: "Telangana", lat: 18.1124, lon: 79.0193 },
  { state: "Maharashtra", lat: 19.7515, lon: 75.7139 },
  { state: "Goa", lat: 15.2993, lon: 74.124 },
  { state: "Gujarat", lat: 22.2587, lon: 71.1924 },
  { state: "Madhya Pradesh", lat: 22.9734, lon: 78.6569 },
  { state: "Chhattisgarh", lat: 21.2787, lon: 81.8661 },
  { state: "Odisha", lat: 20.9517, lon: 85.0985 },
  { state: "West Bengal", lat: 22.9868, lon: 87.855 },
  { state: "Jharkhand", lat: 23.6102, lon: 85.2799 },
  { state: "Bihar", lat: 25.0961, lon: 85.3131 },
  { state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { state: "Rajasthan", lat: 27.0238, lon: 74.2179 },
  { state: "Haryana", lat: 29.0588, lon: 76.0856 },
  { state: "Punjab", lat: 31.1471, lon: 75.3412 },
  { state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734 },
  { state: "Uttarakhand", lat: 30.0668, lon: 79.0193 },
  { state: "Assam", lat: 26.2006, lon: 92.9376 },
  { state: "Jammu & Kashmir", lat: 33.7782, lon: 76.5762 }
];

const MONITORED_HUBS = [
  { state: "Madhya Pradesh", name: "Singrauli Super Thermal Power Hub", lat: 24.1997, lon: 82.6645, type: "Power Plant" },
  { state: "Madhya Pradesh", name: "Vindhyachal Super Thermal Complex", lat: 24.1039, lon: 82.6719, type: "Power Plant" },
  { state: "Uttar Pradesh", name: "Anpara Super Thermal Power Station", lat: 24.2008, lon: 82.7661, type: "Power Plant" },
  { state: "Uttar Pradesh", name: "Rihand Super Thermal Power Complex", lat: 24.0264, lon: 82.7911, type: "Power Plant" },
  { state: "Chhattisgarh", name: "Korba Super Thermal Power Station", lat: 22.3595, lon: 82.6841, type: "Power Plant" },
  { state: "Odisha", name: "Talcher Super Thermal & Coalfields", lat: 20.9509, lon: 85.2167, type: "Power Plant" },
  { state: "Odisha", name: "Rourkela Steel Plant (SAIL)", lat: 22.2253, lon: 84.8683, type: "Industrial" },
  { state: "Odisha", name: "Paradip IOCL Refinery Complex", lat: 20.2644, lon: 86.6711, type: "Industrial" },
  { state: "Odisha", name: "Jharsuguda Aluminium Complex", lat: 21.8554, lon: 84.0061, type: "Industrial" },
  { state: "Gujarat", name: "Jamnagar Reliance Refinery Complex", lat: 22.3662, lon: 69.8322, type: "Industrial" },
  { state: "Gujarat", name: "Hazira Petrochemical Terminal", lat: 21.1039, lon: 72.6449, type: "Industrial" },
  { state: "Gujarat", name: "Dahej Petroleum & Chemical Zone", lat: 21.7052, lon: 72.5842, type: "Industrial" },
  { state: "Gujarat", name: "Mundra Thermal Power & Port", lat: 22.8394, lon: 69.7214, type: "Power Plant" },
  { state: "Maharashtra", name: "Chandrapur Super Thermal Power", lat: 19.9806, lon: 79.2941, type: "Power Plant" },
  { state: "Maharashtra", name: "Trombay Refinery Hub (BPCL/HPCL)", lat: 19.0144, lon: 72.9056, type: "Industrial" },
  { state: "Jharkhand", name: "Bokaro Steel City Complex", lat: 23.6693, lon: 86.1511, type: "Industrial" },
  { state: "Jharkhand", name: "Jamshedpur Tata Steel Works", lat: 22.8046, lon: 86.2029, type: "Industrial" },
  { state: "Jharkhand", name: "Dhanbad Coalfield Mining Zone", lat: 23.7957, lon: 86.4304, type: "Mining" },
  { state: "West Bengal", name: "Haldia Petrochemicals Hub", lat: 22.0644, lon: 88.0617, type: "Industrial" },
  { state: "West Bengal", name: "Durgapur Steel Complex", lat: 23.5204, lon: 87.3119, type: "Industrial" },
  { state: "Chhattisgarh", name: "Bhilai Steel Plant (SAIL)", lat: 21.1938, lon: 81.3509, type: "Industrial" },
  { state: "Tamil Nadu", name: "Neyveli Lignite Power Complex", lat: 11.5975, lon: 79.4861, type: "Power Plant" },
  { state: "Tamil Nadu", name: "Manali Petrochemicals Complex", lat: 13.1672, lon: 80.2644, type: "Industrial" },
  { state: "Andhra Pradesh", name: "Visakhapatnam Steel & HPCL", lat: 17.6868, lon: 83.2185, type: "Industrial" },
  { state: "Telangana", name: "Ramagundam Super Thermal Power", lat: 18.7614, lon: 79.4756, type: "Power Plant" },
  { state: "Karnataka", name: "JSW Steel Toranagallu Complex", lat: 15.1914, lon: 76.6669, type: "Industrial" },
  { state: "Punjab", name: "Guru Gobind Singh Refinery", lat: 30.2109, lon: 74.9455, type: "Industrial" },
  { state: "Haryana", name: "Panipat Indian Oil Complex", lat: 29.3909, lon: 76.9635, type: "Industrial" },
  { state: "Bihar", name: "Barauni Indian Oil Refinery", lat: 25.4664, lon: 85.9869, type: "Industrial" },
  { state: "Assam", name: "Digboi & Bongaigaon Refinery", lat: 27.3828, lon: 95.6311, type: "Industrial" }
];

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveState(lat, lon) {
  let nearest = stateCenters[0].state;
  let minD = Infinity;
  for (const s of stateCenters) {
    const d = haversineMeters(lat, lon, s.lat, s.lon);
    if (d < minD) {
      minD = d;
      nearest = s.state;
    }
  }
  return nearest;
}

function resolveFacility(lat, lon, state) {
  let nearest = MONITORED_HUBS[0];
  let minD = Infinity;
  for (const h of MONITORED_HUBS) {
    const d = haversineMeters(lat, lon, h.lat, h.lon);
    if (d < minD) {
      minD = d;
      nearest = h;
    }
  }

  const distKm = parseFloat((minD / 1000).toFixed(2));
  if (distKm <= 35) {
    return {
      name: nearest.name,
      type: nearest.type,
      lat: nearest.lat,
      lon: nearest.lon,
      distM: minD,
      distKm
    };
  }

  return {
    name: `Industrial Complex (${state})`,
    type: "Industrial Facility",
    lat: nearest.lat,
    lon: nearest.lon,
    distM: minD,
    distKm
  };
}

export function enrichAndSave() {
  console.log("Loading dataset from events.json...");
  const rawEvents = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`Processing ${rawEvents.length} events...`);

  const enrichedEvents = rawEvents.map((e, idx) => {
    const id = idx + 1;
    const eventId = `EVT-${id}`;
    const lat = parseFloat(e.latitude);
    const lon = parseFloat(e.longitude);
    const state = resolveState(lat, lon);
    const fac = resolveFacility(lat, lon, state);

    const frp = parseFloat((e.max_frp || e.mean_frp || e.frp || 2.5).toFixed(2));
    const bright_ti4 = parseFloat((e.max_bright_ti4 || e.mean_bright_ti4 || e.bright_ti4 || 315.0).toFixed(2));
    const bright_ti5 = parseFloat((e.max_bright_ti5 || e.mean_bright_ti5 || e.bright_ti5 || 285.0).toFixed(2));

    const acq_date = e.acq_date || (e.event_start ? e.event_start.split(" ")[0] : "2026-08-20");
    const acq_time = e.acq_time ? String(e.acq_time) : (e.event_start ? e.event_start.split(" ")[1]?.slice(0, 5) : "12:00");

    const rawScore = parseFloat(e.risk_score || e.riskScore || 25);
    const riskScore = parseFloat(rawScore.toFixed(1));

    let risk = "LOW";
    if (riskScore >= 75) risk = "CRITICAL";
    else if (riskScore >= 50) risk = "HIGH";
    else if (riskScore >= 25) risk = "MEDIUM";
    else risk = "LOW";

    let eventType = "Other";
    const pClass = e.predicted_class || "";
    if (pClass.includes("Agricultural") || pClass.includes("Burning")) eventType = "Agricultural";
    else if (pClass.includes("Forest") || pClass.includes("Wildfire")) eventType = "Forest";
    else if (pClass.includes("Industrial") || pClass.includes("Kiln") || pClass.includes("Factory")) eventType = "Industrial";
    else if (pClass.includes("Mining") || pClass.includes("Quarry")) eventType = "Mining";
    else if (pClass.includes("Power")) eventType = "Power Plant";
    else if (fac.distKm < 15) eventType = fac.type;

    const confidencePct = `${Math.round(e.prediction_confidence || e.mean_confidence || 75)}%`;

    return {
      ...e,
      id,
      firms_id: id,
      firmsId: id,
      eventId,
      state,
      facilityName: fac.name,
      facilityType: fac.type,
      nearestFacilityLat: fac.lat,
      nearestFacilityLon: fac.lon,
      dist_to_facility_m: e.dist_to_facility_m || fac.distM,
      dist_to_facility_km: e.dist_to_facility_km || fac.distKm,
      eventType,
      risk,
      risk_level: risk === "CRITICAL" ? "Critical" : risk === "HIGH" ? "High" : risk === "MEDIUM" ? "Medium" : "Low",
      riskScore,
      risk_score: riskScore,
      confidence: confidencePct,
      confidenceRaw: e.mean_confidence || 75,
      acq_date,
      acq_time,
      frp,
      bright_ti4,
      bright_ti5,
      satellite: e.satellite_count > 1 ? "VIIRS + MODIS" : "VIIRS (NOAA-21 375m)",
      instrument: "VIIRS",
      status: risk === "CRITICAL" ? "CRITICAL ALERT" : risk === "HIGH" ? "UNDER INVESTIGATION" : "MONITORED",
      persistence: e.active_days > 1 || e.duration_hours > 0 || e.persistence_score > 20
    };
  });

  fs.writeFileSync(jsonPath, JSON.stringify(enrichedEvents, null, 2), "utf8");
  console.log(`✅ Saved ${enrichedEvents.length} enriched events to ${jsonPath}`);

  const csvStr = Papa.unparse(enrichedEvents);
  fs.writeFileSync(csvPath, csvStr, "utf8");
  console.log(`✅ Saved CSV to ${csvPath}`);
}

enrichAndSave();
