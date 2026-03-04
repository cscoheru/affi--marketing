# Medium 发布操作指南

**会话**: S13-PUBLISHER (Medium 发布员)
**状态**: 🟢 准备就绪
**更新时间**: 2026-03-04

---

## 🎯 发布目标

| 阶段 | 内容 | 时间 | 联盟链接 |
|------|------|------|----------|
| Day 1-3 | 7篇科普文章 | 分散发布 | ❌ 不带 |
| Day 4-7 | 3篇评测文章 | 分散发布 | ✅ 带链接 |
| Day 8 | 申请Amazon Associates | - | - |

**⚠️ 重要**: 先发科普，再发评测！顺序不能乱！

---

## 📝 Day 1: 创建 Medium Publication

### 步骤 1: 注册 Medium 账号

1. **访问**: https://medium.com
2. **点击**: "Get started" 或 "Sign up"
3. **注册方式**:
   - 使用 Google 邮箱注册（推荐）
   - 或使用 Twitter/Apple ID

### 步骤 2: 创建 Publication（建立品牌感）

1. **登录后**: 点击头像 → "Write a story"
2. **左侧菜单**: 点击 "New publication"
3. **填写信息**:

| 项目 | 填写内容 |
|------|----------|
| **Publication name** | Coffee Enthusiast Mag |
| **Description** | A publication for coffee lovers who want honest reviews, brewing tips, and coffee education. Featuring in-depth coffee machine reviews, brewing guides, and practical advice. |
| **Topic** | Coffee |
| **Avatar** | 上传咖啡相关图片（AI生成或免费图库） |
| **Short description** | Honest coffee reviews and brewing tips |

4. **点击**: "Create publication"

### 步骤 3: 记录信息到 `medium_info.md`

发布成功后，记录：
- Publication URL: `https://medium.com/your-pub-name`
- 个人 Profile URL: `https://medium.com/@yourusername`

---

## 📝 Day 1-3: 发布 7 篇科普文章

### ⚠️ 重要规则

- ❌ **不要插入任何联盟链接**
- ✅ 只添加内部链接（文章互相链接）
- ✅ 优化SEO（标题、标签、Alt标签）

### 发布步骤（每篇文章）

#### 步骤 1: 准备内容

打开文章文件，例如：
```bash
cat docs/content/drafts/science_01_coffee_storage.md
```

#### 步骤 2: 在 Medium 创建新故事

1. **点击**: "Write a story"
2. **选择**: Publication → "Coffee Enthusiast Mag"
3. **粘贴**: 文章标题
4. **粘贴**: 文章正文（保持格式）

#### 步骤 3: SEO 优化

**标题优化**:
- ✅ 包含关键词（如 "Coffee Storage"）
- ✅ 吸引点击但不过度标题党
- ❌ 避免全大写或夸张符号

**标签选择**（每篇 3-5 个）:
- Coffee
- Brewing
- Coffee Beans
- 根据文章内容添加具体标签

**内部链接**（重要！）:
在每篇文章末尾添加：
```markdown
---

**More Coffee Tips:**

- [Hard Water vs Soft Water: Does It Affect Your Coffee?](内部链接)
- [Arabica vs Robusta: What's the Difference?](内部链接)

**Found this helpful?** Follow Coffee Enthusiast Mag for more practical coffee tips!
```

#### 步骤 4: 发布

1. **检查**: 预览效果
2. **点击**: "Publish"
3. **记录**: 复制文章URL到 `publish_log.md`

---

## 📝 Day 4-7: 发布 3 篇评测文章（带联盟链接）

### ⚠️ 重要规则

- ✅ **必须插入 Amazon US 联盟链接**
- ✅ 链接要自然融入
- ✅ 添加产品图片

### 准备联盟链接

#### 产品 ASIN 信息

| 产品 | ASIN | 价格 | 佣金率 |
|------|------|------|--------|
| De'Longhi ECAM 22.110 | B00NE1XBY4 | ~$350 | 4.5% |
| Breville Barista Express | (待补充) | ~$500 | 4.0% |
| Nespresso Vertuo | (待补充) | ~$150 | 5.0% |

#### 创建联盟链接

**如果你还没有 Amazon Associates 账号**:

1. **访问**: https://affiliate-program.amazon.com
2. **选择**: North America → United States
3. **填写信息**:
   - Website URL: 你的 Medium Publication URL
   - Website type: Blog / Publication
   - Traffic sources: SEO, Social Media
4. **提交**: 等待审核（通常 1-3 天）

**如果你已经有账号**:

1. **登录**: Amazon Associates
2. **搜索**: Product Search → 输入 ASIN（如 B00NE1XBY4）
3. **点击**: "Text & Image" → "Get Link"
4. **复制**: Short link

### 链接插入策略

#### 文章 1: Why I Regret Buying the De'Longhi ECAM 22.110

**插入位置**:
1. 开头第一段后
2. 规格表格中
3. 结论处

