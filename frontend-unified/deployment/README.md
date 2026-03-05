# Affi-Marketing 部署指南

## 前置条件

- Vercel 账号 (https://vercel.com)
- Railway 账号 (https://railway.app)
- 域名配置权限 (zenconsult.top)
- Git 仓库 (GitHub/GitLab/Bitbucket)

---

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户访问层                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vercel     │  │   Railway     │  │  Railway      │     │
│  │   前端        │  │   后端API     │  │   AI服务      │     │
│  │   hub.zen    │  │   api-hub     │  │   ai-api      │     │
│  │   .zenconsult│  │   .zenconsult │  │   .zenconsult  │     │
│  │   .top       │  │   .top        │  │   .top         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 部署步骤

### 1. 前端部署 (Vercel)

#### 1.1 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 1.2 登录 Vercel

```bash
vercel login
```

#### 1.3 部署项目

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified

# 首次部署 (预览环境)
vercel

# 生产环境部署
vercel --prod
```

#### 1.4 配置环境变量

在 Vercel Dashboard 中配置环境变量:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://api-hub.zenconsult.top` | 后端 API 地址 |
| `NEXT_PUBLIC_AI_URL` | `https://ai-api.zenconsult.top` | AI 服务地址 |
| `NEXTAUTH_SECRET` | `[生成随机字符串]` | NextAuth 密钥 |
| `NEXTAUTH_URL` | `https://hub.zenconsult.top` | 应用 URL |

#### 1.5 配置自定义域名

```bash
# 添加自定义域名
vercel domains add hub.zenconsult.top
```

或在 Vercel Dashboard 中:
1. 进入项目 Settings → Domains
2. 添加域名: `hub.zenconsult.top`
3. 配置 DNS: CNAME 指向 `cname.vercel-dns.com`

---

### 2. 后端部署 (Railway)

#### 2.1 安装 Railway CLI

```bash
npm install -g @railway/cli
```

#### 2.2 登录 Railway

```bash
railway login
```

#### 2.3 创建后端服务

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go

# 初始化项目
railway init

# 创建新服务
railway new --name affi-marketing-backend

# 配置环境变量
railway variables set DATABASE_URL "postgresql://postgres:password@139.224.42.111:5432/business_hub"
railway variables set REDIS_URL "redis://:password@139.224.42.111:6379"
railway variables set MINIO_ENDPOINT "http://103.59.103.85:9000"
railway variables set MINIO_ACCESS_KEY "admin"
railway variables set MINIO_SECRET_KEY "xhOSMeHNmxCgNTBpoQfH"
railway variables set JWT_SECRET "[生成随机字符串]"
railway variables set CORS_ORIGINS "https://hub.zenconsult.top"

# 部署
railway up
```

#### 2.4 配置后端域名

在 Railway Dashboard 中:
1. 进入项目 Settings → Domains
2. 添加域名: `api-hub.zenconsult.top`
3. 配置 DNS: CNAME 指向 Railway 提供的域名

---

### 3. AI 服务部署 (Railway)

#### 3.1 创建 AI 服务

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service

# 创建新服务
railway new --name affi-marketing-ai

# 配置环境变量
railway variables set OPENAI_API_KEY "your-openai-key"
railway variables set ANTHROPIC_API_KEY "your-anthropic-key"
railway variables set QWEN_API_KEY "your-qwen-key"
railway variables set DATABASE_URL "postgresql://postgres:password@139.224.42.111:5432/business_hub"

# 部署
railway up
```

#### 3.2 配置 AI 服务域名

在 Railway Dashboard 中添加域名: `ai-api.zenconsult.top`

---

## DNS 配置

在域名注册商 (zenconsult.top) 配置以下 DNS 记录:

| 类型 | 名称 | 值 | TTL |
|------|------|-----|-----|
| CNAME | hub | cname.vercel-dns.com | 3600 |
| CNAME | api-hub | [Railway 域名] | 3600 |
| CNAME | ai-api | [Railway 域名] | 3600 |
| CNAME | www | hub.zenconsult.top | 3600 |

### 查找 Railway 域名

在 Railway Dashboard 中:
1. 进入项目
2. 点击 Settings → Domains
3. 复制显示的域名

---

## 验证检查清单

### 前端验证

- [ ] 主页可访问: https://hub.zenconsult.top
- [ ] 登录页面正常显示
- [ ] 静态资源加载正常
- [ ] 控制台无错误信息

### 后端验证

```bash
# 健康检查
curl https://api-hub.zenconsult.top/health

# API 测试
curl https://api-hub.zenconsult.top/api/v1/experiments
```

- [ ] 健康检查返回 200
- [ ] API 响应正常
- [ ] CORS 配置正确

### AI 服务验证

```bash
# 健康检查
curl https://ai-api.zenconsult.top/health
```

- [ ] 健康检查返回 200
- [ ] AI 模型加载正常

### DNS 验证

```bash
# 检查 DNS 解析
dig hub.zenconsult.top
dig api-hub.zenconsult.top
dig ai-api.zenconsult.top
```

- [ ] 所有域名正确解析
- [ ] SSL 证书有效

---

## 故障排查

### 构建失败

**症状**: Vercel/Railway 构建失败

**解决方案**:
1. 查看构建日志
2. 检查依赖版本
3. 确认环境变量配置
4. 修复错误后重新部署

### API 调用失败

**症状**: 前端无法连接后端

**解决方案**:
1. 检查 CORS 配置
2. 确认后端服务运行状态
3. 检查防火墙规则
4. 验证环境变量

### DNS 问题

**症状**: 域名无法访问

**解决方案**:
1. 使用 `dig` 或 `nslookup` 检查 DNS
2. 等待 DNS 传播 (最多 48 小时)
3. 检查 DNS 记录配置
4. 清除本地 DNS 缓存

### SSL 证书问题

**症状**: HTTPS 警告

**解决方案**:
1. 等待 Let's Encrypt 验证
2. 检查域名 DNS 配置
3. 确认域名指向正确的服务

---

## 回滚计划

### Vercel 回滚

```bash
# 查看部署历史
vercel ls

# 回滚到指定部署
vercel rollback [deployment-id]
```

### Railway 回滚

```bash
# 查看部署历史
railway status

# 回滚到上一版本
railway rollback
```

---

## 监控与日志

### Vercel Analytics

访问 Vercel Dashboard 查看:
- 页面访问量
- Core Web Vitals
- 构建时间

### Railway Logs

```bash
# 查看实时日志
railway logs

# 查看特定服务日志
railway logs --service affi-marketing-backend
```

---

## 成本估算

| 服务 | 计划 | 月费用 |
|------|------|--------|
| Vercel (Hobby) | 免费计划 | $0 |
| Vercel (Pro) | 专业计划 | $20 |
| Railway | 后端 + AI | $10 |
| 域名 | zenconsult.top | $1/年 |
| **总计** | - | **$10-31/月** |

---

**文档版本**: v1.0
**最后更新**: 2026-03-05
**维护者**: 05-集成测试与部署
