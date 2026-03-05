-- Content Automation System Migration
-- Run this migration in order after the initial schema

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    image_url VARCHAR(1000),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'covered', 'ignored')),
    potential_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL,
    source_type VARCHAR(50) CHECK (source_type IN ('amazon_review', 'youtube', 'reddit', 'quora')),
    source_url VARCHAR(2000) NOT NULL,
    content TEXT NOT NULL,
    sentiment_score DECIMAL(3,2) DEFAULT 0.5,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_asin ON materials(asin);
CREATE INDEX IF NOT EXISTS idx_materials_source_type ON materials(source_type);

-- Material collect tasks table
CREATE TABLE IF NOT EXISTS material_collect_tasks (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL,
    source_types VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
    progress INTEGER DEFAULT 0,
    collected INTEGER DEFAULT 0,
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_collect_tasks_asin ON material_collect_tasks(asin);

-- Contents table
CREATE TABLE IF NOT EXISTS contents (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,
    asin VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('review', 'science', 'guide', 'blog', 'social', 'video', 'email')),
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    seo_title VARCHAR(200),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'approved', 'published', 'rejected')),
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),
    human_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER DEFAULT 0,
    review_comment TEXT,
    word_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug);
CREATE INDEX IF NOT EXISTS idx_contents_asin ON contents(asin);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);

-- Content generate tasks table
CREATE TABLE IF NOT EXISTS content_generate_tasks (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL,
    content_id INTEGER,
    type VARCHAR(20) CHECK (type IN ('review', 'science', 'guide', 'blog', 'social', 'video', 'email')),
    ai_model VARCHAR(50),
    prompt TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'success', 'failed')),
    result TEXT,
    error_msg TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_generate_tasks_asin ON content_generate_tasks(asin);
CREATE INDEX IF NOT EXISTS idx_content_generate_tasks_content_id ON content_generate_tasks(content_id);

-- Publish tasks table
CREATE TABLE IF NOT EXISTS publish_tasks (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    platforms VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'partial')),
    results JSONB,
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publish_tasks_content_id ON publish_tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_publish_tasks_status ON publish_tasks(status);

-- Publish platforms table
CREATE TABLE IF NOT EXISTS publish_platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    type VARCHAR(20) CHECK (type IN ('blogger', 'medium', 'wordpress', 'custom')),
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    last_test_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publish logs table
CREATE TABLE IF NOT EXISTS publish_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER,
    platform VARCHAR(50),
    type VARCHAR(20) CHECK (type IN ('success', 'error', 'info', 'warning')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publish_logs_task_id ON publish_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_platform ON publish_logs(platform);
CREATE INDEX IF NOT EXISTS idx_publish_logs_created_at ON publish_logs(created_at);

-- Analytics stats table
CREATE TABLE IF NOT EXISTS analytics_stats (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    published_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_stats_date ON analytics_stats(date);

-- Content performance table
CREATE TABLE IF NOT EXISTS content_performance (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, date)
);

CREATE INDEX IF NOT EXISTS idx_content_performance_content_id ON content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance(date);

-- Users table (simplified for content automation auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(200),
    password VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert demo user (password: password, in real implementation use bcrypt)
INSERT INTO users (email, name, password, role, status)
VALUES ('demo@example.com', 'Demo User', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzW5hxJw1a', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert default publish platforms
INSERT INTO publish_platforms (name, display_name, type, enabled, status)
VALUES
    ('Blogger', 'Blogger', 'blogger', TRUE, 'disconnected'),
    ('Medium', 'Medium', 'medium', FALSE, 'disconnected'),
    ('Own Blog', 'Own Blog', 'wordpress', TRUE, 'disconnected')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products for testing
INSERT INTO products (asin, title, category, price, rating, review_count, status, potential_score)
VALUES
    ('B08X6YZ9G5', 'Nespresso Vertuo Next Coffee & Espresso Machine', 'Coffee Machines', 179.99, 4.5, 1234, 'covered', 85.5),
    ('B07WQVFFQM', 'Breville Barista Express Espresso Machine', 'Coffee Machines', 449.99, 4.7, 856, 'covered', 92.3),
    ('B08FR7ZLJL', 'Cuisinart DGB-900 Grind & Brew', 'Coffee Makers', 99.99, 4.3, 445, 'researching', 78.2),
    ('B07WDGSPBH', 'Keurig K-Classic Coffee Maker', 'Coffee Makers', 89.99, 4.4, 567, 'researching', 81.0)
ON CONFLICT (asin) DO NOTHING;

-- Insert sample contents
INSERT INTO contents (slug, asin, title, type, content, excerpt, seo_title, seo_description, seo_keywords, status, ai_generated, word_count)
VALUES
    ('nespresso-vertuo-next-review', 'B08X6YZ9G5', 'Nespresso Vertuo Next 深度评测', 'review', '这是一篇关于 Nespresso Vertuo Next 的详细评测内容...', 'Nespresso Vertuo Next 是一款优秀的咖啡机', 'Nespresso Vertuo Next 评测 | ContentHub', '详细评测 Nespresso Vertuo Next 咖啡机', 'Nespresso, 评测, 咖啡机', 'published', TRUE, 1250),
    ('coffee-beans-storage-guide', 'B08X6YZ9G5', '咖啡豆保存指南', 'guide', '咖啡豆的正确保存方法...', '如何正确保存咖啡豆以保持新鲜度', '咖啡豆保存指南 | ContentHub', '学习如何正确保存咖啡豆', '咖啡豆, 保存, 指南', 'approved', TRUE, 890),
    ('best-espresso-machines-2024', 'B07WQVFFQM', '2024年最佳意式咖啡机推荐', 'science', '2024年最佳意式咖啡机推荐...', '我们评测了市面上最受欢迎的意式咖啡机', '最佳意式咖啡机 2024 | ContentHub', '2024年最佳意式咖啡机推荐', '咖啡机, 推荐, 2024', 'reviewing', TRUE, 2100)
ON CONFLICT (slug) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publish_tasks_updated_at BEFORE UPDATE ON publish_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publish_platforms_updated_at BEFORE UPDATE ON publish_platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_stats_updated_at BEFORE UPDATE ON analytics_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_performance_updated_at BEFORE UPDATE ON content_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_collect_tasks_updated_at BEFORE UPDATE ON material_collect_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_generate_tasks_updated_at BEFORE UPDATE ON content_generate_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
