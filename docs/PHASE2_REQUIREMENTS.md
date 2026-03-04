# Affi-Marketing 最小可行实验需求

**版本**: 3.1.1 (最终锁死版 🔒)
**创建日期**: 2026-03-04
**基于**: 老板深度反馈 `docs/boss_feedback/ergent.ini.md` + `docs/boss_feedback/ergent2.ini.md` + `docs/boss_feedback/ergent3.ini.md`
**状态**: **🔒 已锁死 - 禁止修改**
**市场定位**: 英文 / US 市场（美元结算）

---

## 🎯 核心战略调整

### 调整原则

| 之前规划 | 现在调整 |
|---------|---------|
| 先开发自动化工具 | **先手动验证商业模式** |
| 四个模式并行验证 | **只验证一个模式（SEO+联盟）** |
| 程序化SEO（每天3篇） | **AI辅助精品SEO（每周1篇）** |
| 忽略流量获取成本 | **纳入CAC计算** |
| 技术自嗨 | **克制开发，聚焦运营** |
| 购买新域名建站 | **寄生 SEO（Medium 高权重平台）** |
| AI 捏造体验 | **真实素材 + AI 润色** |

### 唯一实验：咖啡机评测 SEO + Amazon (US) 联盟

**目标市场**: **英文 / US 市场**（美元结算，Amazon US Associates）

**目标**: 验证"AI辅助的精品内容 + Amazon US 联盟"能否产生正向 ROI

**为什么选择这个实验**:
1. ✅ 实体商品佣金率高（3-8%）
2. ✅ 用户需求明确（购买决策需要信息）
3. ✅ 内容形式成熟（评测、对比类文章）
4. ✅ 技术风险低（寄生在 Medium，无需建站）
5. ✅ 可快速验证（48小时收录，2-3个月能看到结果）

**暂停的实验**:
- ❌ GEO 页面生成（Google HCU 风险高）
- ❌ AI Agent 电商（ROI 不确定）
- ❌ 自建联盟 SaaS（资源投入过大）

---

## ⚠️ 实战补丁 (Street Smarts - 基于泥坑实战经验)

**🔒 这些修正已整合到后续步骤中，禁止绕过！**

### 补丁 1: Reddit 钓鱼法（Bait & Hook）

| ❌ 错误做法 | ✅ 正确做法 |
|-----------|-----------|
| 主贴直接放 Medium 链接 | **主贴 100% 原生内容，不放任何链接** |
| 只发 r/Coffee | **多渠道：r/Coffee_Machines, r/espresso, r/BuyItForLife** |
| 标题："[Review] 我评测了..." | **标题：具体问题开头** |

**Reddit 发帖模板**:
```markdown
标题：Is the De'Longhi ECAM 22.110 worth it for someone who makes 2 cups/day?

正文：
Hey everyone, I've been researching coffee machines for my morning routine and narrowed it down to the De'Longhi ECAM 22.110. I have a few specific questions:

1. How loud is it really? I live in an apartment and don't want to wake neighbors.
2. The steam wand - can it actually do microfoam or just froth?
3. Cleaning seems tedious - is it a pain in practice?

From what I've gathered (watched 3 YouTube reviews, read 50+ Amazon reviews):
- Great: [基于真实优点，2-3条]
- Dealbreaker for me: [基于真实痛点，1-2条]

Budget is ~$350 and I mainly drink lattes. Any owners want to share their experience?

[如果有人问，我在评论区放详细对比表格和实拍图]
```

**钓鱼策略**:
- 主贴不放任何外部链接
- 如果有人问资源，在评论区回复：*"I put together a detailed comparison chart with real photos. Let me find the link... Here: [Medium link]"*
- 这样看起来像是在帮助社区，不是在营销

---

### 补丁 2: Amazon Associates 人工审核防御

**⚠️ 致命风险**: 前 3 笔销售后会触发人工审核，如果 Medium 只有 3 篇带链接的文章 = 被判定为 Spam

