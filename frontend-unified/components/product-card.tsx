'use client'

import { ProductContent, ProductStatus, ProductType } from '@/lib/api'
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Rocket,
  Archive,
  Sparkles,
  Clock,
  MousePointer,
  DollarSign,
  Link,
} from 'lucide-react'

interface ProductCardProps {
  product: ProductContent
  onViewDetails?: (product: ProductContent) => void
  onEdit?: (product: ProductContent) => void
  onDelete?: (id: number) => void
  onReview?: (id: number, action: 'approve' | 'reject' | 'revision') => void
  onChangeStatus?: (id: number, status: ProductStatus) => void
}

const statusConfig: Record<ProductStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: '草稿',
    color: 'bg-slate-500',
    icon: <Edit className="h-3 w-3" />,
  },
  review: {
    label: '待审核',
    color: 'bg-yellow-500',
    icon: <Eye className="h-3 w-3" />,
  },
  approved: {
    label: '已通过',
    color: 'bg-blue-500',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  published: {
    label: '已发布',
    color: 'bg-green-500',
    icon: <Rocket className="h-3 w-3" />,
  },
  archived: {
    label: '已归档',
    color: 'bg-gray-500',
    icon: <Archive className="h-3 w-3" />,
  },
}

const typeConfig: Record<ProductType, { label: string; icon: string }> = {
  review: { label: '评测', icon: '📝' },
  guide: { label: '指南', icon: '📖' },
  tutorial: { label: '教程', icon: '🎓' },
  list: { label: '清单', icon: '📋' },
  news: { label: '资讯', icon: '📰' },
}

export function ProductCard({
  product,
  onViewDetails,
  onEdit,
  onDelete,
  onReview,
  onChangeStatus,
}: ProductCardProps) {
  const config = statusConfig[product.status]
  const typeInfo = typeConfig[product.type]

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-3">
        {/* 头部：类型 + 标题 */}
        <div className="flex gap-2" onClick={() => onViewDetails?.(product)}>
          <Badge variant="outline" className="flex-shrink-0">
            {typeInfo.icon} {typeInfo.label}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate" title={product.title}>
              {product.title}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {product.slug}
            </div>
          </div>
        </div>

        {/* 摘要 */}
        {product.excerpt && (
          <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {product.excerpt}
          </div>
        )}

        {/* 元信息 */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {product.wordCount} 字
          </span>
          {product.aiGenerated && (
            <Badge variant="secondary" className="text-xs py-0 h-5">
              <Sparkles className="h-3 w-3 mr-1" />
              AI 生成
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(product.updatedAt)}
          </span>
        </div>

        {/* 已发布内容显示表现数据 */}
        {product.status === 'published' && (product.views || product.clicks) && (
          <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(product.views || 0)} 浏览</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MousePointer className="h-3 w-3" />
              <span>{formatNumber(product.clicks || 0)} 点击</span>
            </div>
            {product.conversions !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                <span>{formatNumber(product.conversions)} 转化</span>
              </div>
            )}
            {product.revenue && (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(product.revenue)}</span>
              </div>
            )}
          </div>
        )}

        {/* 关联市场 */}
        {product.markets && product.markets.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Link className="h-3 w-3" />
            <span>关联 {product.markets.length} 个市场</span>
          </div>
        )}

        {/* 审核状态信息 */}
        {product.status === 'review' && product.reviewComment && (
          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
            审核意见: {product.reviewComment}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-2 flex items-center justify-between">
          <Badge className={`${config.color} text-white text-xs`}>
            <span className="flex items-center gap-1">
              {config.icon}
              {config.label}
            </span>
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {/* 草稿状态：提交审核 */}
              {product.status === 'draft' && (
                <DropdownMenuItem onClick={() => onChangeStatus?.(product.id, 'review')}>
                  <Eye className="h-4 w-4" />
                  <span className="ml-2">提交审核</span>
                </DropdownMenuItem>
              )}

              {/* 待审核状态：审核操作 */}
              {product.status === 'review' && (
                <>
                  <DropdownMenuItem onClick={() => onReview?.(product.id, 'approve')}>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="ml-2">通过</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReview?.(product.id, 'reject')}>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="ml-2">拒绝</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReview?.(product.id, 'revision')}>
                    <RotateCcw className="h-4 w-4" />
                    <span className="ml-2">需修改</span>
                  </DropdownMenuItem>
                </>
              )}

              {/* 已通过状态：发布 */}
              {product.status === 'approved' && (
                <DropdownMenuItem onClick={() => onChangeStatus?.(product.id, 'published')}>
                  <Rocket className="h-4 w-4" />
                  <span className="ml-2">发布</span>
                </DropdownMenuItem>
              )}

              {/* 通用操作 */}
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Edit className="h-4 w-4" />
                <span className="ml-2">编辑</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(product.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2">删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
