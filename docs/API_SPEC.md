# API 接口规范文档

## 文档信息

| 字段 | 值 |
|------|-----|
| **文档版本** | v1.0 |
| **创建日期** | 2026-03-03 |
| **创建角色** | 01-架构师 |
| **Base URL** | https://api-hub.zenconsult.top/api/v1 |

---

## 1. API 概述

### 1.1 通用规范

| 属性 | 规范 |
|------|------|
| **协议** | HTTPS |
| **数据格式** | JSON |
| **字符编码** | UTF-8 |
| **认证方式** | Bearer Token (JWT) |
| **分页** | cursor-based + offset-based |

### 1.2 统一响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {},
  "errors": [],
  "timestamp": 1709356800000
}
```

### 1.3 错误码规范

| Code | HTTP | Message | Description |
|------|------|---------|-------------|
| 200 | 200 | success | 请求成功 |
| 400 | 400 | bad_request | 请求参数错误 |
| 401 | 401 | unauthorized | 未认证 |
| 403 | 403 | forbidden | 无权限 |
| 404 | 404 | not_found | 资源不存在 |
| 409 | 409 | conflict | 资源冲突 |
| 422 | 422 | validation_error | 验证失败 |
| 429 | 429 | rate_limit_exceeded | 超过速率限制 |
| 500 | 500 | internal_error | 服务器错误 |
| 503 | 503 | service_unavailable | 服务不可用 |

---

## 2. 认证接口

### 2.1 用户登录

```
POST /auth/login
```

**请求:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  },
  "timestamp": 1709356800000
}
```

### 2.2 刷新 Token

```
POST /auth/refresh
```

**请求:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3 登出

```
POST /auth/logout
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Logged out successfully"
}
```

---

## 3. 实验管理接口

### 3.1 获取实验列表

```
GET /experiments
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认 1） |
| size | int | 否 | 每页数量（默认 20） |
| type | string | 否 | 实验类型筛选 |
| status | string | 否 | 状态筛选 |

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "items": [
      {
        "id": "exp_123",
        "name": "SEO Experiment - Tech Niche",
        "type": "seo",
        "status": "active",
        "start_date": "2026-03-01T00:00:00Z",
        "end_date": null,
        "config": {
          "seo_config": {
            "target_keywords": ["tech", "gadgets"],
            "content_frequency": 5
          }
        },
        "created_at": "2026-03-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20
  }
}
```

### 3.2 获取实验详情

```
GET /experiments/{id}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "exp_123",
    "name": "SEO Experiment - Tech Niche",
    "type": "seo",
    "status": "active",
    "config": {},
    "metrics": {
      "total_visitors": 10000,
      "conversions": 500,
      "revenue": 5000.00,
      "conversion_rate": 0.05
    },
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-03T00:00:00Z"
  }
}
```

### 3.3 创建实验

```
POST /experiments
```

**请求:**
```json
{
  "name": "SEO Experiment - Tech Niche",
  "type": "seo",
  "config": {
    "seo_config": {
      "target_keywords": ["tech", "gadgets"],
      "content_frequency": 5,
      "auto_publish": true
    }
  }
}
```

**响应 (201):**
```json
{
  "success": true,
  "code": 201,
  "message": "Experiment created",
  "data": {
    "id": "exp_123",
    "name": "SEO Experiment - Tech Niche",
    "status": "draft"
  }
}
```

### 3.4 更新实验

```
PUT /experiments/{id}
```

**请求:**
```json
{
  "name": "Updated Experiment Name",
  "status": "active"
}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Experiment updated",
  "data": {
    "id": "exp_123",
    "name": "Updated Experiment Name",
    "status": "active"
  }
}
```

### 3.5 删除实验

```
DELETE /experiments/{id}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Experiment deleted"
}
```

### 3.6 启动/停止实验

```
POST /experiments/{id}/start
POST /experiments/{id}/stop
POST /experiments/{id}/pause
```

