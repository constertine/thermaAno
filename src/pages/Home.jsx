import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlobeHero from "../components/GlobeHero";
import ThermalMap from "../components/ThermalMap";
import {
    loadEventsData,
    matchesRisk,
    matchesConfidence,
    subscribeToLiveStream,
} from "../services/dataService";
import {
    Flame,
    ShieldAlert,
    ArrowRight,
    RotateCcw,
    Filter,
} from "lucide-react";

export default function Home() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [selectedRisk, setSelectedRisk] = useState("ALL");
    const [selectedConfidence, setSelectedConfidence] = useState("ALL");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedFacilityType, setSelectedFacilityType] = useState("ALL");
    const [selectedSatellite, setSelectedSatellite] = useState("ALL");

    useEffect(() => {
        loadEventsData().then((data) => {
            setEvents(data);
            setLoading(false);
        });

        const unsubscribe = subscribeToLiveStream((newEvent) => {
            setEvents(prev => [newEvent, ...prev.filter(e => e.eventId !== newEvent.eventId)]);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Event category colors as per palette instructions
    const categoryColors = {
        Industrial: "#A78BFA",
        Agricultural: "#A3E635",
        Forest: "#34D399",
        "Gas Flare": "#FF9F1C",
        Other: "#64748B",
    };

    const filteredEvents = events.filter((evt) => {
        if (!matchesRisk(evt, selectedRisk)) return false;
        if (!matchesConfidence(evt, selectedConfidence)) return false;
        if (selectedType !== "ALL" && evt.eventType !== selectedType)
            return false;
        if (
            selectedSatellite !== "ALL" &&
            !evt.satellite?.includes(selectedSatellite)
        )
            return false;
        return true;
    });

    const isFiltered =
        selectedRisk !== "ALL" ||
        selectedConfidence !== "ALL" ||
        selectedType !== "ALL" ||
        selectedSatellite !== "ALL";
    const handleResetFilters = () => {
        setSelectedRisk("ALL");
        setSelectedConfidence("ALL");
        setSelectedType("ALL");
        setSelectedSatellite("ALL");
    };

    return (
        <div className="home-page">
            {/* SCREENSHOT 1: HERO SECTION WITH ROTATING GLOBE & OVERLAY BOX */}
            <section className="hero-section">
                {/* Full Hero 3D Globe Background */}
                <div className="hero-globe-bg">
                    <GlobeHero />
                </div>

                {/* Left Translucent Curved Overlay Card */}
                <div className="hero-overlay-card">
                    <h1 className="hero-main-heading">
                        SATELLITE BASED
                        <br />
                        THERMAL INTELLIGENCE
                    </h1>

                    <p className="hero-subheading">
                        See the Heat. Understand the Threat.
                    </p>

                    <p className="hero-description text-secondary">
                        AI powered detection and classification of industrial
                        fires and persistent thermal sources using satellite and
                        geospatial data.
                    </p>

                    <div
                        style={{
                            marginTop: "2rem",
                            display: "flex",
                            gap: "1rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/overview")}
                        >
                            <Flame size={16} />
                            <span>Launch Intelligence Dashboard</span>
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate("/monitor/alerts")}
                        >
                            <ShieldAlert size={16} />
                            <span>View Active Alerts</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SCREENSHOT 2: LIVE THERMAL MAP & FILTER PANELS */}
            <div className="main-content">
                <section className="live-map-section">
                    <h2 className="section-heading">LIVE THERMAL MAP</h2>

                    <div className="map-and-controls-grid">
                        {/* Map Box on Left with Curved Edges & Orange Border */}
                        <div className="map-frame-box">
                            <ThermalMap
                                events={filteredEvents}
                                height="700px"
                            />
                        </div>

                        {/* Right Controls Sidebar (Matching Screenshot 2 layout) */}
                        <div className="map-controls-sidebar">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.25rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    <Filter
                                        size={13}
                                        className="text-thermal"
                                    />
                                    <span>FILTER ANOMALIES</span>
                                </div>
                                {isFiltered && (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        style={{
                                            padding: "3px 8px",
                                            fontSize: "0.72rem",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                        onClick={handleResetFilters}
                                    >
                                        <RotateCcw size={11} />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>

                            {isFiltered && (
                                <div
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "#FF9F1C",
                                        fontFamily: "monospace",
                                        padding: "4px 8px",
                                        background: "rgba(255,159,28,0.1)",
                                        borderRadius: "6px",
                                        border: "1px solid rgba(255,159,28,0.2)",
                                    }}
                                >
                                    Showing {filteredEvents.length} of{" "}
                                    {events.length} anomalies
                                </div>
                            )}

                            {/* EVENT TYPE LEGEND */}
                            <div className="control-group">
                                <div className="control-label">EVENT TYPE</div>
                                <div className="legend-grid">
                                    {Object.entries(categoryColors).map(
                                        ([cat, color]) => (
                                            <button
                                                key={cat}
                                                className={`legend-item-btn ${selectedType === cat ? "active" : ""}`}
                                                onClick={() =>
                                                    setSelectedType(
                                                        selectedType === cat
                                                            ? "ALL"
                                                            : cat,
                                                    )
                                                }
                                            >
                                                <span
                                                    className="color-dot"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                ></span>
                                                <span>{cat}</span>
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            <hr className="sidebar-divider" />

                            {/* RISK LEVEL FILTER PILLS */}
                            <div className="control-group">
                                <div className="control-label">RISK LEVEL</div>
                                <div className="pill-row">
                                    {[
                                        {
                                            label: "CRITICAL",
                                            val: "CRITICAL",
                                            color: "#FF3B47",
                                        },
                                        {
                                            label: "HIGH",
                                            val: "HIGH",
                                            color: "#FF9F1C",
                                        },
                                        {
                                            label: "MEDIUM",
                                            val: "MEDIUM",
                                            color: "#FFD23F",
                                        },
                                        {
                                            label: "LOW",
                                            val: "LOW",
                                            color: "#34D399",
                                        },
                                    ].map((item) => (
                                        <button
                                            key={item.val}
                                            className={`pill-btn ${selectedRisk === item.val ? "active" : ""}`}
                                            style={{
                                                borderColor:
                                                    selectedRisk === item.val
                                                        ? item.color
                                                        : "var(--border)",
                                                color:
                                                    selectedRisk === item.val
                                                        ? item.color
                                                        : "var(--text-primary)",
                                                backgroundColor:
                                                    selectedRisk === item.val
                                                        ? `${item.color}22`
                                                        : "var(--elevated)",
                                                boxShadow:
                                                    selectedRisk === item.val
                                                        ? `0 0 10px ${item.color}66`
                                                        : "none",
                                            }}
                                            onClick={() =>
                                                setSelectedRisk(
                                                    selectedRisk === item.val
                                                        ? "ALL"
                                                        : item.val,
                                                )
                                            }
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="sidebar-divider" />

                            {/* CONFIDENCE FILTER PILLS */}
                            <div className="control-group">
                                <div className="control-label">CONFIDENCE</div>
                                <div className="pill-row">
                                    {[">90%", "70-90%", "<70%"].map((conf) => (
                                        <button
                                            key={conf}
                                            className={`pill-btn ${selectedConfidence === conf ? "active" : ""}`}
                                            style={
                                                selectedConfidence === conf
                                                    ? {
                                                          borderColor:
                                                              "#FF9F1C",
                                                          color: "#FF9F1C",
                                                          backgroundColor:
                                                              "rgba(255, 159, 28, 0.18)",
                                                          boxShadow:
                                                              "0 0 10px rgba(255, 159, 28, 0.35)",
                                                      }
                                                    : {}
                                            }
                                            onClick={() =>
                                                setSelectedConfidence(
                                                    selectedConfidence === conf
                                                        ? "ALL"
                                                        : conf,
                                                )
                                            }
                                        >
                                            {conf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SCREENSHOT 2 BOTTOM SECTION: FACILITY TYPE & SATELLITE SELECTION */}
            </div>

            <style>{`
        .home-page {
          background-color: var(--page-bg);
        }

        /* SCREENSHOT 1: HERO CONTAINER */
        .hero-section {
          position: relative;
          width: 100%;
          min-height: 750px;
          display: flex;
          align-items: center;
          padding: 40px 4rem;
          overflow: hidden;
          background-color: var(--page-bg);
          margin-top:0px;
        }

        .hero-globe-bg {
          position: absolute;
          top: 0;
          right: -5%;
          width: 75%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .globe-canvas-wrapper {
          width: 100%;
          height: 100%;
        }

        .hero-overlay-card {
          position: relative;
          z-index: 2;
          max-width: 680px;
          background: var(--surface-overlay);
          border: 1px solid var(--border);
          border-radius: 60px; /* Big curved container as specified */
          padding: 3.5rem 3.5rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .hero-main-heading {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: 0.02em;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .hero-subheading {
          font-size: 1.25rem;
          letter-spacing: 0.25em;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 1.75rem;
          font-weight: 400;
        }

        .hero-description {
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 540px;
          color: var(--text-secondary);
        }

        /* SCREENSHOT 2: LIVE THERMAL MAP SECTION */
        .live-map-section {
          margin-top: 2rem;
        }

        .section-heading {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
        }

        .map-and-controls-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.5rem;
        }

        .map-frame-box {
          border: 1px solid var(--brand);
          border-radius: var(--radius-large); /* 50px curved edge */
          overflow: hidden;
          box-shadow: 0 0 25px rgba(240, 101, 61, 0.25);
        }

        .map-controls-sidebar {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-medium);
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .control-label {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          margin-bottom: 0.85rem;
          text-transform: uppercase;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1rem;
        }

        .legend-item-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .legend-item-btn:hover, .legend-item-btn.active {
          background: var(--elevated);
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .sidebar-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0.25rem 0;
        }

        .pill-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .pill-btn {
          background-color: var(--elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 10px 18px; /* >= 10px padding */
          border-radius: 30px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill-btn:hover, .pill-btn.active {
          border-color: var(--brand);
          background-color: var(--surface);
          box-shadow: 0 0 10px rgba(240, 101, 61, 0.3);
        }

        .facility-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem 1rem;
          font-size: 0.85rem;
        }

        @media (max-width: 1024px) {
          .hero-section {
            padding: 2rem;
          }
          .hero-overlay-card {
            padding: 2rem;
            border-radius: 40px;
          }
          .map-and-controls-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
