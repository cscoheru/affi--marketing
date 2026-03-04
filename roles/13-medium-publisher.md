# 角色任务卡：Medium 发布员

**会话ID**: S13-PUBLISHER
**角色**: Medium 发布员
**工时**: 4 小时
**优先级**: 🔴 高
**依赖**: S12-CONTENT (内容创作者)
**基于需求**: `docs/PHASE2_REQUIREMENTS.md` v3.1.1

---

## 🚨 第一步：入职指南

**启动会话后，请首先阅读**：
1. `docs/PHASE2_REQUIREMENTS.md` - 完整需求文档
2. `docs/SESSION_ONBOARDING.md` - 项目入职指南

---

## 🎯 核心任务

将 10 篇内容发布到 Medium.com，优化 SEO，并设置 Google Search Console。

### ⚠️ 最高原则

**发布顺序不能错！先发 7 篇科普，再发 3 篇评测！**

---

## 📋 任务清单

### 任务 1：Medium 账号设置 (30分钟)

**步骤**：

1. **注册 Medium 账号**
   - 访问 https://medium.com
   - 使用邮箱注册
   - 完善个人资料（咖啡爱好者形象）

2. **创建 Publication**（重要！建立品牌感）
   - Publication 名称建议：Coffee Enthusiast Mag
   - 添加描述：A publication for coffee lovers who want honest reviews and brewing tips
   - 上传头像（可用 AI 生成的咖啡相关图片）
   - 设置主题标签：Coffee, Coffee Machines, Home Brewing

3. **记录信息**
   - Publication URL: `https://medium.com/your-pub-name`
   - 个人 Profile URL: `https://medium.com/@yourusername`

**保存到**：`docs/deployment/medium_info.md`

---

### 任务 2：发布 7 篇科普文章 (1.5小时)

**⚠️ 重要**：Day 1-3 完成，不带联盟链接

**发布步骤**（每篇文章）：

| 步骤 | 操作 | 注意事项 |
|------|------|----------|
| 1 | New Story | 选择 Publication |
| 2 | 标题 | 包含关键词 |
| 3 | 内容 | 复制草稿，检查格式 |
| 4 | 图片 | 添加 Alt 标签 |
| 5 | 标签 | 3-5 个相关标签 |
| 6 | 预览 | 检查显示效果 |
| 7 | 发布 | **不带联盟链接** |

**SEO 优化清单**（每篇文章）：

- [ ] **标题优化**：包含主要关键词
- [ ] **第一段**：自然出现关键词 2-3 次
- [ ] **图片 Alt 标签**：所有图片添加描述性 Alt
- [ ] **内部链接**：链接到其他科普文章
- [ ] **标签选择**：Coffee, Brewing, Coffee Beans 等
- [ ] **发布时间**：分散在不同时间（避免批量被检测）

**文章发布记录**（保存到 `docs/deployment/publish_log.md`）：

```markdown
## 科普文章发布记录

| # | 标题 | 发布日期 | 状态 | URL |
|---|------|----------|------|-----|
| 1 | How to Store Coffee Beans... | YYYY-MM-DD | ✅ | https://... |
| 2 | Hard Water vs Soft Water... | YYYY-MM-DD | ✅ | https://... |
```

---

### 任务 3：发布 3 篇评测文章 (1.5小时)

**⚠️ 重要**：Day 4-7 完成，**带联盟链接**

**发布前准备**：

1. **获取 Amazon 联盟链接**
   - 注册 Amazon Associates (US)
   - 搜索产品
   - 创建 Text & Image 链接
   - 复制短链接

2. **链接插入策略**
   - 首次提及产品时插入
   - 对比表格中使用
   - 结论处的 CTA 按钮

**发布步骤**（与科普相同，额外步骤）：

| 步骤 | 操作 | 注意事项 |
|------|------|----------|
| 1-6 | 同科普文章 | - |
| 7 | **插入联盟链接** | 自然融入文本 |
| 8 | 添加产品图片 | 必须有实拍图 |
| 9 | 添加 CTA | 明确的购买建议 |
| 10 | 预览链接 | 测试点击 |

**联盟链接格式**：

```markdown
Check current price on Amazon: [Amazon US](https://amazon.com/dp/{ASIN}?tag={your-tag})

<!-- 或者用更自然的方式 -->
I bought mine here: [De'Longhi ECAM 22.110 on Amazon](https://...)
```

