import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../components/FilterPanel";
import {
    loadEventsData,
    matchesRisk,
    matchesConfidence,
    matchesEventType,
} from "../services/dataService";
import { exportEventsToCSV } from "../utils/csvExporter";
import {
    Download,
    ArrowUpDown,
    Eye,
    Flame,
    MapPin,
    ChevronDown,
} from "lucide-react";

export default function AllAnomalies() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [selectedRisk, setSelectedRisk] = useState("ALL");
    const [selectedConfidence, setSelectedConfidence] = useState("ALL");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedState, setSelectedState] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Sorting state
    const [sortField, setSortField] = useState("riskScore");
    const [sortOrder, setSortOrder] = useState("desc");

    const [visibleCount, setVisibleCount] = useState(12);

    useEffect(() => {
        loadEventsData().then((data) => {
            setEvents(data);
            setLoading(false);
        });
    }, []);

    // Filtered & Sorted events computation
    const filteredAndSortedEvents = useMemo(() => {
        let result = events.filter((evt) => {
            if (!matchesRisk(evt, selectedRisk)) return false;
            if (!matchesConfidence(evt, selectedConfidence)) return false;
            if (!matchesEventType(evt, selectedType)) return false;
            if (selectedState !== "ALL" && evt.state !== selectedState)
                return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !evt.facilityName?.toLowerCase().includes(q) &&
                    !evt.eventId?.toLowerCase().includes(q) &&
                    !evt.state?.toLowerCase().includes(q)
                )
                    return false;
            }
            return true;
        });

        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [
        events,
        selectedRisk,
        selectedConfidence,
        selectedType,
        selectedState,
        searchQuery,
        sortField,
        sortOrder,
    ]);

    useEffect(() => {
        setVisibleCount(12);
    }, [filteredAndSortedEvents]);

    const visibleEvents = filteredAndSortedEvents.slice(0, visibleCount);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="main-content page-all-anomalies">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        All Satellite Thermal Anomalies
                    </h1>
                    <p className="page-sub text-muted">
                        Complete database of satellite thermal events (
                        {filteredAndSortedEvents.length} records active)
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            exportEventsToCSV(
                                filteredAndSortedEvents,
                                "filtered_thermal_events.csv",
                            )
                        }
                    >
                        <Download size={14} />
                        <span>
                            Export CSV ({filteredAndSortedEvents.length})
                        </span>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel
                selectedRisk={selectedRisk}
                setSelectedRisk={setSelectedRisk}
                selectedConfidence={selectedConfidence}
                setSelectedConfidence={setSelectedConfidence}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedState={selectedState}
                setSelectedState={setSelectedState}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReset={() => {
                    setSelectedRisk("ALL");
                    setSelectedConfidence("ALL");
                    setSelectedType("ALL");
                    setSelectedState("ALL");
                    setSearchQuery("");
                    setVisibleCount(12);
                }}
            />

            {/* Table & Pagination Panel */}
            <div className="panel-card table-panel">
                <div className="tech-table-container">
                    <table className="tech-table">
                        <thead>
                            <tr>
                                <th
                                    onClick={() => handleSort("eventId")}
                                    className="sortable"
                                >
                                    Event ID <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("facilityName")}
                                    className="sortable"
                                >
                                    Facility / Anomaly Name{" "}
                                    <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("state")}
                                    className="sortable"
                                >
                                    State <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("eventType")}
                                    className="sortable"
                                >
                                    Event Type <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("riskScore")}
                                    className="sortable"
                                >
                                    Risk Score <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("frp")}
                                    className="sortable"
                                >
                                    FRP (MW) <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("confidence")}
                                    className="sortable"
                                >
                                    Confidence <ArrowUpDown size={12} />
                                </th>
                                <th
                                    onClick={() => handleSort("acq_date")}
                                    className="sortable"
                                >
                                    Date <ArrowUpDown size={12} />
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleEvents.map((evt) => (
                                <tr key={evt.id}>
                                    <td
                                        className="mono text-thermal"
                                        style={{ fontWeight: 600 }}
                                    >
                                        {evt.eventId}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>
                                        {evt.facilityName}
                                    </td>
                                    <td>{evt.state}</td>
                                    <td>
                                        <span className="badge badge-medium">
                                            {evt.eventType}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge badge-${evt.risk.toLowerCase()}`}
                                        >
                                            {evt.riskScore} ({evt.risk})
                                        </span>
                                    </td>
                                    <td className="mono text-thermal">
                                        {evt.frp} MW
                                    </td>
                                    <td className="mono">{evt.confidence}</td>
                                    <td className="mono">{evt.acq_date}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() =>
                                                navigate(`/event/${evt.id}`)
                                            }
                                        >
                                            <Eye size={12} />
                                            <span>Inspect</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {visibleEvents.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="9"
                                        style={{
                                            textAlign: "center",
                                            padding: "3rem 0",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        No thermal anomaly events match the
                                        selected criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-bar">
                    <div className="pagination-info text-muted mono">
                        Showing {visibleEvents.length} of{" "}
                        {filteredAndSortedEvents.length} events
                    </div>

                    {visibleCount < filteredAndSortedEvents.length && (
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
                                    setVisibleCount(
                                        filteredAndSortedEvents.length,
                                    )
                                }
                            >
                                <span>Show all</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .page-all-anomalies {
          padding-top: 1.5rem;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-top:20px;
        }

        .page-sub {
          font-size: 0.875rem;
          margin-top: 0.2rem;
        }

        .table-panel {
          padding: 0;
          overflow: hidden;
          margin-top:30px;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          color: var(--text-primary);
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

        .page-num {
          padding: 0.25rem 0.65rem;
          background: var(--elevated);
          border: 1px solid var(--text-secondary);
          border-radius: 3px;
          color: var(--text-primary);
          font-size: 0.75rem;
        }
      `}</style>
        </div>
    );
}
