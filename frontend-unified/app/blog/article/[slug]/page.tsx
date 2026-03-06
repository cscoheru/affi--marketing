'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, Heart, Share2, ChevronRight } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { CommentSection } from '@/components/blog/comment-section'
import { ArticleCard } from '@/components/blog/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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

export default function ArticleDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const { currentArticle, fetchArticleBySlug, likeArticle, articles, loading } = useBlogStore()
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetchArticleBySlug(slug)
  }, [slug, fetchArticleBySlug])

  const handleLike = async () => {
    if (currentArticle && !liked) {
      await likeArticle(currentArticle.id)
      setLiked(true)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentArticle?.title,
          text: currentArticle?.excerpt,
          url: window.location.href,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  // Get related articles (same category, excluding current)
  const relatedArticles = articles
    .filter(a =>
      a.id !== currentArticle?.id &&
      a.category.id === currentArticle?.category.id &&
      a.status === 'published'
    )
    .slice(0, 3)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-80 w-full rounded-xl mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!currentArticle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-muted-foreground mb-8">抱歉，您请求的文章不存在或已被删除。</p>
        <Button asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回博客首页
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">博客</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/blog/category/${currentArticle.category.slug}`}>
                {currentArticle.category.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-48 truncate">
                {currentArticle.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Cover Image */}
        {currentArticle.coverImage && (
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={currentArticle.coverImage}
              alt={currentArticle.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <Badge className="mb-4">{currentArticle.category.name}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
            {currentArticle.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentArticle.author.avatar} alt={currentArticle.author.name} />
                <AvatarFallback>{currentArticle.author.name[0]}</AvatarFallback>
              </Avatar>
              <span>{currentArticle.author.name}</span>
            </div>
            {currentArticle.publishedAt && (
              <span>
                {format(new Date(currentArticle.publishedAt), 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none mb-8">
          <div
            className="whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentArticle.content.replace(/\n/g, '<br/>') }}
          />
        </article>

        {/* Tags */}
        {currentArticle.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {currentArticle.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant={liked ? 'default' : 'outline'}
              onClick={handleLike}
              disabled={liked}
            >
              <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {currentArticle.likes} 点赞
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
        </div>

        {/* Comments Section */}
        <CommentSection
          articleId={currentArticle.id}
          comments={currentArticle.comments}
        />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <h3 className="text-xl font-semibold mb-6">相关文章</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
