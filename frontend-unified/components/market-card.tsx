'use client'

import { MarketOpportunity, MarketStatus } from '@/lib/api'
import { formatCurrency, formatRating, formatNumber } from '@/lib/utils/format'
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
  Package,
  MoreVertical,
  Eye,
  Target,
  Rocket,
  AlertTriangle,
  Archive,
  FileText,
  MousePointer,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react'

interface MarketCardProps {
  market: MarketOpportunity
  onViewDetails?: (market: MarketOpportunity) => void
  onChangeStatus?: (asin: string, status: MarketStatus) => void
  onEdit?: (market: MarketOpportunity) => void
  onDelete?: (asin: string) => void
  onRefresh?: (asin: string) => void
}

const statusConfig: Record<MarketStatus, { label: string; color: string; icon: React.ReactNode; nextStatuses: MarketStatus[] }> = {
  watching: {
    label: '观察中',
    color: 'bg-slate-500',
    icon: <Eye className="h-3 w-3" />,
    nextStatuses: ['targeting', 'exited'],
  },
  targeting: {
    label: '瞄准中',
    color: 'bg-yellow-500',
    icon: <Target className="h-3 w-3" />,
    nextStatuses: ['active', 'watching', 'exited'],
  },
  active: {
    label: '活跃市场',
    color: 'bg-green-500',
    icon: <Rocket className="h-3 w-3" />,
    nextStatuses: ['saturated', 'exited'],
  },
  saturated: {
    label: '已饱和',
    color: 'bg-orange-500',
    icon: <AlertTriangle className="h-3 w-3" />,
    nextStatuses: ['exited'],
  },
  exited: {
    label: '已退出',
    color: 'bg-gray-500',
    icon: <Archive className="h-3 w-3" />,
    nextStatuses: ['watching'],
  },
}

export function MarketCard({
  market,
  onViewDetails,
  onChangeStatus,
  onEdit,
  onDelete,
  onRefresh,
}: MarketCardProps) {
  const config = statusConfig[market.status]

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-3">
        {/* 头部：图片 + 基本信息 */}
        <div className="flex gap-3" onClick={() => onViewDetails?.(market)}>
          {/* 产品图片 */}
          <div className="w-14 h-14 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
            {market.imageUrl ? (
              <img
                src={market.imageUrl}
                alt={market.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate" title={market.title}>
              {market.title}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {market.asin}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-600 font-medium">
                {formatCurrency(market.price)}
              </span>
              {market.rating && (
                <span className="flex items-center gap-0.5">
                  <span>⭐</span>
                  <span>{formatRating(market.rating)}</span>
                </span>
              )}
              {market.reviewCount && (
                <span className="text-muted-foreground">
                  ({formatNumber(market.reviewCount)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 活跃市场显示表现数据 */}
        {market.status === 'active' && (
          <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{market.contentCount} 篇内容</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MousePointer className="h-3 w-3" />
              <span>{formatNumber(market.totalClicks)} 点击</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{formatNumber(market.totalConversions)} 转化</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(market.totalRevenue)}</span>
            </div>
          </div>
        )}

        {/* AI 评分标签 */}
        {market.aiScore !== undefined && market.aiScore > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              AI 评分: {market.aiScore}
            </Badge>
            {market.marketSize && (
              <Badge variant="secondary" className="text-xs">
                {market.marketSize === 'large' ? '大市场' : market.marketSize === 'medium' ? '中市场' : '小市场'}
              </Badge>
            )}
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
              {/* 状态转换选项 */}
              {config.nextStatuses.map((nextStatus) => (
                <DropdownMenuItem
                  key={nextStatus}
                  onClick={() => onChangeStatus?.(market.asin, nextStatus)}
                >
                  {statusConfig[nextStatus].icon}
                  <span className="ml-2">转为 {statusConfig[nextStatus].label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => onEdit?.(market)}>
                <Edit className="h-4 w-4" />
                <span className="ml-2">编辑</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRefresh?.(market.asin)}>
                <RefreshCw className="h-4 w-4" />
                <span className="ml-2">刷新数据</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(market.asin)}
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
