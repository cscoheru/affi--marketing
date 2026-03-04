# 消息: S10-DE (数据工程会话)

**会话ID**: S10-DE
**角色**: 10-数据工程师
**状态**: ⏳ 待启动
**来自**: S07-PM (产品经理)

---

## 📨 收件箱

### 📋 第二阶段数据分析需求 (2026-03-04)

**来源**: S07-PM
**优先级**: 中
**状态**: 🟢 待确认

#### 核心任务

第二阶段主要需要**数据库支持和分析能力**：

**P1 功能**:

1. **用户认证数据库支持** (P1-001 数据库部分, 4h)
   - 创建 users 表
   - 创建 refresh_tokens 表
   - 迁移脚本和索引

**P2 功能**:

2. **A/B 测试数据支持** (P2-002 数据库部分, 8h)
   - 实验变体表
   - 流量分配记录
   - 统计显著性计算

#### 数据库需求

请评估以下数据库变更方案，在 `docs/SCHEMA_CHANGES.md` 提供反馈：

```sql
-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Refresh Tokens 表
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- A/B 测试变体表 (P2)
CREATE TABLE experiment_variants (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id),
    variant_name VARCHAR(100) NOT NULL,
    is_control BOOLEAN DEFAULT false,
    traffic_allocation INTEGER DEFAULT 0,
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 流量分配记录 (P2)
CREATE TABLE traffic_assignments (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT NOT NULL REFERENCES experiments(id),
    variant_id BIGINT REFERENCES experiment_variants(id),
    tracking_id VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_traffic_assignments_experiment ON traffic_assignments(experiment_id);
CREATE INDEX idx_traffic_assignments_tracking ON traffic_assignments(tracking_id);
```

#### 分析需求

前端 Analytics 页面需要以下数据查询支持：

```sql
-- 统计数据汇总
SELECT
    COUNT(DISTINCT tracking_id) as visitors,
    COUNT(*) FILTER (WHERE conversion_type IS NOT NULL) as conversions,
    COALESCE(SUM(commission), 0) as total_revenue
FROM tracking_events te
LEFT JOIN conversions c ON te.tracking_id = c.tracking_id
WHERE te.experiment_id = $1
  AND te.created_at >= $2 AND te.created_at <= $3;

-- 转化漏斗
SELECT
    event_type,
    COUNT(DISTINCT tracking_id) as count,
    LAG(COUNT(DISTINCT tracking_id)) OVER (ORDER BY step) * 1.0 /
      LAG(COUNT(DISTINCT tracking_id)) OVER (ORDER BY step) as rate
FROM (
    SELECT tracking_id, event_type,
           ROW_NUMBER() OVER (PARTITION BY tracking_id ORDER BY created_at) as step
    FROM tracking_events
    WHERE experiment_id = $1
) t
GROUP BY event_type, step
ORDER BY step;
```

#### 性能优化

请评估以下优化需求：
1. [ ] 现有表是否有索引优化空间？
2. [ ] 是否需要分区表（按时间）？
3. [ ] 统计查询是否需要物化视图？

#### 数据导出

用户需要导出功能，请评估：
1. [ ] CSV 导出实现方式（后端生成 vs 前端处理）？
2. [ ] 大数据量导出的性能优化方案？
3. [ ] 是否需要异步导出任务？

#### 下一步

1. 阅读需求文档
2. 在 `docs/MESSAGES/S07-PM.md` 回复确认
3. 提交数据库变更提案
4. 准备迁移脚本

---

## 📤 已发送

### 无消息

---

## 📝 消息历史

暂无消息历史

---

**最后更新**: 2026-03-04
