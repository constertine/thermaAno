import Papa from "papaparse";

export const API_BASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:5001";
export const WS_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_URL) ||
    "ws://localhost:5001/ws/live-events";

// Base44 and Thermal Map external placeholders as required
export const BASE44_DATA_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_BASE44_URL) ||
    "https://thermal-insight-india.base44.app";
export const THERMAL_MAP_URL =
    (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_THERMAL_MAP_URL) ||
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

let cachedEvents = null;
let fetchPromise = null;

const indianStateCenters = [
    ["Tamil Nadu", 11.1271, 78.6569],
    ["Kerala", 10.8505, 76.2711],
    ["Karnataka", 15.3173, 75.7139],
    ["Andhra Pradesh", 15.9129, 79.74],
    ["Telangana", 18.1124, 79.0193],
    ["Maharashtra", 19.7515, 75.7139],
    ["Goa", 15.2993, 74.124],
    ["Gujarat", 22.2587, 71.1924],
    ["Madhya Pradesh", 22.9734, 78.6569],
    ["Chhattisgarh", 21.2787, 81.8661],
    ["Odisha", 20.9517, 85.0985],
    ["West Bengal", 22.9868, 87.855],
    ["Jharkhand", 23.6102, 85.2799],
    ["Bihar", 25.0961, 85.3131],
    ["Uttar Pradesh", 26.8467, 80.9462],
    ["Rajasthan", 27.0238, 74.2179],
    ["Haryana", 29.0588, 76.0856],
    ["Punjab", 31.1471, 75.3412],
    ["Himachal Pradesh", 31.1048, 77.1734],
    ["Uttarakhand", 30.0668, 79.0193],
    ["Assam", 26.2006, 92.9376],
    ["Jammu & Kashmir", 33.7782, 76.5762],
];

const stateAliases = {
    TamilNadu: "Tamil Nadu",
    AndhraPradesh: "Andhra Pradesh",
    WestBengal: "West Bengal",
    MadhyaPradesh: "Madhya Pradesh",
    UttarPradesh: "Uttar Pradesh",
    HimachalPradesh: "Himachal Pradesh",
    JammuKashmir: "Jammu & Kashmir",
};

export function resolveIndianState(item) {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return stateAliases[item.state] || item.state || "India";
    }

    // Offshore Oil & Gas Flare Platforms (Arabian Sea & Bay of Bengal)
    if (latitude >= 18.2 && latitude <= 20.5 && longitude >= 70.0 && longitude <= 72.5) return "Arabian Sea (Bombay High Offshore)";
    if (latitude >= 15.5 && latitude <= 17.5 && longitude >= 81.8 && longitude <= 83.8) return "Bay of Bengal (KG Basin Offshore)";
    if (latitude >= 20.5 && latitude <= 22.0 && longitude >= 71.8 && longitude <= 72.8) return "Gulf of Khambhat (Offshore Marine Zone)";

    // Precise bounding boxes for Indian States
    if (latitude >= 23.0 && latitude <= 30.2 && longitude >= 69.5 && longitude <= 78.3) return "Rajasthan";
    if (latitude >= 21.1 && latitude <= 26.9 && longitude >= 74.0 && longitude <= 82.8) return "Madhya Pradesh";
    if (latitude >= 20.1 && latitude <= 24.7 && longitude >= 68.1 && longitude <= 74.5) return "Gujarat";
    if (latitude >= 15.6 && latitude <= 22.0 && longitude >= 72.6 && longitude <= 80.9) return "Maharashtra";
    if (latitude >= 17.8 && latitude <= 24.1 && longitude >= 80.2 && longitude <= 84.4) return "Chhattisgarh";
    if (latitude >= 17.8 && latitude <= 22.6 && longitude >= 81.4 && longitude <= 87.5) return "Odisha";
    if (latitude >= 23.9 && latitude <= 30.4 && longitude >= 77.1 && longitude <= 84.6) return "Uttar Pradesh";
    if (latitude >= 15.8 && latitude <= 19.9 && longitude >= 77.2 && longitude <= 81.8) return "Telangana";
    if (latitude >= 12.6 && latitude <= 19.2 && longitude >= 76.8 && longitude <= 84.8) return "Andhra Pradesh";
    if (latitude >= 11.5 && latitude <= 18.5 && longitude >= 74.0 && longitude <= 78.6) return "Karnataka";
    if (latitude >= 8.0 && latitude <= 13.5 && longitude >= 76.2 && longitude <= 80.3) return "Tamil Nadu";
    if (latitude >= 8.3 && latitude <= 12.8 && longitude >= 74.8 && longitude <= 77.4) return "Kerala";
    if (latitude >= 24.3 && latitude <= 27.5 && longitude >= 83.3 && longitude <= 88.3) return "Bihar";
    if (latitude >= 21.9 && latitude <= 25.3 && longitude >= 83.3 && longitude <= 87.9) return "Jharkhand";
    if (latitude >= 21.5 && latitude <= 27.2 && longitude >= 85.8 && longitude <= 89.9) return "West Bengal";
    if (latitude >= 29.5 && latitude <= 32.5 && longitude >= 73.9 && longitude <= 76.9) return "Punjab";
    if (latitude >= 27.6 && latitude <= 30.9 && longitude >= 74.5 && longitude <= 77.6) return "Haryana";
    if (latitude >= 30.4 && latitude <= 33.2 && longitude >= 75.6 && longitude <= 79.0) return "Himachal Pradesh";
    if (latitude >= 28.7 && latitude <= 31.5 && longitude >= 77.6 && longitude <= 81.0) return "Uttarakhand";
    if (latitude >= 32.2 && latitude <= 37.1 && longitude >= 73.5 && longitude <= 80.3) return "Jammu & Kashmir";
    if (latitude >= 24.1 && latitude <= 28.0 && longitude >= 89.7 && longitude <= 96.0) return "Assam";

    const providedState = stateAliases[item.state] || item.state;
    if (indianStateCenters.some(([state]) => state === providedState)) {
        return providedState;
    }

    return indianStateCenters.reduce(
        (nearest, [state, stateLat, stateLon]) => {
            const distance =
                (latitude - stateLat) ** 2 + (longitude - stateLon) ** 2;
            return distance < nearest.distance ? { state, distance } : nearest;
        },
        { state: "Madhya Pradesh", distance: Infinity },
    ).state;
}

