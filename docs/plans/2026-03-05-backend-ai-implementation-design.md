# 后端与AI服务实施设计文档

**文档版本**: v1.0
**创建日期**: 2026-03-05
**创建角色**: 04-后端与AI工程师
**项目阶段**: 后端与AI服务实施

---

## 1. 设计概述

### 1.1 目标

完成 Affi-Marketing 项目的 Go 后端服务和 Python AI 服务，使其能够成功编译、运行并部署到 Railway 平台，为已完成的 React 前端提供 API 支持。

### 1.2 范围

| 组件 | 状态 | 工作内容 |
|------|------|----------|
| **backend-go** | 部分完成 | 补充模型、控制器、服务层 |
| **ai-service** | 部分完成 | 补充端点、服务实现 |
| **集成** | 待实施 | Go 后端调用 Python AI 服务 |
| **部署** | 待验证 | Railway 平台部署配置 |

### 1.3 约束条件

- 必须遵循 `API_SPEC.md` 定义的接口规范
- 数据模型必须符合 `DATA_MODELS.md` 定义
- 部署平台为 Railway
- 数据库和 Redis 使用阿里云现有资源

---

## 2. 架构设计

### 2.1 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway 平台                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   backend-go     │────────▶│   ai-service     │         │
│  │   (Go + Gin)     │  HTTP   │   (FastAPI)      │         │
│  │   Port: 8080     │         │   Port: 8000     │         │
│  └──────────────────┘         └──────────────────┘         │
│         │                              │                    │
│         │                              │                    │
│         ▼                              ▼                    │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   PostgreSQL     │         │   Redis          │         │
│  │   (阿里云)        │         │   (阿里云)        │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Vercel 前端                              │
│  (React 原生页面 + Vue 微应用)                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块分层

#### backend-go 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Controller 层                         │
│  处理 HTTP 请求、参数验证、响应格式化                          │
├─────────────────────────────────────────────────────────────┤
│                       Service 层                            │
│  业务逻辑、事务管理、服务编排                                  │
├─────────────────────────────────────────────────────────────┤
│                       Core 层                               │
│  核心业务逻辑 (实验、追踪、归因、结算)                          │
├─────────────────────────────────────────────────────────────┤
│                       Model 层                               │
│  数据模型定义、GORM 映射                                       │
├─────────────────────────────────────────────────────────────┤
│                       Package 层                            │
│  数据库、缓存、日志、响应等公共包                              │
└─────────────────────────────────────────────────────────────┘
```

#### ai-service 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                       API 层                                │
│  FastAPI 路由、请求验证、响应序列化                             │
├─────────────────────────────────────────────────────────────┤
│                       Service 层                            │
│  业务逻辑、AI 服务编排、结果后处理                              │
├─────────────────────────────────────────────────────────────┤
│                       Adapter 层                            │
│  多 AI 模型适配器 (Qwen、OpenAI、ChatGLM)                     │
├─────────────────────────────────────────────────────────────┤
│                       Utility 层                            │
│  提示词模板、监控、缓存                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型设计

### 3.1 Go 数据模型 (backend-go/internal/model/)

基于 `DATA_MODELS.md`，创建以下模型文件：

| 文件 | 模型 | 说明 |
|------|------|------|
| `experiment.go` | Experiment, ExperimentConfig | 实验及配置 |
| `track.go` | Track, Touchpoint | 追踪事件和触点 |
| `conversion.go` | Conversion | 转化事件 |
| `settlement.go` | Settlement | 结算记录 |
| `user.go` | User, APIKey | 用户和API密钥 |
| `visitor.go` | Visitor | 访问者 |

### 3.2 Pydantic 模型 (ai-service/app/models/)

| 文件 | 用途 |
|------|------|
| `request.py` | API 请求模型 |
| `response.py` | API 响应模型 |
| `content.py` | 内容生成相关模型 |

---

## 4. API 端点设计

### 4.1 P0 优先级端点

**认证接口**
```go
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

**实验管理接口**
```go
GET    /api/v1/experiments          // 列表
POST   /api/v1/experiments          // 创建
GET    /api/v1/experiments/:id      // 详情
PUT    /api/v1/experiments/:id      // 更新
DELETE /api/v1/experiments/:id      // 删除
POST   /api/v1/experiments/:id/start  // 启动
POST   /api/v1/experiments/:id/stop   // 停止
POST   /api/v1/experiments/:id/pause  // 暂停
```

**AI 内容生成接口**
```go
POST /api/v1/ai/generate-content    // 生成内容 (转发到 ai-service)
```

### 4.2 AI 服务端点

```python
GET  /health                        // 健康检查
POST /api/v1/generate-content       // 内容生成
POST /api/v1/generate-seo-article   // SEO 文章生成
GET  /api/v1/models                 // 可用模型列表
GET  /api/v1/cost/stats             // 成本统计
```

---

## 5. 服务间通信

