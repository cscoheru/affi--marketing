-- 内容企业架构重构迁移
-- 创建日期: 2026-03-06
-- 说明: 实现从"Amazon推广员"到"内容企业"的认知转变
-- 核心概念:
--   - Amazon商品 -> 市场机会 (market_opportunities)
--   - 内容 -> 产品 (products)
--   - 产品与市场的多对多关联 (product_markets)

-- ============================================================
-- 1. 备份并重命名现有表
-- ============================================================

-- 首先删除旧的检查约束（如果存在）
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_status_check;

-- 备份现有的 products 表（Amazon商品）
-- 这将成为市场机会表的基础
ALTER TABLE IF EXISTS products RENAME TO products_old_backup;

-- 备份现有的 contents 表（内容）
-- 这将成为新的产品表
ALTER TABLE IF EXISTS contents RENAME TO products;

-- ============================================================
-- 2. 创建市场机会表 (market_opportunities)
-- ============================================================

CREATE TABLE IF NOT EXISTS market_opportunities (
    id BIGSERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2),
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    image_url TEXT,

    -- 市场状态: watching/targeting/active/saturated/exited
    status VARCHAR(20) DEFAULT 'watching',

    -- 市场评估
    market_size VARCHAR(20),       -- large/medium/small
    competition_level VARCHAR(20), -- high/medium/low
    content_potential VARCHAR(20), -- high/medium/low
    ai_score INTEGER,               -- AI推荐评分 (0-100)

    -- 统计数据（从关联内容汇总）
    content_count INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,

    -- 时间戳
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_market_opportunities_status ON market_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_market_opportunities_category ON market_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_market_opportunities_ai_score ON market_opportunities(ai_score DESC);

-- 从旧的 products 表迁移数据到 market_opportunities
INSERT INTO market_opportunities (
    asin, title, category, price, rating, review_count,
    image_url, status, created_at, updated_at
)
SELECT
    asin,
    title,
    category,
    price,
    rating,
    review_count,
    image_url,
    CASE
        WHEN status = 'pending' THEN 'watching'
        WHEN status = 'testing' THEN 'targeting'
        WHEN status = 'active' THEN 'active'
        WHEN status = 'phased_out' THEN 'exited'
        ELSE 'watching'
    END,
    created_at,
    updated_at
FROM products_old_backup;

-- ============================================================
-- 3. 创建产品与市场的关联表 (product_markets)
-- ============================================================

