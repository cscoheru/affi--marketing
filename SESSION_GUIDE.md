# Affi-Marketing 会话启动指南

**更新时间**: 2026-03-05

---

## 📋 项目角色概览

| 会话 | 角色ID | 角色名称 | 任务卡文件 | 预计时长 | 依赖 |
|------|--------|----------|-----------|----------|------|
| 会话1 | 01 | 系统架构师 | `roles/01-architect.md` | 8-12h | 无 |
| 会话2 | 02 | React前端工程师 | `roles/02-react-frontend.md` | 7-10天 | 01完成 |
| 会话2/3 | 03 | Vue迁移工程师 | `roles/03-vue-migration.md` | 7-10天 | 01,02完成 |
| 会话3 | 04 | 后端与AI工程师 | `roles/04-backend-ai-engineer.md` | 10-14天 | 01完成 |
| 会话4 | 05 | 集成测试与部署 | `roles/05-integration-devops.md` | 5-7天 | 02,03,04完成 |

---

## 🚀 启动命令

每个会话只需执行一条命令：

### 会话1: 01-架构师
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/01-architect.md
```

### 会话2: 02-React前端工程师
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/02-react-frontend.md
```

### 会话2或3: 03-Vue迁移工程师
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/03-vue-migration.md
```

### 会话3: 04-后端与AI工程师
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/04-backend-ai-engineer.md
```

### 会话4: 05-集成测试与部署
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/05-integration-devops.md
```

---

## 📂 共享文件

| 文件路径 | 用途 |
|----------|------|
| `COLLABORATION.md` | 协作机制 (必读) |
| `PROJECT_PROGRESS.md` | 进度追踪 |
| `PROJECT_ISSUES.md` | 问题追踪 |

---

## 🔄 建议启动顺序

### 第1阶段 (会话1)
```
01-架构师 ──────────────→ 完成
        │
        ↓
    更新 PROJECT_PROGRESS.md
```

### 第2阶段 (会话2 + 可选会话3)
```
01完成 ───→ 02-React前端 ──→ 完成
              │
              ↓
          更新 PROJECT_PROGRESS.md
              │
              ↓
          03-Vue迁移可以开始
```

### 第3阶段 (会话3)
```
02/03完成 ───→ 04-后端与AI ──→ 完成
```

### 第4阶段 (会话4)
```
02+03+04完成 ───→ 05-集成测试与部署 ──→ 完成
```

---

## ✅ 角色完成检查清单

每个角色完成后，检查以下项目：

- [ ] 任务卡中的所有文件已创建
- [ ] 完成标准中的所有项目已达成
- [ ] 已更新 `PROJECT_PROGRESS.md`
- [ ] 如有问题，已写入 `PROJECT_ISSUES.md`

---

## 📞 协作要点

1. **不要弹窗询问项目经理** - 所有问题写入 `PROJECT_ISSUES.md`
2. **定期更新进度** - 完成任务后立即更新 `PROJECT_PROGRESS.md`
3. **查看依赖状态** - 开始前检查依赖角色的完成状态
4. **独立工作** - 每个会话完全独立，通过文件通信

---

## 🎯 快速开始

1. 打开新的 Claude Code 会话
2. 复制对应的启动命令
3. 粘贴并执行
4. 开始工作！

---

**最后更新**: 2026-03-05
