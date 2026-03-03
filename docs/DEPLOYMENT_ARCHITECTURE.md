# 部署架构设计文档

## 文档信息

| 字段 | 值 |
|------|-----|
| **文档版本** | v1.0 |
| **创建日期** | 2026-03-03 |
| **创建角色** | 01-架构师 |
| **项目阶段** | 架构设计 |

---

## 1. 部署架构概述

### 1.1 整体架构图

```
                        ┌─────────────────────────────────────┐
                        │            用户访问                  │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CDN / 边缘层                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Vercel CDN     │  │  Cloudflare CDN  │  │  Cloudflare      │     │
│  │                  │  │                  │  │  Workers         │     │
│  │  前端静态资源     │  │  静态资源加速     │  │  边缘计算        │     │
│  │  hub.zenconsult. │  │                  │  │  tracker.zencon. │     │
│  │       top        │  │                  │  │       top        │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              应用层                                    │
│  ┌──────────────────────────────────────┐  ┌────────────────────────┐ │
│  │        Railway 应用                   │  │                        │ │
│  │  ┌────────────────────────────────┐  │ │                        │ │
│  │  │   后端 API 服务 (Go)           │  │  │   AI 服务 (Python)     │ │
│  │  │   api-hub.zenconsult.top      │  │  │   ai-api.zenconsult.  │ │
│  │  │   - 实验管理                   │  │  │   top                  │ │
│  │  │   - 追踪服务                   │  │  │   - 内容生成           │ │
│  │  │   - 归因引擎                   │  │  │   - SEO 优化           │ │
│  │  │   - 结算服务                   │  │  │   - 智能推荐           │ │
│  │  └────────────────────────────────┘  │  │                        │ │
│  │                                      │  └────────────────────────┘ │
│  └──────────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              数据层                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   PostgreSQL     │  │     Redis        │  │     MinIO        │     │
│  │   阿里云杭州      │  │   阿里云杭州      │  │     香港          │     │
│  │                  │  │                  │  │                  │     │
│  │ 139.224.42.111  │  │ 139.224.42.111  │  │ 103.59.103.85   │     │
│  │ :5432            │  │ :6379            │  │ :9000            │     │
│  │                  │  │                  │  │                  │     │
│  │ - 实验数据        │  │ - 会话缓存        │  │ - 静态资源        │     │
│  │ - 用户数据        │  │ - 追踪缓存        │  │ - 生成内容        │     │
│  │ - 追踪事件        │  │ - 排行榜          │  │ - 日志文件        │     │
│  │ - 转化记录        │  │ - 限流计数        │  │ - 备份文件        │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 服务拆分策略

| 服务 | 部署平台 | 域名 | 实例数 | 说明 |
|------|----------|------|--------|------|
| **前端控制台** | Vercel | hub.zenconsult.top | Auto | Vue3 静态站点 |
| **后端 API** | Railway | api-hub.zenconsult.top | 1-2 | Go API 服务 |
| **AI 服务** | Railway | ai-api.zenconsult.top | 1 | FastAPI 服务 |
| **追踪脚本** | Cloudflare | tracker.zenconsult.top | Edge | Workers 边缘计算 |

---

## 2. 平台配置

### 2.1 Vercel 配置 (前端)

**文件: `frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://api-hub.zenconsult.top/api/v1",
    "VITE_AI_SERVICE_URL": "https://ai-api.zenconsult.top"
  }
}
```

### 2.2 Railway 配置 (后端)

**文件: `backend-go/railway.toml`**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "./server"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "api"
source = "."
domain = "https://api-hub.zenconsult.top"

[[services.env]]
key = "DATABASE_URL"
value = "${{PostgreSQL.DATABASE_URL}}"

[[services.env]]
key = "REDIS_URL"
value = "${{Redis.REDIS_URL}}"

[[services.env]]
key = "MINIO_ENDPOINT"
value = "http://103.59.103.85:9000"

[PostgreSQL]
name = "business_hub"

[Redis]
name = "cache"
```

### 2.3 Cloudflare Workers 配置 (追踪)

**文件: `deployments/workers/tracker.js`**

```javascript
// 追踪脚本注入
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理追踪请求
    if (url.pathname.startsWith('/track')) {
      return handleTracking(request, env);
    }

    // 注入追踪脚本
    const response = await fetch(request);
    const newResponse = new HTMLRewriter()
      .on('head', new ElementHandler())
      .transform(response);

    return newResponse;
  }
};

class ElementHandler {
  element(element) {
    const script = `<script src="https://tracker.zenconsult.top/tracker.js" async></script>`;
    element.append(script, { html: true });
  }
}
```

---

## 3. 基础设施配置

### 3.1 阿里云杭州 (数据库/缓存)

**PostgreSQL 配置:**
| 配置项 | 值 |
|--------|-----|
| 主机 | 139.224.42.111 |
| 端口 | 5432 |
| 数据库 | business_hub |
| 用户 | postgres |
| 密码 | WhjQTPAwInc5Vav3sDWe |
| 版本 | PostgreSQL 15.x |

