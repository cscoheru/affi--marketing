# 角色任务卡: 部署测试工程师 (DevOps Engineer)

## 角色信息
- **角色ID**: 06-devops
- **角色名称**: 部署测试工程师
- **预计时长**: 16 小时
- **主要职责**: 云平台部署、CI/CD、测试验证

## 核心任务

### 1. Railway 后端部署 (3h)

配置 Go 后端部署到 Railway：

```bash
# 安装 Railway CLI
npm install -g @railway/cli
railway login

# 创建项目
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
railway new --name affi-marketing-backend

# 配置环境变量
railway variables set DATABASE_URL "postgresql://postgres:WhjQTPAwInc5Vav3sDWe@139.224.42.111:5432/business_hub?sslmode=disable"
railway variables set REDIS_URL "redis://:FWD4D75OKyQS7HOluA6J@139.224.42.111:6379"
railway variables set MINIO_ENDPOINT "http://103.59.103.85:9000"
railway variables set DASHSCOPE_API_KEY "${DASHSCOPE_API_KEY}"
railway variables set OPENAI_API_KEY "${OPENAI_API_KEY}"

# 部署
railway up
```

**输出**: Railway 后端运行在 `api-hub.zenconsult.top`

### 2. Vercel 前端部署 (2h)

配置 Vue 前端部署到 Vercel：

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend

# 安装 Vercel CLI
npm install -g vercel
vercel login

# 部署
vercel --prod

# 配置域名
vercel domains add hub.zenconsult.top
```

**输出**: 前端运行在 `hub.zenconsult.top`

### 3. Cloudflare Workers 部署 (2h)

部署追踪脚本到 Cloudflare Workers：

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/workers/tracking

# 安装 Wrangler
npm install -g wrangler
wrangler login

# 配置 wrangler.toml
# 配置自定义域名

# 部署
wrangler deploy
```

**输出**: Workers 运行在 `tracker.zenconsult.top`

### 4. AI服务部署 (2h)

部署 FastAPI AI服务到 Railway：

**输出**: AI服务运行在 `ai-api.zenconsult.top`

### 5. DNS配置 (1h)

在 Vercel DNS 或域名注册商配置DNS记录：

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | api-hub | railway-domain.railway.app |
| CNAME | hub | vercel-domain.vercel.app |
| CNAME | tracker | workers-domain.workers.dev |
| CNAME | ai-api | railway-domain.railway.app |
| CNAME | go | vercel-domain.vercel.app |

### 6. 监控配置 (2h)

配置系统监控：
- Railway 内置监控
- Vercel Analytics
- Uptime Kuma (已有)
- 日志聚合

**输出**: 监控仪表板可访问

### 7. 测试验证 (4h)

#### 7.1 单元测试
验证各服务单元测试通过

#### 7.2 集成测试
验证服务间集成正常

#### 7.3 端到端测试
完整流程测试：
1. 创建实验
2. 配置插件
3. 启动实验
4. 生成追踪链接
5. 模拟点击
6. 查看数据

#### 7.4 性能测试
- API响应时间
- 数据库查询性能
- 前端加载速度

**输出**: `docs/TEST_REPORT.md`

### 8. 文档 (2h)

创建部署和运维文档：

**输出**:
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/MONITORING.md`
- `docs/TROUBLESHOOTING.md`

## 输入依赖

- [x] 后端代码已完成
- [x] 前端代码已完成
- [x] AI服务代码已完成
- [x] 基础设施已配置

## 交付产物

| 项目 | 平台 | 域名 | 状态 |
|------|------|------|------|
| Go后端 | Railway | api-hub.zenconsult.top | ⏳ 待部署 |
| Vue前端 | Vercel | hub.zenconsult.top | ⏳ 待部署 |
| 追踪Worker | Cloudflare | tracker.zenconsult.top | ⏳ 待部署 |
| AI服务 | Railway | ai-api.zenconsult.top | ⏳ 待部署 |

## 环境变量清单

### Railway (后端 + AI)
```
DATABASE_URL
REDIS_URL
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
DASHSCOPE_API_KEY
OPENAI_API_KEY
ENV=production
PORT=8080
```

### Vercel (前端)
```
VITE_API_BASE_URL=https://api-hub.zenconsult.top
VITE_TRACKING_DOMAIN=tracker.zenconsult.top
```

### Cloudflare Workers
```
API_BASE_URL=https://api-hub.zenconsult.top
```

## 部署检查清单

### 后端
- [ ] Railway 项目已创建
- [ ] 环境变量已配置
- [ ] 代码已部署
- [ ] 健康检查通过
- [ ] API 可访问

### 前端
- [ ] Vercel 项目已连接
- [ ] 环境变量已配置
- [ ] 构建成功
- [ ] 页面可访问
- [ ] API 调用正常

### Workers
- [ ] Wrangler 已配置
- [ ] Worker 已部署
- [ ] 自定义域名已配置
- [ ] 追踪端点可访问

### DNS
- [ ] 所有 CNAME 记录已添加
- [ ] DNS 已传播
- [ ] SSL 证书有效

### 监控
- [ ] 健康检查已配置
- [ ] 日志已收集
- [ ] 告警已设置

## 验证清单

- [ ] 所有服务已部署
- [ ] 所有域名可访问
- [ ] 服务间通信正常
- [ ] 监控正常工作
- [ ] 文档已完成
- [ ] 测试报告已完成

## 故障处理

### 部署失败
检查构建日志、修复错误、重新部署

### DNS问题
使用 `dig` 或 `nslookup` 检查DNS传播

### API调用失败
检查CORS、网络连接、环境变量

---

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/06-devops.md"