// Filter matchers for Risk and Confidence across the platform
export function matchesRisk(evt, selectedRisk) {
    if (!selectedRisk || selectedRisk === "ALL") return true;
    const target = selectedRisk.toUpperCase().trim();
    const score =
        evt.risk_score != null && evt.risk_score !== ""
            ? parseFloat(evt.risk_score)
            : evt.riskScore != null && evt.riskScore !== ""
              ? parseFloat(evt.riskScore)
              : null;
    let evtRisk;
    if (score != null && !isNaN(score)) {
        if (score >= 75) evtRisk = "CRITICAL";
        else if (score >= 50) evtRisk = "HIGH";
        else if (score >= 25) evtRisk = "MEDIUM";
        else evtRisk = "LOW";
    } else {
        evtRisk = (evt.risk || evt.risk_level || "").toUpperCase().trim();
        if (evtRisk === "MID") evtRisk = "MEDIUM";
    }
    return (
        evtRisk === target ||
        (target === "MID" && evtRisk === "MEDIUM") ||
        (target === "MEDIUM" && evtRisk === "MID")
    );
}

export function matchesConfidence(evt, selectedConf) {
    if (!selectedConf || selectedConf === "ALL") return true;
    const norm = selectedConf.replace(/[\u2013\u2014]/g, "-").trim();

    // Categorical string match if exact match
    const evtConfStr = String(evt.confidence || "")
        .replace(/[\u2013\u2014]/g, "-")
        .trim();
    if (evtConfStr === norm) return true;

    // Numeric percentage extraction. Satellite confidence takes priority over
    // model prediction confidence because this filter describes the sensor data.
    let num = parseFloat(evt.confidenceRaw);
    if (isNaN(num)) num = parseFloat(evtConfStr.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) num = parseFloat(evt.prediction_confidence);
    if (isNaN(num)) {
        const c = String(
            evt.confidenceRaw || evt.confidence || "",
        ).toLowerCase();
        if (c === "h" || c === "high") num = 95;
        else if (c === "n" || c === "nominal") num = 80;
        else if (c === "l" || c === "low") num = 55;
        else return false;
    }

    if (norm === ">90%") {
        return num > 90;
    }
    if (norm === "70-90%") {
        return num >= 70 && num <= 90;
    }
    if (norm === "<70%") {
        return num < 70;
    }
    return true;
}