**解决方案: 充实门面 (Padding)**

在提交那 3 篇"赚钱文章"之前，**先发布 7 篇纯科普文章**：

| 科普文章标题（示例） | 类型 | 是否带联盟链接 |
|-------------------|------|--------------|
| "How to Store Coffee Beans: Freezer vs Counter" | 纯科普 | ❌ 否 |
| "Hard Water vs Soft Water: Does It Really Affect Your Coffee?" | 纯科普 | ❌ 否 |
| "Arabica vs Robusta: What's the Actual Difference?" | 纯科普 | ❌ 否 |
| "Why Your Coffee Tastes Bitter (It's Not the Beans)" | 纯科普 | ❌ 否 |
| "The Perfect Water Temperature for Coffee: Myth vs Fact" | 纯科普 | ❌ 否 |
| "Single-Origin vs Blend: Which Should You Buy?" | 纯科普 | ❌ 否 |
| "How to Clean Your Coffee Machine (Without Chemicals)" | 纯科普 | ❌ 否 |

**发布顺序**:
```
Day 1-3: 发布 7 篇科普文章（AI 快速生成，10分钟/篇）
Day 4-7: 发布 3 篇评测文章（带联盟链接）
Day 8: 提交 Amazon Associates 申请（填写 Medium Publication 链接）
```

这样你的 Medium 看起来像一个"真正的咖啡爱好者杂志"，而不是"垃圾联盟站点"。

---

### 补丁 3: Medium 内部流量幻觉

**⚠️ 现实**: Medium 对带联盟链接的新账号会限流（Shadowban）

**调整**:
- ❌ ~~把 Medium 内部阅读量作为核心 KPI~~
- ✅ **Medium 的唯一价值：高 DR (95+) 骗 Google 收录**
- ✅ **流量来源**: Google 自然搜索 + Pinterest/Quora 外部引流
- ✅ **KPI 调整**: Google Search Console 展现次数 + 外部引荐流量

**Medium SEO 优化**:
- 标题包含关键词（如："Best Coffee Machine Under $500"）
- 第一段自然出现关键词（2-3次）
- 添加 Alt 标签到所有图片
- 内部链接：文章之间互相链接（形成网站结构）

---

### 补丁 4: 真实转化漏斗数学

**⚠️ 之前的计算错误**: 忽略了两层转化

**真实漏斗**:
```
Medium 阅读 (Views)
    ↓ 10% 点击率 (Outbound CTR)
Amazon 点击 (Clicks)
    ↓ 5% 成交率 (Amazon CVR)
订单数 (Orders)
    × 4.5% 佣金率
佣金收入 (Revenue)
```

**反向计算**（目标：$130 佣金/月）:
| 步骤 | 计算 | 目标 |
|------|------|------|
| 目标佣金 | $130 | - |
| 需要销售额 | $130 ÷ 4.5% | **$2,889** |
| 需要订单 | $2,889 ÷ $350/单 | **8.3 单** |
| 需要点击 | 8.3 ÷ 5% | **166 点击** |
| 需要阅读 | 166 ÷ 10% | **1,660 阅读** |

**结论**: 第一个月需要 **1,660 个真实阅读**，不是 830 个。

**调整后的目标**:
- **Week 1**: 100 阅读（Medium + Google + Pinterest）
- **Week 4**: 累计 500 阅读
- **Week 8**: 累计 1,000 阅读
- **Week 12**: 累计 1,660 阅读（达成盈亏平衡）

---

## 🧪 最小可行闭环 (MVP)

### 第0阶段：手动验证 (Week 1-2)

**目标**: 用最"笨"的方式跑通全流程

**不做任何开发，使用现有工具**：

#### 步骤 1: 选择 3-5 款咖啡机 (Amazon US 畅销榜)

