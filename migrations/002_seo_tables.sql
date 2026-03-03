-- ============================================================================
-- Affi-Marketing SEO Plugin Tables Migration
-- ============================================================================
-- Purpose: Create tables for SEO keyword management and content generation
-- Author: 03-数据库工程师
-- Date: 2026-03-03
-- Dependencies: 000_init_database.sql, 001_core_tables.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: SEO Keywords Table
-- ============================================================================
-- Purpose: Store SEO keywords for tracking and optimization

CREATE TABLE IF NOT EXISTS seo_keywords (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    keyword VARCHAR(500) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(50) CHECK (competition_level IN ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN')),
    target_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESEARCHING', 'TARGETING', 'OPTIMIZING', 'RANKING')),
    current_rank INTEGER,
    best_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_experiment_keyword UNIQUE (experiment_id, keyword)
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER seo_keywords_updated_at
    BEFORE UPDATE ON seo_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for seo_keywords
CREATE INDEX IF NOT EXISTS idx_seo_keywords_experiment_id ON seo_keywords(experiment_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_status ON seo_keywords(status);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords USING gin(keyword gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_competition ON seo_keywords(competition_level);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_current_rank ON seo_keywords(current_rank);

-- ============================================================================
-- SECTION 2: Content Generation Tasks Table
-- ============================================================================
-- Purpose: Store AI content generation tasks for SEO pages

CREATE TABLE IF NOT EXISTS content_generation_tasks (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    keyword_id BIGINT REFERENCES seo_keywords(id) ON DELETE SET NULL,
    title VARCHAR(500),
    target_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'GENERATED', 'PUBLISHED', 'FAILED')),
    content_html TEXT,
    prompt_template TEXT,
    generation_metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER content_generation_tasks_updated_at
    BEFORE UPDATE ON content_generation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for content_generation_tasks
CREATE INDEX IF NOT EXISTS idx_content_tasks_experiment_id ON content_generation_tasks(experiment_id);
CREATE INDEX IF NOT EXISTS idx_content_tasks_keyword_id ON content_generation_tasks(keyword_id);
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON content_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_content_tasks_target_url ON content_generation_tasks(target_url);
CREATE INDEX IF NOT EXISTS idx_content_tasks_created_at ON content_generation_tasks(created_at DESC);

-- ============================================================================
-- SECTION 3: SEO Performance Metrics Table (Optional Enhancement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_metrics (
    id BIGSERIAL PRIMARY KEY,
    keyword_id BIGINT NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rank_position INTEGER,
    organic_traffic INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2),
    impressions INTEGER DEFAULT 0,
    backlinks INTEGER DEFAULT 0,
    domain_authority DECIMAL(3,1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_keyword_date UNIQUE (keyword_id, measurement_date)
);

-- Indexes for seo_metrics
CREATE INDEX IF NOT EXISTS idx_seo_metrics_keyword_id ON seo_metrics(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_metrics_date ON seo_metrics(measurement_date DESC);

-- ============================================================================
-- SECTION 4: Verification Queries
-- ============================================================================

-- Verify all tables were created
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('seo_keywords', 'content_generation_tasks', 'seo_metrics')
ORDER BY tablename;

-- Verify all indexes were created
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'seo_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 5: Sample Queries (for testing)
-- ============================================================================

-- Insert test keywords
-- INSERT INTO seo_keywords (experiment_id, keyword, search_volume, competition_level, status)
-- VALUES
--     (1, 'best running shoes 2024', 5000, 'HIGH', 'TARGETING'),
--     (1, 'cheap running shoes', 2000, 'MEDIUM', 'TARGETING'),
--     (1, 'running shoes for beginners', 1000, 'LOW', 'PENDING');

-- Query keywords by experiment with filtering
-- SELECT
--     keyword,
--     search_volume,
--     competition_level,
--     current_rank,
--     CASE
--         WHEN current_rank <= 10 THEN 'Top 10'
--         WHEN current_rank <= 50 THEN 'Top 50'
--         ELSE 'Outside 50'
--     END as rank_category
-- FROM seo_keywords
-- WHERE experiment_id = 1
-- ORDER BY search_volume DESC;

-- Query keywords with content tasks
-- SELECT
--     k.keyword,
--     k.status as keyword_status,
--     COUNT(t.id) as task_count,
--     COUNT(CASE WHEN t.status = 'PUBLISHED' THEN 1 END) as published_count
-- FROM seo_keywords k
-- LEFT JOIN content_generation_tasks t ON k.id = t.keyword_id
-- WHERE k.experiment_id = 1
-- GROUP BY k.id, k.keyword, k.status;

-- Calculate keyword performance
-- SELECT
--     k.keyword,
--     k.current_rank,
--     k.best_rank,
--     m.organic_traffic,
--     m.click_through_rate
-- FROM seo_keywords k
-- LEFT JOIN LATERAL (
--     SELECT
--         organic_traffic,
--         click_through_rate,
--         rank_position
--     FROM seo_metrics
--     WHERE keyword_id = k.id
--     ORDER BY measurement_date DESC
--     LIMIT 1
-- ) m ON true
-- WHERE k.experiment_id = 1;

-- ============================================================================
-- SECTION 6: Useful Aggregate Queries
-- ============================================================================

-- Keyword summary by competition level
-- SELECT
--     competition_level,
--     COUNT(*) as keyword_count,
--     AVG(search_volume) as avg_volume,
--     AVG(current_rank) as avg_rank
-- FROM seo_keywords
-- WHERE experiment_id = 1
-- GROUP BY competition_level;

-- Content generation progress
-- SELECT
--     status,
--     COUNT(*) as count,
--     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
-- FROM content_generation_tasks
-- WHERE experiment_id = 1
-- GROUP BY status;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. seo_keywords has a unique constraint on (experiment_id, keyword)
--    to prevent duplicate keywords per experiment
-- 2. content_generation_tasks can exist without a keyword_id (for standalone content)
-- 3. seo_metrics stores daily performance data for tracking keyword trends
-- 4. Trigram indexes enable efficient text search on keyword field
-- 5. JSONB fields allow flexible storage of generation metadata and metrics
-- ============================================================================