// Event Type Classification Logic based on VIIRS FIRMS schema
export function classifyEventType(item) {
    const name = (item.name || "").toLowerCase();
    const landuse = (item.landuse || "").toLowerCase();
    const industrial = (item.industrial || "").toLowerCase();
    const power = (item.power || "").toLowerCase();

    if (
        industrial.includes("flare") ||
        name.includes("gas") ||
        name.includes("flare")
    ) {
        return "Gas Flare";
    }
    if (
        power === "plant" ||
        name.includes("power") ||
        name.includes("thermal station") ||
        industrial.includes("power")
    ) {
        return "Power Plant";
    }
    if (
        landuse === "mining" ||
        industrial.includes("mine") ||
        name.includes("coal") ||
        name.includes("mining")
    ) {
        return "Mining";
    }
    if (
        landuse === "farmland" ||
        landuse.includes("crop") ||
        landuse.includes("agri")
    ) {
        return "Agricultural";
    }
    if (
        landuse === "forest" ||
        name.includes("wildfire") ||
        name.includes("forest")
    ) {
        return "Forest";
    }
    if (
        landuse === "industrial" ||
        industrial !== "" ||
        name.includes("refinery") ||
        name.includes("plant") ||
        name.includes("factory") ||
        name.includes("complex")
    ) {
        return "Industrial";
    }
    return "Other";
}

// Compute dynamic Risk Score (0 - 100) & Severity Category
export function calculateRisk(item) {
    const frp = parseFloat(item.frp) || 0;
    const dist = parseFloat(item.dist_to_facility_m) || 30000;
    const bright = parseFloat(item.bright_ti4) || 300;
    const conf = (item.confidence || "").toLowerCase();

    let baseScore = 30;

    // FRP impact (0-40 pts)
    baseScore += Math.min(40, frp * 1.5);

    // Proximity impact (< 2000m = +20 pts, < 5000m = +10 pts)
    if (dist < 2000) baseScore += 20;
    else if (dist < 5000) baseScore += 12;
    else if (dist < 10000) baseScore += 5;

    // Brightness impact (above 330K)
    if (bright > 340) baseScore += 15;
    else if (bright > 330) baseScore += 8;

    // Confidence impact
    if (conf === "h" || conf === "high") baseScore += 10;
    else if (conf === "n" || conf === "nominal") baseScore += 5;

    const finalScore = Math.min(99, Math.max(12, Math.round(baseScore)));

    let riskCategory = "LOW";
    if (finalScore >= 75) riskCategory = "CRITICAL";
    else if (finalScore >= 50) riskCategory = "HIGH";
    else if (finalScore >= 25) riskCategory = "MEDIUM";

    return { riskScore: finalScore, risk: riskCategory };
}

// Format Confidence string
export function formatConfidence(conf) {
    if (!conf) return "70–90%";
    const c = conf.toString().toLowerCase();
    if (c === "h" || c === "high") return ">90%";
    if (c === "n" || c === "nominal") return "70–90%";
    if (c === "l" || c === "low") return "<70%";
    if (c.includes("%")) return c;
    const num = parseFloat(conf);
    if (!isNaN(num)) return `${Math.round(num)}%`;
    return "70–90%";
}