**选择标准**:
- **市场**: Amazon US (美国市场)
- 价格段: $200-500 USD (中高端)
- 评价数: 500+ (有足够数据)
- 佣金率: >4%
- 可购买性: 有货（Ship to US）

**具体产品** (从 Amazon US Best Sellers 选择):
1. **De'Longhi ECAM 22.110** (~$350, 4.5% 佣金)
2. **Breville Barista Express** (~$500, 4% 佣金)
3. **Nespresso Vertuo** (~$150, 5% 佣金)

#### 步骤 2: 手动创建 3 篇内容

**⚠️ 关键原则: AI 只润色，不捏造**

**内容准备步骤** (人工):

1. **真实素材收集** (2-3小时):
   - [ ] 在 YouTube 搜索 "[Product Name] review" 观看至少 3 个真实评测视频
   - [ ] 在 Amazon US 产品页面**差评区**提取 5 个真实痛点
   - [ ] 在 Amazon US 产品页面**好评区**提取 3 个真实优点
   - [ ] 整理产品规格参数（从 Amazon 或品牌官网）

2. **真实素材获取** (可选，$50预算):
   - [ ] 在 Fiverr 找一位真实拥有该咖啡机的用户
   - [ ] 购买 5 张手持实拍照片 + 1 段 15 秒萃取视频
   - [ ] 要求：照片需有手持 ID 验证真实性

**AI 辅助写作提示词** (修改版):

```python
你是一位资深的咖啡爱好者，正在写一篇关于 "{product_name}" 的使用体验文章。

**重要约束**：
1. 你只能使用我提供的**真实事实**，绝对禁止捏造任何细节
2. 如果你不知道某个信息，明确说"我无法确认这一点"，不要编造
3. 第一人称叙述，口语化表达

**我提供的真实信息**：

真实优点：
- {advantage_1_from_reviews}
- {advantage_2_from_reviews}
- {advantage_3_from_reviews}

真实痛点：
- {pain_point_1_from_negative_reviews}
- {pain_point_2_from_negative_reviews}
- {pain_point_3_from_negative_reviews}

产品规格：
- {specs_from_amazon}

请将以上**客观事实**融入到一篇幽默、口语化的评测文章中。文章结构：
1. 开篇：一个具体的使用场景（基于优缺点）
2. 主体：详细描述使用体验（只使用提供的信息）
3. 结论：明确的主观评价（适合谁/不适合谁）

**禁止**：
- 禁止描述声音、气味等感官细节（除非我从视频中提取并告诉你）
- 禁止捏造"使用3个月"的时间线（如果我不确定实际使用时间）
```

**文章 1: De'Longhi ECAM 22.110 详细评测**
- **标题**: "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months (Honest Review)"
- **内容**: 基于真实优缺点，不捏造细节
- **图片**: 至少 3 张真实截图/实拍图

**文章 2: 3款咖啡机深度对比**
- **标题**: "De'Longhi vs Breville vs Nespresso: Which Coffee Machine Is Actually Worth It? (2024)"
- **对比维度**: 价格、使用便利性、咖啡质量、维护难度
- **用 AI 生成对比表格**（基于真实数据）

**文章 3: 新手购买指南**
- **标题**: "Complete Coffee Machine Buying Guide for Beginners (2024 Edition)"
- **回答**: Automatic vs Semi-Automatic, Espresso vs Drip, Capsule vs Ground

#### 步骤 3: 手动添加 Amazon US 联盟链接

**操作流程**:
1. 注册 Amazon Associates (美国账号)
2. 手动搜索产品
3. 点击 "Text & Image" 创建链接
4. 复制短链接嵌入文章

#### 步骤 4: 手动发布（寄生策略）

**⚠️ 不购买域名，不搭建 WordPress**

**平台选择: Medium.com**

**为什么选择 Medium**:
- ✅ 域名权重 DR 95+（Google 信任度高）
- ✅ 48 小时内收录（无需等待沙盒期）
- ✅ 免费（零成本启动）

