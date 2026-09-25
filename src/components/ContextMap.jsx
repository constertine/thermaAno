import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { Flame, Maximize2, Minimize2, Radio, Layers } from 'lucide-react';
import { getMarkerRiskProps, getEventCategoryColor } from '../services/dataService';

// Map controller to smoothly pan/zoom to the exact coordinate
function MapPanController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function ContextMap({ event, height = '300px' }) {
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'dark' | 'standard'
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!event) return null;

  const lat = Number(event.latitude);
  const lon = Number(event.longitude);
  const markerProps = getMarkerRiskProps(event, 15);
  const categoryColor = getEventCategoryColor(event);

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    standard: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  return (
    <div className={`clean-context-map-container ${isFullscreen ? 'fullscreen-mode' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      {/* Top Sleek Controls Bar */}
      <div className="context-header-bar">
        <div className="header-left">
          <Flame size={14} className="text-thermal" />
          <span className="mono location-title">
            HIGH-RES SATELLITE VIEW &middot; {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
          </span>
        </div>

        <div className="header-right">
          <div className="layer-pill-group">
            <button
              className={`layer-pill ${mapLayer === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapLayer('satellite')}
            >
              Satellite
            </button>
            <button
              className={`layer-pill ${mapLayer === 'dark' ? 'active' : ''}`}
              onClick={() => setMapLayer('dark')}
            >
              Dark
            </button>
            <button
              className={`layer-pill ${mapLayer === 'standard' ? 'active' : ''}`}
              onClick={() => setMapLayer('standard')}
            >
              Street
            </button>
          </div>

          <button
            className="btn-fullscreen-toggle"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ width: '100%', height: 'calc(100% - 36px)', background: '#0f172a' }}
      >
        <MapPanController center={[lat, lon]} zoom={15} />

        <TileLayer
          attribution='Imagery &copy; Esri, Maxar, Earthstar Geographics'
          url={tileUrls[mapLayer]}
          maxZoom={19}
        />

        {/* 500m Immediate Thermal Impact Zone */}
        <Circle
          center={[lat, lon]}
          radius={500}
          pathOptions={{
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.12,
            dashArray: '4, 4',
            weight: 1.5
          }}
        />

        {/* 1.5km Secondary Buffer Zone */}
        <Circle
          center={[lat, lon]}
          radius={1500}
          pathOptions={{
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 0.05,
            dashArray: '6, 6',
            weight: 1.0
          }}
        />

        {/* Pulsing Thermal Radiance Aura */}
        <Circle
          center={[lat, lon]}
          radius={200}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.38,
            weight: 2
          }}
        />

        {/* Target Thermal Point Circle Marker */}
        <CircleMarker
          center={[lat, lon]}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            fillColor: categoryColor,
            fillOpacity: 1.0,
            weight: 2.5
          }}
        >
          <Popup>
            <div style={{ fontSize: '0.8rem', fontFamily: 'sans-serif', padding: '2px' }}>
              <div style={{ fontWeight: 800, color: categoryColor, marginBottom: '4px' }}>
                {event.predicted_class || event.eventType || 'Thermal Anomaly'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                📍 {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
              </div>
              <div style={{ fontSize: '0.74rem', marginTop: '3px' }}>
                FRP: <strong style={{ color: '#f97316' }}>{event.frp} MW</strong> &middot; Brightness: <strong>{event.bright_ti4} K</strong>
              </div>
              <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                Risk: <strong style={{ color: markerProps.color }}>{markerProps.label.toUpperCase()} ({(markerProps.score * 100).toFixed(0)}%)</strong>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>

      <style>{`
        .clean-context-map-container {
          position: relative;
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          background: #0f172a;
        }

        .clean-context-map-container.fullscreen-mode {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh !important;
          z-index: 99999;
          border-radius: 0;
          border: none;
        }

        .context-header-bar {
          height: 36px;
          background: rgba(15, 23, 42, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.75rem;
          color: #f8fafc;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .location-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #e2e8f0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .layer-pill-group {
          display: flex;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 2px;
          gap: 2px;
        }

        .layer-pill {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .layer-pill:hover {
          color: #ffffff;
        }

        .layer-pill.active {
          background: #f97316;
          color: #ffffff;
        }

        .btn-fullscreen-toggle {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .btn-fullscreen-toggle:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
