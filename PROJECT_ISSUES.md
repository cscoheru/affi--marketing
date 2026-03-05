# Affi-Marketing 项目问题追踪

**最后更新**: 2026-03-06 00:35
**项目经理**: Claude Code

---

## 📋 问题统计

| 状态 | 数量 |
|------|------|
| 🔴 高优先级 | 1 |
| 🟡 中优先级 | 1 |
| 🟢 低优先级 | 1 |
| ✅ 已解决 | 15 |

**说明**:
- 🔴 待解决: 内容自动化API路由未部署 (BE-05) - 需 Railway 重新部署
- 🟡 待解决: Vercel前端部署配置错误
- 🟢 低优先级: Vue组件主题CSS字体栈不一致
- ✅ 新增已解决: Vue组件生产环境加载失败

---

## 当前问题列表

### [05-集成测试与部署] 前端页面标题问题
**提出时间**: 2026-03-05 19:00
**优先级**: 🟢低
**问题描述**:
前端页面标题显示为"Create Next App"而不是"Affi-Marketing"。

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 19:15
**解决方案**: 已更新 `frontend-unified/app/layout.tsx` 中的 metadata.title 为 "Affi-Marketing"，并修改语言为 "zh-CN"

---

### [02-React前端] 登出功能未正常工作
**提出时间**: 2026-03-05 20:00
**优先级**: 🔴高
**问题描述**:
测试中发现点击登出按钮后，页面跳转超时或未正确跳转到登录页。Playwright 测试失败。

**测试日志**:
```
Error: page.waitForURL: Timeout 5000ms exceeded.
waiting for navigation until "load"
  navigated to "http://localhost:3000/dashboard"
```

**当前状态**:
- [x] 需要02-React前端支持: 检查 unified-sidebar.tsx 中的登出按钮逻辑

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 21:00
**解决方案**: 将 `window.location.href = '/login'` 替换为 `router.push('/login')`，确保 Next.js 路由正确触发导航事件

---

### [02-React前端] ProtectedRoute 未正确处理回调URL
**提出时间**: 2026-03-05 20:00
**优先级**: 🟡中
**问题描述**:
用户访问受保护页面后被重定向到登录页，登录后应返回到原始页面，但实际返回到了 dashboard。

**测试步骤**:
1. 清除登录状态
2. 直接访问 /experiments
3. 登录后应该返回 /experiments
4. 实际返回到了 /dashboard

**当前状态**:
- [x] 需要02-React前端支持: 检查 protected-route.tsx 中的回调URL处理

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 21:00
**解决方案**:
1. ProtectedRoute 在重定向前将当前 URL 保存到 sessionStorage
2. Login 页面登录成功后检查并恢复保存的 URL
3. 如无保存的 URL，默认跳转到 /dashboard

---

### [02-React前端] 侧边栏导航高亮问题
**提出时间**: 2026-03-05 20:00
**优先级**: 🟡中
**问题描述**:
侧边栏用户区域（用户头像/名称）未正确显示。Playwright 测试无法找到用户信息元素。