---

## 4. 追踪接口

### 4.1 发送追踪事件

```
POST /tracking/track
```

**请求:**
```json
{
  "experiment_id": "exp_123",
  "visitor_id": "vis_456",
  "session_id": "ses_789",
  "event_type": "page_view",
  "properties": {
    "url": "https://example.com/page",
    "referrer": "https://google.com",
    "utm_source": "google",
    "utm_medium": "organic",
    "utm_campaign": "spring_sale"
  },
  "touchpoints": [
    {
      "channel": "organic",
      "source": "google",
      "campaign": "spring_sale",
      "medium": "organic"
    }
  ],
  "timestamp": 1709356800000
}
```

**响应 (202):**
```json
{
  "success": true,
  "code": 202,
  "message": "Event tracked",
  "data": {
    "event_id": "evt_123",
    "tracked": true
  }
}
```

### 4.2 批量发送事件

```
POST /tracking/batch
```

**请求:**
```json
{
  "events": [
    {
      "experiment_id": "exp_123",
      "visitor_id": "vis_456",
      "event_type": "page_view",
      "properties": {},
      "timestamp": 1709356800000
    },
    {
      "experiment_id": "exp_123",
      "visitor_id": "vis_456",
      "event_type": "click",
      "properties": {},
      "timestamp": 1709356801000
    }
  ]
}
```

---

## 5. 分析接口

### 5.1 获取实验概览

```
GET /analytics/experiments/{id}/overview
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 时间范围（7d, 30d, 90d） |
| from | string | 否 | 开始日期 |
| to | string | 否 | 结束日期 |

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "experiment": {
      "id": "exp_123",
      "name": "SEO Experiment"
    },
    "metrics": {
      "visitors": 10000,
      "page_views": 50000,
      "conversions": 500,
      "revenue": 5000.00,
      "conversion_rate": 0.05,
      "avg_order_value": 10.00
    },
    "trends": {
      "visitors_trend": [
        {"date": "2026-03-01", "value": 1000},
        {"date": "2026-03-02", "value": 1200}
      ]
    },
    "top_sources": [
      {"source": "google", "visitors": 5000, "conversions": 300},
      {"source": "facebook", "visitors": 3000, "conversions": 150}
    ]
  }
}
```

### 5.2 获取转化漏斗

```
GET /analytics/experiments/{id}/funnel
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "steps": [
      {"name": "Page View", "count": 10000, "conversion_rate": 1.0},
      {"name": "Product View", "count": 3000, "conversion_rate": 0.3},
      {"name": "Add to Cart", "count": 1500, "conversion_rate": 0.15},
      {"name": "Purchase", "count": 500, "conversion_rate": 0.05}
    ],
    "overall_conversion_rate": 0.05
  }
}
```

### 5.3 获取归因分析

```
GET /analytics/experiments/{id}/attribution
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 否 | 归因模型（last_click, first_click, linear） |
| conversion_id | string | 否 | 特定转化 ID |

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "model": "last_click",
    "attribution": [
      {
        "touchpoint_id": "tp_123",
        "channel": "organic",
        "source": "google",
        "conversions": 300,
        "revenue": 3000.00,
        "contribution": 0.6
      },
      {
        "touchpoint_id": "tp_456",
        "channel": "paid",
        "source": "facebook",
        "conversions": 200,
        "revenue": 2000.00,
        "contribution": 0.4
      }
    ]
  }
}
```

---

## 6. 结算接口

### 6.1 获取结算记录

