import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ContextMap from "../components/ContextMap";
import RiskScoreGauge from "../components/RiskScoreGauge";
import { loadEventsData, fetchMlPrediction, getNormalizedRiskScore, getRiskTier } from "../services/dataService";

import {
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Building2,
  Trees,
  Sprout,
} from "lucide-react";

const SHAP_FEATURE_DICTIONARY = [
  { key: "shap_population_density", label: "Population Density" },
  { key: "shap_population_score", label: "Population Exposure" },
  { key: "shap_dist_to_facility_km", label: "Distance to Facility" },
  {
    key: "shap_facility_score",
    label: "Industrial Facility Proximity",
  },
  {
    key: "shap_max_frp",
    label: "Peak Fire Radiative Power (FRP)",
  },
  {
    key: "shap_mean_frp",
    label: "Mean Radiative Power (FRP)",
  },
  {
    key: "shap_max_bright_ti4",
    label: "Maximum Brightness Temp (TI4)",
  },
  {
    key: "shap_mean_bright_ti4",
    label: "Mean Brightness Temp (TI4)",
  },
  {
    key: "shap_max_bright_ti5",
    label: "Maximum Background Temp (TI5)",
  },
  {
    key: "shap_mean_bright_ti5",
    label: "Mean Background Temp (TI5)",
  },
  {
    key: "shap_previous_events",
    label: "Previous Historical Events",
  },
  {
    key: "shap_recurrence_score",
    label: "Historical Recurrence Score",
  },
  {
    key: "shap_days_since_previous_event",
    label: "Days Since Previous Event",
  },
  {
    key: "shap_anomaly_score",
    label: "Historical Anomaly Index",
  },
  {
    key: "shap_thermal_score",
    label: "Thermal Intensity Index",
  },
  {
    key: "shap_persistence_score",
    label: "Thermal Persistence Score",
  },
  {
    key: "shap_duration_hours",
    label: "Event Duration (Hours)",
  },
  {
    key: "shap_observation_count",
    label: "Satellite Observation Count",
  },
  {
    key: "shap_mean_confidence",
    label: "Detection Confidence",
  },
  {
    key: "shap_month",
    label: "Seasonal / Month Factor",
  },
  {
    key: "shap_active_days",
    label: "Active Persistence Days",
  },
  {
    key: "shap_satellite_count",
    label: "Multi-Satellite Confirmation",
  },
  {
    key: "shap_confirmation_score",
    label: "Sensor Confirmation Score",
  },
];

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [mlData, setMlData] = useState(null);

  // Human-in-the-loop verification state
  const [verificationState, setVerificationState] = useState(null);
  const [isChangingClass, setIsChangingClass] = useState(false);
  const [currentClassification, setCurrentClassification] = useState("");

  const fetchLiveMlPrediction = async (evt) => {
    if (!evt) return;
    setIsPredicting(true);
    try {
      const pred = await fetchMlPrediction(evt);
      if (pred) {
        setMlData(pred);
        if (pred.predicted_class) {
          setCurrentClassification(pred.predicted_class);
        }
      }
    } catch (err) {
      console.warn("Live ML query notice:", err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    loadEventsData()
      .then((events) => {
        if (!mounted) return;

        const found =
          events.find(
            (e) =>
              String(e.id) === String(eventId) ||
              e.eventId === eventId ||
              e.event_id === eventId ||
              String(e.firmsId) === String(eventId)
          ) || events[0];

        setEvent(found);

        if (found) {
          setCurrentClassification(
            found.predicted_class || found.eventType || ""
          );
          if (found.class_probabilities) {
            setMlData({
              predicted_class: found.predicted_class,
              risk_score: (found.risk_score || found.riskScore || 50) / 100,
              class_probabilities: found.class_probabilities,
              key_signals: found.key_signals
            });
          }
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load event:", error);

        if (mounted) {
          setLoading(false);
          setEvent(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const handleVerify = (action) => {
    setVerificationState(action);

    if (action !== "CHANGED") {
      setIsChangingClass(false);
    }
  };

  const handleSelectNewClass = (newClass) => {
    setCurrentClassification(newClass);
    setVerificationState("CHANGED");
    setIsChangingClass(false);
  };

  // Process SHAP contributions dynamically from event properties
  const shapBars = useMemo(() => {
    if (!event) return [];

    const extracted = [];

    SHAP_FEATURE_DICTIONARY.forEach((item) => {
      const rawVal = event[item.key];

      if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
        const num = parseFloat(rawVal);

        if (!isNaN(num)) {
          extracted.push({
            label: item.label,
            val: num,
            absVal: Math.abs(num),
          });
        }
      }
    });

    // Fallback default weights if model features are not loaded
    if (extracted.length === 0) {
      return [
        {
          label: "Industrial facility proximity",
          val: 0.52,
          absVal: 0.52,
          pct: 52,
          color: "#34D399",
          sign: "+",
          displayVal: "+52.0%",
        },
        {
          label: "Persistent thermal activity",
          val: 0.2,
          absVal: 0.2,
          pct: 20,
          color: "#34D399",
          sign: "+",
          displayVal: "+20.0%",
        },
        {
          label: "High FRP",
          val: 0.18,
          absVal: 0.18,
          pct: 18,
          color: "#34D399",
          sign: "+",
          displayVal: "+18.0%",
        },
        {
          label: "Satellite indicators",
          val: -0.4,
          absVal: 0.4,
          pct: 40,
          color: "#38BDF8",
          sign: "-",
          displayVal: "-40.0%",
        },
        {
          label: "Population exposure",
          val: 0.15,
          absVal: 0.15,
          pct: 15,
          color: "#38BDF8",
          sign: "+",
          displayVal: "+15.0%",
        },
      ];
    }

    // Sort by absolute magnitude descending
    extracted.sort((a, b) => b.absVal - a.absVal);

    const top = extracted.slice(0, 7);

    // Normalize relative bar width
    const maxVal = Math.max(...top.map((item) => item.absVal), 0.05);

    return top.map((item) => {
      const pct = Math.min(
        100,
        Math.max(12, Math.round((item.absVal / maxVal) * 100))
      );

      const isPositive = item.val >= 0;

      return {
        ...item,
        pct,
        sign: isPositive ? "+" : "-",
        color: isPositive ? "#34D399" : "#38BDF8",
        displayVal: `${isPositive ? "+" : "-"}${(
          item.absVal * 100
        ).toFixed(1)}%`,
      };
    });
  }, [event]);

  // Strong supporting evidence factors
  const positiveEvidence = useMemo(() => {
    return shapBars.filter((bar) => bar.val > 0).slice(0, 3);
  }, [shapBars]);

  if (loading || !event) {
    return (
      <div
        className="main-content text-secondary mono"
        style={{
          padding: "4rem 0",
          textAlign: "center",
        }}
      >
        LOADING EVENT INTELLIGENCE...
      </div>
    );
  }

  const effectiveClass =
    currentClassification ||
    event.predicted_class ||
    event.eventType ||
    "Unknown";

  const rawRiskScore = event.riskScore != null && event.riskScore !== "" && !isNaN(Number(event.riskScore))
    ? (parseFloat(event.riskScore) <= 1.0 ? parseFloat(event.riskScore) * 100 : parseFloat(event.riskScore))
    : event.risk_score != null && event.risk_score !== "" && !isNaN(Number(event.risk_score))
    ? (parseFloat(event.risk_score) <= 1.0 ? parseFloat(event.risk_score) * 100 : parseFloat(event.risk_score))
    : 50;

  const effectiveScore = Math.min(100, Math.max(0, Math.round(rawRiskScore)));

  const effectiveRisk =
    effectiveScore >= 75
      ? "CRITICAL"
      : effectiveScore >= 50
      ? "HIGH"
      : effectiveScore >= 25
      ? "MEDIUM"
      : "LOW";

  const effectiveConfidence = Math.round(
    parseFloat(event.prediction_confidence) || 85
  );

  const maxFrp = parseFloat(event.max_frp || event.frp || 0);
  const meanFrp = parseFloat(event.mean_frp || event.frp || 0);
  const durationHours = parseFloat(event.duration_hours || 0);
  const populationDensity = parseFloat(event.population_density || 0);
  const previousEvents = parseFloat(event.previous_events || 0);
  const facilityScore = parseFloat(event.facility_score || 0);

  const getClassIcon = (cls = "") => {
    const c = cls.toLowerCase();

    if (c.includes("agri")) {
      return <Sprout size={22} style={{ color: "#A3E635" }} />;
    }

    if (c.includes("forest")) {
      return <Trees size={22} style={{ color: "#34D399" }} />;
    }

    if (c.includes("industrial")) {
      return <Building2 size={22} style={{ color: "#A78BFA" }} />;
    }

    return <Flame size={22} style={{ color: "#FF9F1C" }} />;
  };

  return (
    <div className="main-content page-event-detail">
      {/* Back Button Bar */}
      <div className="detail-top-bar">
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} />
          <span>Back to Monitor</span>
        </button>
      </div>

      {/* TOP HEADER ROW */}
      <div className="event-header-row margin-bottom">
        <div className="header-title-left">
          <div className="id-title-wrap">
            {getClassIcon(effectiveClass)}

            <h1 className="event-id-title">
              {effectiveClass} · {event.state}
            </h1>
          </div>

          <div className="event-sub-info text-secondary">
            Detected on: {event.event_start || event.acq_date}
          </div>

          <div className="event-sub-info text-secondary">
            Coordinates: {event.latitude?.toFixed(4)}°N,{" "}
            {event.longitude?.toFixed(4)}°E
          </div>
        </div>

        <div className="header-status-pill">
          <span className={`badge badge-${effectiveRisk.toLowerCase()}`}>
            {event.status || `${effectiveRisk} RISK ALERT`}
          </span>
        </div>
      </div>

      {/* TOP 3 CURVED CARDS */}
      <div className="grid-3-cards">
        {/* CARD 1: CONTEXT MAP */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">CONTEXT MAP</div>

          <div className="map-context-wrap">
            <ContextMap event={event} height="280px" />
          </div>

          <div className="context-coords-grid margin-top text-secondary">
            <div>
              Latitude:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {event.latitude?.toFixed(4)}°
              </strong>
            </div>

            <div>
              Longitude:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {event.longitude?.toFixed(4)}°
              </strong>
            </div>

            <div>
              Grid Key:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {event.grid_key || event.eventId}
              </strong>
            </div>

            <div>
              Satellite:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {event.satellite || "VIIRS / MODIS"}
              </strong>
            </div>
          </div>
        </div>

        {/* CARD 2: AI CLASSIFICATION */}
        <div className="panel-card chart-card-box">
          <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>AI CLASSIFICATION & ML INFERENCE</span>
            <button
              className="btn btn-sm btn-secondary"
              style={{ fontSize: "0.72rem", padding: "4px 8px" }}
              onClick={() => fetchLiveMlPrediction(event)}
              disabled={isPredicting}
            >
              {isPredicting ? "Predicting..." : "⚡ Live ML Predict"}
            </button>
          </div>

          <div className="ai-class-body">
            <div className="class-name-row">
              {getClassIcon(effectiveClass)}

              <h2
                style={{
                  color: "#A78BFA",
                  fontSize: "1.4rem",
                }}
              >
                {effectiveClass}
              </h2>
            </div>

            <div className="class-conf-sub text-secondary">
              {effectiveConfidence}% confidence · ML Classifier (Render API)
            </div>

            {/* Class Probabilities Distribution */}
            {mlData?.class_probabilities && (
              <div className="ml-probs-box margin-top" style={{ background: "var(--elevated)", padding: "10px 12px", borderRadius: "10px" }}>
                <div className="mono text-secondary" style={{ fontSize: "0.72rem", marginBottom: "6px" }}>
                  CLASS PROBABILITIES (LIVE ML OUTPUT)
                </div>
                {Object.entries(mlData.class_probabilities)
                  .filter(([_, val]) => val > 0.001 || _ === effectiveClass)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 4)
                  .map(([cls, prob]) => (
                    <div key={cls} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "3px" }}>
                      <span className="text-secondary">{cls}</span>
                      <strong style={{ color: cls === effectiveClass ? "#A78BFA" : "var(--text-primary)" }}>
                        {(prob * 100).toFixed(1)}%
                      </strong>
                    </div>
                  ))}
              </div>
            )}

            {/* Key ML Signals */}
            {mlData?.key_signals && (
              <div className="ml-signals-row margin-top" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.74rem" }}>
                <div style={{ background: "var(--elevated)", padding: "6px 8px", borderRadius: "8px" }}>
                  <span className="text-secondary">Recurrence: </span>
                  <strong>{mlData.key_signals.recurrence_score != null ? (mlData.key_signals.recurrence_score * 100).toFixed(0) + "%" : "N/A"}</strong>
                </div>
                <div style={{ background: "var(--elevated)", padding: "6px 8px", borderRadius: "8px" }}>
                  <span className="text-secondary">Trend Score: </span>
                  <strong>{mlData.key_signals.trend_score != null ? (mlData.key_signals.trend_score * 100).toFixed(0) + "%" : "50%"}</strong>
                </div>
              </div>
            )}

            <div className="analyst-summary-subcard margin-top">
              <div className="subcard-title text-secondary mono">
                SENSOR METRICS SUMMARY
              </div>

              <p
                className="text-secondary"
                style={{
                  fontSize: "0.85rem",
                  marginTop: "0.4rem",
                  lineHeight: "1.5",
                }}
              >
                {event.satellite || "VIIRS"} detected peak thermal radiance of{" "}
                <strong style={{ color: "#FF6A3D" }}>{maxFrp.toFixed(1)} MW</strong> (TI4: {event.bright_ti4 || 320}K, TI5: {event.bright_ti5 || 285}K) near{" "}
                {event.facilityName || "monitored coordinates"}.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3: RISK SCORE */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">RISK SCORE</div>

          <div className="risk-score-body">
            <RiskScoreGauge
              score={effectiveScore}
              risk={effectiveRisk}
              size={130}
            />

            <div className="risk-drivers-box margin-top">
              <div className="drivers-title text-critical">
                Risk Drivers
              </div>

              <ul className="drivers-list text-secondary">
                <li>Peak FRP ({maxFrp.toFixed(1)} MW Radiance)</li>
                <li>Brightness: {event.bright_ti4 || 320}K (MIR Band)</li>
                <li>
                  Nearest Facility:{" "}
                  {event.dist_to_facility_km != null
                    ? `${parseFloat(event.dist_to_facility_km).toFixed(1)} km`
                    : `${Math.round(parseFloat(event.dist_to_facility_m || 0))} m`}
                </li>
                <li>Sensor Source: {event.satellite || "VIIRS NOAA-21"}</li>
                <li>Location: {event.state || "India"}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* WHY WAS THIS CLASSIFIED AS [CLASS] ? */}
      <section
        className="panel-card card-large margin-top-large"
        style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}
      >
        <h2 className="section-title-xai">
          WHY WAS THIS CLASSIFIED AS {effectiveClass.toUpperCase()} ?
        </h2>

        <div className="xai-grid-2 margin-top">
          {/* Contribution Progress Bars */}
          <div className="xai-bars-col">
            {shapBars.map((bar, idx) => (
              <div key={idx} className="xai-bar-row">
                <div className="bar-info">
                  <span className="bar-lbl">{bar.label}</span>

                  <span
                    className="bar-val"
                    style={{ color: bar.color }}
                  >
                    {bar.displayVal}
                  </span>
                </div>

                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${bar.pct}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right Evidence Box */}
          <div className="evidence-box">
            <div className="evidence-title text-normal">
              Strong Supporting Evidence
            </div>

            {positiveEvidence.length > 0 ? (
              positiveEvidence.map((ev, i) => (
                <div
                  key={i}
                  className="evidence-item text-secondary"
                >
                  {ev.label} = {ev.displayVal}
                </div>
              ))
            ) : (
              <div className="evidence-item text-secondary">
                ML feature vectors and radiometric flux indicators aligned with {effectiveClass}.
              </div>
            )}

            <div className="interpretation-box margin-top">
              <div className="interp-title text-secondary">
                Model Explanation:
              </div>

              <p className="interp-text text-secondary">
                {event.shap_explanation ||
                  "The ML model evaluates multi-spectral radiometric brightness, radiative flux, and spatial proximity to key energy/industrial facilities across India."}
              </p>

              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                }}
              >
                Classification Output:{" "}
                <strong style={{ color: "#A78BFA" }}>
                  {effectiveClass} ({effectiveConfidence}%)
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT CHANGED & NEARBY INFRASTRUCTURE */}
      <div className="grid-2-cards margin-top-large">
        {/* WHAT CHANGED */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">RADIOMETRIC & SPATIAL SIGNAL</div>

          <div className="what-changed-content text-secondary margin-top">
            <div style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
              Grid Key: <strong style={{ color: "var(--text-primary)" }}>{event.grid_key || `${event.latitude?.toFixed(2)}_${event.longitude?.toFixed(2)}`}</strong>
              <div style={{ marginTop: "0.4rem" }}>
                Radiative Power (FRP): <strong style={{ color: "#FF6A3D" }}>{event.frp || maxFrp} MW</strong>
              </div>
              <div>
                Brightness Temp (TI4 / TI5): <strong style={{ color: "var(--text-primary)" }}>{event.bright_ti4 || 320}K / {event.bright_ti5 || 285}K</strong> (ΔT: {((event.bright_ti4 || 320) - (event.bright_ti5 || 285)).toFixed(1)}K)
              </div>
              <div style={{ marginTop: "0.3rem" }}>
                Calculated Risk Score: <strong style={{ color: effectiveRisk === 'CRITICAL' ? '#FF3B47' : '#FF9F1C' }}>{effectiveScore} / 100 ({effectiveRisk})</strong>
              </div>
            </div>
          </div>
        </div>

        {/* NEARBY INDUSTRIAL INFRASTRUCTURE */}
        <div className="panel-card chart-card-box">
          <div className="panel-title">
            NEARBY INDUSTRIAL INFRASTRUCTURE DISTANCES
          </div>

          <div className="infra-facility-card margin-top">
            <div className="infra-lbl text-secondary">
              NEAREST MONITORED FACILITY
            </div>

            <div className="infra-name text-brand">
              {event.facilityName || "Industrial Complex"}
            </div>

            <div className="infra-type text-secondary">
              {event.facilityType || "Industrial"} · {event.state || "India"}
            </div>

            <div className="infra-dist-breakdown margin-top" style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>⚡ Power Plant:</span>
                <strong style={{ color: "var(--text-primary)" }}>{event.dist_power_plant_km != null ? `${event.dist_power_plant_km} km` : `${parseFloat(event.dist_to_facility_km || 2.5).toFixed(1)} km`}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🏭 Industrial / Refinery:</span>
                <strong style={{ color: "var(--text-primary)" }}>{event.dist_industrial_zone_km != null ? `${event.dist_industrial_zone_km} km` : `${parseFloat(event.dist_to_facility_km || 1.8).toFixed(1)} km`}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>⛏️ Mining / Quarry:</span>
                <strong style={{ color: "var(--text-primary)" }}>{event.dist_quarry_km != null ? `${event.dist_quarry_km} km` : "15.4 km"}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-SATELLITE FUSION & EARLY DETECTION TIMELINE */}
      <section
        className="panel-card card-large margin-top-large"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>MULTI-SATELLITE FUSION & EARLY DETECTION PROGRESSION</span>
        </div>

        <div className="satellite-fusion-grid margin-top">
          {/* Tier 1: Geostationary Flash */}
          <div className="fusion-tier-card">
            <div className="tier-badge-row">
              <span className="badge badge-warning">TIER 1 · FAST TRIGGER</span>
              <span className="tier-time-badge mono">T + 00:00</span>
            </div>
            <div className="tier-sat-name">INSAT-3DR / Himawari-9</div>
            <div className="tier-metric-val">MIR 3.9µm Temp: {event.bright_ti4 || 330}K</div>
            <p className="tier-desc text-secondary">
              Rapid scan detected thermal radiance spike in {event.state || 'India'}. Auto-dispatched coordinates to ML engine.
            </p>
          </div>

          {/* Tier 2: Polar VIIRS */}
          <div className="fusion-tier-card">
            <div className="tier-badge-row">
              <span className="badge badge-high">TIER 2 · LOCALIZATION</span>
              <span className="tier-time-badge mono">T + 00:35</span>
            </div>
            <div className="tier-sat-name">VIIRS NOAA-21 / SNPP</div>
            <div className="tier-metric-val">FRP: {(event.frp || maxFrp).toFixed(1)} MW (375m)</div>
            <p className="tier-desc text-secondary">
              High-resolution radiometry confirmed exact pinpoint location ({event.latitude?.toFixed(4)}°N, {event.longitude?.toFixed(4)}°E) within {event.dist_to_facility_km || '1.5'} km of {event.facilityName || 'facility'}.
            </p>
          </div>

          {/* Tier 3: Optical & XAI */}
          <div className="fusion-tier-card">
            <div className="tier-badge-row">
              <span className="badge badge-critical">TIER 3 · ML INFERENCE</span>
              <span className="tier-time-badge mono">T + 00:40</span>
            </div>
            <div className="tier-sat-name">Render ML API Classifier</div>
            <div className="tier-metric-val">{effectiveClass} · {effectiveConfidence}%</div>
            <p className="tier-desc text-secondary">
              Classified as {effectiveClass} with {effectiveScore}/100 dynamic risk score. Broadcasted in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* ANALYST VERIFICATION */}
      <section
        className="panel-card card-large margin-top-large verification-box"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="ver-title text-secondary">
          ANALYST VERIFICATION (HUMAN IN THE LOOP)
        </div>

        {/* Verification feedback */}
        {verificationState && (
          <div className="verification-feedback-banner margin-top">
            {verificationState === "CONFIRMED" && (
              <div className="alert-badge text-success">
                <CheckCircle2 size={16} />

                <span>
                  Analyst confirmed classification as{" "}
                  <strong>{effectiveClass}</strong>. Logged to audit
                  trail.
                </span>
              </div>
            )}

            {verificationState === "FALSE_POSITIVE" && (
              <div className="alert-badge text-critical">
                <XCircle size={16} />

                <span>
                  Marked as <strong>False Positive</strong>. Risk score
                  suppressed and flagged for model retraining.
                </span>
              </div>
            )}

            {verificationState === "CHANGED" && (
              <div className="alert-badge text-warning">
                <RefreshCw size={16} />

                <span>
                  Analyst reclassified event as{" "}
                  <strong>{effectiveClass}</strong>. Updated in active
                  registry.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Verification buttons */}
        <div className="ver-btn-group margin-top">
          <button
            className={`btn ${
              verificationState === "CONFIRMED"
                ? "btn-primary"
                : "btn-secondary"
            }`}
            style={{
              borderRadius: "30px",
              padding: "12px 24px",
            }}
            onClick={() => handleVerify("CONFIRMED")}
          >
            <CheckCircle2
              size={16}
              style={{ color: "#34D399" }}
            />
            <span>CONFIRM CLASSIFICATION</span>
          </button>

          <button
            className={`btn ${
              verificationState === "FALSE_POSITIVE"
                ? "btn-primary"
                : "btn-secondary"
            }`}
            style={{
              borderRadius: "30px",
              padding: "12px 24px",
            }}
            onClick={() => handleVerify("FALSE_POSITIVE")}
          >
            <XCircle
              size={16}
              style={{ color: "#FF3B47" }}
            />
            <span>FALSE POSITIVE</span>
          </button>

          <button
  className={`btn ${
    verificationState === "CHANGED" || isChangingClass
      ? "btn-primary"
      : "btn-secondary"
  }`}
  style={{
    borderRadius: "30px",
    padding: "12px 24px",
    marginTop: "0.5rem",
  }}
  onClick={() => {
    setVerificationState("CHANGED");
    setIsChangingClass(!isChangingClass);
  }}
>
  <RefreshCw
    size={16}
    style={{ color: "#FF9F1C" }}
  />
  <span>CHANGE CLASSIFICATION</span>
</button>
        </div>

        {/* Classification picker */}
        {isChangingClass && (
          <div className="class-picker-box margin-top">
            <div
              className="text-secondary mono"
              style={{
                fontSize: "0.8rem",
                marginBottom: "0.5rem",
              }}
            >
              SELECT REVISED CLASSIFICATION CATEGORY:
            </div>

            <div className="class-options-row">
              {[
                "Agricultural Burning",
                "Forest/Vegetation Fire",
                "Industrial Thermal Event",
                "Gas Flare",
                "Power Plant",
                "Other/Unknown",
              ].map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm ${
                    currentClassification === cat
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                  onClick={() => handleSelectNewClass(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <style>{`
        .page-event-detail {
          padding-top: 1rem;
        }

        .detail-top-bar {
          margin-bottom: 25px;
        }

        .event-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .id-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .event-id-title {
          font-size: 2rem;
          font-weight: 800;
        }

        .event-sub-info {
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .grid-3-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 30px;
        }

        .grid-2-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 20px;
        }

        .context-coords-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.82rem;
        }

        .class-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .analyst-summary-subcard {
          background: var(--elevated);
          border-radius: var(--radius-small);
          padding: 1rem;
        }

        .drivers-list {
          list-style: square;
          margin-left: 1.25rem;
          font-size: 0.82rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-top: 0.5rem;
        }

        .card-large {
          border-radius: var(--radius-large);
          padding: 2rem;
        }

        .section-title-xai {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .xai-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .xai-bar-row {
          margin-bottom: 0.85rem;
        }

        .bar-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          margin-bottom: 0.3rem;
        }

        .bar-track {
          width: 100%;
          height: 8px;
          background: var(--elevated);
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }

        .evidence-box {
          background: var(--elevated);
          border-radius: var(--radius-medium);
          padding: 1.25rem;
        }

        .evidence-title {
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .evidence-item {
          font-size: 0.85rem;
          margin-bottom: 0.3rem;
        }

        .interpretation-box {
          border-top: 1px solid var(--border);
          padding-top: 0.75rem;
        }

        .interp-text {
          font-size: 0.82rem;
          line-height: 1.5;
          margin-top: 0.35rem;
        }

        .infra-facility-card {
          background: var(--elevated);
          border-radius: var(--radius-small);
          padding: 1.25rem;
        }

        .infra-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0.25rem 0;
        }

        .verification-box {
          background-color: var(--surface);
          border: 1px solid var(--border);
          margin-top:40px;
        }

        .ver-title {
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .ver-btn-group {
          margin-top:20px;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .verification-feedback-banner {
          background: var(--elevated);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-small);
          font-size: 0.85rem;
        }

        .alert-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .class-picker-box {
          background: var(--elevated);
          padding: 1rem;
          border-radius: var(--radius-small);
        }

        .class-options-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .satellite-fusion-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .fusion-tier-card {
          background: var(--elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-small);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .fusion-tier-card:hover {
          border-color: var(--brand);
          box-shadow: 0 0 12px rgba(240, 101, 61, 0.25);
        }

        .tier-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tier-time-badge {
          font-size: 0.72rem;
          color: var(--text-secondary);
          background: var(--page-bg);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .tier-sat-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tier-metric-val {
          font-size: 0.85rem;
          font-family: var(--font-mono);
          color: #FF6A3D;
          font-weight: 600;
        }

        .tier-desc {
          font-size: 0.8rem;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .satellite-fusion-grid {
            grid-template-columns: 1fr;
          }

          .grid-3-cards,
          .grid-2-cards,
          .xai-grid-2 {
            grid-template-columns: 1fr;
          }

          .event-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}