# 后端测试指南

## 环境变量问题修复

### 问题诊断
.env.example 中的变量名与代码绑定不一致：

| 错误名称 (.env.example) | 正确名称 (loader.go) |
|------------------------|---------------------|
| `DB_HOST` | `DATABASE_HOST` |
| `DB_PORT` | `DATABASE_PORT` |
| `DB_USER` | `DATABASE_USER` |
| `DB_PASSWORD` | `DATABASE_PASSWORD` |
| `DB_NAME` | `DATABASE_DB_NAME` |
| `DB_SSLMODE` | `DATABASE_SSL_MODE` |

### ✅ 已修复
已更新 `.env.example` 使用正确的变量名。

---

## 本地测试步骤

### 1. 创建本地环境变量文件

```bash
cd backend-go
cp .env.example .env
```

### 2. 验证环境变量加载

```bash
# 运行测试命令
go run cmd/server/main.go
```

应该看到以下日志：
```
INFO  Starting Affi-Marketing API Server  version=0.1.0  mode=debug
INFO  Database connected  host=139.224.42.111  database=business_hub
INFO  Redis connected  host=139.224.42.111
INFO  Server started  address=0.0.0.0:8080
```

### 3. 健康检查

```bash
curl http://localhost:8080/health
```

预期响应：
```json
{
  "status": "ok",
  "service": "affi-marketing-api",
  "version": "0.1.0"
}
```

---

## API 测试清单

### 实验 API

| 方法 | 端点 | 测试命令 |
|------|------|----------|
| GET | /api/v1/experiments | `curl http://localhost:8080/api/v1/experiments` |
| POST | /api/v1/experiments | `curl -X POST http://localhost:8080/api/v1/experiments -H "Content-Type: application/json" -d '{"name":"Test","plugin_id":"seo","config":{}}'` |
| GET | /api/v1/experiments/:id | `curl http://localhost:8080/api/v1/experiments/1` |
| PUT | /api/v1/experiments/:id | `curl -X PUT http://localhost:8080/api/v1/experiments/1 -H "Content-Type: application/json" -d '{"name":"Updated"}'` |
| DELETE | /api/v1/experiments/:id | `curl -X DELETE http://localhost:8080/api/v1/experiments/1` |
| POST | /api/v1/experiments/:id/start | `curl -X POST http://localhost:8080/api/v1/experiments/1/start` |
| POST | /api/v1/experiments/:id/stop | `curl -X POST http://localhost:8080/api/v1/experiments/1/stop` |

### 追踪 API

| 方法 | 端点 | 测试命令 |
|------|------|----------|
| POST | /api/v1/tracking/events | `curl -X POST http://localhost:8080/api/v1/tracking/events -H "Content-Type: application/json" -d '{"experiment_id":1,"event_type":"click","tracking_id":"test-123"}'` |
| GET | /api/v1/tracking/events | `curl http://localhost:8080/api/v1/tracking/events` |

### 结算 API

| 方法 | 端点 | 测试命令 |
|------|------|----------|
| GET | /api/v1/settlement/records | `curl http://localhost:8080/api/v1/settlement/records` |

---

## Railway 部署环境变量

在 Railway Console 中设置以下环境变量：

```bash
# 数据库连接 (使用完整 URL)
DATABASE_URL=postgresql://postgres:WhjQTPAwInc5Vav3sDWe@139.224.42.111:5432/business_hub?sslmode=disable

# 或者分开设置
DATABASE_HOST=139.224.42.111
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=WhjQTPAwInc5Vav3sDWe
DATABASE_DB_NAME=business_hub
DATABASE_SSL_MODE=disable

# Redis
REDIS_HOST=139.224.42.111
REDIS_PORT=6379
REDIS_PASSWORD=FWD4D75OKyQS7HOluA6J

# MinIO
MINIO_ENDPOINT=http://103.59.103.85:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=xhOSMeHNmxCgNTBpoQfH

# AI 服务 API 密钥
DASHSCOPE_API_KEY=your_dashscope_key
OPENAI_API_KEY=your_openai_key
```

---

## 故障排查

### 问题 1: 数据库连接失败
```
Error: failed to init database: connection refused
```

**解决方案**:
1. 检查防火墙是否允许 Railway IP 访问
2. 验证数据库密码正确
3. 确认 PostgreSQL 正在运行

### 问题 2: 环境变量未生效
```
Error: database config is empty
```

**解决方案**:
1. 确认环境变量名称正确 (使用 `DATABASE_` 前缀)
2. 在 Railway Console 中重新设置环境变量
3. 触发重新部署

### 问题 3: CORS 错误
```
Access to fetch at '...' has been blocked by CORS policy
```

**解决方案**:
```bash
# 设置 CORS 允许的前端域名
CORS_ALLOWED_ORIGINS=https://hub.zenconsult.top,http://localhost:5173
```

---

## 与会话 6 并行测试

### 会话 6 测试范围
- 后端 → 数据库连接
- GORM 模型验证
- CRUD 操作测试

### 你可以并行测试的范围
- 前端 → 后端 API 调用
- 认证流程测试
- 完整用户流程测试

### 测试命令

```bash
# 终端 1: 后端服务 (会话 6)
cd backend-go
go run cmd/server/main.go

# 终端 2: 前端服务 (你)
cd frontend
npm run dev

# 终端 3: API 测试 (你)
# 运行测试脚本
```

---

## 验证清单

- [ ] 本地环境变量正确加载
- [ ] 数据库连接成功
- [ ] Redis 连接成功 (可选)
- [ ] 健康检查端点返回 200
- [ ] 创建实验 API 工作正常
- [ ] 追踪事件 API 工作正常
- [ ] CORS 配置正确
- [ ] Railway 环境变量已设置
- [ ] Railway 部署成功