// Normalize a single raw record
export function normalizeEvent(item, index) {
    const eventType =
        item.eventType ||
        (item.predicted_class?.includes("Agricultural")
            ? "Agricultural"
            : item.predicted_class?.includes("Forest")
              ? "Forest"
              : item.predicted_class?.includes("Industrial")
                ? "Industrial"
                : classifyEventType(item));

    // Read risk_score directly from data
    const rawScore =
        item.risk_score != null && item.risk_score !== ""
            ? parseFloat(item.risk_score)
            : item.riskScore != null && item.riskScore !== ""
              ? parseFloat(item.riskScore)
              : calculateRisk(item).riskScore;
    const riskScore = parseFloat(rawScore.toFixed(1));

    // Global rule: >= 75 CRITICAL, >= 50 HIGH, >= 25 MEDIUM, else LOW
    let risk = "LOW";
    if (riskScore >= 75) risk = "CRITICAL";
    else if (riskScore >= 50) risk = "HIGH";
    else if (riskScore >= 25) risk = "MEDIUM";
    else risk = "LOW";

    const risk_level =
        item.risk_level ||
        (risk === "CRITICAL"
            ? "Critical"
            : risk === "HIGH"
              ? "High"
              : risk === "MEDIUM"
                ? "Medium"
                : "Low");

    const firmsId = item.firms_id || item.firmsId || index + 1;
    const eventId =
        item.eventId ||
        item.event_id ||
        `EVT-2026-${String(firmsId).padStart(5, "0")}`;

    const distM = parseFloat(item.dist_to_facility_m || 0);
    const distKm = parseFloat(
        item.dist_to_facility_km || (distM / 1000).toFixed(1),
    );
    const confidencePercent = formatConfidence(
        item.confidence || item.prediction_confidence,
    );

    return {
        ...item,
        id: firmsId,
        eventId,
        event_id: item.event_id || eventId,
        firmsId,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        bright_ti4: parseFloat(
            item.bright_ti4 ||
                item.max_bright_ti4 ||
                item.mean_bright_ti4 ||
                300,
        ),
        bright_ti5: parseFloat(
            item.bright_ti5 ||
                item.max_bright_ti5 ||
                item.mean_bright_ti5 ||
                270,
        ),
        frp: parseFloat(item.frp || item.max_frp || item.mean_frp || 0),
        acq_date:
            item.acq_date ||
            (item.event_start ? item.event_start.split(" ")[0] : "03-08-2026"),
        acq_time:
            item.acq_time ||
            (item.event_start
                ? item.event_start.split(" ")[1]?.slice(0, 5)
                : 1200),
        daynight: item.daynight || "D",
        satellite:
            item.satellite ||
            (item.satellite_count > 1 ? "VIIRS + MODIS" : "VIIRS (N21)"),
        instrument: item.instrument || "VIIRS",
        confidence: confidencePercent,
        confidenceRaw: item.confidence || item.mean_confidence,
        version: item.version || "2.0NRT",
        state:
            resolveIndianState({
                ...item,
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
            }) || "India",
        coordinatesText: `${parseFloat(item.latitude).toFixed(3)}° N, ${parseFloat(item.longitude).toFixed(3)}° E`,
        facilityName:
            item.facilityName ||
            (distKm <= 5.0 && item.name
                ? item.name
                : `${eventType} Cluster (${resolveIndianState(item) || 'India'} · ${parseFloat(item.latitude).toFixed(3)}°N, ${parseFloat(item.longitude).toFixed(3)}°E)`),
        location:
            item.location ||
            (distKm <= 5.0 && (item.facilityName || item.name)
                ? `${item.facilityName || item.name}, ${resolveIndianState(item) || 'India'} (${parseFloat(item.latitude).toFixed(3)}°N, ${parseFloat(item.longitude).toFixed(3)}°E)`
                : `${resolveIndianState(item) || 'India'} (${parseFloat(item.latitude).toFixed(3)}°N, ${parseFloat(item.longitude).toFixed(3)}°E)`),
        power: item.power || "",
        landuse: item.landuse || "",
        industrial: item.industrial || "",
        dist_to_facility_m: distM,
        dist_to_facility_km: distKm,
        eventType,
        predicted_class: item.predicted_class || eventType,
        prediction_confidence: parseFloat(item.prediction_confidence || 85),
        risk,
        riskScore,
        risk_score: riskScore,
        risk_level,
        status:
            item.status ||
            (risk === "CRITICAL"
                ? "CRITICAL ALERT"
                : risk === "HIGH"
                  ? "UNDER INVESTIGATION"
                  : "MONITORED"),
        persistence:
            item.persistence != null
                ? item.persistence
                : distM < 5000 ||
                  riskScore >= 75 ||
                  item.active_days > 1 ||
                  item.duration_hours > 0,
        is_live: Boolean(
            item.is_live === true ||
            (item.eventId && String(item.eventId).includes("LIVE")) ||
            item.is_early_warning ||
            item.is_flash_trigger
        ),
        is_early_warning: Boolean(item.is_early_warning),
        is_flash_trigger: Boolean(item.is_flash_trigger || item.satellite?.includes("INSAT") || item.satellite?.includes("Himawari")),
        satellite_tier: item.satellite_tier || (item.satellite?.includes("INSAT") || item.satellite?.includes("Himawari") ? "TIER1_GEO" : "TIER2_POLAR"),
        reason: item.reason || item.diagnosis || (
            distKm <= 5.0
                ? `High-temperature radiometric thermal emission (FRP: ${parseFloat(item.frp || item.max_frp || 10).toFixed(1)} MW) at ${item.facilityName || item.name || 'Industrial Complex'}.`
                : `Active ${eventType} thermal signature (FRP: ${parseFloat(item.frp || item.max_frp || 10).toFixed(1)} MW, Brightness: ${parseFloat(item.bright_ti4 || 320).toFixed(1)} K) detected in ${resolveIndianState(item) || 'India'}.`
        ),
        diagnosis: item.reason || item.diagnosis || (
            distKm <= 5.0
                ? `High-temperature radiometric thermal emission (FRP: ${parseFloat(item.frp || item.max_frp || 10).toFixed(1)} MW) at ${item.facilityName || item.name || 'Industrial Complex'}.`
                : `Active ${eventType} thermal signature (FRP: ${parseFloat(item.frp || item.max_frp || 10).toFixed(1)} MW, Brightness: ${parseFloat(item.bright_ti4 || 320).toFixed(1)} K) detected in ${resolveIndianState(item) || 'India'}.`
        ),
        z_score: parseFloat(item.z_score || 0),
        multi_satellite_confirmed: Boolean(item.multi_satellite_confirmed),
        grid_key: item.grid_key || `${parseFloat(item.latitude).toFixed(2)}_${parseFloat(item.longitude).toFixed(2)}`,
        class_probabilities: item.class_probabilities || null,
        key_signals: item.key_signals || null,
        dist_power_plant_km: item.dist_power_plant_km != null ? parseFloat(item.dist_power_plant_km) : null,
        dist_industrial_zone_km: item.dist_industrial_zone_km != null ? parseFloat(item.dist_industrial_zone_km) : null,
        dist_quarry_km: item.dist_quarry_km != null ? parseFloat(item.dist_quarry_km) : null,
        dist_brick_kiln_km: item.dist_brick_kiln_km != null ? parseFloat(item.dist_brick_kiln_km) : null,
        dist_oil_gas_km: item.dist_oil_gas_km != null ? parseFloat(item.dist_oil_gas_km) : null,
        landcover_class: item.landcover_class || null,
        ndvi_proxy: item.ndvi_proxy != null ? parseFloat(item.ndvi_proxy) : null,
        ndbi_proxy: item.ndbi_proxy != null ? parseFloat(item.ndbi_proxy) : null,
        landcover_probabilities: item.landcover_probabilities || null,
        systemIndex: item["system:index"] || `idx_${index}`,
        b1: parseFloat(item.b1 || 0),
    };
}