**⚠️ 发布顺序（重要！）**:

**Day 1-3: 先发布 7 篇科普文章（充实门面，防御 Amazon 审核）**:

| 科普文章标题（AI 快速生成） | 类型 | 联盟链接 |
|-------------------|------|---------|
| "How to Store Coffee Beans: Freezer vs Counter" | 纯科普 | ❌ |
| "Hard Water vs Soft Water: Does It Affect Coffee?" | 纯科普 | ❌ |
| "Arabica vs Robusta: What's the Difference?" | 纯科普 | ❌ |
| "Why Your Coffee Tastes Bitter" | 纯科普 | ❌ |
| "Perfect Water Temperature for Coffee" | 纯科普 | ❌ |
| "Single-Origin vs Blend: Which to Buy?" | 纯科普 | ❌ |
| "How to Clean Your Coffee Machine" | 纯科普 | ❌ |

**Day 4-7: 发布 3 篇评测文章（带联盟链接）**:
- 文章 1: De'Longhi ECAM 22.110 详细评测
- 文章 2: 3款咖啡机深度对比
- 文章 3: 新手购买指南

**Day 8: 提交 Amazon Associates 申请**（此时 Medium 已有 10 篇文章，看起来像真实杂志）

**发布流程**:
1. 注册 Medium 账号
2. 创建 Publication (建立品牌感，如 "Coffee Enthusiast Mag")
3. 发布 7 篇科普文章（Day 1-3）
4. 发布 3 篇评测文章（Day 4-7）
5. 优化 SEO（标题、摘要、Alt 标签）

#### 步骤 5: 手动推广（英文渠道）

**⚠️ 划掉小红书，只用英文渠道**

**推广渠道**:
- **Reddit**: r/Coffee_Machines, r/espresso, r/BuyItForLife（更宽容的社区）
- **Quora**: 回答咖啡机相关问题，附链接
- **Pinterest**: 分享产品图片和对比图

**⚠️ Reddit 钓鱼法（Bait & Hook）**:

```markdown
标题（示例）："Is the De'Longhi ECAM 22.110 worth it for someone who makes 2 cups/day?"

正文（100% 原生内容，不放链接）：
Hey everyone, I've been researching coffee machines and narrowed it down to the De'Longhi ECAM 22.110. I have a few questions:

1. How loud is it really? Apartment living...
2. Can the steam wand do microfoam?
3. Is cleaning a pain?

What I've gathered (from YouTube + Amazon reviews):
- Great: [真实优点2-3条]
- Dealbreaker: [真实痛点1-2条]

Any owners want to share their experience?
```

**钓鱼策略**:
- ❌ 主贴不放任何外部链接
- ✅ 如果有人问，在评论区回复：*"I put together a detailed comparison. Here: [Medium link]"*
- ✅ 这样看起来像帮助社区，不是营销

**⚠️ 禁止**:
- 禁止投放 Reddit 广告（转化率低，反广告情绪高）
- 禁止在小红书发英文内容（语言错位）
- 禁止在主贴直接放外部链接（会被秒删封号）

#### 步骤 5: 验证指标

**第1周目标** (v3.1.1 修正版):
- [ ] 10 篇文章在 Medium 发布成功（7 科普 + 3 评测）
- [ ] Google Search Console 收录 > 5 篇
- [ ] Pinterest/Quora 引荐流量 > 50
- [ ] 至少 1 次联盟点击
- [ ] 提交 Amazon Associates 申请

**真实转化漏斗**（目标：$130 佣金/月）:
```
1,660 阅读 (Views)
    ↓ 10% Outbound CTR
166 点击 (Clicks)
    ↓ 5% Amazon CVR
8.3 单 (Orders)
    × 4.5% 佣金率
$130 佣金
```

**如果第1周失败**:
- 检查：内容质量问题？
- 检查：推广渠道有效性？
- 检查：产品选择是否有问题？

