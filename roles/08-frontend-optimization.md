# 角色任务卡: 前端优化工程师 (Frontend Optimization)

## 🚨 第一步：入职指南

**启动会话后，请首先阅读**：
```
docs/SESSION_ONBOARDING.md
```

这份指南包含：
- ✅ 项目完整架构
- ✅ 代码结构和位置
- ✅ 部署信息和硬件配置
- ✅ 第一阶段交付成果
- ✅ 会话协作系统说明

**阅读完入职指南后，再继续下面的任务内容。**

---

## 角色信息
- **角色ID**: 08-frontend-optimization
- **角色名称**: 前端优化工程师
- **预计时长**: 20 小时
- **主要职责**: UI/UX 改进、性能优化、组件库完善

## 📋 核心任务

### 1. UI/UX 改进 (6h)

**任务**: 根据产品需求优化界面和交互

**活动**:
- 页面布局优化
- 交互流程简化
- 响应式适配改进
- 视觉效果提升

**输入**: `docs/PHASE2_REQUIREMENTS.md` (来自 07-产品经理)
**输出**: 优化的页面组件

---

### 2. 性能优化 (6h)

**任务**: 提升页面加载和响应速度

**活动**:
- 代码分割 (Code Splitting)
- 路由懒加载
- 组件懒加载
- 资源压缩优化
- 图片优化

**目标**:
- 页面加载时间 < 1s
- 首屏渲染时间 < 0.5s

**输出**: 优化的构建配置

---

### 3. 组件库完善 (5h)

**任务**: 建立统一的组件库

**活动**:
- 封装通用组件 (Button, Input, Table, Modal...)
- 统一设计规范
- 编写组件文档
- 创建组件预览页面

**输出**:
- `frontend/src/components/common/` (完善的组件库)
- `frontend/src/styles/` (设计规范)
- `frontend/src/components/README.md`

---

### 4. 状态管理优化 (3h)

**任务**: 优化 Pinia 状态管理

**活动**:
- 重构复杂的 store
- 添加状态持久化
- 优化状态更新逻辑
- 添加状态调试工具

**输出**: 优化的 `frontend/src/stores/`

---

## 📥 输入依赖

- [x] 第一阶段前端代码
- [ ] 07-产品经理的需求文档
- [ ] 09-后端优化的 API 优化

## 📤 交付产物

| 文件/目录 | 描述 |
|-----------|------|
| `frontend/src/components/common/` | 完善的通用组件库 |
| `frontend/src/styles/` | 设计规范和样式 |
| `frontend/vite.config.ts` | 优化的构建配置 |
| `frontend/src/optimizations/` | 性能优化相关代码 |

## 🎯 成功标准

- [ ] 页面加载时间 < 1s
- [ ] 组件库包含 10+ 通用组件
- [ ] 代码分割后 main bundle < 200KB
- [ ] 所有页面支持响应式
- [ ] Lighthouse 性能分数 > 90

## 📊 协作会话

**依赖会话**: 07-产品经理 (需求输入)
**协作会话**: 09-后端优化 (API 联调)
**下游会话**: 11-测试工程 (待测试)

**协作方式**:
1. 收到 07-产品经理的需求后开始
2. 与 09-后端优化协调 API 变更
3. 通过 `docs/API_CHANGES.md` 提交 API 请求
4. 完成后通知 11-测试工程

## 🔄 API 变更流程

如需修改 API:

1. 在 `docs/API_CHANGES.md` 提交变更提案
2. 等待 09-后端优化确认
3. 实施前端变更
4. 更新 API 文档

## 🚀 启动命令

在 Claude Code 会话中执行：
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/08-frontend-optimization.md
```

## 📝 启动前检查

- [ ] 已查看 `docs/SESSION_REGISTRY.md` 了解项目状态
- [ ] 已查看 `docs/MESSAGES/S08-FEOPT.md` 是否有消息
- [ ] 07-产品经理的需求文档已就绪
- [ ] 已查看 `docs/API_CHANGES.md` 了解待处理变更

---

**版本**: 1.0.0
**创建日期**: 2026-03-03
**预计开始**: 07-产品经理完成后