### 5.1 通信协议

Go 后端通过 HTTP REST API 调用 Python AI 服务：

```go
// backend-go/internal/service/ai/client.go
type AIClient struct {
    baseURL    string
    httpClient *http.Client
    timeout    time.Duration
}

func (c *AIClient) GenerateContent(ctx context.Context, req ContentRequest) (*ContentResponse, error)
```

### 5.2 请求格式

```json
{
  "keyword": "keyword",
  "type": "seo_article",
  "options": {
    "length": 1000,
    "style": "professional",
    "include_meta": true
  }
}
```

### 5.3 响应格式

```json
{
  "success": true,
  "data": {
    "title": "Generated Title",
    "content": "Generated content...",
    "meta_tags": {
      "description": "...",
      "keywords": "..."
    }
  },
  "metrics": {
    "tokens_used": 1500,
    "cost": 0.03,
    "duration_ms": 2500
  }
}
```

---

## 6. 错误处理

### 6.1 统一响应格式

```go
// pkg/response/response.go
type Response struct {
    Success   bool        `json:"success"`
    Code      int         `json:"code"`
    Message   string      `json:"message"`
    Data      interface{} `json:"data,omitempty"`
    Errors    []ErrorItem `json:"errors,omitempty"`
    Timestamp int64       `json:"timestamp"`
}

type ErrorItem struct {
    Field   string `json:"field,omitempty"`
    Message string `json:"message"`
}
```

### 6.2 错误码映射

| Go Error | HTTP Code | API Code | Message |
|----------|-----------|----------|---------|
| nil | 200 | 200 | success |
| ValidationError | 400 | 400 | bad_request |
| NotFoundError | 404 | 404 | not_found |
| UnauthorizedError | 401 | 401 | unauthorized |
| InternalError | 500 | 500 | internal_error |

---

## 7. 部署配置

### 7.1 环境变量

**backend-go (.env.example)**
```bash
# Server
PORT=8080
GIN_MODE=release

# Database
DB_HOST=139.224.42.111
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=business_hub
DB_SSL_MODE=require

# Redis
REDIS_HOST=139.224.42.111
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# AI Service
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_TIMEOUT=30s

# CORS
CORS_ALLOWED_ORIGINS=https://hub.zenconsult.top
```

**ai-service (.env.example)**
```bash
# Application
APP_NAME=affi-marketing-ai
API_PORT=8000
ENVIRONMENT=production

# AI API Keys
DASHSCOPE_API_KEY=your_dashscope_key
OPENAI_API_KEY=your_openai_key
CHATGLM_API_KEY=your_chatglm_key

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@139.224.42.111:5432/business_hub

# Redis
REDIS_URL=redis://:password@139.224.42.111:6379/0

# CORS
CORS_ORIGINS=https://hub.zenconsult.top
```

### 7.2 Railway 部署

**健康检查端点**
- Go: `GET /health` → 检查数据库、Redis、AI服务连接
- Python: `GET /health` → 检查 AI API 连接

**重启策略**
```toml
[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/health"
healthcheckTimeout = 30000
```

---

## 8. 测试策略

### 8.1 单元测试

| 组件 | 测试内容 | 工具 |
|------|----------|------|
| Model | GORM 验证、关联关系 | Go testing |
| Service | 业务逻辑 | Go testing |
| Controller | HTTP 处理 | httptest |
| Adapter | AI 调用 | pytest |

### 8.2 集成测试

- API 端点测试
- 服务间通信测试
- 数据库 CRUD 测试

---

## 9. 实施计划

### Phase 1: 基础完善 (Day 1-2)
- [ ] 补充 Go 数据模型
- [ ] 创建统一响应格式
- [ ] 补充 AI 服务 Pydantic 模型
- [ ] 验证编译和运行

### Phase 2: P0 核心功能 (Day 3-5)
- [ ] 实现认证接口
- [ ] 实现实验管理 API
- [ ] 实现 AI 内容生成服务
- [ ] 实现 Go → Python 服务调用

### Phase 3: 部署验证 (Day 6)
- [ ] 配置 Railway 环境变量
- [ ] 部署到 Railway
- [ ] 验证所有 API 端点
- [ ] 健康检查测试

---

## 10. 风险与依赖

### 10.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| AI API Key 未配置 | 无法使用 AI 功能 | 使用 Mock 数据，等待 Key 配置 |
| 数据库连接失败 | 服务无法启动 | 提供详细错误日志，排查连接配置 |
| Railway 部署失败 | 无法上线 | 本地 Docker 测试，确保容器可运行 |

### 10.2 依赖

- 01-架构师的架构文档 ✅ 已完成
- 前端 API 规范 ✅ 已完成
- Railway 账户配置 ⚠️ 需确认
- AI API Keys ⚠️ 需申请

---

**文档创建者**: 04-后端与AI工程师
**最后更新**: 2026-03-05