**链接代码示例**:
```markdown
Check current price on Amazon US: [De'Longhi ECAM 22.110 →](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20)

---

### Quick Specs

| Feature | Details |
|---------|---------|
| Price | Check [Amazon →](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20) |
| Water Tank | 1.8L |
| Pressure | 15 Bar |

---

## The Verdict

[**Buy on Amazon US**](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20)
```

#### 文章 2: De'Longhi vs Breville vs Nespresso Comparison

**对比表格中的链接**:
```markdown
| Product | Price | Buy Link |
|---------|-------|----------|
| De'Longhi ECAM 22.110 | ~$350 | [Amazon →](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20) |
| Breville Barista Express | ~$500 | [Amazon →](ASIN链接) |
| Nespresso Vertuo | ~$150 | [Amazon →](ASIN链接) |
```

#### 文章 3: Coffee Machine Buying Guide

**推荐产品卡片**:
```markdown
### Best Under $500: De'Longhi ECAM 22.110

[![Check Price on Amazon](product-image.jpg)](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20)

**Why we love it:**
- Easy to use with one-touch operation
- Great milk frothing system
- Excellent value for money

[**Check current price on Amazon →**](https://amazon.com/dp/B00NE1XBY4?tag=YOUR-TAG-20)
```

---

## 📝 Day 8: 申请 Amazon Associates（如果还没申请）

### 申请准备清单

- [ ] 10 篇文章已发布
- [ ] Publication 有品牌感
- [ ] 3 篇评测有联盟链接
- [ ] 文章之间有内部链接
- [ ] 内容质量高

### 申请信息模板

```
网站 URL: [你的 Medium Publication URL]
网站类型: Blog / Publication
流量来源: SEO (Google Search), Social Media (Reddit, Quora, Pinterest)
内容主题: Coffee Machine Reviews and Coffee Education
主要受众: Coffee enthusiasts, home brewing beginners
```

---

## 🔍 SEO 优化清单（每篇文章）

### 发布前检查

- [ ] **标题包含关键词**
- [ ] **第一段自然出现关键词 2-3 次**
- [ ] **所有图片有 Alt 标签**
- [ ] **添加 3-5 个相关标签**
- [ ] **添加内部链接**
- [ ] **添加摘要（Subtitle）**

### 摘要示例

```markdown
Struggling with bitter coffee? It might not be the beans — it could be your water. Learn how water hardness affects your coffee taste and what to do about it.
```

---

## 📊 内部链接结构

### 科普文章互相链接

```
science_01 (Storage)
    ↓ ↑
    ↓ ↑
science_02 (Water) ←→ science_03 (Arabica/Robusta)
    ↓ ↑
    ↓ ↑
science_04 (Bitter) ←→ science_05 (Temperature)
    ↓
science_06 (Single-Origin) ←→ science_07 (Cleaning)
```

### 评测文章链接到科普文章

```markdown
**Related Reading:**

- [How to Store Coffee Beans](链接到 science_01)
- [Hard Water vs Soft Water](链接到 science_02)
```

---

## 🚀 发布后：Google Search Console 设置

### 步骤 1: 验证 Publication

1. **访问**: https://search.google.com/search-console
2. **添加资源**: 你的 Medium Publication URL
3. **验证方式**:
   - 选择 "HTML 标签" 或
   - 使用 Google Analytics（如果已设置）

### 步骤 2: 提交 Sitemap

Medium 自动生成 sitemap:
```
https://medium.com/your-pub-name/sitemap.xml
```

在 GSC 中提交这个 URL。

### 步骤 3: 请求编入索引

每发布一篇文章后：
1. GSC → "URL 检查"
2. 输入文章 URL
3. 点击 "请求编入索引"

---

## 📝 发布记录模板

### 更新 `publish_log.md`

每发布一篇文章后更新：

```markdown
| # | 标题 | 发布日期 | URL | 状态 |
|---|------|----------|-----|------|
| 1 | How to Store Coffee Beans... | 2026-03-04 | https://... | ✅ 已收录 |
```

---

## ⚠️ 重要注意事项

### 发布频率

- ❌ 不要一次性发布所有文章
- ✅ 每天发布 1-2 篇
- ✅ 分散在不同时间（如上午9点、下午3点）

### 质量检查

- [ ] 检查错别字
- [ ] 检查格式是否正确
- [ ] 检查链接是否有效
- [ ] 检查图片是否显示

### 避免被封号

- ❌ 不要过度推广
- ❌ 不要每篇都是产品推荐
- ✅ 保持内容质量
- ✅ 提供真实价值

---

## 📞 需要帮助？

如果在发布过程中遇到问题：

1. **Medium 帮助中心**: https://help.medium.com
2. **Amazon Associates 帮助**: https://affiliate-program.amazon.com/help

---

**准备开始了吗？**

按照这个指南，从 Day 1 开始，一步步完成发布任务！

---

**创建时间**: 2026-03-04
**状态**: ✅ 指南就绪，等待执行
