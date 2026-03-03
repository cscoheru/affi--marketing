-- ============================================================================
-- Affi-Marketing GEO Plugin Tables Migration
-- ============================================================================
-- Purpose: Create tables for Generated Engine Optimization (GEO)
-- Description: GEO is a technique for generating large numbers of optimized pages
--              using AI and templates, similar to programmatic SEO but with
--              dynamic content generation.
-- Author: 03-数据库工程师
-- Date: 2026-03-03
-- Dependencies: 000_init_database.sql, 001_core_tables.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: GEO Pages Table
-- ============================================================================
-- Purpose: Store GEO page templates and configurations

CREATE TABLE IF NOT EXISTS geo_pages (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    page_name VARCHAR(255) NOT NULL,
    url_template TEXT NOT NULL, -- e.g., '/shoes/{brand}/{color}'
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'GENERATING', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    page_type VARCHAR(100), -- e.g., 'category', 'comparison', 'review', 'listing'
    total_variants INTEGER DEFAULT 0,
    published_variants INTEGER DEFAULT 0,
    template_config JSONB NOT NULL DEFAULT '{}',
    generation_settings JSONB DEFAULT '{}',
    seo_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER geo_pages_updated_at
    BEFORE UPDATE ON geo_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for geo_pages
CREATE INDEX IF NOT EXISTS idx_geo_pages_experiment_id ON geo_pages(experiment_id);
CREATE INDEX IF NOT EXISTS idx_geo_pages_status ON geo_pages(status);
CREATE INDEX IF NOT EXISTS idx_geo_pages_page_type ON geo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_geo_pages_template_config ON geo_pages USING GIN(template_config);
CREATE INDEX IF NOT EXISTS idx_geo_pages_seo_metadata ON geo_pages USING GIN(seo_metadata);

-- ============================================================================
-- SECTION 2: GEO Variants Table
-- ============================================================================
-- Purpose: Store individual generated page variants

CREATE TABLE IF NOT EXISTS geo_variants (
    id BIGSERIAL PRIMARY KEY,
    geo_page_id BIGINT NOT NULL REFERENCES geo_pages(id) ON DELETE CASCADE,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_name VARCHAR(255),
    generated_url TEXT UNIQUE NOT NULL,
    canonical_url TEXT,
    variant_data JSONB NOT NULL DEFAULT '{}', -- Variable substitutions
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'GENERATED', 'PUBLISHED', 'INDEXED', 'ERROR')),
    content_html TEXT,
    content_hash VARCHAR(64), -- SHA-256 hash for content change detection
    generation_metadata JSONB DEFAULT '{}',
    last_generated_at TIMESTAMP,
    published_at TIMESTAMP,
    indexed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER geo_variants_updated_at
    BEFORE UPDATE ON geo_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for geo_variants
CREATE INDEX IF NOT EXISTS idx_geo_variants_geo_page_id ON geo_variants(geo_page_id);
CREATE INDEX IF NOT EXISTS idx_geo_variants_experiment_id ON geo_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_geo_variants_status ON geo_variants(status);
CREATE INDEX IF NOT EXISTS idx_geo_variants_generated_url ON geo_variants(generated_url);
CREATE INDEX IF NOT EXISTS idx_geo_variants_content_hash ON geo_variants(content_hash);
CREATE INDEX IF NOT EXISTS idx_geo_variants_variant_data ON geo_variants USING GIN(variant_data);

-- ============================================================================
-- SECTION 3: GEO Performance Metrics Table
-- ============================================================================
-- Purpose: Track performance metrics for generated pages

