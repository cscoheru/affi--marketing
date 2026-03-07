-- 009_materials.sql
-- 素材库表

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,  -- product_intro, user_review, youtube_review, attachment
    content TEXT,
    source_url VARCHAR(500),
    file_path VARCHAR(500),
    file_name VARCHAR(200),
    file_size BIGINT DEFAULT 0,
    market_id INTEGER NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
    word_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_materials_market_id ON materials(market_id);

-- Comment
COMMENT ON TABLE materials IS '素材库 - 存储产品介绍、用户评论、YouTube评测等素材';
