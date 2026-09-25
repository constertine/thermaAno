import React, { useState, useEffect, useMemo } from "react";
import { loadEventsData, resolveIndianState } from "../services/dataService";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    AreaChart,
    Area,
} from "recharts";
import { BarChart2, Calendar, TrendingUp } from "lucide-react";

export default function Intelligence() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("30d"); // '7d' | '30d' | '90d' | '1y'

    useEffect(() => {
        loadEventsData().then((data) => {
            setEvents(data);
            setLoading(false);
        });
    }, []);

    // Parse both YYYY-MM-DD and DD-MM-YYYY formats
    const parseEventDate = (dateString) => {
        if (!dateString) return null;

        const parts = String(dateString).split("-");

        if (parts.length !== 3) return null;

        // YYYY-MM-DD
        if (parts[0].length === 4) {
            const [year, month, day] = parts.map(Number);
            return new Date(year, month - 1, day);
        }

        // DD-MM-YYYY
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day);
    };

    // Filter dataset by time period
    const filteredEvents = useMemo(() => {
        if (!events.length) return [];

        let dayLimit = 30;

        if (timeFilter === "7d") dayLimit = 7;
        else if (timeFilter === "90d") dayLimit = 90;
        else if (timeFilter === "1y") dayLimit = 365;

        const validDates = events
            .map((e) => parseEventDate(e.acq_date))
            .filter(Boolean);

        if (!validDates.length) return [];

        // Use the latest date available in the dataset
        const latestDate = new Date(Math.max(...validDates));
        latestDate.setHours(0, 0, 0, 0);

        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - (dayLimit - 1));

        return events.filter((e) => {
            const eventDate = parseEventDate(e.acq_date);

            if (!eventDate) return false;

            eventDate.setHours(0, 0, 0, 0);

            return eventDate >= startDate && eventDate <= latestDate;
        });
    }, [events, timeFilter]);

    // Chart 1: Thermal Anomaly Trend over Time
    const trendData = useMemo(() => {
        const map = new Map();

        filteredEvents.forEach((e) => {
            const dateKey = e.acq_date;

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    date: dateKey,
                    total: 0,
                    critical: 0,
                });
            }

            const item = map.get(dateKey);

            item.total += 1;

            if (e.risk === "CRITICAL" || e.risk === "HIGH") {
                item.critical += 1;
            }
        });

        // Sort chronologically so the chart displays the full selected range.
        return Array.from(map.values())
            .sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date))
            .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
    }, [filteredEvents]);

    // Chart 2: Industrial vs Other Distribution (Donut Chart)
    const categoryDistributionData = useMemo(() => {
        const counts = {
            Industrial: 0,
            "Power Plant": 0,
            Mining: 0,
            "Brick Kiln": 0,
            "Waste/Landfill": 0,
            "Gas Flare": 0,
            Agricultural: 0,
            Forest: 0,
            Other: 0,
        };

        filteredEvents.forEach((e) => {
            if (counts[e.eventType] !== undefined) {
                counts[e.eventType] += 1;
            } else if (e.eventType?.includes("Waste") || e.eventType?.includes("Landfill")) {
                counts["Waste/Landfill"] += 1;
            } else if (e.eventType?.includes("Brick")) {
                counts["Brick Kiln"] += 1;
            } else if (e.eventType?.includes("Mining") || e.eventType?.includes("Quarry")) {
                counts["Mining"] += 1;
            } else {
                counts["Other"] += 1;
            }
        });

        return [
            {
                name: "Industrial",
                value: counts["Industrial"],
                color: "#E14F1F",
            },
            {
                name: "Power Plant",
                value: counts["Power Plant"],
                color: "#F04819",
            },
            { name: "Mining", value: counts["Mining"], color: "#FF6A3D" },
            { name: "Brick Kiln", value: counts["Brick Kiln"], color: "#FB7185" },
            { name: "Waste/Landfill", value: counts["Waste/Landfill"], color: "#38BDF8" },
            { name: "Gas Flare", value: counts["Gas Flare"], color: "#FF9E7D" },
            {
                name: "Agricultural",
                value: counts["Agricultural"],
                color: "#D29922",
            },
            { name: "Forest", value: counts["Forest"], color: "#3FB950" },
            { name: "Other", value: counts["Other"], color: "#8B949E" },
        ].filter((d) => d.value > 0);
    }, [filteredEvents]);

    // Custom tooltip for Event Type Distribution
    const CustomPieTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) {
            return null;
        }

        const data = payload[0];

        return (
            <div
                style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                    minWidth: "100px",
                }}
            >
                <div
                    style={{
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        fontWeight: "600",
                        marginBottom: "4px",
                    }}
                >
                    {data.name}
                </div>

                <div
                    style={{
                        color: "var(--text-primary)",
                        fontSize: "12px",
                    }}
                >
                    {data.value}
                </div>
            </div>
        );
    };

    // Chart 3: Events by State (Bar Chart)
    const stateData = useMemo(() => {
        const map = new Map();

        filteredEvents.forEach((e) => {
            const state = resolveIndianState(e);
            if (state) map.set(state, (map.get(state) || 0) + 1);
        });

        return Array.from(map.entries())
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count);
    }, [filteredEvents]);

    // Chart 4: Average FRP over Time
    const frpTrendData = useMemo(() => {
        const map = new Map();

        filteredEvents.forEach((e) => {
            const dateKey = e.acq_date;

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    date: dateKey,
                    totalFRP: 0,
                    count: 0,
                });
            }

            const item = map.get(dateKey);

            item.totalFRP += e.frp;
            item.count += 1;
        });

        // Sort chronologically so the chart displays the full selected range.
        return Array.from(map.values())
            .map((item) => ({
                date: item.date,
                avgFRP: parseFloat((item.totalFRP / item.count).toFixed(2)),
            }))
            .sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date))
            .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
    }, [filteredEvents]);

    return (
        <div className="main-content page-intelligence">
            {/* Header & Time Filter */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics & Thermal Trends</h1>
                    <p className="page-sub text-muted">
                        National satellite thermal radiometry analytics (
                        {filteredEvents.length} events processed)
                    </p>
                </div>

                <div className="time-filter-bar">
                    <span className="filter-lbl text-muted mono">
                        TIME RANGE:
                    </span>
                    {["7d", "30d", "90d", "1y"].map((t) => (
                        <button
                            key={t}
                            className={`time-btn ${timeFilter === t ? "active" : ""}`}
                            onClick={() => setTimeFilter(t)}
                        >
                            {t === "7d"
                                ? "7 Days"
                                : t === "30d"
                                  ? "30 Days"
                                  : t === "90d"
                                    ? "90 Days"
                                    : "1 Year"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Analytics Charts Grid */}
            <div className="charts-grid">
                {/* Chart 1: Thermal Anomaly Activity Trend */}
                <div className="panel-card chart-card">
                    <div className="panel-header">
                        <div className="panel-title">
                            <TrendingUp size={15} className="text-thermal" />
                            <span>THERMAL ANOMALY ACTIVITY TREND</span>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart
                                data={trendData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorTotal"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#FF6A3D"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#FF6A3D"
                                            stopOpacity={0.0}
                                        />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />

                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />

                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "6px",
                                        color: "var(--text-primary)",
                                        fontSize: "12px",
                                        padding: "8px 12px",
                                    }}
                                    labelStyle={{
                                        color: "var(--text-primary)",
                                        fontWeight: "600",
                                        marginBottom: "4px",
                                    }}
                                    itemStyle={{
                                        color: "var(--text-primary)",
                                        padding: "2px 0",
                                    }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#FF6A3D"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    name="Total Anomalies"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Industrial vs Other Distribution */}
                <div className="panel-card chart-card">
                    <div className="panel-header">
                        <div className="panel-title">
                            <BarChart2 size={15} className="text-thermal" />
                            <span>EVENT TYPE DISTRIBUTION</span>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={categoryDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {categoryDistributionData.map(
                                        (entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ),
                                    )}
                                </Pie>

                                <Tooltip content={<CustomPieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 3: Thermal Anomalies by State */}
                <div className="panel-card chart-card">
                    <div className="panel-header">
                        <div className="panel-title">
                            <BarChart2 size={15} className="text-thermal" />
                            <span>ANOMALIES BY REGION / STATE</span>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={stateData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -10,
                                    bottom: 25,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />

                                <XAxis
                                    dataKey="state"
                                    stroke="var(--text-secondary)"
                                    fontSize={10}
                                    angle={-35}
                                    textAnchor="end"
                                    tickLine={false}
                                />

                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--page-bg)",
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                        fontSize: "12px",
                                    }}
                                />

                                <Bar
                                    dataKey="count"
                                    fill="#E14F1F"
                                    radius={[3, 3, 0, 0]}
                                    name="Events Count"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 4: Average FRP Power over Time */}
                <div className="panel-card chart-card">
                    <div className="panel-header">
                        <div className="panel-title">
                            <TrendingUp size={15} className="text-thermal" />
                            <span>AVERAGE FIRE RADIATIVE POWER (FRP MW)</span>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart
                                data={frpTrendData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -10,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />

                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />

                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={11}
                                    tickLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--page-bg)",
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                        fontSize: "12px",
                                    }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="avgFRP"
                                    stroke="#F04819"
                                    strokeWidth={2}
                                    dot={{ fill: "#F04819", r: 3 }}
                                    name="Avg FRP (MW)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style>{`
        .page-intelligence { padding-top: 1.5rem; }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          margin-top:25px;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .page-sub {
          font-size: 0.875rem;
          margin-top: 0.2rem;
        }

        .time-filter-bar {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--elevated);
          border: 1px solid var(--border);
          padding: 10px;
          border-radius: 15px;
        }

        .filter-lbl {
          font-size: 0.68rem;
          margin-right: 0.35rem;
        }

        .time-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-family: var(--font-mono);
          padding: 0.3rem 0.65rem;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .time-btn:hover {
          color: var(--text-primary);
          background: var(--page-bg);
        }

        .time-btn.active {
          background: var(--page-bg);
          color: #FF6A3D;
          font-weight: 600;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .chart-container {
          padding-top: 0.5rem;
        }

        @media (max-width: 900px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
