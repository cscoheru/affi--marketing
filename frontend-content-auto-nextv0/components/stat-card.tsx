'use client'

import { TrendingUp, TrendingDown, DollarSign, Eye, Percent, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsOverview } from '@/lib/types'

export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  prefix = '',
  suffix = '',
}: {
  title: string
  value: string | number
  trend?: number
  icon: typeof DollarSign
  prefix?: string
  suffix?: string
}) {
  const isPositive = trend && trend > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {trend !== undefined && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            <span>{isPositive ? '+' : ''}{trend}% 较上期</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsOverview({ data }: { data: AnalyticsOverview }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="总收入"
        value={data.totalRevenue.toFixed(2)}
        trend={data.revenueTrend}
        icon={DollarSign}
        prefix="$"
      />
      <StatCard
        title="总阅读量"
        value={data.totalViews}
        trend={data.viewsTrend}
        icon={Eye}
      />
      <StatCard
        title="转化率"
        value={data.conversionRate}
        trend={data.conversionTrend}
        icon={Percent}
        suffix="%"
      />
      <StatCard
        title="已发布内容"
        value={data.publishedCount}
        trend={data.publishedTrend}
        icon={FileText}
        suffix=" 篇"
      />
    </div>
  )
}
