-- ============================================================================
-- Affi-Marketing Affiliate Plugin Tables Migration
-- ============================================================================
-- Purpose: Create tables for affiliate link management and tracking
-- Author: 03-数据库工程师
-- Date: 2026-03-03
-- Dependencies: 000_init_database.sql, 001_core_tables.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: Affiliate Links Table
-- ============================================================================
-- Purpose: Store affiliate links with cloaking and performance tracking

CREATE TABLE IF NOT EXISTS affiliate_links (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    link_name VARCHAR(255),
    original_url TEXT NOT NULL,
    cloaked_url TEXT,
    network VARCHAR(100), -- e.g., 'amazon', 'shareasale', 'cj', 'impact'
    tracking_id VARCHAR(255) UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    link_type VARCHAR(50) DEFAULT 'STANDARD' CHECK (link_type IN ('STANDARD', 'DEEP', 'IMAGE', 'TEXT')),
    categories VARCHAR(255)[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER affiliate_links_updated_at
    BEFORE UPDATE ON affiliate_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for affiliate_links
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tracking_id ON affiliate_links(tracking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_experiment_id ON affiliate_links(experiment_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_network ON affiliate_links(network);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_categories ON affiliate_links USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_metadata ON affiliate_links USING GIN(metadata);

-- ============================================================================
-- SECTION 2: Affiliate Networks Table
-- ============================================================================
-- Purpose: Store affiliate network configurations

CREATE TABLE IF NOT EXISTS affiliate_networks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    website_url TEXT,
    tracking_format VARCHAR(100), -- e.g., 'subid', 'sid', 'tag'
    commission_rate DECIMAL(5,2),
    cookie_days INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    api_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER affiliate_networks_updated_at
    BEFORE UPDATE ON affiliate_networks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for affiliate_networks
CREATE INDEX IF NOT EXISTS idx_affiliate_networks_name ON affiliate_networks(name);
CREATE INDEX IF NOT EXISTS idx_affiliate_networks_status ON affiliate_networks(status);

-- ============================================================================
-- SECTION 3: Affiliate Click Events Table
-- ============================================================================
-- Purpose: Detailed click tracking for affiliate links

CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id BIGSERIAL PRIMARY KEY,
    affiliate_link_id BIGINT NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    tracking_id VARCHAR(255),
    click_id VARCHAR(255) UNIQUE NOT NULL DEFAULT (generate_click_id()),
    source_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2),
    device_type VARCHAR(50),
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for affiliate_clicks
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id ON affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_experiment_id ON affiliate_clicks(experiment_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tracking_id ON affiliate_clicks(tracking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_click_id ON affiliate_clicks(click_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at DESC);

-- ============================================================================
-- SECTION 4: Functions
-- ============================================================================

-- Function: Generate unique click ID
CREATE OR REPLACE FUNCTION generate_click_id()
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN 'clk_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function: Update affiliate link statistics
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.converted = true AND (OLD.converted = false OR OLD.converted IS NULL) THEN
        UPDATE affiliate_links
        SET
            clicks = clicks + 1,
            conversions = conversions + 1,
            revenue = revenue + COALESCE(NEW.conversion_value, 0)
        WHERE id = NEW.affiliate_link_id;
    ELSIF NEW.converted = false THEN
        UPDATE affiliate_links
        SET clicks = clicks + 1
        WHERE id = NEW.affiliate_link_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating affiliate stats
CREATE TRIGGER affiliate_clicks_after_insert
    AFTER INSERT ON affiliate_clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_stats();

-- ============================================================================
-- SECTION 5: Verification Queries
-- ============================================================================

-- Verify all tables were created
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('affiliate_links', 'affiliate_networks', 'affiliate_clicks')
ORDER BY tablename;

-- Verify all indexes were created
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'affiliate_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 6: Seed Data for Affiliate Networks
-- ============================================================================

INSERT INTO affiliate_networks (name, display_name, website_url, tracking_format, commission_rate, cookie_days, status) VALUES
('amazon', 'Amazon Associates', 'https://affiliate-program.amazon.com', 'tag', 4.0, 24, 'ACTIVE'),
('shareasale', 'ShareASale', 'https://www.shareasale.com', 'afftrack', NULL, 30, 'ACTIVE'),
('cj', 'Commission Junction', 'https://www.cj.com', 'sid', NULL, 30, 'ACTIVE'),
('impact', 'Impact', 'https://www.impact.com', 'subid1', NULL, 30, 'ACTIVE'),
('rakuten', 'Rakuten Advertising', 'https://www.rakutenadvertising.com', 'u1', NULL, 30, 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 7: Sample Queries (for testing)
-- ============================================================================

-- Create a test affiliate link
-- INSERT INTO affiliate_links (experiment_id, link_name, original_url, cloaked_url, network, tracking_id)
-- VALUES (
--     1,
--     'Best Running Shoes Deal',
--     'https://www.amazon.com/best-running-shoes?tag=your-tag-20',
--     'https://hub.zenconsult.top/r/clk_abc123',
--     'amazon',
--     'aff_abc123'
-- );

-- Query affiliate links by experiment
-- SELECT
--     l.link_name,
--     l.network,
--     l.clicks,
--     l.conversions,
--     ROUND(l.conversions * 100.0 / NULLIF(l.clicks, 0), 2) as conversion_rate,
--     l.revenue,
--     l.commission
-- FROM affiliate_links l
-- WHERE l.experiment_id = 1
-- ORDER BY l.revenue DESC;

-- Query affiliate link performance by network
-- SELECT
--     l.network,
--     COUNT(*) as link_count,
--     SUM(l.clicks) as total_clicks,
--     SUM(l.conversions) as total_conversions,
--     SUM(l.revenue) as total_revenue,
--     ROUND(SUM(l.conversions) * 100.0 / NULLIF(SUM(l.clicks), 0), 2) as avg_conversion_rate
-- FROM affiliate_links l
-- WHERE l.experiment_id = 1
-- GROUP BY l.network
-- ORDER BY total_revenue DESC;

-- Query click details for a specific link
-- SELECT
--     ac.click_id,
--     ac.source_url,
--     ac.referrer,
--     ac.device_type,
--     ac.country_code,
--     ac.converted,
--     ac.conversion_value,
--     ac.created_at
-- FROM affiliate_clicks ac
-- WHERE ac.affiliate_link_id = 1
-- ORDER BY ac.created_at DESC
-- LIMIT 100;

-- ============================================================================
-- SECTION 8: Maintenance Queries
-- ============================================================================

-- Reset affiliate link statistics (useful for testing)
-- UPDATE affiliate_links
-- SET clicks = 0, conversions = 0, revenue = 0, commission = 0
-- WHERE experiment_id = 1;

-- Find orphaned affiliate links (no experiment)
-- SELECT * FROM affiliate_links WHERE experiment_id NOT IN (SELECT id FROM experiments);

-- Cleanup old click events (older than 90 days)
-- DELETE FROM affiliate_clicks WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. tracking_id is unique across all affiliate links for proper attribution
-- 2. affiliate_clicks stores detailed click data with conversion flag
-- 3. Statistics are automatically updated via trigger on affiliate_clicks insert
-- 4. Array field for categories enables multi-category tagging
-- 5. JSONB metadata allows flexible storage of network-specific data
-- 6. click_id is generated automatically using gen_random_bytes() for uniqueness
-- ============================================================================
