'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Content } from '@/lib/types'

const typeMap: Record<Content['type'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  review: { label: '评测', variant: 'default' },
  science: { label: '科普', variant: 'secondary' },
  guide: { label: '指南', variant: 'outline' },
}

const statusMap: Record<Content['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'outline' },
  reviewing: { label: '审核中', variant: 'secondary' },
  approved: { label: '已通过', variant: 'default' },
  published: { label: '已发布', variant: 'default' },
}

export function ContentTable({
  contents,
  onEdit,
  onReview,
  onPublish,
}: {
  contents: Content[]
  onEdit: (content: Content) => void
  onReview: (content: Content) => void
  onPublish: (content: Content) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead className="w-[80px]">类型</TableHead>
          <TableHead className="w-[80px]">状态</TableHead>
          <TableHead className="w-[80px]">字数</TableHead>
          <TableHead className="w-[100px]">来源</TableHead>
          <TableHead className="w-[120px]">更新时间</TableHead>
          <TableHead className="w-[180px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contents.map((content) => {
          const type = typeMap[content.type]
          const status = statusMap[content.status]
          return (
            <TableRow key={content.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{content.title}</span>
                  <span className="text-xs text-muted-foreground">ASIN: {content.asin}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={type.variant} className="text-xs">{type.label}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{content.wordCount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {content.aiGenerated ? 'AI' : '人工'}
                  {content.humanReviewed && ' + 审核'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{content.updatedAt}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(content)}>
                    编辑
                  </Button>
                  {content.status === 'reviewing' && (
                    <Button variant="outline" size="sm" onClick={() => onReview(content)}>
                      审核
                    </Button>
                  )}
                  {(content.status === 'approved' || content.status === 'draft') && (
                    <Button size="sm" onClick={() => onPublish(content)}>
                      发布
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
        {contents.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
              暂无内容
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
