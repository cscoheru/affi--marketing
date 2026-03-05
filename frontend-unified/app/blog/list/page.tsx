import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const allArticles = [
  { id: 1, title: '如何选择适合的联盟营销平台', category: '指南', date: '2026-03-01', excerpt: '联盟营销是电商变现的重要方式...' },
  { id: 2, title: 'Amazon Associates 佣金结构详解', category: '教程', date: '2026-02-28', excerpt: '了解 Amazon Associates 的佣金结构...' },
  { id: 3, title: '2025年联盟营销趋势分析', category: '分析', date: '2026-02-25', excerpt: '探索2025年联盟营销的最新趋势...' },
  { id: 4, title: '产品评测写作技巧', category: '写作', date: '2026-03-05', excerpt: '学习如何撰写吸引人的产品评测...' },
  { id: 5, title: '如何提高转化率', category: '优化', date: '2026-03-04', excerpt: '提高转化率的实用技巧和策略...' },
  { id: 6, title: 'SEO在联盟营销中的应用', category: 'SEO', date: '2026-03-03', excerpt: '搜索引擎优化对联盟营销的重要性...' },
  { id: 7, title: '社交媒体推广策略', category: '营销', date: '2026-03-02', excerpt: '利用社交媒体推广联盟产品...' },
  { id: 8, title: '数据分析入门', category: '数据', date: '2026-03-01', excerpt: '联盟营销数据分析的基础知识...' },
  { id: 9, title: '合规性指南', category: '合规', date: '2026-02-28', excerpt: '联盟营销合规性的重要要点...' },
  { id: 10, title: '移动端优化策略', category: '优化', date: '2026-02-27', excerpt: '针对移动设备的联盟营销优化...' },
  { id: 11, title: '邮件营销实战', category: '营销', date: '2026-02-26', excerpt: '通过邮件营销提升联盟收益...' },
  { id: 12, title: '内容创作技巧', category: '写作', date: '2026-02-25', excerpt: '创作高质量内容的实用方法...' },
]

const categories = ['全部', '指南', '教程', '分析', '写作', '优化', 'SEO', '营销', '数据', '合规']

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-muted/50 py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">文章列表</h1>
          <p className="text-muted-foreground">浏览我们所有的联盟营销文章和指南</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-muted-foreground">分类:</span>
              <Select defaultValue="全部">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input placeholder="搜索文章..." className="max-w-xs" />
              <Button>搜索</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Article List */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid gap-6">
            {allArticles.map((article) => (
              <Link key={article.id} href={`/blog/article/${article.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-48 h-32 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {article.category}
                          </span>
                          <span className="text-sm text-muted-foreground">{article.date}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                上一页
              </Button>
              <Button variant="default" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">下一页</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
