'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { ArticleCard } from '@/components/blog/article-card'
import { CategoryFilter } from '@/components/blog/category-filter'
import { SearchSort } from '@/components/blog/search-sort'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function BlogPublicHomePage() {
  const { fetchArticles, getFilteredArticles, loading } = useBlogStore()
  const [displayCount, setDisplayCount] = useState(6)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const filteredArticles = getFilteredArticles()
  const featuredArticle = filteredArticles[0]
  const otherArticles = filteredArticles.slice(1, displayCount)
  const hasMore = filteredArticles.length > displayCount

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gray-900">
            Affi Marketing 博客
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            探索联盟营销、SEO 优化、技术教程和产品测评的最新内容
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <div className="relative mb-8">
            <div className="absolute -top-3 left-4 z-10">
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full shadow-lg">
                <Sparkles className="h-3 w-3" />
                精选文章
              </span>
            </div>
            <ArticleCard article={featuredArticle} featured />
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <CategoryFilter />
          <SearchSort />
        </div>

        {/* Article Grid */}
        {otherArticles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {otherArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 mb-4">暂无匹配的文章</p>
            <Link href="/blog-public" className="text-primary hover:underline">
              查看全部文章
            </Link>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDisplayCount(prev => prev + 6)}
              className="bg-white hover:bg-gray-50"
            >
              加载更多
            </Button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Affi Marketing. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
