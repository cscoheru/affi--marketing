# Affi-Marketing 部署日志

**部署日期**: 2026-03-05
**部署工程师**: 05-集成测试与部署
**部署阶段**: 准备阶段

---

## 📋 部署前检查

### 环境检查
- [x] Node.js 版本: v18+
- [x] npm 版本: v9+
- [x] Git 仓库已初始化
- [x] 项目依赖已安装

### 代码检查
- [x] 前端代码已构建成功
- [x] 无TypeScript错误
- [x] 无ESLint关键错误

---

## 🚀 部署准备进度

### 已完成
- [x] Vercel 配置文件创建 (`vercel.json`)
- [x] 环境变量模板创建 (`.env.example`)
- [x] 部署文档编写 (`deployment/README.md`)
- [x] Playwright 测试配置完成
- [x] 测试套件创建完成
- [x] 前端测试通过 (20/29)

### 待完成 (等待03、04角色完成)
- [ ] 前端部署到 Vercel
- [ ] 后端部署到 Railway
- [ ] AI服务部署到 Railway
- [ ] DNS配置
- [ ] SSL证书验证
- [ ] 健康检查配置

---

## 📦 部署配置

### Vercel 配置 (前端)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api-hub.zenconsult.top",
    "NEXT_PUBLIC_AI_URL": "https://ai-api.zenconsult.top"
  }
}
```

### Railway 配置 (后端)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "./server"
healthcheckPath = "/health"
```

### Railway 配置 (AI服务)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

---

## 🔐 环境变量配置

### 前端环境变量
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://api-hub.zenconsult.top` | 后端API地址 |
| `NEXT_PUBLIC_AI_URL` | `https://ai-api.zenconsult.top` | AI服务地址 |
| `NEXTAUTH_SECRET` | `[待生成]` | NextAuth密钥 |
| `NEXTAUTH_URL` | `https://hub.zenconsult.top` | 应用URL |

### 后端环境变量
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `[待配置]` | PostgreSQL连接 |
| `REDIS_URL` | `[待配置]` | Redis连接 |
| `MINIO_ENDPOINT` | `http://103.59.103.85:9000` | MinIO端点 |
| `JWT_SECRET` | `[待生成]` | JWT密钥 |

### AI服务环境变量
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `OPENAI_API_KEY` | `[待配置]` | OpenAI密钥 |
| `ANTHROPIC_API_KEY` | `[待配置]` | Anthropic密钥 |
| `QWEN_API_KEY` | `[待配置]` | 通义千问密钥 |

---

## 🌐 DNS 配置计划

| 类型 | 名称 | 值 | TTL | 状态 |
|------|------|-----|-----|------|
| CNAME | hub | cname.vercel-dns.com | 3600 | 待配置 |
| CNAME | api-hub | [Railway域名] | 3600 | 待配置 |
| CNAME | ai-api | [Railway域名] | 3600 | 待配置 |
| CNAME | www | hub.zenconsult.top | 3600 | 待配置 |

---

## 🔄 回滚计划

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

## 📝 待解决问题

### 阻塞问题
- [ ] 03-Vue迁移未完成
- [ ] 04-后端与AI未完成

### 非阻塞问题
- [ ] 登出功能需修复 (02-React前端)
- [ ] 导航高亮需修复 (02-React前端)

---

## 🎯 下一步行动

1. **等待03-Vue迁移完成** (预计2-3天)
2. **等待04-后端与AI完成** (预计3-5天)
3. **进行完整集成测试**
4. **执行生产环境部署**
5. **配置DNS和监控**

---

**日志更新**: 2026-03-05 20:00
**下次更新**: 03、04角色完成后
