'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MoreVertical, Edit, Trash2, Send, Eye, Bot } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Article } from '@/lib/blog/types'

interface AdminArticleCardProps {
  article: Article
  onPublish: (id: string) => void
  onDelete: (id: string) => void
}

const statusConfig = {
  draft: { label: '草稿', variant: 'secondary' as const },
  review: { label: '待审核', variant: 'outline' as const },
  published: { label: '已发布', variant: 'default' as const },
}

export function AdminArticleCard({ article, onPublish, onDelete }: AdminArticleCardProps) {
  const status = statusConfig[article.status]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{article.category.name}</Badge>
              {article.contentItemId && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Bot className="h-3 w-3" />
                  AI同步
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {article.excerpt || '暂无摘要'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>创建于 {format(new Date(article.createdAt), 'yyyy/MM/dd', { locale: zhCN })}</span>
              <span>更新于 {format(new Date(article.updatedAt), 'yyyy/MM/dd', { locale: zhCN })}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">更多操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {article.status === 'published' && (
                <DropdownMenuItem asChild>
                  <Link href={`/blog/${article.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    查看文章
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/blog/admin/edit/${article.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Link>
              </DropdownMenuItem>
              {article.status !== 'published' && (
                <DropdownMenuItem onClick={() => onPublish(article.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  发布
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(article.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-3 border-t">
        <div className="flex items-center justify-between w-full text-sm">
          <span className="text-muted-foreground">作者: {article.author.name}</span>
          <div className="flex items-center gap-2">
            <span>{article.likes} 点赞</span>
            <span>{article.comments.length} 评论</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
