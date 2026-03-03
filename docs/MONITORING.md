# Affi-Marketing 监控指南

本文档提供 Affi-Marketing 项目的监控配置和使用指南。

## 目录

- [监控概览](#监控概览)
- [Railway 监控](#railway-监控)
- [Vercel Analytics](#vercel-analytics)
- [健康检查端点](#健康检查端点)
- [告警配置](#告警配置)
- [日志分析](#日志分析)

## 监控概览

| 服务 | 监控平台 | 指标 |
|------|----------|------|
| Backend API | Railway Metrics | CPU, 内存, 请求, 错误率 |
| AI Service | Railway Metrics | CPU, 内存, 请求, AI 调用 |
| Frontend | Vercel Analytics | 页面加载, Web Vitals |

## Railway 监控

### 1. Metrics 查看

1. 打开 Railway Dashboard: https://railway.com/dashboard
2. 选择项目: affi-marketing-backend
3. 选择服务 (Backend 或 AI Service)
4. 点击 "Metrics" 标签

### 2. 关键指标

**CPU 使用率**
- 正常: < 70%
- 警告: 70-90%
- 严重: > 90%

**内存使用**
- 正常: < 80%
- 警告: 80-95%
- 严重: > 95%

**请求成功率**
- 正常: > 99%
- 警告: 95-99%
- 严重: < 95%

**响应时间**
- 正常: < 500ms
- 警告: 500-2000ms
- 严重: > 2000ms

### 3. Railway 日志

```bash
# 查看实时日志
railway logs --tail 100

# 查看特定服务的日志
cd backend-go && railway logs
cd ai-service && railway logs
```

## Vercel Analytics

### 1. 启用 Analytics

1. 打开 Vercel Dashboard
2. 进入 frontend 项目
3. 点击 "Analytics" 标签
4. 确认 Analytics 已启用

### 2. 关键指标

**Core Web Vitals**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**页面性能**
- First Load JS: < 200 KB
- 资源总大小: < 500 KB

**流量分析**
- 页面浏览量
- 唯一访客
- 地理分布
- 设备分布

## 健康检查端点

### Backend API

```bash
# 根端点
GET https://api-hub.zenconsult.top/

# 响应
{
  "message": "Affi-Marketing API",
  "status": "running",
  "version": "0.1.0"
}
```

### AI Service

```bash
# 健康检查
GET https://ai-api.zenconsult.top/health

# 响应
{
  "status": "healthy",
  "version": "1.0.0",
  "models_available": {
    "qwen": 1,
    "openai": 1,
    "chatglm": 1
  },
  "uptime_seconds": 3600
}
```

### 监控脚本

```bash
#!/bin/bash
# health-check.sh

# Backend
curl -f https://api-hub.zenconsult.top/ || echo "Backend DOWN"

# AI Service
curl -f https://ai-api.zenconsult.top/health || echo "AI Service DOWN"

# Frontend
curl -f https://hub.zenconsult.top/ || echo "Frontend DOWN"
```

## 告警配置

### Railway 告警

1. 打开 Railway Dashboard
2. 选择服务
3. 点击 "Settings" → "Notifications"
4. 配置告警规则:

| 指标 | 阈值 | 通知方式 |
|------|------|----------|
| CPU | > 80% | Email |
| 内存 | > 90% | Email |
| 错误率 | > 5% | Email |
| 响应时间 | > 2000ms | Email |

### 外部监控服务

**Uptime Kuma** (如已配置)
- URL: https://uptime.zenconsult.top
- 监控端点:
  - https://api-hub.zenconsult.top/health
  - https://ai-api.zenconsult.top/health
  - https://hub.zenconsult.top/

## 日志分析

### 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| DEBUG | 调试信息 | 函数参数值 |
| INFO | 一般信息 | 服务启动, 请求完成 |
| WARN | 警告信息 | 降级服务, 重试 |
| ERROR | 错误信息 | 请求失败, 异常 |

### 查看日志

**Railway CLI**
```bash
# 实时日志
railway logs --tail 50 -f

# 过滤错误
railway logs --tail 100 | grep ERROR
```

**Vercel Dashboard**
1. 进入项目
2. 点击 "Deployments"
3. 选择部署
4. 查看 "Build Logs" 或 "Function Logs"

### 日志聚合

将日志发送到外部服务 (可选):

**Loki**
```bash
# 安装 loki-logcli
brew install loki-logcli

# 查询日志
logcli query --addr=http://localhost:3100 '{app="affi-marketing"}'
```

## 性能监控

### AI 成本监控

```bash
# 检查 AI 服务成本统计
curl https://ai-api.zenconsult.top/api/v1/stats/costs

# 响应
{
  "total_cost": 1.23,
  "costs_by_model": {
    "qwen-turbo": 0.50,
    "gpt-3.5-turbo": 0.73
  },
  "daily_limit": 100,
  "requests": 150
}
```

### 数据库性能

**查询性能监控**
- 慢查询日志
- 连接池使用率
- 查询响应时间

**Redis 性能**
- 缓存命中率
- 内存使用率
- 连接数

## 故障排查

### 常见问题

**服务无响应**
1. 检查健康检查端点
2. 查看 Railway 日志
3. 检查环境变量配置

**性能下降**
1. 查看 CPU/内存使用率
2. 检查数据库连接池
3. 分析慢查询日志

**高错误率**
1. 查看 Error 级别日志
2. 检查外部 API 调用
3. 验证环境变量配置

### 诊断命令

```bash
# 检查服务状态
./docs/check-deployment.sh

# 运行集成测试
./docs/integration-test.sh

# 验证 DNS
./docs/verify-dns.sh
```

## 监控最佳实践

1. **设置告警阈值**
   - 基于历史数据设置合理的阈值
   - 避免告警疲劳

2. **定期审查日志**
   - 每日查看错误日志
   - 每周分析性能趋势

3. **监控 SLA**
   - 目标可用性: 99.9%
   - 目标响应时间: < 500ms
   - 目标错误率: < 0.1%

4. **容量规划**
   - 监控资源使用趋势
   - 提前规划扩容

## 联系支持

如有监控问题:
- 查看部署日志
- GitHub Issues
- 检查服务状态页面

## 相关文档

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [API 文档](./API_SPEC.md)
- [架构文档](./ARCHITECTURE.md)
