import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial real sample records from prompt
const sampleEvents = [
  {
    latitude: 10.87581,
    longitude: 79.09857,
    bright_ti4: 335.72,
    scan: 0.4,
    track: 0.37,
    acq_date: "03-08-2026",
    acq_time: 758,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "n",
    version: "2.0NRT",
    bright_ti5: 292.93,
    frp: 6.92,
    daynight: "D",
    firms_id: 3,
    state: "TamilNadu",
    osm_id: 1396507050,
    name: "Tanjore Industrial Cluster",
    power: "plant",
    landuse: "industrial",
    industrial: "power_substation",
    dist_to_facility_m: 20142.3751,
    "system:index": "00000000000000000000_0_0",
    Map: 10,
    b1: 2161.6926
  },
  {
    latitude: 11.08548,
    longitude: 79.41801,
    bright_ti4: 334.32,
    scan: 0.39,
    track: 0.36,
    acq_date: "03-08-2026",
    acq_time: 758,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "l",
    version: "2.0NRT",
    bright_ti5: 298.96,
    frp: 9.08,
    daynight: "D",
    firms_id: 4,
    state: "TamilNadu",
    osm_id: 374825637,
    name: "Lanco Tanjore Power Plant",
    power: "plant",
    landuse: "industrial",
    industrial: "power_station",
    dist_to_facility_m: 12827.16845,
    "system:index": "00000000000000000001_0_0",
    Map: 10,
    b1: 294.92303
  },
  {
    latitude: 16.97776,
    longitude: 81.59511,
    bright_ti4: 334.38,
    scan: 0.44,
    track: 0.38,
    acq_date: "03-08-2026",
    acq_time: 758,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "n",
    version: "2.0NRT",
    bright_ti5: 292.96,
    frp: 3.22,
    daynight: "D",
    firms_id: 7,
    state: "AndhraPradesh",
    osm_id: 308740411,
    name: "Vijjeswaram Gas Power Plant",
    power: "plant",
    landuse: "industrial",
    industrial: "gas_flare",
    dist_to_facility_m: 14406.78412,
    "system:index": "00000000000000000004_0_0",
    Map: 10,
    b1: 337.1588
  },
  {
    latitude: 21.10393,
    longitude: 72.6449,
    bright_ti4: 339.03,
    scan: 0.39,
    track: 0.44,
    acq_date: "03-08-2026",
    acq_time: 801,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "h",
    version: "2.0NRT",
    bright_ti5: 280.09,
    frp: 24.25,
    daynight: "D",
    firms_id: 15,
    state: "Gujarat",
    osm_id: 823272713,
    name: "Hazira Power Plant & Refinery",
    power: "plant",
    landuse: "industrial",
    industrial: "refinery",
    dist_to_facility_m: 1302.506083,
    "system:index": "0000000000000000000c_0_0",
    Map: 50,
    b1: 71875.56
  },
  {
    latitude: 22.87237,
    longitude: 86.06178,
    bright_ti4: 342.77,
    scan: 0.58,
    track: 0.52,
    acq_date: "03-08-2026",
    acq_time: 2027,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "h",
    version: "2.0NRT",
    bright_ti5: 267.63,
    frp: 31.32,
    daynight: "N",
    firms_id: 24,
    state: "Jharkhand",
    osm_id: 395142061,
    name: "Mahadev Prasad Super Thermal Power Plant",
    power: "plant",
    landuse: "industrial",
    industrial: "steel_plant",
    dist_to_facility_m: 3779.828978,
    "system:index": "00000000000000000015_0_0",
    Map: 10,
    b1: 1274.2266
  },
  {
    latitude: 8.77262,
    longitude: 78.11182,
    bright_ti4: 346.79,
    scan: 0.57,
    track: 0.52,
    acq_date: "04-08-2026",
    acq_time: 737,
    satellite: "N21",
    instrument: "VIIRS",
    confidence: "h",
    version: "2.0NRT",
    bright_ti5: 288.05,
    frp: 16.78,
    daynight: "D",
    firms_id: 41,
    state: "TamilNadu",
    osm_id: 17348197,
    name: "SPIC Thoothukudi Floating Solar PV Park",
    power: "plant",
    landuse: "industrial",
    industrial: "chemical_plant",
    dist_to_facility_m: 4663.753065,
    "system:index": "0000000000000000001d_0_0",
    Map: 30,
    b1: 3978.8066
  }
];

