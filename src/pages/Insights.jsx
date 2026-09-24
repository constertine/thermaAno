import React, { useState, useEffect, useMemo } from "react";
import { loadEventsData, matchesRisk } from "../services/dataService";
import { exportEventsToCSV } from "../utils/csvExporter";
import FilterPanel from "../components/FilterPanel";
import {
    Download,
    Printer,
    FileText,
    CheckCircle2,
    ChevronDown,
} from "lucide-react";

export default function Insights() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [generatedReport, setGeneratedReport] = useState(null);

    // Filters state
    const [selectedRisk, setSelectedRisk] = useState("ALL");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedState, setSelectedState] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(12);

    useEffect(() => {
        loadEventsData().then((data) => {
            setEvents(data);
            if (data.length > 0) {
                setSelectedEventId(data[0].eventId);
            }
            setLoading(false);
        });
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            if (!matchesRisk(evt, selectedRisk)) return false;
            if (selectedType !== "ALL" && evt.eventType !== selectedType)
                return false;
            if (selectedState !== "ALL" && evt.state !== selectedState)
                return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !evt.facilityName.toLowerCase().includes(q) &&
                    !evt.eventId.toLowerCase().includes(q) &&
                    !evt.state.toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });
    }, [events, selectedRisk, selectedType, selectedState, searchQuery]);

    useEffect(() => {
        setVisibleCount(12);
    }, [filteredEvents]);

    const selectedEventObj = useMemo(() => {
        return events.find((e) => e.eventId === selectedEventId) || events[0];
    }, [events, selectedEventId]);

    const handleGenerateReport = () => {
        if (!selectedEventObj) return;
        setGeneratedReport({
            title: `SATELLITE THERMAL INVESTIGATION REPORT — ${selectedEventObj.eventId}`,
            generatedAt: new Date().toLocaleString(),
            event: selectedEventObj,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div
            className="main-content page-insights"
            style={{ marginBottom: "40px" }}
        >
            {/* PAGE TITLE & SUBTITLE (MATCHING IMAGE 2) */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Intelligence Reports</h1>
                    <p className="page-sub text-secondary">
                        Generate and export event & dataset reports
                    </p>
                </div>
            </div>

            {/* FILTER PANEL */}
            <FilterPanel
                selectedRisk={selectedRisk}
                setSelectedRisk={setSelectedRisk}
                selectedConfidence="ALL"
                setSelectedConfidence={() => {}}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReset={() => {
                    setSelectedRisk("ALL");
                    setSelectedType("ALL");
                    setSelectedState("ALL");
                    setSearchQuery("");
                    setVisibleCount(12);
                }}
            />

            {/* Grid: Dataset Table + Report Generator */}
            <div className="insights-grid">
                {/* Left Column: Event Dataset Summary Table */}
                <div className="panel-card dataset-panel">
                    <div
                        className="panel-header"
                        style={{ paddingTop: "1rem", paddingLeft: "1rem" }}
                    >
                        <div className="panel-title">
                            <FileText size={15} className="text-thermal" />
                            <span>
                                EVENT DATASET RECORDS ({filteredEvents.length})
                            </span>
                        </div>
                    </div>

                    <button
                        className="btn btn-secondary export-csv-btn"
                        onClick={() =>
                            exportEventsToCSV(
                                filteredEvents,
                                "thermal_intelligence_dataset.csv",
                            )
                        }
                    >
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* INNER FULL-WIDTH TABLE CONTAINER (EXPANDED WIDTH SO NO TEXT GETS CUT OFF) */}
                <div
                    className="tech-table-container inner-table-card"
                    style={{ marginTop: "25px" }}
                >
                    <table className="tech-table insights-full-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Class</th>
                                <th>Risk</th>
                                <th>FRP</th>
                                <th>Pop. 5km</th>
                                <th>Status</th>
                                <th>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents
                                .slice(0, visibleCount)
                                .map((evt) => (
                                    <tr
                                        key={evt.id}
                                        className={
                                            selectedEventId === evt.eventId
                                                ? "selected-row"
                                                : ""
                                        }
                                        onClick={() =>
                                            setSelectedEventId(evt.eventId)
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="mono text-primary font-bold">
                                            {evt.eventId}
                                        </td>
                                        <td>
                                            <span className="badge badge-medium">
                                                {evt.eventType}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-${evt.risk.toLowerCase()}`}
                                            >
                                                {evt.risk}
                                            </span>
                                        </td>
                                        <td className="mono">{evt.frp} MW</td>
                                        <td className="mono text-secondary">
                                            {(evt.dist_to_facility_m * 1.8)
                                                .toFixed(0)
                                                .replace(
                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                    ",",
                                                )}
                                        </td>
                                        <td>
                                            <span className="mono status-pill">
                                                {evt.status}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="radio"
                                                name="selectedReportEvent"
                                                checked={
                                                    selectedEventId ===
                                                    evt.eventId
                                                }
                                                onChange={() =>
                                                    setSelectedEventId(
                                                        evt.eventId,
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    {visibleCount < filteredEvents.length && (
                        <div className="pagination-bar">
                            <div className="pagination-info text-muted mono">
                                Showing{" "}
                                {Math.min(visibleCount, filteredEvents.length)}{" "}
                                of {filteredEvents.length} events
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() =>
                                        setVisibleCount((count) => count + 12)
                                    }
                                >
                                    <ChevronDown size={14} />
                                    <span>Show more</span>
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() =>
                                        setVisibleCount(filteredEvents.length)
                                    }
                                >
                                    <span>Show all</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM SECTION: REPORT TEMPLATE FRAME (FULL WIDTH ACROSS PAGE - MATCHING IMAGE 2) */}
            <div className="panel-card frame-outer-card margin-top-large">
                <div
                    className="frame-title-group"
                    style={{ marginBottom: "1.25rem" }}
                >
                    <span className="frame-label text-secondary mono">
                        REPORT TEMPLATE
                    </span>
                </div>

                <div className="report-template-body">
                    <p className="report-template-highlight">
                        Each event investigation page includes a printable
                        intelligence report (File → Print / Save as PDF). A full
                        event report contains: event ID, location, date/time,
                        classification, confidence, risk score, FRP,
                        persistence, industrial facility information, land-cover
                        analysis, population exposure, satellite imagery,
                        historical trend, explainability, analyst verification,
                        and recommendations.
                    </p>

                    <div className="report-template-bullet-row text-secondary">
                        Event Summary · Classification · Explainable AI ·
                        Industrial Context · Land Cover · Population Exposure ·
                        Temporal Analysis · Satellite Imagery · Risk Score ·
                        Analyst Verification · Recommendations
                    </div>

                    <div
                        style={{
                            marginTop: "1.5rem",
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerateReport}
                        >
                            <FileText size={16} />
                            <span>
                                Generate Report for{" "}
                                {selectedEventObj
                                    ? selectedEventObj.eventId
                                    : "Selected Event"}
                            </span>
                        </button>
                        {generatedReport && (
                            <button
                                className="btn btn-secondary"
                                onClick={handlePrint}
                            >
                                <Printer size={16} />
                                <span>Print Report (PDF)</span>
                            </button>
                        )}
                    </div>

                    {generatedReport && (
                        <div className="generated-report-card margin-top">
                            <div className="gen-header">
                                <CheckCircle2
                                    size={18}
                                    style={{ color: "#34D399" }}
                                />
                                <span
                                    className="mono"
                                    style={{
                                        color: "#34D399",
                                        fontWeight: 700,
                                    }}
                                >
                                    REPORT GENERATED:{" "}
                                    {generatedReport.event.eventId} —{" "}
                                    {generatedReport.event.facilityName}
                                </span>
                            </div>
                            <p
                                className="text-secondary"
                                style={{
                                    fontSize: "0.85rem",
                                    marginTop: "0.5rem",
                                }}
                            >
                                Full investigation package compiled. Includes
                                VIIRS infrared telemetry (
                                {generatedReport.event.bright_ti4}K), distance
                                to nearest facility (
                                {generatedReport.event.dist_to_facility_m}m),
                                risk score ({generatedReport.event.riskScore}
                                /100), and analyst audit signatures.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .page-insights {
          padding-top: 1rem;
        }

        .page-header {
          margin-bottom: 1.5rem;
          margin-top:25px;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .page-sub {
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .frame-outer-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 50px; /* Big curved radius matching Image 2 */
          padding: 2rem;
          width: 100%;
        }

        .frame-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .frame-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .frame-heading {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-secondary);
          opacity: 0.5;
          margin-top: 0.1rem;
        }

        .export-csv-btn {
          background-color: var(--text-primary) !important;
          color: var(--page-bg) !important;
          border-color: var(--text-primary) !important;
          font-weight: 700;
          border-radius: 30px;
          padding: 10px 24px;
        }

        .export-csv-btn:hover {
          background-color: var(--text-primary) !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
        }

        .inner-table-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: 40px; /* Inner curved card as shown in Image 2 */
          padding: 1rem 1.5rem;
          overflow: hidden;
        }

        /* Full width insights table with ample column widths so NO text gets cut off */
        .insights-full-table {
            border: 1px solid var(--elevated);
            border-radius: 30px;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
        }

        .insights-full-table th {
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }

        .insights-full-table td {
          border-bottom: 1px solid var(--elevated);
          font-size: 0.88rem;
          white-space: nowrap;
        }

        .insights-full-table tr:last-child td {
          border-bottom: none;
        }

        .insights-full-table tr:hover td {
          background-color: var(--elevated);
        }

        .selected-row td {
          background-color: rgba(255, 106, 61, 0.12) !important;
        }

                .pagination-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.85rem 1.25rem;
                    background-color: var(--elevated);
                    border-top: 1px solid var(--border);
                }

                .pagination-info {
                    font-size: 0.75rem;
                }

                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

        .font-bold {
          font-weight: 700;
        }

        .status-pill {
          color: var(--text-primary);
          font-size: 0.82rem;
        }

        .margin-top-large {
          margin-top: 60px;
        }

        /* REPORT TEMPLATE BOTTOM SECTION STYLING (MATCHING IMAGE 2) */
        .report-template-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .report-template-highlight {
          color: var(--brand); /* #FF6A3D / #F0653D orange text from palette & Image 2 */
          font-size: 0.95rem;
          line-height: 1.75;
          font-weight: 500;
          max-width: 1100px;
        }

        .report-template-bullet-row {
          font-size: 0.82rem;
          letter-spacing: 0.03em;
          border-top: 1px solid var(--border);
          padding-top: 1.25rem;
          line-height: 1.6;
        }

        .generated-report-card {
          background-color: var(--elevated);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.25rem;
        }

        .gen-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
      `}</style>
        </div>
    );
}
