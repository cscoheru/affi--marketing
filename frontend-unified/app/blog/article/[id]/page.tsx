import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const articles: Record<string, {
  id: number
  title: string
  category: string
  date: string
  readTime: string
  content: string
  author: string
}> = {
  '1': {
    id: 1,
    title: '如何选择适合的联盟营销平台',
    category: '指南',
    date: '2026-03-01',
    readTime: '5 分钟',
    author: '张三',
    content: `
# 引言

联盟营销是电商变现的重要方式。选择合适的联盟营销平台对于成功至关重要。

## 什么是联盟营销？

联盟营销是一种基于效果的营销模式，商家通过联盟会员（推广者）推广产品，并根据销售结果支付佣金。

## 选择平台的关键因素

### 1. 佣金率

不同平台提供不同的佣金率。通常在 1% 到 10% 之间，有些平台甚至更高。

### 2. 产品类别

选择与您内容相关度高的产品类别，这样可以提高转化率。

### 3. 追踪和报告

良好的追踪系统可以帮助您了解哪些推广策略最有效。

## 热门联盟营销平台

### Amazon Associates

- 佣金率：1-10%
- 产品种类：极其丰富
- 追踪期：24小时

### ShareASale

- 佣金率：因商家而异
- 产品种类：多样化
- 追踪期：30天以上

### Commission Junction

- 佣金率：因商家而异
- 产品种类：知名品牌多
- 追踪期：7-30天

## 结论

选择联盟营销平台时，请综合考虑佣金率、产品相关性、追踪系统等因素。最重要的是选择与您的受众和内容相匹配的平台。
    `,
  },
  '2': {
    id: 2,
    title: 'Amazon Associates 佣金结构详解',
    category: '教程',
    date: '2026-02-28',
    readTime: '8 分钟',
    author: '李四',
    content: `
# Amazon Associates 佣金结构

Amazon Associates 是世界上最受欢迎的联盟营销计划之一。

## 佣金率表

| 产品类别 | 佣金率 |
|---------|--------|
| 奢侈美容 | 10% |
| Amazon Games | 10% |
| 数字音乐 | 5% |
| 家居装修 | 8% |
| 厨房用品 | 8% |
| 电子产品 | 2.5% |

## 佣金结构特点

### 递进式佣金

Amazon 使用递进式佣金结构，您在一个月内销售的产品越多，可能获得更高的佣金率。

### 跨品类销售

您可以推广任何 Amazon 产品类别的产品，佣金会根据实际销售产品的类别计算。

## 最大化收益技巧

1. **选择高佣金类别**：专注于佣金率较高的产品类别
2. **高价值产品**：推广高价产品可以获得更高的绝对佣金
3. **批量销售**：销售数量越多，收益越高
4. **节日促销**：利用促销期间的高转化率

## 注意事项

- 佣金Cookie有效期仅24小时
- 需要遵守Amazon的使用条款
- 定期检查佣金率变化

通过了解 Amazon Associates 的佣金结构，您可以更好地规划联盟营销策略。
    `,
  },
  '3': {
    id: 3,
    title: '2025年联盟营销趋势分析',
    category: '分析',
    date: '2026-02-25',
    readTime: '6 分钟',
    author: '王五',
    content: `
# 2025年联盟营销趋势分析

随着数字营销的不断发展，联盟营销也在不断演进。

## 主要趋势

### 1. 视频内容崛起

短视频和直播成为联盟营销的重要渠道。TikTok、Instagram Reels 等平台的兴起改变了内容创作方式。

### 2. 移动端优先

超过70%的联盟营销流量来自移动设备。优化移动体验变得至关重要。

### 3. AI驱动的内容创作

AI工具正在帮助联盟营销者更高效地创建产品评测和推荐内容。

### 4. 社交电商整合

社交平台正在整合电商功能，缩短从发现到购买的路径。

### 5. 微影响者增长

拥有小众但高度参与受众的微影响者越来越受商家青睐。

## 应对策略

### 内容质量优先

在信息过载的时代，高质量、有深度的内容更容易脱颖而出。

### 多元化平台布局

不要过度依赖单一平台，建立多元化的流量来源。

### 数据驱动决策

利用数据分析工具优化推广策略，关注转化率而非点击量。

### 建立信任

与受众建立长期信任关系是联盟营销成功的关键。

## 未来展望

联盟营销行业将继续增长，新技术和平台会带来更多机会。保持学习和适应能力是成功的关键。
    `,
  },
}

const relatedArticles = [
  { id: 4, title: '产品评测写作技巧' },
  { id: 5, title: '如何提高转化率' },
  { id: 6, title: 'SEO在联盟营销中的应用' },
]

export default async function BlogArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = articles[id] || articles['1']

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回博客
        </Link>

        <Badge variant="secondary" className="mb-4">{article.category}</Badge>

        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 text-muted-foreground mb-8">
          <span>作者: {article.author}</span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span>阅读时间: {article.readTime}</span>
        </div>

        <div className="aspect-video bg-muted rounded-lg mb-8 flex items-center justify-center">
          <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap">{article.content}</div>
        </div>

        {/* Share */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="font-semibold mb-4">分享这篇文章</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">复制链接</Button>
            <Button variant="outline" size="sm">分享到 Twitter</Button>
            <Button variant="outline" size="sm">分享到 Facebook</Button>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="bg-muted/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">相关文章</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => (
              <Link key={related.id} href={`/blog/article/${related.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <h3 className="font-semibold hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">订阅我们的通讯</h2>
              <p className="text-primary-foreground/80 mb-6">
                获取最新的联盟营销技巧和行业资讯
              </p>
              <div className="flex max-w-md mx-auto gap-2">
                <input
                  type="email"
                  placeholder="输入您的邮箱"
                  className="flex-1 px-4 py-2 rounded bg-background text-foreground"
                />
                <Button variant="secondary">订阅</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
