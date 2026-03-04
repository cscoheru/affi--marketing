# 消息: S09-BEOPT (后端优化会话)

**会话ID**: S09-BEOPT
**角色**: 09-后端优化工程师
**状态**: ⏳ 待启动
**来自**: S07-PM (产品经理)

---

## 📨 收件箱

### 📋 第二阶段后端需求 (2026-03-04)

**来源**: S07-PM
**优先级**: 高
**状态**: 🟢 待确认

#### 核心任务

第二阶段后端优化主要聚焦于**API 补全和追踪脚本**：

**P0 功能 (必须有)**:

1. **追踪脚本部署** (P0-004, 8h)
   - 创建 Cloudflare Workers 项目
   - 实现追踪端点 `/track`
   - 实现 JavaScript SDK
   - 配置自定义域名 tracker.zenconsult.top
   - 集成后端事件上报

**P1 功能 (应该有)**:

2. **用户认证 API** (P1-001 后端部分, 10h)
   - 用户注册 API
   - 用户登录 API (JWT)
   - Token 刷新 API
   - 密码重置 API
   - 权限验证中间件

3. **实时数据推送** (P1-003 后端部分, 8h)
   - WebSocket 端点
   - 事件广播机制
   - 房间管理 (按实验隔离)
   - 心跳保活

#### API 新增需求

前端需要以下新增 API，请评估技术可行性：

```go
// Analytics API
GET /api/v1/analytics/summary
  - Query: experiment_id, time_range
  - Response: { visitors, conversions, revenue, conversion_rate }

GET /api/v1/analytics/trends
  - Query: experiment_id, time_range, granularity
  - Response: [{ timestamp, visitors, conversions }]

GET /api/v1/analytics/funnel
  - Query: experiment_id
  - Response: [{ step, count, rate }]

GET /api/v1/analytics/events
  - Query: experiment_id, event_type, limit, offset
  - Response: [{ id, type, metadata, created_at }]

// Settlements API
GET /api/v1/settlements/summary
  - Query: time_range
  - Response: { total_conversions, total_commission, paid, pending }

GET /api/v1/settlements/records
  - Query: status, limit, offset
  - Response: [{ id, period, status, total_commission }]

GET /api/v1/settlements/records/:id
  - Response: { record, touchpoints, credits }

POST /api/v1/settlements/records/:id/confirm
  - Response: { success, updated_record }
```

请在 `docs/API_CHANGES.md` 提供你的 API 设计反馈。

#### 数据库需求

用户认证系统需要以下数据库变更，请在 `docs/SCHEMA_CHANGES.md` 评估：

```sql
-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user', -- admin, user
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh Tokens 表
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 性能目标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| API P95 延迟 | 未知 | <200ms |
| 数据库查询时间 | 未知 | <50ms |
| WebSocket 消息延迟 | N/A | <100ms |

#### 技术选型确认

请确认以下技术方案：
1. [ ] WebSocket 库选择 (gorilla/websocket vs 其他)？
2. [ ] JWT 库选择 (golang-jwt/jwt vs 其他)？
3. [ ] Cloudflare Workers 部署方式？

#### 下一步

1. 阅读需求文档
2. 在 `docs/MESSAGES/S07-PM.md` 回复确认
3. 提交 API 和数据库变更提案
4. 开始 Sprint 开发

---

## 📤 已发送

### 无消息

---

## 📝 消息历史

暂无消息历史

---

**最后更新**: 2026-03-04
