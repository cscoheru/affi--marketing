# 角色任务卡：流量推广员

**会话ID**: S14-PROMOTER
**角色**: 流量推广员
**工时**: 6 小时
**优先级**: 🔴 高
**依赖**: S13-PUBLISHER (Medium发布员)
**基于需求**: `docs/PHASE2_REQUIREMENTS.md` v3.1.1

---

## 🚨 第一步：入职指南

**启动会话后，请首先阅读**：
1. `docs/PHASE2_REQUIREMENTS.md` - 完整需求文档
2. `docs/SESSION_ONBOARDING.md` - 项目入职指南

---

## 🎯 核心任务

通过 Reddit、Quora、Pinterest 推广 Medium 内容，获取初始流量。

### ⚠️ 最高原则

**Reddit 钓鱼法：主贴不放链接，评论区放链接！**

---

## 📋 任务清单

### 任务 1：Reddit 推广 (3小时)

**⚠️ 核心策略：Bait & Hook（钓鱼法）**

| ❌ 错误做法 | ✅ 正确做法 |
|-----------|-----------|
| 主贴直接放 Medium 链接 | **主贴 100% 原生内容** |
| 只发 r/Coffee | **多渠道发帖** |
| 标题："[Review] 我评测了..." | **标题：具体问题开头** |

**目标 Subreddit**：

| Subreddit | 订阅数 | 用途 | 发帖频率 |
|-----------|--------|------|----------|
| r/Coffee_Machines | ~50k | 咖啡机讨论 | 每周 1-2 帖 |
| r/espresso | ~200k | 意式咖啡 | 每周 1 帖 |
| r/BuyItForLife | ~5M | 耐用品推荐 | 每周 1 帖 |
| r/Coffee | ~1.5M | 咖啡综合 | 仅回答问题 |

**发帖模板**（评测文章推广）：

```markdown
标题：Is the De'Longhi ECAM 22.110 worth it for someone who makes 2 cups/day?

正文：
Hey everyone,

I've been researching coffee machines for my morning routine and narrowed it down to the De'Longhi ECAM 22.110. I have a few specific questions:

1. How loud is it really? I live in an apartment and don't want to wake neighbors.
2. The steam wand - can it actually do microfoam or just froth?
3. Cleaning seems tedious - is it a pain in practice?

From what I've gathered (watched 3 YouTube reviews, read 50+ Amazon reviews):
- Great: {基于真实优点，2-3条}
- Dealbreaker for me: {基于真实痛点，1-2条}

Budget is ~$350 and I mainly drink lattes. Any owners want to share their experience?

[如果有人问资源，我在评论区放详细对比表格和实拍图]
```

**发帖模板**（对比文章推广）：

```markdown
标题：De'Longhi vs Breville - help me decide?

正文：
I'm torn between these two for my first "real" espresso machine:

De'Longhi ECAM 22.110:
- Pros: {优点}
- Cons: {痛点}

Breville Barista Express:
- Pros: {优点}
- Cons: {痛点}

I mostly drink lattes on weekends (maybe 4-6 cups/week).

Questions:
1. Is the Breville worth the extra $150?
2. Which has better longevity?
3. Any hidden maintenance costs I should know about?

[I made a comparison chart if anyone's interested]
```

**钓鱼策略**：

1. **主贴 100% 原生内容**
   - 不放任何外部链接
   - 分享真实问题
   - 展示已做的调研

2. **评论区放链接**
   - 如果有人问：*"I put together a detailed comparison chart with real photos. Let me find the link... Here: [Medium link]"*
   - 看起来像帮助社区，不是营销

3. **互动很重要**
   - 回复所有评论
   - 真诚感谢建议
   - 后续更新购买决定

**发帖记录**（保存到 `docs/promotion/reddit_log.md`）：

```markdown
## Reddit 发帖记录

| 日期 | Subreddit | 标题 | 主贴点赞 | 评论 | 评论区链接 |
|------|-----------|------|----------|------|-----------|
| | | | | | |
```

---

### 任务 2：Quora 推广 (1.5小时)

**策略**：回答咖啡机相关问题，自然融入链接

**目标问题类型**：

| 问题类型 | 示例 | 回答策略 |
|----------|------|----------|
| 购买建议 | "Which coffee machine should I buy?" | 推荐产品，附详细对比链接 |
| 对比问题 | "De'Longhi vs Breville?" | 基于真实优缺点回答 |
| 使用问题 | "How to clean coffee machine?" | 推荐科普文章链接 |
| 预算问题 | "Best espresso under $500?" | 推荐合适产品 |

**回答模板**：

```markdown
回答：

{基于真实信息的详细回答，200-300字}

I wrote a detailed comparison with real photos here: [Medium link]

Hope this helps!
```

