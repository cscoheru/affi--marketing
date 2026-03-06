-- 内容自动化系统数据模型迁移
-- 创建日期: 2026-03-06
-- 说明: 新增选品、扩展素材、内容生成任务表

-- ============================================================
-- 1. 选品表 (products)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(200),
    category VARCHAR(200),
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    sales_rank INTEGER,
    image_url TEXT,
    product_url TEXT,
    marketplace VARCHAR(20) DEFAULT 'amazon.com',
    -- AI 推荐字段
    ai_score DECIMAL(5,2),
    ai_recommendation TEXT,
    ai_analysis JSONB,
    -- 状态字段
    status VARCHAR(50) DEFAULT 'pending',
    selected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(asin, marketplace)
);

CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_ai_score ON products(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_marketplace ON products(marketplace);

-- ============================================================
-- 2. 扩展素材表 (materials)
-- ============================================================
-- 检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size BIGINT DEFAULT 0,
    url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 添加新字段 (如果不存在)
DO $$
BEGIN
    -- 来源信息
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'source_type') THEN
        ALTER TABLE materials ADD COLUMN source_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'source_url') THEN
        ALTER TABLE materials ADD COLUMN source_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'product_id') THEN
        ALTER TABLE materials ADD COLUMN product_id BIGINT REFERENCES products(id);
    END IF;

    -- 原始内容
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'raw_content') THEN
        ALTER TABLE materials ADD COLUMN raw_content TEXT;
    END IF;

    -- AI 分析字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'ai_quality_score') THEN
        ALTER TABLE materials ADD COLUMN ai_quality_score DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'ai_summary') THEN
        ALTER TABLE materials ADD COLUMN ai_summary TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'ai_key_points') THEN
        ALTER TABLE materials ADD COLUMN ai_key_points JSONB;
    END IF;

    -- 审核状态
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'review_status') THEN
        ALTER TABLE materials ADD COLUMN review_status VARCHAR(50) DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'review_result') THEN
        ALTER TABLE materials ADD COLUMN review_result JSONB;
    END IF;

    -- 元数据
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'metadata') THEN
        ALTER TABLE materials ADD COLUMN metadata JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materials_product ON materials(product_id);
CREATE INDEX IF NOT EXISTS idx_materials_source_type ON materials(source_type);
CREATE INDEX IF NOT EXISTS idx_materials_review_status ON materials(review_status);

-- ============================================================
-- 3. 内容生成任务表 (content_generation_tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_generation_tasks (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    -- 关联的素材
    material_ids JSONB,
    -- 生成配置
    content_type VARCHAR(50) NOT NULL,
    target_platform VARCHAR(50),
    target_keywords JSONB,
    tone VARCHAR(50) DEFAULT 'professional',
    length VARCHAR(20) DEFAULT 'medium',
    -- 生成结果
    generated_title VARCHAR(500),
    generated_content TEXT,
    generated_slug VARCHAR(500),
    seo_metadata JSONB,
    -- AI 处理状态
    status VARCHAR(50) DEFAULT 'pending',
    ai_model VARCHAR(50),
    tokens_used INTEGER,
    error_message TEXT,
    -- 审核字段
    user_reviewed BOOLEAN DEFAULT FALSE,
    user_edits TEXT,
    final_content TEXT,
    -- 时间戳
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_tasks_product ON content_generation_tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON content_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_content_tasks_type ON content_generation_tasks(content_type);

-- ============================================================
-- 4. 评论/评测素材表 (review_materials)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_materials (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    material_id BIGINT REFERENCES materials(id),
    -- 评论信息
    author VARCHAR(200),
    rating DECIMAL(3,2),
    title VARCHAR(500),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    -- 来源信息
    source_type VARCHAR(50),  -- amazon_review, youtube_comment, etc.
    source_url TEXT,
    source_id VARCHAR(200),   -- 评论ID
    -- AI 分析
    sentiment VARCHAR(20),    -- positive/neutral/negative
    key_points JSONB,
    quality_score DECIMAL(5,2),
    -- 状态
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_materials_product ON review_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_review_materials_status ON review_materials(status);
CREATE INDEX IF NOT EXISTS idx_review_materials_sentiment ON review_materials(sentiment);

-- ============================================================
-- 5. 插入测试数据
-- ============================================================
-- 插入测试产品
INSERT INTO products (asin, name, brand, category, price, rating, review_count, marketplace, status)
VALUES
    ('B08N5KWB9H', 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones', 'Sony', 'Electronics', 349.99, 4.70, 45230, 'amazon.com', 'selected'),
    ('B0BDHB9Y8M', 'Apple AirPods Pro (2nd Generation)', 'Apple', 'Electronics', 249.00, 4.60, 89450, 'amazon.com', 'pending'),
    ('B09V3KXJPB', 'Apple Watch SE (2nd Gen)', 'Apple', 'Electronics', 279.00, 4.70, 32100, 'amazon.com', 'pending')
ON CONFLICT (asin, marketplace) DO NOTHING;

-- ============================================================
-- 完成
-- ============================================================
-- 迁移版本记录
INSERT INTO schema_migrations (version, applied_at)
VALUES ('005_content_automation', NOW())
ON CONFLICT (version) DO NOTHING;