**如果第1周成功**:
- 继续发布到第 10 篇文章
- 观察收录和流量情况

---

## 📋 调整后的实验规划

### 实验：AI 辅助精品 SEO（寄生版）

#### 核心策略：EEAT + 真实素材

**与"程序化SEO"的区别**:

| 维度 | 程序化SEO | AI辅助精品SEO（寄生版）|
|------|-----------|---------------|
| 发布平台 | 独立站（新域名） | **Medium.com（高权重）** |
| 收录周期 | 3-6个月（沙盒期） | **48小时** |
| 内容数量 | 每天3篇 | **每周1篇** |
| 内容质量 | 模板化、同质化 | **每篇深度原创 + 真实素材** |
| 真实性 | AI 捏造 | **基于真实优缺点** |
| 图片 | 通用图 | **至少3张实拍/截图** |
| SEO 风险 | 高（HCU 打击） | **低（符合 E-E-A-T）** |

#### 内容生成流程（修正版）

**第1步：真实素材提取** (人工，必须!)

```
素材收集清单：
□ YouTube 3个评测视频笔记
□ Amazon 差评区 5个痛点
□ Amazon 好评区 3个优点
□ 产品规格参数
□ 至少 3张实拍照片/截图
```

**第2步：事实陈述** (AI 辅助)

```python
# AI 辅助整理事实
请帮我整理以下信息，做成对比表格：

产品: {product_list}

基于我提供的真实信息：
- 痛点: {real_pain_points}
- 优点: {real_advantages}
- 规格: {specs}

表格需要包含：价格、水箱容量、泵压、重量、尺寸

**约束**：只使用我提供的信息，不要添加任何捏造的数据
```

**第3步：内容润色** (AI 辅助)

```python
# AI 润色提示词
我有一份草稿，包含以下真实信息：
{content_with_facts}

请帮我：
1. 润色语言，使其更口语化、幽默
2. 调整结构，使其更易读
3. **绝对不要添加任何事实性信息**
4. 如果信息不足，明确标注"[需要补充]"
```

#### 发布计划

| 阶段 | 周期 | 平台 | 内容量 | 目标 |
|------|------|------|--------|------|
| 冷启动 | Week 1-2 | Medium | 5 篇手动 | Medium阅读 >500, Reddit引流 >100 |
| 稳定发布 | Week 3-10 | Medium | 每周 1 篇 | 总计 10 篇精品内容 |
| 扩张期 | Week 11-20 | 根据数据决定 | 考虑独立站 | 收录稳定后扩张 |

#### 内容质量检查清单

每篇内容发布前检查：

- [ ] **真实素材**：是否包含从 Amazon/YouTube 提取的真实优缺点？
- [ ] **图片真实**：是否包含至少 3 张实拍图或截图？
- [ ] **专业深度**：是否展示了对产品的深入理解？
- [ ] **观点明确**：是否有清晰的个人评价和推荐？
- [ ] **交互性**：是否包含表格或其他互动元素？
- [ ] **标题吸引力**：标题是否能激发点击欲望？
- [ ] **SEO 基础**：标题、元描述是否包含目标关键词？
- [ ] **联盟链接**：联盟链接是否自然融入，不过度营销？
- [ ] **无捏造**：是否确认所有事实性信息都来自真实来源？

---

## 🚨 多阶段止损线（修正版）

### 阶段 1：收录关（Week 3）

**决策点**：第 3 周结束时检查

**⚠️ 调整说明**: Medium 寄生策略 48 小时收录，不考核 Medium 内部流量（会被限流）

**指标**:
| 指标 | 目标值 | 实际值 | 决策 |
|------|--------|--------|------|
| Google Search Console 收录率 | >80% | ___ | 继续优化 ⚠️ |
| GSC 展现次数（Impressions） | >500 | ___ | 继续优化 ⚠️ |
| Reddit/Quora/Pinterest 引荐流量 | >100/周 | ___ | 继续优化 ⚠️ |