// Load Full Dataset (30-Day Historical Baseline + Live Active Real Detections)
export async function loadEventsData() {
    if (cachedEvents) return cachedEvents;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
        let baselineList = [];
        let liveList = [];

        // 1. Fetch 30-Day Baseline Dataset
        try {
            const res = await fetch(`${API_BASE_URL}/api/events/30days?limit=2000`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.events) && data.events.length > 0) {
                    baselineList = data.events.map((item, idx) => ({
                        ...normalizeEvent(item, idx),
                        is_live: false
                    }));
                }
            }
        } catch (e) {
            console.log("ℹ️ Backend 30-day baseline API offline or unreachable, using local dataset fallback.", e.message);
        }

        // Fallback to /data/events.json if baseline not fetched from API
        if (baselineList.length === 0) {
            try {
                const response = await fetch("/data/events.json");
                if (response.ok) {
                    const rawJson = await response.json();
                    baselineList = rawJson.map((item, idx) => ({
                        ...normalizeEvent(item, idx),
                        is_live: false
                    }));
                }
            } catch (e) {
                console.warn("JSON fallback fetch failed:", e.message);
            }
        }

        // 2. Fetch Active Live Real Satellite Stream (from NASA FIRMS)
        try {
            const liveRes = await fetch(`${API_BASE_URL}/api/events/live?limit=500`);
            if (liveRes.ok) {
                const liveData = await liveRes.json();
                if (liveData.success && Array.isArray(liveData.events)) {
                    liveList = liveData.events.map((item, idx) => ({
                        ...normalizeEvent(item, idx),
                        is_live: true
                    }));
                }
            }
        } catch (e) {
            console.log("ℹ️ Live API unreachable, live list starts clean.", e.message);
        }

        // Combine live real detections at the head + baseline dataset
        cachedEvents = [...liveList, ...baselineList];
        return cachedEvents;
    })();

    return fetchPromise;
}