// Major industrial hubs & regions across Indian states
const stateClusters = [
  { state: "TamilNadu", lat: 11.1271, lon: 78.6569, facilities: ["Lanco Tanjore Power Plant", "Neyveli Lignite Thermal Power", "SPIC Thoothukudi Park", "Tuticorin Refinery", "Ennore Thermal Power Station"] },
  { state: "AndhraPradesh", lat: 16.5062, lon: 80.6480, facilities: ["Vijjeswaram Gas Power Plant", "Visakhapatnam Steel Complex", "Simhadri Super Thermal", "Kakinada Fertilizer Plant", "Sri City Industrial Zone"] },
  { state: "Gujarat", lat: 22.2587, lon: 71.1924, facilities: ["Hazira Industrial Complex", "Jamnagar Refinery Complex", "Mundra Thermal Power Station", "Ankleshwar Chemical Hub", "Dahej Petrochemical Zone"] },
  { state: "Maharashtra", lat: 19.7515, lon: 75.7139, facilities: ["Chandrapur Super Thermal", "Trombay Thermal Station", "Tarapur Atomic Complex", "Nagothane Chemical Complex", "Ballarpur Paper Mills"] },
  { state: "Jharkhand", lat: 23.6102, lon: 85.2799, facilities: ["Mahadev Prasad Thermal", "Bokaro Steel City", "Jamshedpur Tata Steel Works", "Dhanbad Coal Mining Zone", "Patratu Thermal Power"] },
  { state: "WestBengal", lat: 22.9868, lon: 87.8550, facilities: ["Durgapur Steel Complex", "Haldia Petrochemical Refinery", "Mejia Thermal Power Station", "Kolkata Port Industrial Hub", "Asansol Mining Zone"] },
  { state: "Telangana", lat: 18.1124, lon: 79.0193, facilities: ["Ramagundam Super Thermal", "Kothagudem Power Complex", "Singareni Coal Fields", "Pashamylaram Industrial Estate", "Gajwel Power Hub"] },
  { state: "Chhattisgarh", lat: 21.2787, lon: 81.8661, facilities: ["Middle Kolab Project", "Bhilai Steel Plant", "Korba Super Thermal Power", "NTPC Sipat Power Station", "Jindal Steel & Power Raigarh"] },
  { state: "Odisha", lat: 20.9517, lon: 85.0985, facilities: ["Talcher Coalfields & Power", "Jharsuguda Aluminium Complex", "Paradip Refinery", "Rourkela Steel Plant", "Kalinganagar Industrial Hub"] },
  { state: "Rajasthan", lat: 27.0238, lon: 74.2179, facilities: ["Suratgarh Super Thermal", "Chhabra Thermal Power", "Barmer Oil Refinery", "Bhilwara Textile Zone", "Kota Industrial Area"] },
  { state: "Karnataka", lat: 15.3173, lon: 75.7139, facilities: ["Bellary Thermal Power", "JSW Toranagallu Steel", "Mangalore Refinery (MRPL)", "Raichur Thermal Power", "Nanjangud Industrial Hub"] },
  { state: "Punjab", lat: 31.1471, lon: 75.3412, facilities: ["Guru Hargobind Thermal Station", "Talwandi Sabo Power Limited", "Ludhiana Industrial Cluster", "Bhatinda Refinery", "Mansa Agro-thermal Hub"] },
  { state: "Haryana", lat: 29.0588, lon: 76.0856, facilities: ["Panipat Thermal Station", "Yamunanagar Thermal Plant", "Hisar Industrial Estate", "Jhajjar Power Plant", "Gurugram Manufacturing Zone"] },
  { state: "MadhyaPradesh", lat: 22.9734, lon: 78.6569, facilities: ["Vindhyachal Super Thermal", "Sasan Ultra Mega Power", "Bina Oil Refinery", "Pithampur Industrial Area", "Singrauli Mining Complex"] },
  { state: "UttarPradesh", lat: 26.8467, lon: 80.9462, facilities: ["Singrauli Power Hub", "Anpara Thermal Power Station", "Rihand Super Thermal", "Mathura Refinery", "Dadri Thermal Power"] }
];

