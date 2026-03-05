# 修改任务卡: 03-Vue迁移工程师 - 字体栈修复

**分配日期**: 2026-03-05
**优先级**: 🟢 低
**预计时间**: 30分钟
**来源**: TEST_REPORT.md - Vue组件集成测试

---

## 🎯 任务目标

修复Vue组件的主题CSS字体验证问题，确保字体栈与Next.js主应用一致。

---

## 📋 问题详情

### 测试失败项
- **测试**: Vue组件主题CSS字体验证
- **状态**: 非关键失败
- **描述**: 字体栈不同但功能正确

### 当前状态
- ✅ Vue组件正常显示
- ✅ Element Plus样式正常应用
- ✅ 主题与shadcn/ui一致
- ⚠️ 字体栈定义不完全一致

---

## 🔧 修复步骤

### 步骤1: 检查当前字体栈定义

**文件**: `frontend/src/styles/theme.css`

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
grep -n "font-family" src/styles/theme.css
```

### 步骤2: 检查Next.js主应用字体栈

**文件**: `frontend-unified/app/globals.css`

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
grep -n "font-family" app/globals.css
```

### 步骤3: 统一字体栈定义

将Vue应用的字体栈修改为与Next.js一致：

**示例** (如果Next.js使用):
```css
/* Next.js globals.css */
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

**Vue theme.css 应该改为**:
```css
:root {
  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

body {
  font-family: var(--font-family-base);
}
```

### 步骤4: 验证修复

```bash
# 启动Vue服务器
cd frontend
npm run dev

# 在浏览器中检查字体
# 1. 打开 http://localhost:5174
# 2. 打开开发者工具 → Elements → Computed
# 3. 检查 font-family 属性
```

---

## ✅ 完成标准

- [ ] Vue应用字体栈与Next.js一致
- [ ] 所有Element Plus组件使用正确的字体
- [ ] 视觉上字体显示无差异

---

## 📝 注意事项

1. **优先级低**: 此问题不影响功能，仅为一致性优化
2. **可延后**: 如果其他高优先级任务存在，可延后处理
3. **非阻塞**: 不会阻塞其他测试或部署

---

**分配人**: 项目经理
**审核人**: 05-集成测试与部署