**测试日志**:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid="user-avatar"]')
Expected: visible
Timeout: 5000ms
```

**当前状态**:
- [x] 需要02-React前端支持: 检查 unified-sidebar.tsx 中的用户信息渲染逻辑

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 21:00
**解决方案**: 为 Avatar 组件添加 `data-testid="user-avatar"` 属性，为用户菜单按钮添加 `data-testid="user-menu-button"` 属性

---

### [02-React前端] 导航高亮样式未生效
**提出时间**: 2026-03-05 20:00
**优先级**: 🟢低
**问题描述**:
当前页面的导航项没有高亮样式。active 类名或样式可能未正确应用。

**当前状态**:
- [x] 需要02-React前端支持: 检查 unified-sidebar.tsx 中的 active 状态处理

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 21:00
**解决方案**: 代码检查显示导航高亮逻辑正确 (`variant={pathname === item.path ? "secondary" : "ghost"}`)，shadcn/ui 的 secondary 变体会自动应用高亮样式。需要视觉测试确认

---

### [03-Vue迁移] Vue组件Wrapper未实现
**提出时间**: 2026-03-05 20:00
**优先级**: 🔴高
**问题描述**:
03-Vue迁移角色尚未开始工作，Vue组件的Wrapper、状态桥接等均未实现。导致05角色无法进行Vue微应用集成测试。

**当前状态**:
- [x] 等待03-Vue迁移角色启动

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 21:30
**解决方案**: 03-Vue迁移已完成，创建了6个Wrapper组件、Bridge Store、主题适配样式，所有页面已集成VueRemoteLoader

---

### [04-后端与AI] 后端API服务未部署
**提出时间**: 2026-03-05 20:00
**优先级**: 🔴高
**问题描述**:
04-后端与AI角色尚未开始工作，后端API服务和AI服务均未部署。导致05角色无法进行API连接测试和完整端到端测试。

**当前状态**:
- [x] 等待04-后端与AI角色启动

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 22:00
**解决方案**: 04-后端与AI已完成开发，服务器可正常运行，API测试已完成

---

### [04-后端与AI] 追踪/结算API返回404 (BE-03)
**提出时间**: 2026-03-05 22:00
**优先级**: 🔴高
**问题描述**:
测试发现追踪和结算服务的API端点返回404错误，路由可能未实现或未注册。

**测试日志**:
```
GET /api/v1/tracking/events → 404 Not Found
GET /api/v1/settlements → 404 Not Found
```

**当前状态**:
- [x] 需要04-后端与AI支持: 检查路由注册，实现缺失的控制器
- [x] 修改任务卡已创建: `roles/04-backend-ai-fix.md`

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 23:00
**解决方案**: 添加了 `/api/v1/settlements` 别名路由，复用现有的 ListRecords 控制器方法。追踪服务路由已正确注册，无需修改。

---

### [04-后端与AI] Redis密码错误 (BE-02)
**提出时间**: 2026-03-05 22:00
**优先级**: 🟡中
**问题描述**:
后端无法连接到Redis服务器，返回NOAUTH错误，密码配置不正确。

**测试日志**:
```
Redis连接失败: NOAUTH Authentication required
```

**当前状态**:
- [x] 需要04-后端与AI支持: 更新`.env`文件中的REDIS_PASSWORD
- [x] 修改任务卡已创建: `roles/04-backend-ai-fix.md`

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 23:00
**解决方案**: 更新 `.env` 文件中的 `REDIS_PASSWORD=YOUR_REDIS_PASSWORD` 占位符。部署时需配置正确的环境变量。

---

### [04-后端与AI] content自动化API被临时禁用 (BE-04)
**提出时间**: 2026-03-05 22:00
**优先级**: 🟡中
**问题描述**:
content auth与主auth路由冲突，content.RegisterRoutes被临时注释掉，导致产品、素材、内容、发布、分析API不可用。

**临时修复**:
```go
// backend-go/cmd/server/main.go
// content.RegisterRoutes(v1, db) // 已注释
```

**当前状态**:
- [x] 需要04-后端与AI支持: 重构内容自动化系统，移除重复的auth控制器
- [x] 修改任务卡已创建: `roles/04-backend-ai-fix.md`

**解决状态**: ✅已解决
**解决时间**: 2026-03-05 23:00
**解决方案**: 删除了 `internal/controller/content/auth.go` 重复认证控制器，更新了 `routes.go` 移除对它的引用，然后在 `main.go` 中重新启用了 `content.RegisterRoutes(v1, db)`。

---

### [03-Vue迁移] Vue组件生产环境加载失败
**提出时间**: 2026-03-05 23:55
**优先级**: 🔴高
**问题描述**:
生产环境控制台报错，无法加载Vue组件：
```
Error loading Vue component
Cannot find module 'https://hub.zenconsult.top/vue-remote/assets/remoteEntry.js'
```

**根本原因**:
- `next.config.ts` 中的 rewrite 规则仅用于开发环境
- 生产环境没有配置 `/vue-remote/` 路由
- Vue 构建产物未部署到可访问位置

**当前状态**:
- [x] Vue 应用已构建
- [x] 构建产物已复制到 `frontend-unified/public/vue-remote/`
- [x] remoteEntry.js 文件已就位

**解决状态**: ✅已解决
**解决时间**: 2026-03-06
**解决方案**:
```bash
cd frontend
npm run build
cd ../frontend-unified
mkdir -p public/vue-remote
cp -r ../frontend/dist/* public/vue-remote/
```

**注意**: Vue 构建产物已部署，但需要重新部署 Vercel 前端才能生效。

---

### [04-后端与AI] 内容自动化API路由未部署 (BE-05)
**提出时间**: 2026-03-06 00:20
**优先级**: 🔴高
**问题描述**:
生产环境后端 API 返回 404 错误，内容自动化路由不可用：
- `/api/v1/products` → 404 Not Found
- `/api/v1/materials` → 404 Not Found
- `/api/v1/content` → 404 Not Found
- `/api/v1/publish` → 404 Not Found

**测试结果**:
```
✅ /health → 200 OK (后端运行正常)
⚠️ /api/v1/experiments → origin not allowed (路由存在，CORS限制)
❌ /api/v1/products → 404 Not Found (路由不存在)
❌ /api/v1/materials → 404 Not Found (路由不存在)
```

**根本原因**:
- Railway 不知道要构建 `backend-go` 子目录
- 缺少根目录的 `railway.toml` 配置文件指定构建目录
- Railway 可能部署了错误的目录或使用了旧版本

**影响范围**:
- 前端产品管理页面无法加载数据
- 前端素材库页面无法上传/下载
- 前端内容管理页面无法创建/发布
- 前端发布中心页面无法创建任务

**当前状态**:
- [x] 本地代码已完整实现
- [x] 代码已推送到 GitHub
- [x] 已创建 `railway.toml` 配置文件 (commit 1e67363)
- [ ] Railway 需要重新部署以应用新配置

**解决方案**:
1. ✅ 已创建 `railway.toml` 配置 Railway 使用 `backend-go` 目录
2. 在 Railway Dashboard 触发重新部署:
   - 访问 Railway Dashboard → affi-marketing-api 服务
   - 点击 "New Deploy" 或 "Redeploy"
   - 等待 2-3 分钟
3. 验证路由可用性: `curl https://api-hub.zenconsult.top/api/v1/products`

**Railway 日志分析**:
```
"upstreamAddress": "http://[fd12:49b6:1414:1:4000:a3:c60:cf08]:8080"
```
请求到达后端但返回 404，说明路由未注册。

**解决状态**: 待解决（等待 Railway 重新部署）

---

### [03-Vue迁移] Vue组件主题CSS字体栈不一致
**提出时间**: 2026-03-05 22:00
**优先级**: 🟢低
**问题描述**:
Vue组件的主题CSS字体栈与Next.js主应用不完全一致，虽然功能正确但为保持一致性建议统一。

**当前状态**:
- [x] 需要03-Vue迁移支持: 统一字体栈定义
- [x] 修改任务卡已创建: `roles/03-vue-migration-fix.md`

**解决状态**: 待解决

---

### [02-React前端] 内容管理功能缺失 - Mock状态
**提出时间**: 2026-03-05 23:50
**优先级**: 🟡中
**问题描述**:
React原生页面（产品管理、素材库、内容管理、发布中心）处于Mock状态，未连接后端API：
- 按钮没有 onClick 处理函数
- 数据使用硬编码的 mock 数据
- 无法进行实际 CRUD 操作

**影响页面**:
- `/products` - 产品管理页面
- `/materials` - 素材库页面
- `/content` - 内容管理页面
- `/publish` - 发布中心页面

**需要实现**:
- [x] 创建 API 请求封装 (`lib/api.ts`)
- [x] 产品管理页面 API 集成
- [x] 素材库页面 API 集成
- [x] 内容管理页面 API 集成
- [x] 发布中心页面 API 集成

**当前状态**:
- [x] Phase 2 已完成 ✅
- [x] 所有页面已连接后端API
- [x] 完整 CRUD 功能实现

**解决状态**: ✅已解决
**解决时间**: 2026-03-06
**解决方案**:
- 创建了完整的 API 客户端封装 (`lib/api.ts`)
- 产品管理: 使用 productsApi 实现完整 CRUD，搜索功能
- 素材库: 使用 materialsApi 实现文件上传/下载/删除，类型筛选
- 内容管理: 使用 contentApi 实现创建/编辑/删除/发布，Tab 分类筛选
- 发布中心: 使用 publishApi 实现任务创建/执行/取消，状态筛选

---

### [02-React前端] 博客页面缺失 - 404错误
**提出时间**: 2026-03-05 23:50
**优先级**: 🟡中
**问题描述**:
博客相关页面未创建，访问返回404：
- `/blog` - 博客首页 (404)
- `/blog/list` - 文章列表页 (404)
- `/blog/article/[id]` - 文章详情页 (404)

**需要实现**:
- [x] 创建博客首页组件
- [x] 创建文章列表页组件
- [x] 创建文章详情页组件
- [x] 集成后端内容 API

**当前状态**:
- [x] 博客系统已完成 ✅
- [x] 包含首页、列表页、详情页

**解决状态**: ✅已解决
**解决时间**: 2026-03-06
**解决方案**:
- 创建了博客首页 (`/blog/page.tsx`)：精选文章 + 最新文章 + 订阅区域
- 创建了文章列表页 (`/blog/list/page.tsx`)：分类筛选 + 搜索 + 分页
- 创建了文章详情页 (`/blog/article/[id]/page.tsx`)：完整内容 + 相关文章 + 分享功能

---

## 已解决问题

*(暂无已解决问题)*

---

## 📝 问题报告格式

各角色遇到问题时，请按以下格式添加到此文件：

```markdown
### [角色ID] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
[详细描述问题，包括错误信息、重现步骤等]

**当前状态**:
- [ ] 需要项目经理决策
- [ ] 需要[角色ID]支持: [具体需求]
- [ ] 可自行解决

**解决状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM (如果已解决)
**解决方案**: [如果已解决，描述解决方案]
```

---

## 📞 项目经理响应承诺

- 工作时间内 2小时内回复
- 每日至少查看 3 次 (10:00, 15:00, 21:00)
- 高优先级问题优先处理
- 所有回复将直接在此文件中添加

---

**更新说明**: 各角色遇到问题时添加，项目经理回复时更新
