-- ============================================================================
-- Affi-Marketing Core Tables Migration
-- ============================================================================
-- Purpose: Create core tables for experiments, tracking, conversions
-- Author: 03-数据库工程师
-- Date: 2026-03-03
-- Dependencies: 000_init_database.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: Experiments Table
-- ============================================================================
-- Purpose: Store A/B test configurations and experiment settings

CREATE TABLE IF NOT EXISTS experiments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plugin_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    config JSONB NOT NULL DEFAULT '{}',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER experiments_updated_at
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for experiments
CREATE INDEX IF NOT EXISTS idx_experiments_plugin_id ON experiments(plugin_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at DESC);

-- ============================================================================
-- SECTION 2: Tracking Events Table
-- ============================================================================
-- Purpose: Store all tracking events (clicks, impressions, etc.)

CREATE TABLE IF NOT EXISTS tracking_events (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    tracking_id VARCHAR(255),
    source_url TEXT,
    target_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tracking_events
CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking_id ON tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_experiment_id ON tracking_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_metadata ON tracking_events USING GIN(metadata);

-- ============================================================================
-- SECTION 3: Conversions Table
-- ============================================================================
-- Purpose: Store conversion/commission events

CREATE TABLE IF NOT EXISTS conversions (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    tracking_id VARCHAR(255),
    conversion_type VARCHAR(100),
    amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    commission DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- Indexes for conversions
CREATE INDEX IF NOT EXISTS idx_conversions_tracking_id ON conversions(tracking_id);
CREATE INDEX IF NOT EXISTS idx_conversions_experiment_id ON conversions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);

-- ============================================================================
-- SECTION 4: Settlement Records Table
-- ============================================================================
-- Purpose: Store periodic settlement summaries

CREATE TABLE IF NOT EXISTS settlement_records (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for settlement_records
CREATE INDEX IF NOT EXISTS idx_settlement_records_experiment_id ON settlement_records(experiment_id);
CREATE INDEX IF NOT EXISTS idx_settlement_records_period ON settlement_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_settlement_records_status ON settlement_records(status);

-- ============================================================================
-- SECTION 5: Verification Queries
-- ============================================================================

-- Verify all tables were created
SELECT
    schemaname,
    tablename,
    (SELECT pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size)
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('experiments', 'tracking_events', 'conversions', 'settlement_records')
ORDER BY tablename;

-- Verify all indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected table counts:
-- experiments: 0 rows
-- tracking_events: 0 rows
-- conversions: 0 rows
-- settlement_records: 0 rows

-- ============================================================================
-- SECTION 6: Sample Queries (for testing)
-- ============================================================================

-- Insert a test experiment
-- INSERT INTO experiments (name, description, plugin_id, status, config)
-- VALUES ('Test SEO Experiment', 'A test SEO campaign', 'seo-plugin', 'DRAFT', '{"keywords": ["test keyword"]}'::jsonb);

-- Query experiments with JSON config access
-- SELECT name, plugin_id, status, config->>'keywords' as keywords FROM experiments;

-- Query tracking events by experiment with stats
-- SELECT
--     experiment_id,
--     event_type,
--     COUNT(*) as event_count,
--     COUNT(DISTINCT tracking_id) as unique_visitors
-- FROM tracking_events
-- WHERE experiment_id = 1
-- GROUP BY experiment_id, event_type;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All tables use BIGSERIAL for primary keys (auto-incrementing bigint)
-- 2. Foreign keys have ON DELETE CASCADE for automatic cleanup
-- 3. JSONB is used for flexible metadata storage
-- 4. GIN indexes on JSONB fields for efficient JSON querying
-- 5. updated_at is automatically maintained via triggers
-- ============================================================================
