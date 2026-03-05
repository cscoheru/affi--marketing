# ContentHub - 内容自动化系统

智能内容自动化管理平台 - 产品评测、内容生成与多平台发布

## 技术栈

- **框架**: Next.js 15 (React 19)
- **语言**: TypeScript 5.7
- **样式**: Tailwind CSS 3.4
- **UI 组件**: Radix UI + shadcn/ui 风格
- **状态管理**: Zustand 5.0
- **HTTP 客户端**: Axios 1.7

## 开始使用

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

在 [http://localhost:3000](http://localhost:3000) 查看应用

### 构建生产版本

```bash
npm run build
npm start
```

## 功能模块

- **产品候选库** (`/products`) - 管理待评测的产品
- **素材库** (`/materials`) - 查看和管理搜集到的素材
- **内容管理** (`/content`) - AI 内容生成、审核、发布
- **发布中心** (`/publish`) - 多平台发布管理
- **数据看板** (`/analytics`) - 数据统计和分析

## 部署

### Vercel 部署

项目已配置 Vercel 自动部署，推送到 main 分支即可自动部署。

域名: [https://content-hub.zenconsult.top](https://content-hub.zenconsult.top)

### 环境变量

```bash
NEXT_PUBLIC_API_URL=https://api-hub.zenconsult.top/api/v1
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页（重定向到产品）
│   ├── products/           # 产品候选库
│   ├── materials/          # 素材库
│   ├── content/            # 内容管理
│   ├── publish/            # 发布中心
│   └── analytics/          # 数据看板
├── components/
│   ├── ui/                 # shadcn/ui 基础组件
│   └── dashboard-layout.tsx # 仪表板布局
├── lib/
│   ├── utils.ts            # 工具函数
│   └── mock-data.ts        # Mock 数据
├── stores/                 # Zustand 状态管理
└── types/
    └── index.ts            # TypeScript 类型定义
```

## 开发计划

- [x] 基础项目结构
- [x] 产品候选库页面
- [x] 内容管理页面（含 AI 生成、审核对话框）
- [ ] 后端 API 集成
- [ ] 素材库功能
- [ ] 发布中心功能
- [ ] 数据看板功能
- [ ] 认证系统
- [ ] SSR/SSG 优化

## 许可证

MIT