const eventTypes = [
  { power: "plant", landuse: "industrial", industrial: "power_station", name: "Thermal Power Station" },
  { power: "plant", landuse: "industrial", industrial: "refinery", name: "Oil Refinery Flare" },
  { power: "", landuse: "industrial", industrial: "chemical_plant", name: "Chemical Processing Facility" },
  { power: "plant", landuse: "industrial", industrial: "steel_plant", name: "Steel & Metallurgy Plant" },
  { power: "", landuse: "mining", industrial: "coal_mine", name: "Open-cast Mining Operation" },
  { power: "", landuse: "farmland", industrial: "", name: "Agricultural Crop Residual Burn" },
  { power: "", landuse: "forest", industrial: "", name: "Forest Wildfire Anomaly" },
  { power: "plant", landuse: "industrial", industrial: "gas_flare", name: "Natural Gas Flare Station" }
];

const satellites = ["N21", "NOAA-20", "VIIRS", "MODIS_Terra", "MODIS_Aqua"];
const confidences = ["h", "n", "l"];

// Generate 2000 events
const events = [];
let idCounter = 1;

// First add sample events
sampleEvents.forEach(s => {
  events.push({ ...s, firms_id: idCounter++ });
});

const startDate = new Date(2026, 7, 1); // August 1, 2026

while (events.length < 2000) {
  const cluster = stateClusters[Math.floor(Math.random() * stateClusters.length)];
  const et = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const sat = satellites[Math.floor(Math.random() * satellites.length)];
  const conf = confidences[Math.floor(Math.random() * confidences.length)];
  
  // Random position within 1.5 degrees of state cluster center
  const lat = parseFloat((cluster.lat + (Math.random() - 0.5) * 2.8).toFixed(5));
  const lon = parseFloat((cluster.lon + (Math.random() - 0.5) * 2.8).toFixed(5));
  
  // Random brightness & FRP
  const bright_ti4 = parseFloat((300 + Math.random() * 65).toFixed(2));
  const bright_ti5 = parseFloat((265 + Math.random() * 40).toFixed(2));
  const frp = parseFloat((0.2 + Math.pow(Math.random(), 2) * 50).toFixed(2)); // skewed towards realistic FRPs
  
  // Acquisition date within August 2026
  const daysOffset = Math.floor(Math.random() * 30);
  const eventDate = new Date(startDate.getTime() + daysOffset * 86400000);
  const dayStr = String(eventDate.getDate()).padStart(2, '0');
  const monthStr = String(eventDate.getMonth() + 1).padStart(2, '0');
  const acq_date = `${dayStr}-${monthStr}-2026`;
  const acq_time = Math.floor(Math.random() * 2359);
  const daynight = acq_time > 600 && acq_time < 1900 ? "D" : "N";
  
  const facilityName = Math.random() > 0.45 ? cluster.facilities[Math.floor(Math.random() * cluster.facilities.length)] : "";
  const dist_to_facility_m = parseFloat((200 + Math.random() * 35000).toFixed(2));
  
  events.push({
    latitude: lat,
    longitude: lon,
    bright_ti4,
    scan: parseFloat((0.35 + Math.random() * 0.3).toFixed(2)),
    track: parseFloat((0.35 + Math.random() * 0.3).toFixed(2)),
    acq_date,
    acq_time,
    satellite: sat,
    instrument: "VIIRS",
    confidence: conf,
    version: "2.0NRT",
    bright_ti5,
    frp,
    daynight,
    firms_id: idCounter,
    state: cluster.state,
    osm_id: 100000000 + Math.floor(Math.random() * 900000000),
    name: facilityName,
    power: et.power,
    landuse: et.landuse,
    industrial: et.industrial,
    dist_to_facility_m,
    "system:index": `0000000000000000${idCounter.toString(16).padStart(4, '0')}_0_0`,
    Map: [10, 20, 30, 40, 50, 60][Math.floor(Math.random() * 6)],
    b1: parseFloat((100 + Math.random() * 5000).toFixed(2))
  });
  
  idCounter++;
}

// Output directories
const publicDataDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Save JSON
const jsonPath = path.join(publicDataDir, 'events.json');
fs.writeFileSync(jsonPath, JSON.stringify(events, null, 2));
console.log(`Generated 2000 events in ${jsonPath}`);

// Save CSV
const csvHeaders = Object.keys(events[0]).join(',');
const csvRows = events.map(e => Object.values(e).map(val => `"${val}"`).join(','));
const csvContent = [csvHeaders, ...csvRows].join('\n');

const csvPath = path.join(publicDataDir, 'events.csv');
fs.writeFileSync(csvPath, csvContent);
console.log(`Generated CSV dataset in ${csvPath}`);
