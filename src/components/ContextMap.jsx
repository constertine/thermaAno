import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import { Flame, Layers } from 'lucide-react';
import { getMarkerRiskProps } from '../services/dataService';

export default function ContextMap({ event, height = '360px' }) {
  const [mapLayer, setMapLayer] = useState('satellite');

  if (!event) return null;

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  return (
    <div className="context-map-wrapper" style={{ height }}>
      <div className="context-map-header">
        <div className="context-title">
          <Flame size={14} className="text-thermal" />
          <span className="mono">GIS CONTEXT MAP — LAT: {event.latitude} | LON: {event.longitude}</span>
        </div>
        <div className="context-layer-toggle">
          <button
            className={`layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapLayer('satellite')}
          >
            Satellite
          </button>
          <button
            className={`layer-btn ${mapLayer === 'dark' ? 'active' : ''}`}
            onClick={() => setMapLayer('dark')}
          >
            Dark Vector
          </button>
        </div>
      </div>

      <MapContainer
        center={[event.latitude, event.longitude]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: '100%', height: 'calc(100% - 36px)', background: 'var(--page-bg)' }}
      >
        <TileLayer
          attribution='&copy; ESRI Satellite &copy; VIIRS'
          url={tileUrls[mapLayer]}
          maxZoom={18}
        />

        {/* Outer 5km Radius Thermal Buffer Zone */}
        <Circle
          center={[event.latitude, event.longitude]}
          radius={5000}
          pathOptions={{
            color: '#FF6A3D',
            fillColor: '#FF6A3D',
            fillOpacity: 0.08,
            dashArray: '4, 4',
            weight: 1
          }}
        />

        {/* Nearest Industrial Facility Marker if available */}
        {event.nearestFacilityLat && event.nearestFacilityLon && (
          <CircleMarker
            center={[event.nearestFacilityLat, event.nearestFacilityLon]}
            radius={7}
            pathOptions={{
              color: '#38BDF8',
              fillColor: '#38BDF8',
              fillOpacity: 0.85,
              weight: 1.5
            }}
          >
            <Popup>
              <div className="mono text-brand" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {event.facilityName || 'Nearby Facility'}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                {event.facilityType || 'Industrial Facility'} · {event.dist_to_facility_km} km away
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Selected Anomaly Target Marker with Dynamic Risk Styling */}
        {(() => {
          const markerProps = getMarkerRiskProps(event, 12);
          return (
            <CircleMarker
              center={[event.latitude, event.longitude]}
              radius={Math.max(10, markerProps.radius)}
              pathOptions={{
                color: markerProps.color,
                fillColor: markerProps.fillColor,
                fillOpacity: 0.92,
                weight: markerProps.weight
              }}
            >
              <Popup>
                <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: markerProps.color }}>
                  {event.eventId} (TARGET ANOMALY — {markerProps.label.toUpperCase()})
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Risk Score: <strong style={{ color: markerProps.color }}>{(markerProps.score * 100).toFixed(1)}%</strong> | FRP: <strong>{event.frp} MW</strong>
                </div>
                <div style={{ fontSize: '0.72rem', marginTop: '3px', color: 'var(--text-secondary)' }}>
                  Classification: <strong>{event.predicted_class || event.eventType}</strong>
                </div>
              </Popup>
            </CircleMarker>
          );
        })()}
      </MapContainer>

      <style>{`
        .context-map-wrapper {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          background: var(--page-bg);
        }

        .context-map-header {
          height: 36px;
          background: var(--page-bg);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.85rem;
        }

        .context-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.72rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .context-layer-toggle {
          display: flex;
          gap: 0.2rem;
        }

        .layer-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.68rem;
          font-family: var(--font-mono);
          padding: 0.15rem 0.45rem;
          border-radius: 2px;
          cursor: pointer;
        }

        .layer-btn.active {
          background: var(--elevated);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