**停止条件**: GSC 收录 < 50% 且 2 周优化无改善
**原因**: 内容质量问题或 SEO 优化不足

**停止后行动**:
1. 检查内容质量：是否包含真实优缺点？
2. 检查图片：是否有实拍图？
3. 检查 SEO：标题、摘要、Alt 标签是否优化？
4. 调整内容：增加真实素材

**⚠️ 核心认知**: Medium 的价值是高 DR（95+）骗 Google 收录，不是内部流量

---

### 阶段 2：流量关（Week 6）

**决策点**：第 6 周结束时检查

**指标**:
| 指标 | 目标值 | 实际值 | 决策 |
|------|--------|--------|------|
| Medium 累计阅读量 | >1000 | ___ | 继续优化 ⚠️ |
| Reddit/Quora 累计引流 | >300 | ___ | 继续优化 ⚠️ |
| 联盟链接点击率 | >2% | ___ | 继续优化 ⚠️ |
| 平均停留时间 | >2 分钟 | ___ | 继续优化 ⚠️ |

**优化方向**:
- Medium 阅读量低：优化标题、增加图片、优化摘要
- 引流低：优化 Reddit 发帖策略、回答更多 Quora 问题
- 点击率低：优化联盟链接位置、使用更明显的 CTA
- 停留时间短：增加内容深度、添加更多真实图片

**停止条件**: Medium 阅读 <200 且 2 周优化无改善
**原因**: 内容质量或选品有问题

---

### 阶段 3：转化关（Week 8）

**决策点**：第 8 周结束时检查

**指标**:
| 指标 | 目标值 | 实际值 | 决策 |
|------|--------|--------|------|
| 联盟点击率 CTR | >2% | ___ | 优化 ⚠️ |
| 转化率 | >1% | ___ | 优化 ⚠️ |
| 累计佣金收入 | >$10 | ___ | 评估下一步 |

**优化方向**:
- CTR 低：优化内容引导语、使用更明显的 CTA
- 转化率低：优化产品选择、提供更明确的购买建议

**停止条件**: 累计收入 <$5 且 2 周优化无改善
**原因**: 商业模式本身可能不成立

---

### 阶段 4：ROI 关（Week 12）

**决策点**：第 12 周最终评估

**指标**:
| 指标 | 目标值 | 决策 |
|------|--------|------|
| 月均佣金收入 | >$100 | ✅ 成功，继续扩大 |
| 累计投入 | <$200 | ✅ 控制良好 |
| ROI | >50% | ✅ 可以接受 |

**成功后下一步**:
- 开始探索自动化（内容生成、联盟链接自动注入）
- 考虑搭建独立站（购买老域名）
- 扩展到第二个利基市场

**失败后的选择**:
- 如果 ROI < 0：停止该项目
- 如果 ROI 0-50%：调整策略，再观察 4 周
- 如果 ROI > 50%：继续优化，准备扩张

---

## 💰 真实成本测算（修正版）

### 成本结构

**固定成本**:
- Medium 免费
- AI API（10 篇高质量内容生成）：$50/月
- 工具（Ahrefs/SEMrush 基础版）：$30/月（可选）

**变动成本**:
- 真实素材获取（Fiverr）：$50/篇（可选，前3篇可手动收集）
- 人工时间（10小时/月 × 自己的时间成本）

**⚠️ 流量获取成本调整**:

| 方法 | 预估成本 | 备注 |
|------|----------|------|
| Reddit 自然推广 | $0 | 社区互动，软性推广 |
| Quora 回答问题 | $0 | 知识分享，附链接 |
| Pinterest 自然增长 | $0 | 图片分享 |
| ~~Reddit 广告~~ | ~~$50-100/天~~ | **禁止！转化率低** |
| 真实素材（Fiverr） | $50/篇 | **推荐！转化率高** |

### 首月成本测算（v3.1.1 修正版）

