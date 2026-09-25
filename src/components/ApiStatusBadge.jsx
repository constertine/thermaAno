import React, { useState, useEffect } from "react";
import { checkApiHealth, ML_REMOTE_API } from "../services/dataService";
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Server, ExternalLink, X } from "lucide-react";

export default function ApiStatusBadge({ compact = false }) {
    const [health, setHealth] = useState({
        connected: false,
        status: "checking",
        service: "thermal-classifier-api",
        latency: null
    });
    const [isPinging, setIsPinging] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    const performPing = async () => {
        setIsPinging(true);
        try {
            const res = await checkApiHealth();
            setHealth(res);
        } catch {
            setHealth({
                connected: false,
                status: "error",
                service: "thermal-classifier-api",
                latency: null
            });
        } finally {
            setIsPinging(false);
        }
    };

    useEffect(() => {
        performPing();
        // Ping every 35 seconds to keep connection alive and verify readiness
        const interval = setInterval(performPing, 35000);
        return () => clearInterval(interval);
    }, []);

    const isLive = health.connected && (health.status === "healthy" || health.status === "online");

    return (
        <div className="api-status-wrapper">
            <button
                type="button"
                className={`api-status-pill ${isLive ? "live" : health.status === "checking" ? "checking" : "offline"}`}
                onClick={() => setShowPopover(!showPopover)}
                title="Click to view Live ML Engine telemetry & endpoint health"
            >
                <span className={`status-indicator-dot ${isLive ? "live-glow" : ""}`}></span>
                <span className="status-label">
                    {isLive
                        ? "ML Engine: Connected to Render"
                        : health.status === "checking"
                          ? "ML Engine: Connecting..."
                          : "ML Engine: Standby"}
                </span>
                {isLive && health.latency != null && (
                    <span className="latency-tag">{health.latency}ms</span>
                )}
            </button>

            {showPopover && (
                <div className="api-telemetry-popover">
                    <div className="popover-header">
                        <div className="header-left">
                            <Server size={14} className="text-brand" />
                            <span className="popover-title">Remote ML Service Status</span>
                        </div>
                        <button
                            type="button"
                            className="close-popover-btn"
                            onClick={() => setShowPopover(false)}
                            aria-label="Close status popover"
                        >
                            <X size={13} />
                        </button>
                    </div>

                    <div className="popover-body">
                        <div className="telemetry-row">
                            <span className="telemetry-key">API Endpoint:</span>
                            <span className="telemetry-val mono truncate">{ML_REMOTE_API}</span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-key">Model Service:</span>
                            <span className="telemetry-val mono">{health.service || "thermal-classifier-api"}</span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-key">Health Status:</span>
                            <span className={`telemetry-val status-val ${isLive ? "text-success" : "text-warning"}`}>
                                {isLive ? (
                                    <>
                                        <CheckCircle2 size={12} /> 200 OK (Healthy)
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={12} /> Standby / Reconnecting
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-key">Ping Latency:</span>
                            <span className="telemetry-val mono text-brand">
                                {health.latency != null ? `${health.latency} ms` : "—"}
                            </span>
                        </div>
                        <div className="telemetry-row">
                            <span className="telemetry-key">Explainability:</span>
                            <span className="telemetry-val text-success">TreeSHAP & Key Signals Ready</span>
                        </div>
                    </div>

                    <div className="popover-footer">
                        <button
                            type="button"
                            className="btn-reping"
                            onClick={performPing}
                            disabled={isPinging}
                        >
                            <RefreshCw size={12} className={isPinging ? "spin-icon" : ""} />
                            <span>{isPinging ? "Pinging..." : "Test Connection"}</span>
                        </button>
                        <a
                            href={ML_REMOTE_API}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-api-link"
                        >
                            <span>Open Root</span>
                            <ExternalLink size={11} />
                        </a>
                    </div>
                </div>
            )}

            <style>{`
                .api-status-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }

                .api-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: rgba(18, 22, 28, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 9999px;
                    padding: 5px 12px;
                    font-size: 0.72rem;
                    font-family: var(--font-mono, monospace);
                    color: var(--text-secondary, #94A3B8);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
                }

                .api-status-pill:hover {
                    border-color: rgba(255, 255, 255, 0.25);
                    color: var(--text-primary, #F8FAFC);
                    background: rgba(28, 33, 41, 0.95);
                    transform: translateY(-1px);
                }

                .api-status-pill.live {
                    border-color: rgba(34, 197, 94, 0.35);
                    color: #F1F5F9;
                }

                .status-indicator-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #94A3B8;
                    display: inline-block;
                }

                .api-status-pill.live .status-indicator-dot {
                    background: #22c55e;
                    box-shadow: 0 0 8px #22c55e;
                }

                .api-status-pill.checking .status-indicator-dot {
                    background: #facc15;
                    box-shadow: 0 0 6px #facc15;
                }

                .api-status-pill.offline .status-indicator-dot {
                    background: #dc2626;
                }

                .live-glow {
                    animation: greenPulse 2s infinite;
                }

                @keyframes greenPulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                .latency-tag {
                    font-size: 0.65rem;
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ADE80;
                    padding: 1px 5px;
                    border-radius: 4px;
                    border: 1px solid rgba(74, 222, 128, 0.3);
                }

                .api-telemetry-popover {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 320px;
                    background: #0F172A;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 12px;
                    z-index: 2000;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
                    animation: popoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes popoverFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .popover-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .popover-title {
                    font-size: 0.78rem;
                    font-weight: 700;
                    color: #F8FAFC;
                }

                .close-popover-btn {
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    padding: 3px;
                    border-radius: 4px;
                }

                .close-popover-btn:hover {
                    color: #F8FAFC;
                    background: rgba(255, 255, 255, 0.08);
                }

                .popover-body {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    font-size: 0.73rem;
                }

                .telemetry-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                .telemetry-key {
                    color: #94A3B8;
                }

                .telemetry-val {
                    color: #F1F5F9;
                    font-weight: 500;
                }

                .status-val {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .text-success { color: #22C55E; }
                .text-warning { color: #F59E0B; }
                .text-brand { color: #38BDF8; }

                .popover-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }

                .btn-reping, .btn-api-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.7rem;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.15s ease;
                }

                .btn-reping {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #F1F5F9;
                }

                .btn-reping:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.12);
                }

                .btn-api-link {
                    background: transparent;
                    border: none;
                    color: #38BDF8;
                }

                .btn-api-link:hover {
                    color: #7DD3FC;
                    text-decoration: underline;
                }

                .spin-icon {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
