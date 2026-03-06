'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { ArticleCard } from '@/components/blog/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params)
  const { categories, fetchArticles, articles, loading, setFilters, getFilteredArticles } = useBlogStore()
  const [displayCount, setDisplayCount] = useState(12)

  useEffect(() => {
    fetchArticles()
    setFilters({ category: slug })
  }, [slug, fetchArticles, setFilters])

  const category = categories.find(c => c.slug === slug)
  const filteredArticles = getFilteredArticles()
  const displayedArticles = filteredArticles.slice(0, displayCount)
  const hasMore = filteredArticles.length > displayCount

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-8" />
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
      <div className="p-6 text-center py-16">
        <h1 className="text-2xl font-bold mb-4">分类未找到</h1>
        <p className="text-muted-foreground mb-8">抱歉，您请求的分类不存在。</p>
        <Button asChild>
          <Link href="/dashboard/blog">
            <ChevronRight className="h-4 w-4 mr-2" />
            返回博客
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/blog">博客</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge className={category.color}>{category.name}</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Articles Grid */}
      {displayedArticles.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {displayedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setDisplayCount(prev => prev + 12)}
              >
                加载更多
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">该分类下暂无文章</p>
        </div>
      )}
    </div>
  )
}
