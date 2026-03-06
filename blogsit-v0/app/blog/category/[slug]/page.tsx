'use client'

import { useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { ArticleCard } from '@/components/blog/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params)
  const { articles, categories, fetchArticles, loading } = useBlogStore()

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const category = categories.find(c => c.slug === slug)
  const categoryArticles = articles.filter(
    a => a.category.slug === slug && a.status === 'published'
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full rounded-xl mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">分类未找到</h1>
        <p className="text-muted-foreground mb-8">抱歉，您请求的分类不存在。</p>
        <Button asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回博客首页
          </Link>
        </Button>
      </div>
    )
  }

  const categoryColors: Record<string, string> = {
    'bg-blue-500': 'from-blue-500/20 to-blue-500/5',
    'bg-green-500': 'from-green-500/20 to-green-500/5',
    'bg-yellow-500': 'from-yellow-500/20 to-yellow-500/5',
    'bg-pink-500': 'from-pink-500/20 to-pink-500/5',
    'bg-indigo-500': 'from-indigo-500/20 to-indigo-500/5',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div className={`rounded-2xl bg-gradient-to-br ${categoryColors[category.color] || 'from-primary/20 to-primary/5'} p-8 mb-8`}>
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回博客
              </Link>
            </Button>
            <Badge className={`${category.color} text-white mb-4`}>
              {category.name}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-muted-foreground max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{categoryArticles.length} 篇文章</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {categoryArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">暂无文章</h2>
          <p className="text-muted-foreground mb-6">
            该分类下还没有发布的文章
          </p>
          <Button asChild>
            <Link href="/blog">浏览其他文章</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