**手动模式**（前 3 个月）:
- 固定：~$80/月（AI API + 可选工具）
- 真实素材：$50（仅第1篇，后续手动收集）
- 总成本：~$130/月（第1个月），~$80/月（第2-3个月）

**盈亏平衡分析**（修正版）:
- 按 4.5% 佣金率计算
- 需要 $130 / 0.045 = $2,889 销售额
- 按 $350 平均客单价：需要 8.3 单销售/月
- 按 5% Amazon 成交率：需要 166 个 Amazon 点击
- 按 10% 文章点击率：需要 **1,660 个阅读**

**调整后的目标**:
- **Week 1**: 100 阅读（Medium + Google + Pinterest）
- **Week 4**: 累计 500 阅读
- **Week 8**: 累计 1,000 阅读
- **Week 12**: 累计 1,660 阅读（达成盈亏平衡）

**现实检验**：
- 对于 Medium 寄生策略，第 1 个月目标 100-200 阅读是现实的
- **第 1 个月**：100-200 阅读，5-10 次点击，$0-10 佣金
- **第 2-3 个月**：300-600 阅读，20-50 次点击，$10-50 佣金
- **第 4-6 个月**：如果前 3 个月有正向趋势，考虑扩张

---

## 🛑 第二阶段开发任务（暂停）

**所有后端、前端、AI 服务开发任务全部暂停**，直到手动验证成功。

**停止的开发任务**:
- ❌ Analytics 页面开发
- ❌ Settlements 页面开发
- ❌ 用户认证系统
- ❌ 实验创建向导
- ❌ 实时数据更新
- ❌ 追踪脚本部署
- ❌ Cloudflare Workers
- ❌ 购买域名和搭建 WordPress

**原因**: 在没有跑通最小闭环前，开发这些功能是浪费资源。

---

## ✅ 当务之急（立即行动）

### 行动清单

#### Week 1 Day 1-2: 选品和素材收集

**Day 1**:
- [ ] 登录 Amazon US 浏览 Coffee Machine Best Sellers
- [ ] 选择 3 款具体产品（$200-500 价格段，500+ 评价）
- [ ] 注册 Medium 账号，创建 Publication
- [ ] YouTube 搜索每款产品的评测视频，各看 3 个

**Day 2**:
- [ ] 提取真实优缺点（视频 + Amazon 评论区）
- [ ] 整理产品规格参数
- [ ] 可选：Fiverr 购买真实素材（$50）

#### Week 1 Day 3-5: 内容创建（10篇）

**Day 3-4: 科普文章（7篇，AI 快速生成）**:
- [ ] "How to Store Coffee Beans: Freezer vs Counter"
- [ ] "Hard Water vs Soft Water: Does It Affect Coffee?"
- [ ] "Arabica vs Robusta: What's the Difference?"
- [ ] "Why Your Coffee Tastes Bitter"
- [ ] "Perfect Water Temperature for Coffee"
- [ ] "Single-Origin vs Blend: Which to Buy?"
- [ ] "How to Clean Your Coffee Machine"

**Day 5-6: 评测文章（3篇，基于真实素材）**:
- [ ] 第 1 篇：De'Longhi ECAM 22.110 详细评测（+联盟链接）
- [ ] 第 2 篇：3款咖啡机深度对比（+联盟链接）
- [ ] 第 3 篇：新手购买指南（+联盟链接）
- [ ] 每篇至少 3 张真实图片

#### Week 1 Day 7-8: 发布和推广

**Day 7**:
- [ ] 发布 7 篇科普文章（Day 1-3 已完成）
- [ ] 发布 3 篇评测文章（Day 4-6 已完成）
- [ ] 注册 Amazon Associates（填写 Medium Publication 链接）
- [ ] 为每款产品创建联盟短链接

**Day 8**:
- [ ] Reddit r/Coffee_Machines 发帖（钓鱼法，主贴不放链接）
- [ ] Quora 回答 3 个相关问题，附链接
- [ ] Pinterest 分享产品对比图
- [ ] 提交 Google Search Console（Medium Publication）

