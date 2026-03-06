'use client'

import { useEffect, useState } from 'react'
import { useBlogStore } from '@/lib/blog/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { PenSquare, Eye, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const statusLabels: Record<string, string> = {
  draft: '草稿',
  review: '审核中',
  published: '已发布',
}

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: 'secondary',
  review: 'outline',
  published: 'default',
}

export default function BlogManagePage() {
  const { articles, categories, loading } = useBlogStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()

  // 过滤文章
  const filteredArticles = articles.filter(article => {
    const matchSearch = !search ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.category.name.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'all' || article.status === statusFilter

    return matchSearch && matchStatus
  })

  // 统计数据
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    review: articles.filter(a => a.status === 'review').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">博客管理</h1>
          <p className="text-muted-foreground">
            管理您的博客文章，包括草稿、已发布和审核中的内容
          </p>
        </div>
        <Button asChild>
          <Link href="/content">
            <Plus className="h-4 w-4 mr-2" />
            新建文章
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">总文章</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">已发布</div>
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">草稿</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">审核中</div>
            <div className="text-3xl font-bold text-blue-600">{stats.review}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="搜索文章标题或分类..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('published')}
                size="sm"
              >
                已发布
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                草稿
              </Button>
              <Button
                variant={statusFilter === 'review' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('review')}
                size="sm"
              >
                审核中
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium truncate">{article.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{article.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[article.status]}>
                      {statusLabels[article.status] || article.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {article.status === 'published' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/blog/${article.slug}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/content?edit=${article.id}`}>
                          <PenSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all' ? '没有找到匹配的文章' : '暂无文章，点击右上角创建第一篇文章'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/content">
                  <Plus className="h-4 w-4 mr-2" />
                  创建文章
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
