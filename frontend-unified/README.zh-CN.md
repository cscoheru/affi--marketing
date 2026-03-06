# Affi-Marketing 前端统一平台

> **联盟营销 + 内容自动化 + 博客系统** 一体化管理平台
>
> 基于Next.js 16 + React 19 + Tailwind CSS 4 构建的现代化Web应用

---

## ✨ 核心功能

### 📊 联盟营销控制台
- **仪表板**: 数据概览与实时监控
- **实验管理**: A/B测试与转化率优化
- **插件市场**: 功能扩展与集成
- **数据分析**: 业绩报表与趋势分析
- **佣金结算**: 收入管理与结算

### ✍️ 内容自动化系统
- **产品管理**: Amazon产品信息管理
- **素材库**: 图片、视频素材存储
- **AI内容生成**: 自动创建营销内容
- **多平台发布**: 一键发布到Blogger等平台
- **博客同步**: 内容自动同步到博客系统

### 📝 博客系统
- **前台展示**: 精美的博客首页和文章详情
- **后台管理**: 文章、分类、评论管理
- **AI助手**: 智能内容生成与编辑
- **SEO优化**: 完整的搜索引擎优化支持
- **评论系统**: 用户互动与反馈

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- npm 或 bun

### 安装依赖

```bash
npm install
# 或
bun install
```

### 启动开发服务器

```bash
npm run dev
# 或
bun dev
```

访问：http://localhost:3000

### 构建生产版本

```bash
npm run build
npm start
```

---

## 📁 项目结构

```
frontend-unified/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard路由组
│   │   ├── blog/         # 博客系统
│   │   ├── content/      # 内容自动化
│   │   └── ...          # 其他功能
│   └── login/            # 登录页
├── components/           # React组件
│   ├── blog/            # 博客组件
│   ├── ui/              # shadcn/ui组件
│   └── unified-sidebar.tsx
├── lib/                 # 核心库
│   ├── blog/           # 博客状态管理
│   ├── api.ts          # 统一API客户端
│   └── store.ts        # 全局状态
└── docs/               # 文档
    └── PROJECT_ONBOARDING.md  # 详细入职指南
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.6 | 前端框架 |
| React | 19.2.3 | UI框架 |
| Zustand | 5.0.11 | 状态管理 |
| Tailwind CSS | 4.x | 样式 |
| shadcn/ui | latest | UI组件 |
| date-fns | 4.1.0 | 日期处理 |
| Vue 3 | latest | 微应用 |

---

## 📖 主要文档

- **[项目入职指南](docs/PROJECT_ONBOARDING.md)** - 完整的项目介绍和开发指南
- **[博客集成方案](BLOG_INTEGRATION_PLAN.md)** - 博客系统架构设计

---

## 🎯 核心工作流

```
内容管理流程:
产品管理 → AI内容生成 → 内容审核 → 博客同步 → 编辑发布

博客工作流:
新建文章 → AI辅助生成 → 编辑完善 → 分类标签 → 发布
```

---

## 📝 开发指南

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint配置
- 组件使用函数声明
- 状态管理使用Zustand

### UI组件
- 优先使用shadcn/ui组件
- 遵循Tailwind CSS规范
- 使用cn()工具函数处理条件类名

### API调用
- 使用统一的API客户端
- 错误处理使用Toast通知
- 敏感数据不持久化到localStorage

---

## 🔧 配置说明

### 环境变量 (.env.local)

```bash
# API地址
NEXT_PUBLIC_API_URL=http://localhost:8080

# 可选认证token
AUTH_TOKEN=your-dev-token
```

### 路由配置

- Dashboard路由: `/dashboard/*` (Vue微应用)
- 博客路由: `/blog/*` (React原生)
- 内容路由: `/content/*` (React原生)

---

## 🐛 已知问题

1. **数据持久化**: 当前使用Mock数据，刷新后重置
2. **图片上传**: 功能待实现
3. **富文本编辑**: 使用Textarea，待升级

---

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 提交Pull Request

---

## 📄 许可证

MIT License

---

## 📮 联系方式

- 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 功能建议: 项目看板

---

**最后更新**: 2026年3月6日