**回答原则**：

- [ ] 先提供价值，再放链接
- [ ] 链接要自然，不要硬广
- [ ] 每天回答 2-3 个问题
- [ ] 不要重复回答同一问题

**Quora 记录**（保存到 `docs/promotion/quora_log.md`）：

```markdown
## Quora 回答记录

| 日期 | 问题 | 回答摘要 | 链接 | 浏览 | 点击 |
|------|------|----------|------|------|------|
| | | | | | |
```

---

### 任务 3：Pinterest 推广 (1小时)

**策略**：分享产品图片和对比图，吸引点击

**Pin 创建步骤**：

1. **创建图片资源**
   - 产品对比图（使用 AI 生成）
   - 信息图（"3 Best Coffee Machines Under $500"）
   - 实拍图（如果有）

2. **Pin 设置**
   - 标题：包含关键词（如 "Best Coffee Machine 2024"）
   - 描述：简洁描述，包含 CTA
   - 链接：指向 Medium 文章
   - 板块：Coffee Machines, Coffee Lovers

3. **Pin 模板**
   ```
   标题：De'Longhi vs Breville vs Nespresso (2024 Comparison)

   描述：Can't decide which coffee machine to buy? I tested all three
   and wrote a detailed comparison with real photos. Link in pin!

   板块：Coffee Machines, Kitchen Appliances
   ```

**Pinterest 记录**（保存到 `docs/promotion/pinterest_log.md`）：

```markdown
## Pinterest 记录

| 日期 | Pin 标题 | 链接 | 展示 | 点击 |
|------|----------|------|------|------|
| | | | | |
```

---

### 任务 4：生成推广素材 (30分钟)

**AI 生成图片**（用于 Pinterest）：

```python
# 图片生成提示词
Create a professional product comparison image for:

Title: "Best Coffee Machines Under $500"

Products:
1. De'Longhi ECAM 22.110 - $350
2. Breville Barista Express - $500
3. Nespresso Vertuo - $150

Style: Clean, modern, lifestyle photography with warm coffee tones
Include: Product photos (placeholder), price, key features
Text overlay: "2024 Comparison"
```

**生成内容**：
- [ ] 3 张产品对比图
- [ ] 1 张信息图
- [ ] 2 张引客图（Teaser images）

**保存到**：`docs/promotion/images/`

---

## ✅ 完成标准

**Week 1 目标**：

- [ ] Reddit: 发布 3 帖，获得 100+ 引荐流量
- [ ] Quora: 回答 10 个问题，获得 50+ 引荐流量
- [ ] Pinterest: 创建 10 个 Pins，获得 20+ 引荐流量
- [ ] 总引荐流量: >170
- [ ] 更新 `docs/SESSION_LOG.md`

**推广记录完整**：

```markdown
# Week 1 推广总结

## Reddit
- 发帖数: 3
- 总点赞: XX
- 总评论: XX
- 引荐流量: XX

## Quora
- 回答数: 10
- 总浏览: XX
- 引荐流量: XX

## Pinterest
- Pin 数: 10
- 总展示: XX
- 引荐流量: XX

## 总计
- 总引荐流量: XX
- 目标达成: XX%
```

---

## 🤝 与其他会话协作

**等待输入**: S13-PUBLISHER (Medium发布员)
- Medium Publication URL
- 10 篇文章 URL

**通知**: S15-TRACKER (数据追踪员)
- 提供推广链接（Reddit 帖、Quora 回答、Pinterest Pins）
- 确认追踪代码已添加

---

## 📁 文件结构

```
docs/
└── promotion/
    ├── reddit_log.md          # Reddit 发帖记录
    ├── quora_log.md           # Quora 回答记录
    ├── pinterest_log.md       # Pinterest 记录
    └── images/                # 推广图片
        ├── comparison_1.png
        ├── comparison_2.png
        └── infographic.png
```

---

## 🔔 重要提醒

1. **Reddit 钓鱼法是核心**：主贴不放链接，评论区放
2. **真实互动很重要**：回复所有评论，真诚参与讨论
3. **不要发广告**：提供价值，链接是额外资源
4. **分散渠道**：不要只依赖一个平台
5. **记录要完整**：每个链接都要追踪

---

## 🚫 禁止事项

- ❌ 禁止在 Reddit 主贴直接放外部链接
- ❌ 禁止投放 Reddit 广告（转化率低）
- ❌ 禁止在小红书发英文内容（语言错位）
- ❌ 禁止 spam 式发帖（会被封号）
- ❌ 禁止重复发相同内容

---

**版本**: 1.0.0
**基于需求**: PHASE2_REQUIREMENTS.md v3.1.1
**创建日期**: 2026-03-04