**Redis 配置:**
| 配置项 | 值 |
|--------|-----|
| 主机 | 139.224.42.111 |
| 端口 | 6379 |
| 密码 | FWD4D75OKyQS7HOluA6J |
| 版本 | Redis 7.x |

### 3.2 香港 (存储/服务)

**MinIO 配置:**
| 配置项 | 值 |
|--------|-----|
| 端点 | http://103.59.103.85:9000 |
| Console | http://103.59.103.85:9001 |
| Access Key | admin |
| Secret Key | xhOSMeHNmxCgNTBpoQfH |
| 区域 | 香港 |

**存储桶:**
| 桶名 | 用途 | 公共访问 |
|------|------|----------|
| affi-marketing-content | 生成内容 | 是 |
| affi-marketing-assets | 静态资源 | 是 |
| affi-marketing-logs | 日志文件 | 否 |
| affi-marketing-backups | 备份文件 | 否 |

### 3.3 Chatwoot 配置

| 配置项 | 值 |
|--------|-----|
| Base URL | https://chat.zenconsult.top |
| API Token | 7Y4bXT3epqqu5mEo1Bq96UHz |

---

## 4. 网络拓扑

### 4.1 DNS 配置

```
zenconsult.top 域名结构:

A 记录:
├── hub.zenconsult.top          → Vercel Anycast
├── api-hub.zenconsult.top     → Railway IP
├── ai-api.zenconsult.top      → Railway IP
└── tracker.zenconsult.top     → Cloudflare Anycast

CNAME 记录:
├── www.hub.zenconsult.top     → hub.zenconsult.top
└── go.zenconsult.top          → (短链接服务)
```

### 4.2 端口配置

| 服务 | 内部端口 | 外部端口 | 协议 |
|------|----------|----------|------|
| 后端 API | 8080 | 443 | HTTPS |
| AI 服务 | 8000 | 443 | HTTPS |
| PostgreSQL | 5432 | 5432 | TCP |
| Redis | 6379 | 6379 | TCP |
| MinIO API | 9000 | 9000 | HTTP |
| MinIO Console | 9001 | 9001 | HTTP |

### 4.3 防火墙规则

**阿里云杭州 (139.224.42.111):**
| 规则 | 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|------|
| 允许 | TCP | 5432 | Railway IP | PostgreSQL 访问 |
| 允许 | TCP | 6379 | Railway IP | Redis 访问 |
| 允许 | TCP | 22 | 办公 IP | SSH 管理 |
| 拒绝 | ALL | ALL | ANY | 默认拒绝 |

**香港 (103.59.103.85):**
| 规则 | 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|------|
| 允许 | TCP | 9000 | ANY | MinIO API |
| 允许 | TCP | 9001 | 办公 IP | MinIO Console |
| 允许 | TCP | 3000 | 办公 IP | Chatwoot |
| 拒绝 | ALL | ALL | ANY | 默认拒绝 |

---

## 5. 环境变量

### 5.1 后端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://postgres:xxx@139.224.42.111:5432/business_hub` |
| `REDIS_URL` | Redis 连接字符串 | `redis://:xxx@139.224.42.111:6379` |
| `MINIO_ENDPOINT` | MinIO 端点 | `http://103.59.103.85:9000` |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `admin` |
| `MINIO_SECRET_KEY` | MinIO 秘密密钥 | `xhOSMeHNmxCgNTBpoQfH` |
| `MINIO_BUCKET` | 默认存储桶 | `affi-marketing-content` |
| `JWT_SECRET` | JWT 签名密钥 | `${{secrets.JWT_SECRET}}` |
| `JWT_EXPIRATION` | Token 过期时间 | `168h` |
| `AI_SERVICE_URL` | AI 服务地址 | `https://ai-api.zenconsult.top` |
| `CORS_ORIGINS` | CORS 白名单 | `https://hub.zenconsult.top` |
| `RATE_LIMIT_ENABLED` | 启用速率限制 | `true` |
| `LOG_LEVEL` | 日志级别 | `info` |

### 5.2 AI 服务环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://postgres:xxx@139.224.42.111:5432/business_hub` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | `${{secrets.OPENAI_API_KEY}}` |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 | `${{secrets.ANTHROPIC_API_KEY}}` |
| `QWEN_API_KEY` | 通义千问 API 密钥 | `${{secrets.QWEN_API_KEY}}` |
| `MODEL_DEFAULT` | 默认模型 | `gpt-4` |
| `MODEL_FALLBACK` | 备用模型 | `gpt-3.5-turbo` |
| `MAX_TOKENS` | 最大 Token 数 | `4000` |
| `TEMPERATURE` | 温度参数 | `0.7` |
| `RATE_LIMIT_RPM` | 每分钟请求限制 | `60` |

