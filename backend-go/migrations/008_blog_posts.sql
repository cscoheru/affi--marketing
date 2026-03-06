-- 博客文章表
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    category_id BIGINT,
    author_id BIGINT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published
    image_url VARCHAR(500),
    published_at TIMESTAMP,

    -- SEO 字段
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    meta_keywords VARCHAR(200),

    -- 统计字段
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published'))
);

-- 创建索引
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- 博客分类表
CREATE TABLE IF NOT EXISTS blog_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT REFERENCES blog_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建分类索引
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_parent ON blog_categories(parent_id);

-- 插入默认分类
INSERT INTO blog_categories (name, slug, description) VALUES
    ('营销策略', 'marketing', '联盟营销策略和技巧'),
    ('产品评测', 'reviews', '联盟产品和平台评测'),
    ('SEO优化', 'seo', '搜索引擎优化技巧'),
    ('工具推荐', 'tools', '营销工具和资源推荐')
ON CONFLICT (slug) DO NOTHING;

-- 插入示例文章
INSERT INTO blog_posts (title, slug, content, excerpt, category_id, status, image_url, published_at, meta_title, meta_description, author_id)
SELECT
    '2024年联盟营销完整指南',
    'affiliate-marketing-guide-2024',
    '# 2024年联盟营销完整指南

## 什么是联盟营销？

联盟营销是一种基于效果的营销方式，商家通过联盟会员推广产品或服务，并按实际效果（销售、引导等）支付佣金。

## 联盟营销的优势

1. **低风险**：按效果付费，无需预先投入大量广告费用
2. **可扩展**：可以同时推广多个产品和服务
3. **被动收入**：建立渠道后可持续获得收入

## 如何开始联盟营销

### 第一步：选择利基市场

选择一个您熟悉且有兴趣的领域，这样可以创作更专业的内容。

### 第二步：选择联盟计划

研究并选择可靠的联盟计划，考虑以下因素：
- 佣金比例
- 产品质量
- 支付条件
- 联盟支持

### 第三步：建立内容平台

创建博客、YouTube 频道或社交媒体账号，定期发布有价值的内容。

### 第四步：优化转化

通过 SEO、内容优化和用户体验改进来提高转化率。',
    '从零开始学习联盟营销，包括策略、工具和最佳实践',
    (SELECT id FROM blog_categories WHERE slug = 'marketing'),
    'published',
    '/images/blog/affiliate-guide.jpg',
    '2024-01-15 00:00:00',
    '2024年联盟营销完整指南 | Affi Marketing Blog',
    '从零开始学习联盟营销，包括策略、工具和最佳实践',
    1
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'affiliate-marketing-guide-2024');

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

CREATE TRIGGER blog_categories_updated_at
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();