---

### 任务 4：SEO 优化和 GSC 设置 (30分钟)

**Medium 内部 SEO**：

- [ ] **标题优化**：每篇标题包含目标关键词
- [ ] **摘要（Subtitle）**：简洁描述，包含关键词
- [ ] **图片 Alt**：所有图片添加 Alt 标签
- [ ] **内部链接**：文章之间互相链接

**示例**：
```markdown
在文章 1 中：
> Read also: [Arabica vs Robusta: What's the Difference?](内部链接)

在文章 2 中：
> Check out: [How to Store Coffee Beans](内部链接)
```

**Google Search Console 设置**：

1. **验证 Medium Publication**
   - 登录 Google Search Console
   - 添加资源：`https://medium.com/your-pub-name`
   - 选择 HTML 标签验证（或使用 Google Analytics）
   - **注意**：Medium 可能不支持自定义 HTML，需要通过其他方式验证

2. **提交站点地图**
   - Medium 自动生成 sitemap
   - URL: `https://medium.com/your-pub-name/sitemap.xml`
   - 在 GSC 中提交

3. **请求编入索引**
   - GSC → URL 检查
   - 输入每篇文章 URL
   - 点击"请求编入索引"

---

### 任务 5：提交 Amazon Associates 申请 (等待 Day 8)

**⚠️ 重要**：只有在 10 篇文章全部发布后再申请！

**申请准备**：

| 检查项 | 状态 |
|--------|------|
| 10 篇文章已发布 | [ ] |
| Publication 有品牌感 | [ ] |
| 3 篇评测有联盟链接 | [ ] |
| 有内部链接结构 | [ ] |
| 内容质量高 | [ ] |

**申请信息**：

- 网站 URL: Medium Publication URL
- 网站类型: Blog / Publication
- 流量来源: SEO + Social Media
- 内容主题: Coffee Machine Reviews

---

## ✅ 完成标准

**任务完成时**：

- [ ] Medium Publication 创建完成
- [ ] 7 篇科普文章发布（不带联盟链接）
- [ ] 3 篇评测文章发布（带联盟链接）
- [ ] 所有文章完成 SEO 优化
- [ ] Google Search Console 设置完成
- [ ] 发布记录完整（`docs/deployment/publish_log.md`）
- [ ] Amazon Associates 申请提交
- [ ] 更新 `docs/SESSION_LOG.md`

**文章发布记录示例**：

```markdown
# Medium 发布记录

## Publication 信息
- 名称: Coffee Enthusiast Mag
- URL: https://medium.com/coffee-enthusiast-mag
- 创建日期: 2026-03-04

## 文章列表

### 科普文章（7篇）
| # | 标题 | 发布日期 | URL | 收录状态 |
|---|------|----------|-----|----------|
| 1 | How to Store Coffee Beans... | | | |
| 2 | Hard Water vs Soft Water... | | | |

### 评测文章（3篇）
| # | 标题 | 发布日期 | URL | 联盟链接 | 点击数 |
|---|------|----------|-----|----------|--------|
| 1 | Why I Regret Buying... | | | | |
```

---

## 🤝 与其他会话协作

**等待输入**: S12-CONTENT (内容创作者)
- 10 篇文章草稿
- 产品素材文件

**输出给**: S14-PROMOTER (流量推广员)
- Medium Publication URL
- 10 篇文章 URL
- 内部链接结构

**通知**: S15-TRACKER (数据追踪员)
- 提供发布记录
- 确认追踪链接已添加

---

## 📁 文件结构

```
docs/
└── deployment/
    ├── medium_info.md         # Medium 账号信息
    ├── publish_log.md         # 发布记录
    └── affiliate_links.md     # 联盟链接记录
```

---

## 🔔 重要提醒

1. **发布顺序不能乱**：先科普后评测
2. **SEO 要做到位**：Alt 标签、内部链接、关键词
3. **品牌感很重要**：Publication 要像真正的杂志
4. **不要急着申请**：10 篇齐全后再申请 Amazon Associates
5. **记录要完整**：每个 URL 都要记录，方便后续追踪

---

**版本**: 1.0.0
**基于需求**: PHASE2_REQUIREMENTS.md v3.1.1
**创建日期**: 2026-03-04