// Trigger Manual Immediate Re-sync from Satellite Ingestion API
export async function triggerLiveSync() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/sync-live`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.events)) {
                const normalizedLive = data.events.map((e, idx) => ({ ...normalizeEvent(e, idx), is_live: true }));
                // Update memory cache
                const baseline = (cachedEvents || []).filter(e => !isEventLive(e));
                cachedEvents = [...normalizedLive, ...baseline];
                return { success: true, count: normalizedLive.length, events: cachedEvents };
            }
        }
    } catch (err) {
        console.warn('Manual live sync notice:', err.message);
    }
    return { success: false, events: cachedEvents || [] };
}

// Live WebSocket Stream Subscriber
export function subscribeToLiveStream(onNewEvent, onAlert) {
    if (typeof window === "undefined") return () => {};

    let ws = null;
    let reconnectTimeout = null;
    let isSubscribed = true;

    function connect() {
        if (!isSubscribed) return;
        try {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log("🛰️ Live Multi-Satellite Stream Connected (INSAT-3DR + Himawari-9 + VIIRS)");
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === "NEW_THERMAL_EVENT" && message.data) {
                        const normalized = normalizeEvent(message.data, 0);

                        // Prepend to memory cache
                        if (cachedEvents) {
                            cachedEvents = [normalized, ...cachedEvents.filter(e => e.eventId !== normalized.eventId)];
                        }

                        if (onNewEvent) onNewEvent(normalized);
                        if (onAlert && (normalized.risk === "CRITICAL" || normalized.risk === "HIGH" || normalized.is_early_warning)) {
                            onAlert(normalized);
                        }
                    }
                } catch (err) {
                    console.error("Error parsing live stream message:", err);
                }
            };

            ws.onclose = () => {
                if (isSubscribed) {
                    reconnectTimeout = setTimeout(connect, 4000);
                }
            };

            ws.onerror = () => {
                ws?.close();
            };
        } catch (err) {
            if (isSubscribed) {
                reconnectTimeout = setTimeout(connect, 4000);
            }
        }
    }

    connect();

    return () => {
        isSubscribed = false;
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (ws) ws.close();
    };
}

// Get all events synchronously if cached or trigger load
export function getEventsSync() {
    return cachedEvents || [];
}

// Get Priority Events (sorted by risk score)
export function getPriorityEvents(events, limit = 5) {
    if (!events || events.length === 0) return [];
    return [...events]
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit);
}

// Get Industrial Facilities Summary
export function getIndustrialFacilities(events) {
    if (!events || events.length === 0) return [];
    const facilityMap = new Map();

    events.forEach((evt) => {
        const key = evt.facilityName || `${evt.state} ${evt.eventType} Complex`;
        if (!facilityMap.has(key)) {
            facilityMap.set(key, {
                facility: key,
                type: evt.eventType,
                state: evt.state,
                eventsCount: 0,
                highestRiskScore: 0,
                highestRisk: "LOW",
                persistent: false,
                lastActivity: evt.acq_date,
                lat: evt.latitude,
                lng: evt.longitude,
            });
        }

        const fac = facilityMap.get(key);
        fac.eventsCount += 1;
        if (evt.riskScore > fac.highestRiskScore) {
            fac.highestRiskScore = evt.riskScore;
            fac.highestRisk = evt.risk;
        }
        if (evt.persistence) fac.persistent = true;
    });

    return Array.from(facilityMap.values()).sort(
        (a, b) => b.highestRiskScore - a.highestRiskScore,
    );
}

// Get Persistent Thermal Sources
export function getPersistentSources(events) {
    if (!events || events.length === 0) return [];
    const sourceMap = new Map();

    events.forEach((evt) => {
        if (!evt.persistence) return;
        const key = evt.facilityName || `${evt.state} Thermal Source`;

        if (!sourceMap.has(key)) {
            sourceMap.set(key, {
                facility: key,
                eventType: evt.eventType,
                state: evt.state,
                durationDays: Math.floor(7 + Math.random() * 85),
                avgPower: evt.frp,
                peakPower: evt.frp,
                totalFRP: evt.frp,
                count: 1,
                severity: evt.risk,
                status: "CONTINUOUS_MONITORING",
            });
        } else {
            const src = sourceMap.get(key);
            src.count += 1;
            src.totalFRP += evt.frp;
            src.avgPower = parseFloat((src.totalFRP / src.count).toFixed(2));
            if (evt.frp > src.peakPower) src.peakPower = evt.frp;
            if (evt.risk === "CRITICAL" || src.severity === "CRITICAL")
                src.severity = "CRITICAL";
        }
    });

    return Array.from(sourceMap.values()).sort(
        (a, b) => b.peakPower - a.peakPower,
    );
}

// Helper to test if an event is live / real-time
export function isEventLive(evt) {
    if (!evt) return false;
    if (evt.is_live === true || evt.is_flash_trigger || evt.is_early_warning) return true;
    const evtId = String(evt.eventId || evt.event_id || evt.id || '');
    if (evtId.includes('LIVE')) return true;
    const dateStr = String(evt.acq_date || '');
    if (dateStr === '2026-09-24' || dateStr === new Date().toISOString().split('T')[0]) return true;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const diffHours = (Date.now() - d.getTime()) / (1000 * 3600);
      if (diffHours >= 0 && diffHours <= 48) return true;
    }
    return false;
}

// Get Real-Time Alerts & Early Warnings (1-to-1 with Live Map Detections)
export function getAlerts(events) {
    if (!events || events.length === 0) return [];

    const rawAlerts = events
        .filter((evt) =>
            isEventLive(evt) ||
            evt.risk === "CRITICAL" ||
            evt.risk === "HIGH" ||
            evt.is_early_warning ||
            evt.is_flash_trigger ||
            evt.satellite?.includes("INSAT") ||
            evt.satellite?.includes("Himawari")
        );

    return rawAlerts.map((evt) => {
        const lat = parseFloat(evt.latitude);
        const lon = parseFloat(evt.longitude);
        const isLive = isEventLive(evt);
        return {
            id: evt.id || evt.eventId,
            eventId: evt.eventId,
            eventType: evt.eventType || evt.predicted_class || 'Industrial',
            location: evt.location || `${evt.state || resolveIndianState(evt) || 'India'} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`,
            facilityName: evt.facilityName || `${evt.state || 'India'} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`,
            state: evt.state || resolveIndianState(evt) || 'India',
            latitude: lat,
            longitude: lon,
            coordinatesText: `${lat.toFixed(3)}° N, ${lon.toFixed(3)}° E`,
            date: evt.acq_date,
            time: evt.acq_time,
            risk: evt.risk || "MEDIUM",
            riskScore: evt.riskScore || 50,
            confidence: evt.confidence || "nominal",
            frp: evt.frp || 10,
            reason: evt.reason || evt.diagnosis || `Radiometric thermal anomaly (FRP: ${evt.frp} MW) detected via ${evt.satellite || 'satellite'}.`,
            diagnosis: evt.diagnosis || evt.reason || `Radiometric thermal anomaly (FRP: ${evt.frp} MW) detected via ${evt.satellite || 'satellite'}.`,
            status: evt.status || (isLive ? 'LIVE DETECTED' : 'MONITORED'),
            is_live: isLive,
            is_early_warning: Boolean(evt.is_early_warning || evt.is_flash_trigger || evt.satellite?.includes("INSAT") || evt.satellite?.includes("Himawari")),
            is_flash_trigger: Boolean(evt.is_flash_trigger || evt.satellite?.includes("INSAT") || evt.satellite?.includes("Himawari")),
            satellite: evt.satellite || "VIIRS (NOAA-21)"
        };
    }).sort((a, b) => {
        const aLive = a.is_live ? 200 : 0;
        const bLive = b.is_live ? 200 : 0;
        const aEarly = a.is_early_warning ? 100 : 0;
        const bEarly = b.is_early_warning ? 100 : 0;
        return (bLive + bEarly + (b.riskScore || 0)) - (aLive + aEarly + (a.riskScore || 0));
    });
}