CREATE TABLE IF NOT EXISTS geo_metrics (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT NOT NULL REFERENCES geo_variants(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_time_on_page INTEGER, -- in seconds
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    serp_position INTEGER,
    indexed BOOLEAN DEFAULT FALSE,
    core_web_vitals JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_variant_date UNIQUE (variant_id, measurement_date)
);

-- Indexes for geo_metrics
CREATE INDEX IF NOT EXISTS idx_geo_metrics_variant_id ON geo_metrics(variant_id);
CREATE INDEX IF NOT EXISTS idx_geo_metrics_date ON geo_metrics(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_geo_metrics_indexed ON geo_metrics(indexed);

-- ============================================================================
-- SECTION 4: GEO Generation Queue Table
-- ============================================================================
-- Purpose: Queue for batch page generation

CREATE TABLE IF NOT EXISTS geo_generation_queue (
    id BIGSERIAL PRIMARY KEY,
    geo_page_id BIGINT NOT NULL REFERENCES geo_pages(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    batch_size INTEGER DEFAULT 100,
    total_to_generate INTEGER DEFAULT 0,
    generated_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for geo_generation_queue
CREATE INDEX IF NOT EXISTS idx_geo_queue_geo_page_id ON geo_generation_queue(geo_page_id);
CREATE INDEX IF NOT EXISTS idx_geo_queue_status ON geo_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_geo_queue_priority ON geo_generation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_geo_queue_created_at ON geo_generation_queue(created_at DESC);

-- ============================================================================
-- SECTION 5: Functions
-- ============================================================================

-- Function: Generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(content TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(content, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function: Update geo page variant counts
CREATE OR REPLACE FUNCTION update_geo_page_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE geo_pages
        SET
            total_variants = total_variants + 1,
            published_variants = published_variants + (CASE WHEN NEW.status = 'PUBLISHED' THEN 1 ELSE 0 END)
        WHERE id = NEW.geo_page_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'PUBLISHED' AND NEW.status = 'PUBLISHED' THEN
            UPDATE geo_pages SET published_variants = published_variants + 1 WHERE id = NEW.geo_page_id;
        ELSIF OLD.status = 'PUBLISHED' AND NEW.status != 'PUBLISHED' THEN
            UPDATE geo_pages SET published_variants = published_variants - 1 WHERE id = NEW.geo_page_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE geo_pages
        SET
            total_variants = total_variants - 1,
            published_variants = published_variants - (CASE WHEN OLD.status = 'PUBLISHED' THEN 1 ELSE 0 END)
        WHERE id = OLD.geo_page_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating geo page counts
CREATE TRIGGER geo_variants_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON geo_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_geo_page_counts();

-- ============================================================================
-- SECTION 6: Verification Queries
-- ============================================================================

-- Verify all tables were created
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('geo_pages', 'geo_variants', 'geo_metrics', 'geo_generation_queue')
ORDER BY tablename;

-- Verify all indexes were created
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'geo_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 7: Sample Queries (for testing)
-- ============================================================================

-- Create a test GEO page
-- INSERT INTO geo_pages (experiment_id, page_name, url_template, description, page_type, template_config)
-- VALUES (
--     1,
--     'Running Shoes by Brand',
--     '/shoes/running/{brand}/{gender}',
--     'Dynamic pages for running shoes filtered by brand and gender',
--     'category',
--     '{"brands": ["nike", "adidas", "new-balance"], "genders": ["mens", "womens"], "template": "product-listing"}'::jsonb
-- );

-- Create test variants
-- INSERT INTO geo_variants (geo_page_id, experiment_id, variant_name, generated_url, variant_data, status)
-- VALUES
--     (1, 1, 'Nike Mens', '/shoes/running/nike/mens', '{"brand": "Nike", "gender": "Mens"}'::jsonb, 'PUBLISHED'),
--     (1, 1, 'Nike Womens', '/shoes/running/nike/womens', '{"brand": "Nike", "gender": "Womens"}'::jsonb, 'PUBLISHED'),
--     (1, 1, 'Adidas Mens', '/shoes/running/adidas/mens', '{"brand": "Adidas", "gender": "Mens"}'::jsonb, 'PENDING');

-- Query GEO pages with variant counts
-- SELECT
--     p.page_name,
--     p.url_template,
--     p.page_type,
--     p.status as page_status,
--     p.total_variants,
--     p.published_variants,
--     ROUND(p.published_variants * 100.0 / NULLIF(p.total_variants, 0), 2) as publish_rate
-- FROM geo_pages p
-- WHERE p.experiment_id = 1
-- ORDER BY p.total_variants DESC;

-- Query variants by GEO page
-- SELECT
--     v.variant_name,
--     v.generated_url,
--     v.status,
--     v.variant_data->>'brand' as brand,
--     v.variant_data->>'gender' as gender,
--     v.published_at
-- FROM geo_variants v
-- WHERE v.geo_page_id = 1
-- ORDER BY v.created_at DESC;

-- Query performance metrics
-- SELECT
--     v.variant_name,
--     m.measurement_date,
--     m.page_views,
--     m.unique_visitors,
--     m.bounce_rate,
--     m.conversions,
--     m.revenue,
--     ROUND(m.conversions * 100.0 / NULLIF(m.unique_visitors, 0), 2) as conversion_rate
-- FROM geo_variants v
-- JOIN geo_metrics m ON v.id = m.variant_id
-- WHERE v.geo_page_id = 1
-- ORDER BY m.measurement_date DESC, v.variant_name;

-- ============================================================================
-- SECTION 8: Maintenance Queries
-- ============================================================================

-- Find GEO pages with generation errors
-- SELECT
--     p.page_name,
--     p.status,
--     COUNT(v.id) FILTER (WHERE v.status = 'ERROR') as error_count,
--     COUNT(v.id) FILTER (WHERE v.status = 'PENDING') as pending_count
-- FROM geo_pages p
-- LEFT JOIN geo_variants v ON p.id = v.geo_page_id
-- WHERE p.experiment_id = 1
-- GROUP BY p.id, p.page_name, p.status
-- HAVING COUNT(v.id) FILTER (WHERE v.status = 'ERROR') > 0;

-- Get generation queue status
-- SELECT
--     q.status,
--     COUNT(*) as queue_count,
--     SUM(q.total_to_generate) as total_jobs,
--     SUM(q.generated_count) as total_generated
-- FROM geo_generation_queue q
-- GROUP BY q.status;

-- Cleanup old metrics (older than 6 months)
-- DELETE FROM geo_metrics WHERE measurement_date < CURRENT_DATE - INTERVAL '6 months';

-- ============================================================================
-- SECTION 9: Performance Analysis Queries
-- ============================================================================

-- Top performing GEO variants
-- SELECT
--     v.variant_name,
--     v.generated_url,
--     SUM(m.page_views) as total_views,
--     SUM(m.conversions) as total_conversions,
--     SUM(m.revenue) as total_revenue,
--     ROUND(AVG(m.bounce_rate), 2) as avg_bounce_rate
-- FROM geo_variants v
-- JOIN geo_metrics m ON v.id = m.variant_id
-- WHERE v.status = 'PUBLISHED'
-- AND v.geo_page_id = 1
-- GROUP BY v.id, v.variant_name, v.generated_url
-- ORDER BY total_revenue DESC
-- LIMIT 10;

-- GEO page type performance comparison
-- SELECT
--     p.page_type,
--     COUNT(DISTINCT p.id) as page_count,
--     SUM(v.total_variants) as total_variants,
--     SUM(m.page_views) as total_page_views,
--     SUM(m.conversions) as total_conversions,
--     SUM(m.revenue) as total_revenue
-- FROM geo_pages p
-- JOIN geo_variants v ON p.id = v.geo_page_id
-- LEFT JOIN geo_metrics m ON v.id = m.variant_id
-- WHERE p.experiment_id = 1
-- GROUP BY p.page_type
-- ORDER BY total_revenue DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. GEO (Generated Engine Optimization) pages are template-based
--    with dynamic content generation
-- 2. url_template uses {placeholder} syntax for variable substitution
-- 3. variant_data contains the actual values for each generated page
-- 4. Content hash enables change detection and incremental regeneration
-- 5. Generation queue enables asynchronous batch processing
-- 6. Performance metrics are tracked daily for each variant
-- 7. JSONB fields provide flexibility for template and SEO metadata
-- ============================================================================
