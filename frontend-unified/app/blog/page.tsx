import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const featuredArticles = [
  {
    id: 1,
    title: '如何选择适合的联盟营销平台',
    excerpt: '联盟营销是电商变现的重要方式，本文将详细介绍如何选择适合的联盟营销平台...',
    category: '指南',
    date: '2026-03-01',
    readTime: '5 分钟',
  },
  {
    id: 2,
    title: 'Amazon Associates 佣金结构详解',
    excerpt: '了解 Amazon Associates 的佣金结构，帮助您最大化收益...',
    category: '教程',
    date: '2026-02-28',
    readTime: '8 分钟',
  },
  {
    id: 3,
    title: '2025年联盟营销趋势分析',
    excerpt: '探索2025年联盟营销的最新趋势和机会...',
    category: '分析',
    date: '2026-02-25',
    readTime: '6 分钟',
  },
]

const recentArticles = [
  { id: 4, title: '产品评测写作技巧', date: '2026-03-05', category: '写作' },
  { id: 5, title: '如何提高转化率', date: '2026-03-04', category: '优化' },
  { id: 6, title: 'SEO在联盟营销中的应用', date: '2026-03-03', category: 'SEO' },
  { id: 7, title: '社交媒体推广策略', date: '2026-03-02', category: '营销' },
  { id: 8, title: '数据分析入门', date: '2026-03-01', category: '数据' },
  { id: 9, title: '合规性指南', date: '2026-02-28', category: '合规' },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/50 py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Affi-Marketing 博客</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            分享联盟营销、产品评测、行业洞察，助您成功开展联盟营销业务
          </p>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">精选文章</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                      {article.category}
                    </span>
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                  <Link href={`/blog/article/${article.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      阅读更多
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">最新文章</h2>
            <Link href="/blog/list">
              <Button variant="outline">查看全部</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
              <Link key={article.id} href={`/blog/article/${article.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded mb-2 inline-block">
                      {article.category}
                    </span>
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.date}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
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