```
GET /settlements
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |
| period | string | 否 | 结算周期（YYYY-MM） |
| status | string | 否 | 状态筛选 |

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "items": [
      {
        "id": "st_123",
        "conversion_id": "cnv_456",
        "period": "2026-03",
        "total_amount": 100.00,
        "platform_fee": 10.00,
        "affiliate_share": 90.00,
        "status": "pending",
        "created_at": "2026-03-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

### 6.2 创建结算

```
POST /settlements
```

**请求:**
```json
{
  "conversion_id": "cnv_456",
  "period": "2026-03",
  "breakdown": {
    "items": [
      {"description": "Platform Fee", "amount": 10.00, "percentage": 0.1},
      {"description": "Affiliate Share", "amount": 90.00, "percentage": 0.9}
    ]
  }
}
```

**响应 (201):**
```json
{
  "success": true,
  "code": 201,
  "data": {
    "id": "st_123",
    "status": "pending"
  }
}
```

### 6.3 确认结算

```
POST /settlements/{id}/confirm
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "message": "Settlement confirmed",
  "data": {
    "id": "st_123",
    "status": "completed"
  }
}
```

---

## 7. 插件接口

### 7.1 获取插件列表

```
GET /plugins
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "items": [
      {
        "id": "seo-content-generator",
        "name": "SEO Content Generator",
        "type": "seo",
        "version": "1.0.0",
        "enabled": true,
        "config": {}
      }
    ]
  }
}
```

### 7.2 获取插件详情

```
GET /plugins/{id}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "seo-content-generator",
    "name": "SEO Content Generator",
    "type": "seo",
    "version": "1.0.0",
    "description": "Generate SEO-optimized content",
    "enabled": true,
    "config": {
      "model": "gpt-4",
      "max_tokens": 2000
    },
    "info": {
      "author": "Platform Team",
      "dependencies": []
    }
  }
}
```

### 7.3 更新插件配置

```
PUT /plugins/{id}/config
```

**请求:**
```json
{
  "enabled": true,
  "parameters": {
    "model": "gpt-4-turbo",
    "max_tokens": 4000
  }
}
```

### 7.4 执行插件

```
POST /plugins/{id}/execute
```

**请求:**
```json
{
  "type": "generate_content",
  "data": {
    "keywords": ["tech", "gadgets"],
    "style": "professional"
  },
  "context": {
    "experiment_id": "exp_123"
  }
}
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "result": {},
    "metrics": {
      "duration_ms": 1500,
      "tokens_used": 500
    }
  }
}
```

---

## 8. 系统 API

### 8.1 健康检查

```
GET /health
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "services": {
      "database": "ok",
      "redis": "ok",
      "minio": "ok"
    }
  }
}
```

### 8.2 系统信息

```
GET /system/info
```

**响应 (200):**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "version": "1.0.0",
    "environment": "production",
    "features": {
      "ai_enabled": true,
      "seo_enabled": true,
      "attribution_enabled": true
    }
  }
}
```

---

## 9. Webhook API

### 9.1 Webhook 签名

Webhook 请求使用 HMAC-SHA256 签名：

```
X-Webhook-Signature: sha256=<signature>
```

签名计算：
```
signature = hmac_sha256(webhook_secret, request_body)
```

### 9.2 Webhook 事件类型

| 事件 | 描述 |
|------|------|
| `conversion.created` | 转化创建 |
| `conversion.approved` | 转化确认 |
| `settlement.completed` | 结算完成 |
| `experiment.started` | 实验启动 |
| `experiment.paused` | 实验暂停 |

### 9.3 Webhook 请求示例

```json
{
  "id": "evt_123",
  "type": "conversion.created",
  "data": {
    "conversion_id": "cnv_456",
    "amount": 100.00,
    "experiment_id": "exp_123"
  },
  "timestamp": 1709356800000
}
```

---

## 10. 速率限制

| 端点类型 | 限制 |
|----------|------|
| 认证接口 | 10 次/分钟 |
| 追踪接口 | 1000 次/分钟 |
| 分析接口 | 100 次/分钟 |
| 其他接口 | 100 次/分钟 |

超过限制返回 `429 rate_limit_exceeded`

---

*文档创建者: 01-架构师*
*最后更新: 2026-03-03*
