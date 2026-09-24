import React from "react";
import { Filter, RotateCcw, Search } from "lucide-react";

export default function FilterPanel({
    selectedRisk,
    setSelectedRisk,
    selectedConfidence,
    setSelectedConfidence,
    selectedType,
    setSelectedType,
    selectedState,
    setSelectedState,
    searchQuery,
    setSearchQuery,
    onReset,
}) {
    const risks = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const confidences = ["ALL", ">90%", "70–90%", "<70%"];
    const eventTypes = [
        "ALL",
        "Industrial",
        "Agricultural",
        "Forest",
        "Gas Flare",
        "Other",
    ];
    const indianStates = [
        { value: "ALL", label: "All Indian States" },
        { value: "Tamil Nadu", label: "Tamil Nadu" },
        { value: "Andhra Pradesh", label: "Andhra Pradesh" },
        { value: "Gujarat", label: "Gujarat" },
        { value: "Maharashtra", label: "Maharashtra" },
        { value: "Jharkhand", label: "Jharkhand" },
        { value: "West Bengal", label: "West Bengal" },
        { value: "Telangana", label: "Telangana" },
        { value: "Chhattisgarh", label: "Chhattisgarh" },
        { value: "Odisha", label: "Odisha" },
        { value: "Rajasthan", label: "Rajasthan" },
        { value: "Karnataka", label: "Karnataka" },
        { value: "Punjab", label: "Punjab" },
        { value: "Haryana", label: "Haryana" },
        { value: "Madhya Pradesh", label: "Madhya Pradesh" },
        { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    ];

    return (
        <div className="filter-panel">
            <div className="filter-header">
                <div className="filter-title">
                    <Filter size={14} className="text-thermal" />
                    <span>RISK & EVENT FILTERS</span>
                </div>
                {onReset && (
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={onReset}
                    >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                    </button>
                )}
            </div>

            <div className="filter-grid">
                {/* Search Input */}
                {setSearchQuery && (
                    <div className="filter-group filter-search-group">
                        <label className="filter-label">
                            Search Anomaly / Facility
                        </label>
                        <div className="search-input-wrap">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                className="tech-input search-input"
                                placeholder="Search facility, event ID..."
                                value={searchQuery || ""}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Risk Level Pills */}
                <div className="filter-group">
                    <label className="filter-label">Risk Severity</label>
                    <div className="pill-group">
                        {risks.map((risk) => (
                            <button
                                key={risk}
                                className={`filter-pill ${selectedRisk === risk ? "active" : ""} ${risk !== "ALL" ? `pill-${risk.toLowerCase()}` : ""}`}
                                onClick={() => setSelectedRisk(risk)}
                            >
                                {risk}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confidence Filter Pills */}
                <div className="filter-group">
                    <label className="filter-label">Satellite Confidence</label>
                    <div className="pill-group">
                        {confidences.map((conf) => (
                            <button
                                key={conf}
                                className={`filter-pill ${selectedConfidence === conf ? "active" : ""}`}
                                onClick={() => setSelectedConfidence(conf)}
                            >
                                {conf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Event Type Select */}
                {setSelectedType && (
                    <div className="filter-group">
                        <label className="filter-label">Event Category</label>
                        <select
                            className="tech-select"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            {eventTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t === "ALL" ? "All Event Types" : t}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* State Select */}
                {setSelectedState && (
                    <div className="filter-group">
                        <label className="filter-label">Region / State</label>
                        <select
                            className="tech-select"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            {indianStates.map((st) => (
                                <option key={st.value} value={st.value}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <style>{`
        .filter-panel {
          background-color: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          margin-top:25px;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .filter-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .filter-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 1.25rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .filter-search-group {
          flex: 1;
          min-width: 220px;
        }

        .filter-label {
          font-size: 0.7rem;
          font-family: var(--font-mono);
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.6rem;
          color: var(--text-secondary);
        }

        .search-input {
          padding-left: 2rem;
          width: 100%;
        }

        .pill-group {
          display: flex;
          gap: 0.25rem;
          background: var(--surface);
          padding: 0.2rem;
          border-radius: 15px;
          border: 1px solid var(--border);
        }

        .filter-pill {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          padding: 0.3rem 0.6rem;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-pill:hover {
          color: var(--text-primary);
        }

        .filter-pill.active {
          background: var(--elevated);
          color: var(--text-primary);
          font-weight: 600;
          border-radius:10px;
        }

        .filter-pill.active.pill-critical {
          background: rgba(225, 79, 31, 0.25);
          color: #FF6A3D;
        }

        .filter-pill.active.pill-high {
          background: rgba(240, 72, 25, 0.2);
          color: #FF8056;
        }

        .filter-pill.active.pill-medium {
          background: rgba(210, 153, 34, 0.2);
          color: #D29922;
        }

        .filter-pill.active.pill-low {
          background: rgba(35, 134, 54, 0.2);
          color: #3FB950;
        }
      `}</style>
        </div>
    );
}
