'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, Send, Archive } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { AdminArticleCard } from '@/components/blog/admin-article-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function BlogAdminPage() {
  const { articles, fetchArticles, publishArticle, deleteArticle, loading } = useBlogStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const drafts = articles.filter(a => a.status === 'draft')
  const published = articles.filter(a => a.status === 'published')
  const review = articles.filter(a => a.status === 'review')

  const handleDelete = async () => {
    if (deleteId) {
      await deleteArticle(deleteId)
      setDeleteId(null)
    }
  }

  const renderArticleList = (filteredArticles: typeof articles, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )
    }

    if (filteredArticles.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filteredArticles.map((article) => (
          <AdminArticleCard
            key={article.id}
            article={article}
            onPublish={publishArticle}
            onDelete={setDeleteId}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">文章管理</h1>
          <p className="text-muted-foreground mt-1">管理您的博客文章和内容</p>
        </div>
        <Button asChild size="lg">
          <Link href="/blog/admin/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            新建文章
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Archive className="h-4 w-4" />
            <span className="text-sm">草稿</span>
          </div>
          <p className="text-2xl font-bold">{drafts.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-sm">待审核</span>
          </div>
          <p className="text-2xl font-bold">{review.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Send className="h-4 w-4" />
            <span className="text-sm">已发布</span>
          </div>
          <p className="text-2xl font-bold">{published.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">全部 ({articles.length})</TabsTrigger>
          <TabsTrigger value="drafts">草稿 ({drafts.length})</TabsTrigger>
          <TabsTrigger value="review">待审核 ({review.length})</TabsTrigger>
          <TabsTrigger value="published">已发布 ({published.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {renderArticleList(articles, '暂无文章')}
        </TabsContent>
        <TabsContent value="drafts">
          {renderArticleList(drafts, '暂无草稿')}
        </TabsContent>
        <TabsContent value="review">
          {renderArticleList(review, '暂无待审核文章')}
        </TabsContent>
        <TabsContent value="published">
          {renderArticleList(published, '暂无已发布文章')}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这篇文章吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。文章将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