#### Week 2-4: 数据观察

**每天**:
- [ ] 检查 Google Search Console 收录情况
- [ ] 检查 Medium 阅读量
- [ ] 检查 Reddit/Quora/Pinterest 引荐流量
- [ ] 检查 Amazon 联盟点击

**每周一次**:
- [ ] 评估本周数据
- [ ] 根据数据决定：继续、优化、停止

---

## 📝 成功日志模板

**Week 1 日志**:
```
日期: 2026-03-04
内容发布: 3 篇
平台: Medium.com
市场: US / English

收录情况:
- Medium: 已发布，待审核

推广动作:
- Reddit r/Coffee: 1 帖
- Quora: 3 个回答
- Pinterest: 10 pins

数据:
- Medium 阅读: 待统计
- 引荐流量: 待统计
- 点击: 0
- 佣金: $0
```

**每周评估报告**:
```
日期: 2026-03-XX
本周数据:
- Medium 累计阅读: [数字]
- Reddit/Quora 引流: [数字]
- 联盟点击: [数字]
- 佣金: $[金额]

评估:
- [ ] 继续当前策略
- [ ] 需要优化内容
- [ ] 需要调整推广策略
- [ ] 达到阶段 1/2/3 止损线
```

---

## 🎯 核心原则

### 1. 克制技术冲动
在没有验证商业模式前，不开发任何自动化工具。

### 2. 聚焦单一利基
只做"咖啡机评测"这一个实验，不发散。

### 3. 快速试错
每 2 周评估一次，及时止损或调整策略。

### 4. 敬畏平台规则
严格遵守 Google HCU 规则，坚持 EEAT 原则，**禁止 AI 捏造**。

### 5. 真实性第一
**一张丑陋但真实的实拍图 > 1000字优美的 AI 废话**

### 6. 寄生策略
**Medium 高权重 > 新域名沙盒期**

### 7. 承认不确定性
实验可能失败，失败也是有价值的数据。

---

**文档版本**: 3.1.1 (最终锁死版 🔒)
**最后更新**: 2026-03-04
**状态**: **🔒 已锁死 - 禁止修改**
**下一步**: **Go Execution!**

---

## 📌 修正说明

**v3.1.0 基于 ergent2.ini.md 反馈的关键修正**:

1. ✅ **明确市场定位**: 英文 / US 市场（美元结算，Amazon US）
2. ✅ **寄生策略**: 使用 Medium.com，不购买新域名
3. ✅ **调整考核指标**: Week 1-4 不考核 Google 排名，只考核 Medium 内部流量和社交媒体引流
4. ✅ **真实素材优先**: 提取真实优缺点，至少 3 张实拍图，AI 只润色不捏造
5. ✅ **划错渠道**: 删除小红书，只用 Reddit/Quora/Pinterest
6. ✅ **禁止广告**: 不投放 Reddit 广告，预算用于真实素材
7. ✅ **沙盒期认知**: 新域名 3-6 个月沙盒期，Medium 48小时收录

**v3.1.1 基于 ergent3.ini.md 反馈的实战补丁（最终版）**:
1. ✅ **Reddit 钓鱼法**: 主贴不放链接，用 "Bait & Hook" 策略
2. ✅ **充实门面**: 先发 7 篇科普文章，防御 Amazon 人工审核
3. ✅ **Medium 限流认知**: 不考核内部阅读，专注 Google SEO
4. ✅ **真实转化漏斗**: 需要 1,660 阅读，不是 830（10% CTR × 5% CVR）

---

## 🔒 文档锁死声明

**这份文档已达到"可执行"状态，禁止再修改任何一个字。**

**商业世界的真理不在需求文档里，而在 Amazon 联盟后台跳动的第一笔 $0.5 美金里。**

**Go Execution! 🚀**