CREATE TABLE IF NOT EXISTS product_markets (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (market_id) REFERENCES market_opportunities(id) ON DELETE CASCADE,
    UNIQUE(product_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_product_markets_product ON product_markets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_markets_market ON product_markets(market_id);
CREATE INDEX IF NOT EXISTS idx_product_markets_primary ON product_markets(is_primary) WHERE is_primary = TRUE;

-- 迁移现有的内容与产品关联
-- 假设 contents 表中的 asin 字段引用了 products 表
INSERT INTO product_markets (product_id, market_id, is_primary, created_at)
SELECT
    p.id as product_id,
    mo.id as market_id,
    TRUE as is_primary,
    p.created_at
FROM products p
INNER JOIN products_old_backup po ON p.asin = po.asin
INNER JOIN market_opportunities mo ON mo.asin = po.asin;

-- ============================================================
-- 4. 更新发布任务表 (publish_tasks)
-- ============================================================

-- 重命名 content_id 为 product_id（如果列存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='publish_tasks' AND column_name='content_id'
    ) THEN
        ALTER TABLE publish_tasks RENAME COLUMN content_id TO product_id;
    END IF;
END $$;

-- 添加新列（如果不存在）
ALTER TABLE publish_tasks
    ADD COLUMN IF NOT EXISTS platform VARCHAR(50),
    ADD COLUMN IF NOT EXISTS published_url TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- 移除旧的 results 和 error_msg 列（如果存在）
ALTER TABLE publish_tasks
    DROP COLUMN IF EXISTS results,
    DROP COLUMN IF EXISTS error_msg,
    DROP COLUMN IF EXISTS platforms;

-- ============================================================
-- 5. 创建点击事件表 (click_events)
-- ============================================================

CREATE TABLE IF NOT EXISTS click_events (
    id BIGSERIAL PRIMARY KEY,
    click_id VARCHAR(100) NOT NULL UNIQUE,
    market_id BIGINT,
    product_id BIGINT,
    platform VARCHAR(50),

    -- 追踪信息
    user_fingerprint VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- 设备信息
    device_type VARCHAR(20), -- desktop/mobile/tablet
    browser VARCHAR(50),
    country VARCHAR(10),

    clicked_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (market_id) REFERENCES market_opportunities(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_click_events_click_id ON click_events(click_id);
CREATE INDEX IF NOT EXISTS idx_click_events_market ON click_events(market_id);
CREATE INDEX IF NOT EXISTS idx_click_events_product ON click_events(product_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

-- ============================================================
-- 6. 创建转化事件表 (conversion_events)
-- ============================================================

CREATE TABLE IF NOT EXISTS conversion_events (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(100),
    click_id VARCHAR(100),
    market_id BIGINT,

    -- 商品信息
    asin VARCHAR(20),
    product_title VARCHAR(500),
    quantity INTEGER DEFAULT 1,

    -- 金额
    product_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    commission DECIMAL(10,2),
    commission_rate DECIMAL(5,4),

    -- 时间
    ordered_at TIMESTAMP,
    shipped_at TIMESTAMP,
    reported_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (market_id) REFERENCES market_opportunities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_order_id ON conversion_events(order_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_click_id ON conversion_events(click_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_market ON conversion_events(market_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_reported_at ON conversion_events(reported_at);

-- ============================================================
-- 7. 更新产品（内容）状态枚举
-- ============================================================

-- 更新状态值以匹配新的产品生命周期
UPDATE products
SET status = CASE
    WHEN status = 'pending' THEN 'draft'
    WHEN status = 'reviewing' THEN 'review'
    WHEN status = 'approved' THEN 'approved'
    WHEN status = 'published' THEN 'published'
    ELSE 'draft'
END
WHERE status IN ('pending', 'reviewing', 'approved', 'published');

-- 添加 CHECK 约束确保状态值有效
ALTER TABLE products
    ADD CONSTRAINT chk_product_status
    CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived'));

-- ============================================================
-- 8. 更新市场机会状态枚举
-- ============================================================

-- 添加 CHECK 约束确保状态值有效
ALTER TABLE market_opportunities
    ADD CONSTRAINT chk_market_status
    CHECK (status IN ('watching', 'targeting', 'active', 'saturated', 'exited'));

-- ============================================================
-- 9. 创建视图以方便查询
-- ============================================================

-- 市场机会与关联内容统计视图
CREATE OR REPLACE VIEW v_market_summary AS
SELECT
    mo.id,
    mo.asin,
    mo.title,
    mo.category,
    mo.price,
    mo.rating,
    mo.status,
    mo.market_size,
    mo.competition_level,
    mo.content_potential,
    mo.ai_score,
    COUNT(pm.id) as content_count,
    SUM(pt.views) as total_views,
    SUM(pt.clicks) as total_clicks,
    SUM(pt.conversions) as total_conversions,
    SUM(pt.revenue) as total_revenue
FROM market_opportunities mo
LEFT JOIN product_markets pm ON mo.id = pm.market_id
LEFT JOIN products p ON pm.product_id = p.id
LEFT JOIN publish_tasks pt ON p.id = pt.product_id
GROUP BY mo.id;

-- 产品（内容）表现汇总视图
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
    p.id,
    p.slug,
    p.title,
    p.type,
    p.status,
    p.published_at,
    COUNT(DISTINCT pt.platform) as platforms_published,
    SUM(pt.views) as total_views,
    SUM(pt.clicks) as total_clicks,
    SUM(pt.conversions) as total_conversions,
    SUM(pt.revenue) as total_revenue
FROM products p
LEFT JOIN publish_tasks pt ON p.id = pt.product_id
GROUP BY p.id;

-- ============================================================
-- 10. 迁移完成备注
-- ============================================================

-- 备份表保留:
-- - products_old_backup: 原 products 表备份
--
-- 新表结构:
-- - market_opportunities: 市场机会（原Amazon商品）
-- - products: 产品（内容，原contents表）
-- - product_markets: 产品与市场的关联
-- - click_events: 点击事件
-- - conversion_events: 转化事件
--
-- 下一阶段建议:
-- 1. 验证所有数据迁移正确
-- 2. 更新应用代码使用新的表结构
-- 3. 确认无问题后删除 products_old_backup 表
