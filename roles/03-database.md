# 角色任务卡: 数据库工程师 (Database Engineer)

## 角色信息
- **角色ID**: 03-database
- **角色名称**: 数据库工程师
- **预计时长**: 8 小时
- **主要职责**: 数据库设计、迁移脚本、数据初始化

## 核心任务

### 1. 数据库初始化 (1h)

连接到阿里云 PostgreSQL，创建业务数据库：

```bash
# SSH 到阿里云
ssh aliyun

# 连接到 PostgreSQL
docker exec -it postgres psql -U postgres

-- 创建数据库
CREATE DATABASE business_hub;

-- 连接到新数据库
\c business_hub

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**输出**: 数据库 `business_hub` 已创建

### 2. 表结构设计 (2h)

根据架构师的数据模型设计，创建所有表：

#### 核心表 (001_core_tables.sql)
```sql
-- 实验表
CREATE TABLE experiments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plugin_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    config JSONB NOT NULL DEFAULT '{}',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 追踪事件表
CREATE TABLE tracking_events (
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

-- 转化表
CREATE TABLE conversions (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    plugin_id VARCHAR(100) NOT NULL,
    tracking_id VARCHAR(255),
    conversion_type VARCHAR(100),
    amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    commission DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- 结算记录表
CREATE TABLE settlement_records (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tracking_events_tracking_id ON tracking_events(tracking_id);
CREATE INDEX idx_tracking_events_experiment_id ON tracking_events(experiment_id);
CREATE INDEX idx_conversions_tracking_id ON conversions(tracking_id);
CREATE INDEX idx_conversions_experiment_id ON conversions(experiment_id);
```

#### SEO 插件表 (002_seo_tables.sql)
```sql
-- SEO 关键词表
CREATE TABLE seo_keywords (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    keyword VARCHAR(500) NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(50),
    target_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    current_rank INTEGER,
    best_rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 内容生成任务表
CREATE TABLE content_generation_tasks (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    keyword_id BIGINT REFERENCES seo_keywords(id) ON DELETE CASCADE,
    title VARCHAR(500),
    target_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    content_html TEXT,
    generated_at TIMESTAMP,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_keywords_experiment_id ON seo_keywords(experiment_id);
CREATE INDEX idx_content_tasks_experiment_id ON content_generation_tasks(experiment_id);
```

#### 联盟插件表 (003_affiliate_tables.sql)
```sql
-- 联盟链接表
CREATE TABLE affiliate_links (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id) ON DELETE CASCADE,
    link_name VARCHAR(255),
    original_url TEXT NOT NULL,
    cloaked_url TEXT,
    network VARCHAR(100),
    tracking_id VARCHAR(255) UNIQUE,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_affiliate_links_tracking_id ON affiliate_links(tracking_id);
CREATE INDEX idx_affiliate_links_experiment_id ON affiliate_links(experiment_id);
```

**输出**: `migrations/` 目录下的 SQL 文件

### 3. 执行迁移 (1h)

```bash
# 执行所有迁移脚本
for file in migrations/*.sql; do
    docker exec -i postgres psql -U postgres -d business_hub < "$file"
done
```

### 4. MinIO 存储桶 (1h)

连接到香港节点，创建对象存储桶：

```bash
ssh hk

# 创建存储桶
docker exec -it minio mc alias set local http://minio:9000 admin xhOSMeHNmxCgNTBpoQfH
docker exec -it minio mc mb local/business-hub
docker exec -it minio mc policy set public local/business-hub
```

### 5. 数据验证 (1h)

```bash
# 验证表创建
docker exec -it postgres psql -U postgres -d business_hub -c "\dt"

# 验证索引
docker exec -it postgres psql -U postgres -d business_hub -c "\di"

# 验证扩展
docker exec -it postgres psql -U postgres -d business_hub -c "SELECT extname FROM pg_extension;"
```

### 6. 备份策略 (1h)

设置自动备份：

```bash
# 创建备份脚本
cat > /opt/backups/business-hub-backup.sh << 'EOF'
#!/bin/bash
docker exec postgres pg_dump -U postgres business_hub > /opt/backups/business-hub-$(date +%Y%m%d).sql
find /opt/backups -name "business-hub-*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backups/business-hub-backup.sh

# 添加到 crontab (每日2点)
echo "0 2 * * * /opt/backups/business-hub-backup.sh" | crontab -
```

### 7. 文档 (1h)

创建数据库文档：

**输出**: `docs/DATABASE_SCHEMA.md`

包含：
- 表结构图
- 字段说明
- 索引说明
- 关系图
- 查询示例

## 输入依赖

- [x] 架构师提供的数据模型设计
- [x] 基础设施连接信息

## 交付产物

| 文件 | 描述 |
|------|------|
| `migrations/001_core_tables.sql` | 核心表 |
| `migrations/002_seo_tables.sql` | SEO表 |
| `migrations/003_affiliate_tables.sql` | 联盟表 |
| `migrations/004_geo_tables.sql` | GEO表 |
| `docs/DATABASE_SCHEMA.md` | 数据库文档 |

## 数据库连接信息

```
Host: 139.224.42.111
Port: 5432
Database: business_hub
User: postgres
Password: WhjQTPAwInc5Vav3sDWe
```

## 验证清单

- [ ] business_hub 数据库已创建
- [ ] 所有扩展已安装
- [ ] 所有表已创建
- [ ] 所有索引已创建
- [ ] MinIO 存储桶已创建
- [ ] 备份脚本已配置
- [ ] 文档已完成

## 完成标准

1. ✅ 数据库可正常连接
2. ✅ 所有表结构正确
3. ✅ 迁移脚本可重复执行
4. ✅ 备份策略已配置

---

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/03-database.md"