### 5.3 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://api-hub.zenconsult.top/api/v1` |
| `VITE_AI_SERVICE_URL` | AI 服务地址 | `https://ai-api.zenconsult.top` |
| `VITE_TRACKER_URL` | 追踪脚本地址 | `https://tracker.zenconsult.top/tracker.js` |
| `VITE_APP_NAME` | 应用名称 | `Affi-Marketing` |

---

## 6. 监控与日志

### 6.1 应用监控

| 工具 | 用途 | 配置 |
|------|------|------|
| **Railway Metrics** | 应用性能监控 | CPU、内存、网络 |
| **Vercel Analytics** | 前端性能监控 | 页面加载、Core Web Vitals |
| **Cloudflare Analytics** | 边缘性能监控 | 请求量、响应时间 |
| **Sentry** | 错误追踪 | 错误聚合、告警 |

### 6.2 日志策略

**日志级别:**
- `ERROR`: 错误信息，需要立即处理
- `WARN`: 警告信息，需要关注
- `INFO`: 一般信息，正常运行记录
- `DEBUG`: 调试信息，开发环境使用

**日志存储:**
| 日志类型 | 存储位置 | 保留时间 |
|----------|----------|----------|
| 应用日志 | MinIO (logs/) | 30 天 |
| 访问日志 | Cloudflare | 7 天 |
| 错误日志 | Sentry | 90 天 |
| 审计日志 | PostgreSQL | 永久 |

### 6.3 告警配置

| 告警类型 | 触发条件 | 通知方式 |
|----------|----------|----------|
| 服务宕机 | 健康检查失败 | 邮件 + Slack |
| 高错误率 | 5xx > 5% | 邮件 |
| 高延迟 | P95 > 1s | 邮件 |
| 存储空间 | 使用率 > 80% | 邮件 |
| API 配额 | 使用率 > 90% | 邮件 |

---

## 7. 备份与恢复

### 7.1 备份策略

| 资源 | 备份频率 | 保留时间 | 存储位置 |
|------|----------|----------|----------|
| PostgreSQL | 每日 | 30 天 | MinIO (backups/) |
| Redis | 每周 | 7 天 | MinIO (backups/) |
| MinIO | 实时 | 永久 | 多副本存储 |

### 7.2 备份脚本

```bash
#!/bin/bash
# PostgreSQL 备份脚本

DATE=$(date +%Y%m%d)
BACKUP_FILE="business_hub_${DATE}.sql.gz"

pg_dump -h 139.224.42.111 -U postgres business_hub | \
  gzip > /tmp/${BACKUP_FILE}

# 上传到 MinIO
mc cp /tmp/${BACKUP_FILE} \
  minio/affi-marketing-backups/db/${BACKUP_FILE}

# 清理本地文件
rm /tmp/${BACKUP_FILE}
```

### 7.3 恢复流程

```bash
# 1. 从 MinIO 下载备份
mc cp minio/affi-marketing-backups/db/business_hub_20260303.sql.gz /tmp/

# 2. 解压备份文件
gunzip /tmp/business_hub_20260303.sql.gz

# 3. 恢复数据库
psql -h 139.224.42.111 -U postgres business_hub < /tmp/business_hub_20260303.sql
```

---

## 8. 部署流程

### 8.1 前端部署 (Vercel)

```bash
# 1. 关联 Git 仓库
vercel link

# 2. 配置项目
vercel project add

# 3. 部署
vercel --prod

# 4. 查看部署状态
vercel ls
```

### 8.2 后端部署 (Railway)

```bash
# 1. 关联 Git 仓库
railway init

# 2. 配置服务
railway variables set DATABASE_URL="..."
railway variables set REDIS_URL="..."

# 3. 部署
railway up

# 4. 查看日志
railway logs
```

### 8.3 AI 服务部署 (Railway)

```bash
# 1. 创建新服务
railway create --service ai-service

# 2. 配置环境变量
railway variables set OPENAI_API_KEY="..."

# 3. 部署
railway up
```

### 8.4 Workers 部署 (Cloudflare)

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 发布 Worker
wrangler publish deployments/workers/tracker.js

# 4. 配置自定义域名
wrangler domains add tracker.zenconsult.top
```

---

## 9. 成本估算

### 9.1 月度成本

| 服务 | 计划 | 月费用 |
|------|------|--------|
| **Vercel** | Pro | $20 |
| **Railway** | - 后端 ($5) + AI ($5) | $10 |
| **Cloudflare** | Free | $0 |
| **阿里云杭州** | PostgreSQL + Redis | $20 |
| **香港服务器** | MinIO + Chatwoot | $30 |
| **域名** | zenconsult.top | $1 |
| **总计** | - | **$81/月** |

### 9.2 扩展成本

| 场景 | 额外成本 |
|------|----------|
| 流量增加 10x | Railway 增加 $20 |
| AI 调用增加 | API 费用另计 |
| 存储增加 >1TB | MinIO 增加 $10 |

---

*文档创建者: 01-架构师*
*最后更新: 2026-03-03*
