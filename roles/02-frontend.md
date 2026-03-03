# 角色任务卡: 前端工程师 (Frontend Engineer)

## 角色信息
- **角色ID**: 02-frontend
- **角色名称**: 前端工程师
- **预计时长**: 24 小时
- **主要职责**: Vue 3 前端应用开发

## 核心任务

### 1. 项目初始化 (4h)
- 创建 Vue 3 + TypeScript 项目
- 配置 Vite 构建
- 安装依赖 (Vue Router, Pinia, Element Plus)
- 配置 ESLint/Prettier

**输出**: `frontend/` 项目框架

### 2. 布局与路由 (4h)
- 主布局组件 (Header, Sidebar, Main)
- 路由配置
- 页面权限控制
- 面包屑导航

**输出**:
- `frontend/src/views/Layout.vue`
- `frontend/src/router/index.ts`

### 3. API 客户端 (3h)
- Axios 封装
- 请求/响应拦截器
- 错误处理
- TypeScript 类型定义

**输出**:
- `frontend/src/api/business-hub.ts`
- `frontend/src/types/index.ts`
- `frontend/src/utils/request.ts`

### 4. 状态管理 (3h)
- Pinia stores 设计
- 实验管理状态
- 插件管理状态
- 用户状态

**输出**:
- `frontend/src/stores/experiment.ts`
- `frontend/src/stores/plugin.ts`
- `frontend/src/stores/user.ts`

### 5. 页面开发 (8h)

#### 5.1 仪表板 (2h)
- 实验概览卡片
- 实时指标展示
- 图表组件集成
- 快捷操作

**输出**: `frontend/src/views/Dashboard.vue`

#### 5.2 实验管理 (3h)
- 实验列表页面
- 创建实验向导
- 实验详情页面
- 实验状态管理

**输出**:
- `frontend/src/views/Experiments.vue`
- `frontend/src/views/ExperimentCreate.vue`
- `frontend/src/views/ExperimentDetail.vue`

#### 5.3 插件管理 (3h)
- 插件列表/卡片
- 插件配置表单
- 插件指标展示

**输出**:
- `frontend/src/views/Plugins.vue`
- `frontend/src/components/plugins/PluginCard.vue`

### 6. 通用组件 (2h)
- Loading 组件
- 空状态组件
- 确认对话框
- 表格封装

**输出**: `frontend/src/components/common/`

## 输入依赖

- [x] 架构师提供的 API 规范
- [x] 后端 API 端点已就绪

## 交付产物

| 路径 | 描述 |
|------|------|
| `frontend/src/main.ts` | 应用入口 |
| `frontend/src/App.vue` | 根组件 |
| `frontend/src/router/index.ts` | 路由配置 |
| `frontend/src/stores/` | Pinia 状态管理 |
| `frontend/src/api/` | API 客户端 |
| `frontend/src/views/` | 页面组件 |
| `frontend/src/components/` | 业务组件 |
| `frontend/vercel.json` | Vercel 配置 |

## 技术栈

- Vue 3.4+ (Composition API)
- TypeScript 5.3+
- Vite 5.0+
- Vue Router 4.2+
- Pinia 2.1+
- Element Plus 2.5+
- Axios 1.6+
- ECharts (图表，可选)

## 页面清单

1. **仪表板** (`/`) - 项目概览
2. **实验列表** (`/experiments`) - 所有实验
3. **创建实验** (`/experiments/new`) - 向导式创建
4. **实验详情** (`/experiments/:id`) - 详情与编辑
5. **插件市场** (`/plugins`) - 可用插件列表
6. **追踪数据** (`/analytics`) - 追踪与分析
7. **结算管理** (`/settlements`) - 佣金结算

## 环境变量

`.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8080
```

`.env.production`:
```env
VITE_API_BASE_URL=https://api-hub.zenconsult.top
```

## 部署

使用 Vercel 自动部署：
1. 连接 GitHub 仓库
2. 配置构建命令
3. 配置环境变量
4. 部署到 `hub.zenconsult.top`

## 验证清单

- [ ] `npm run dev` 正常启动
- [ ] 所有页面可访问
- [ ] API 调用正常
- [ ] 路由切换正常
- [ ] 状态管理正常
- [ ] 组件渲染正常

---

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/02-frontend.md"
