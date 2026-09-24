-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Industrial Facilities Reference Table
CREATE TABLE IF NOT EXISTS industrial_facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(128),
    power VARCHAR(64),
    industrial VARCHAR(64),
    landuse VARCHAR(64),
    operator VARCHAR(128),
    state VARCHAR(64),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    hazard_rating INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_geom ON industrial_facilities USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_facilities_state ON industrial_facilities(state);

-- 2. Thermal Events Table (Live & Historical Multi-Satellite Ingestion)
CREATE TABLE IF NOT EXISTS thermal_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    bright_ti4 NUMERIC,
    bright_ti5 NUMERIC,
    frp NUMERIC DEFAULT 0,
    acq_date VARCHAR(32),
    acq_time VARCHAR(32),
    satellite VARCHAR(64),
    instrument VARCHAR(32) DEFAULT 'VIIRS',
    confidence VARCHAR(32),
    confidence_raw NUMERIC,
    state VARCHAR(64),
    facility_name VARCHAR(255),
    facility_type VARCHAR(128),
    nearest_facility_lat DOUBLE PRECISION,
    nearest_facility_lon DOUBLE PRECISION,
    dist_to_facility_m NUMERIC,
    dist_to_facility_km NUMERIC,
    event_type VARCHAR(64),
    predicted_class VARCHAR(64),
    prediction_confidence NUMERIC,
    risk VARCHAR(32),
    risk_score NUMERIC,
    risk_level VARCHAR(32),
    status VARCHAR(64),
    persistence BOOLEAN DEFAULT false,
    is_early_warning BOOLEAN DEFAULT false,
    is_flash_trigger BOOLEAN DEFAULT false,
    satellite_tier VARCHAR(32) DEFAULT 'TIER2_POLAR', -- 'TIER1_GEO' (INSAT/Himawari), 'TIER2_POLAR' (VIIRS), 'TIER3_FUSED'
    satellite_count INT DEFAULT 1,
    multi_satellite_confirmed BOOLEAN DEFAULT false,
    grid_key VARCHAR(64),
    class_probabilities JSONB,
    key_signals JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thermal_events_geom ON thermal_events USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_thermal_events_created ON thermal_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thermal_events_risk ON thermal_events(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_thermal_events_state ON thermal_events(state);

-- 3. Real-Time Early Warnings / Flash Triggers Table
CREATE TABLE IF NOT EXISTS early_warnings (
    id SERIAL PRIMARY KEY,
    warning_id VARCHAR(64) UNIQUE NOT NULL,
    event_id VARCHAR(64) REFERENCES thermal_events(event_id) ON DELETE CASCADE,
    facility_name VARCHAR(255),
    state VARCHAR(64),
    initial_source VARCHAR(64), -- 'INSAT-3DR', 'Himawari-9'
    confirmed_by_viirs BOOLEAN DEFAULT false,
    z_score NUMERIC,
    frp_delta NUMERIC,
    severity VARCHAR(32), -- 'CRITICAL', 'HIGH', 'ELEVATED'
    message TEXT,
    status VARCHAR(32) DEFAULT 'ACTIVE', -- 'ACTIVE', 'CONFIRMED', 'RESOLVED', 'SUPPRESSED'
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_early_warnings_triggered ON early_warnings(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_early_warnings_status ON early_warnings(status);
