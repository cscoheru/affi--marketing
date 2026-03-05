# Affi-Marketing 项目协作机制

**文档版本**: v1.0
**创建时间**: 2026-03-05
**项目经理**: Claude Code

---

## 📋 协作原则

### 1. 独立工作原则
- 每个角色在自己的会话中独立工作
- 任务卡包含所有必要信息，无需询问项目经理
- 遇到问题时写入问题文件，项目经理定期查看并回复

### 2. 文件通信机制
- 所有问题和支持请求写入 `PROJECT_ISSUES.md`
- 项目经理每日查看并回复
- 不在会话中弹窗询问

### 3. 进度同步机制
- 完成任务后更新 `PROJECT_PROGRESS.md`
- 其他角色可参考已完成的产出

---

## 👥 角色总览

| 角色ID | 角色名称 | 会话号 | 优先级 | 依赖 |
|--------|----------|--------|--------|------|
| 01 | 系统架构师 | 会话1 | 🔴 最高 | 无 |
| 02 | React前端工程师 | 会话2 | 🔴 高 | 01完成 |
| 03 | Vue迁移工程师 | 会话2或3 | 🟡 中 | 01完成 |
| 04 | 后端与AI工程师 | 会话3 | 🔴 高 | 01完成 |
| 05 | 集成测试与部署 | 会话4 | 🟢 低 | 02、03、04完成 |

**建议会话分配**:
- 会话1: 01-架构师 (独立)
- 会话2: 02-React前端 + 03-Vue迁移 (可并行)
- 会话3: 04-后端与AI (独立)
- 会话4: 05-集成测试与部署 (最后启动)

---

## 📁 共享文件说明

### 问题文件: `PROJECT_ISSUES.md`
所有角色遇到问题时，将问题追加到此文件：

```markdown
### [角色ID] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
[详细描述问题]

**当前状态**:
- [ ] 需要项目经理决策
- [ ] 需要[角色ID]支持: [具体需求]
- [ ] 可自行解决

**解决状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: [如果已解决]
```

### 进度文件: `PROJECT_PROGRESS.md`
每个角色完成任务后，更新此文件：

```markdown
### [角色ID] [角色名称]
**状态**: ✅完成 / 🟡进行中 / ⏸待开始
**当前阶段**: [具体阶段]
**完成时间**: [预计或实际]
**产出文件**:
- [列出已完成的文件]

**遗留问题**:
- [ ] [如果有]
```

---

## 🔄 角色间协作流程

### 1. 架构师 → 其他角色
```
01-架构师完成架构设计
    ↓
更新 PROJECT_PROGRESS.md
    ↓
其他角色读取 docs/ 下的架构文档
    ↓
开始各自工作
```

### 2. 前端角色间协作 (02 & 03)
```
02-React前端完成统一布局
    ↓
更新 PROJECT_PROGRESS.md
    ↓
03-Vue迁移读取统一布局代码
    ↓
03-Vue迁移适配Vue组件
```

### 3. 后端 → 前端
```
04-后端完成API实现
    ↓
更新 PROJECT_PROGRESS.md
    ↓
02-React前端读取API文档
    ↓
02-React前端对接真实API
```

### 4. 所有角色 → 05-集成测试
```
02、03、04完成工作
    ↓
更新 PROJECT_PROGRESS.md
    ↓
05-集成测试读取所有产出
    ↓
05-集成测试开始测试和部署
```

---

## ⚠️ 问题处理流程

### 遇到问题时的处理顺序

1. **自行解决** (5分钟)
   - 查看任务卡中的文档引用
   - 查看现有代码实现
   - 搜索相关技术文档

2. **查看问题文件** (2分钟)
   - 查看 `PROJECT_ISSUES.md`
   - 检查是否有类似问题已解决

3. **写入问题文件**
   - 如果无法自行解决
   - 按格式写入 `PROJECT_ISSUES.md`
   - 标注是否需要其他角色支持

4. **继续其他工作**
   - 不要阻塞等待回复
   - 可以并行处理其他任务

### 项目经理响应承诺
- 工作时间内 2小时内回复
- 每日至少查看 3 次 (10:00, 15:00, 21:00)
- 高优先级问题优先处理

---

## 📦 交付物清单

每个角色完成后，需在项目根目录创建以下文件：

### 01-架构师交付物
```
docs/
├── ARCHITECTURE.md          ✅ 已存在
├── PLUGIN_SYSTEM.md         ✅ 已存在
├── DATA_MODELS.md           ✅ 已存在
├── API_SPEC.md              ✅ 已存在
└── DEPLOYMENT_ARCHITECTURE.md ✅ 已存在
```

### 02-React前端工程师交付物
```
frontend-unified/
├── lib/store.ts             ← Zustand状态管理
├── components/unified-sidebar.tsx ← 统一侧边栏
├── components/protected-route.tsx ← 路由保护
├── app/(dashboard)/layout.tsx ← 控制台布局
├── app/(content)/layout.tsx ← 内容自动化布局
├── app/login/page.tsx       ← 登录页面
└── app/(dashboard)/dashboard/page.tsx ← 仪表板
```

### 03-Vue迁移工程师交付物
```
frontend/                    ← 现有Vue项目
├── vite.config.ts           ← Module Federation配置
├── src/wrappers/            ← Vue组件Wrapper
├── src/stores/bridge.ts     ← 状态桥接
└── dist/                    ← 构建产物

frontend-unified/
└── next.config.ts           ← 更新Vue模块配置
```

### 04-后端与AI工程师交付物
```
backend-go/                  ← Go后端
├── cmd/server/main.go       ← 应用入口
├── internal/core/           ← 核心业务逻辑
├── internal/controller/     ← HTTP控制器
└── api/                     ← API文档

ai-service/                  ← Python AI服务
├── app/services/manager.py  ← AI服务管理器
├── app/adapters/            ← 模型适配器
└── main.py                  ← FastAPI入口
```

### 05-集成测试与部署交付物
```
frontend-unified/
├── tests/                   ← 测试用例
├── deployment/              ← 部署配置
├── vercel.json              ← Vercel配置
└── docs/TEST_REPORT.md      ← 测试报告
```

---

## 🚀 启动检查清单

每个角色启动前，检查以下项目：

- [ ] 已读取 `COLLABORATION.md` 了解协作机制
- [ ] 已读取任务卡中的"需要读取的文件"
- [ ] 已检查 `PROJECT_PROGRESS.md` 了解依赖状态
- [ ] 已检查 `PROJECT_ISSUES.md` 了解已知问题
- [ ] 知道如何写入问题文件

---

**最后更新**: 2026-03-05
