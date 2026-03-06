'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { analyticsApi, type AnalyticsOverview, type ContentPerformance, type AnalyticsTrend } from '@/lib/api'
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Target,
  FileText,
  BarChart3,
  Download,
  Calendar,
  Trophy,
  Globe,
  Eye,
} from 'lucide-react'

// 时间范围选项
const timeRanges = [
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: 'all', label: '全部时间' },
]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const { toast } = useToast()

  // 数据状态
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([])
  const [trends, setTrends] = useState<AnalyticsTrend[]>([])
  const [marketPerformance, setMarketPerformance] = useState<any[]>([])
  const [platformPerformance, setPlatformPerformance] = useState<any[]>([])

  // 获取总览数据
  const fetchOverview = async () => {
    try {
      const response = await analyticsApi.overview()
      setOverview(response)
    } catch {
      // 演示数据
      setOverview({
        totalClicks: 1234,
        totalConversions: 45,
        totalRevenue: '567.89',
        conversionRate: '3.6',
        totalContent: 26,
        activeMarkets: 8,
        pendingReview: 3,
      })
    }
  }

  // 获取内容表现
  const fetchContentPerformance = async () => {
    try {
      const response = await analyticsApi.products()
      setContentPerformance(response || [])
    } catch {
      // 演示数据
      setContentPerformance([
        {
          productId: 1,
          productTitle: 'Sony WH-1000XM4 深度评测',
          views: 1234,
          clicks: 89,
          conversions: 5,
          revenue: '125.50',
          conversionRate: '5.6',
        },
        {
          productId: 2,
          productTitle: '2024年最佳降噪耳机指南',
          views: 2345,
          clicks: 156,
          conversions: 8,
          revenue: '234.56',
          conversionRate: '5.1',
        },
        {
          productId: 3,
          productTitle: 'Anker充电宝评测',
          views: 987,
          clicks: 45,
          conversions: 3,
          revenue: '45.20',
          conversionRate: '6.7',
        },
      ])
    }
  }

  // 获取趋势数据
  const fetchTrends = async () => {
    try {
      const response = await analyticsApi.trends({
        startDate: getStartDate(),
        endDate: new Date().toISOString(),
      })
      setTrends(response.trends || [])
    } catch {
      // 演示数据
      const demoTrends: AnalyticsTrend[] = []
      const now = new Date()
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        demoTrends.push({
          date: date.toISOString().split('T')[0],
          clicks: Math.floor(Math.random() * 100) + 20,
          conversions: Math.floor(Math.random() * 10) + 1,
          revenue: (Math.random() * 50 + 10).toFixed(2),
        })
      }
      setTrends(demoTrends)
    }
  }

  // 获取市场表现（演示数据）
  const fetchMarketPerformance = async () => {
    // 后端暂未实现，使用演示数据
    setMarketPerformance([
      {
        asin: 'B08N5KWB9H',
        title: 'Sony WH-1000XM4',
        clicks: 234,
        conversions: 12,
        revenue: '456.78',
        contentCount: 3,
      },
      {
        asin: 'B0BDHB9Y8M',
        title: 'Apple AirPods Pro 2',
        clicks: 156,
        conversions: 8,
        revenue: '234.56',
        contentCount: 2,
      },
      {
        asin: 'B0CHX2F5QT',
        title: 'Anker 充电宝',
        clicks: 89,
        conversions: 5,
        revenue: '89.34',
        contentCount: 1,
      },
    ])
  }

  // 获取平台表现（演示数据）
  const fetchPlatformPerformance = async () => {
    // 后端暂未实现，使用演示数据
    setPlatformPerformance([
      {
        name: 'Medium',
        published: 12,
        views: 3456,
        clicks: 234,
        conversions: 8,
        revenue: '456.78',
      },
      {
        name: 'Blogger',
        published: 15,
        views: 2345,
        clicks: 156,
        conversions: 12,
        revenue: '567.89',
      },
      {
        name: 'WordPress',
        published: 3,
        views: 567,
        clicks: 23,
        conversions: 1,
        revenue: '45.20',
      },
    ])
  }

  // 获取开始日期
  const getStartDate = () => {
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const date = new Date(now)
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }

  // 刷新所有数据
  const refreshAll = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchOverview(),
        fetchContentPerformance(),
        fetchTrends(),
        fetchMarketPerformance(),
        fetchPlatformPerformance(),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [timeRange])

  // 计算变化趋势
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    }
  }

  // 简单趋势图（使用CSS绘制）
  const SimpleTrendChart = ({ data, valueKey, color }: { data: AnalyticsTrend[], valueKey: 'clicks' | 'conversions' | 'revenue', color: string }) => {
    const maxValue = Math.max(...data.map(d => Number(d[valueKey])))
    const minValue = Math.min(...data.map(d => Number(d[valueKey])))
    const range = maxValue - minValue || 1

    return (
      <div className="h-32 flex items-end gap-1">
        {data.map((item, index) => {
          const value = Number(item[valueKey])
          const height = ((value - minValue) / range) * 100
          return (
            <div
              key={index}
              className="flex-1 rounded-t transition-all hover:opacity-80"
              style={{
                height: `${Math.max(height, 5)}%`,
                backgroundColor: color,
              }}
              title={`${item.date}: ${value}`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">数据分析</h1>
          <p className="text-muted-foreground text-sm">点击追踪、转化统计、收益分析、表现排名</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshAll} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            刷新
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 总览指标 */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总点击</p>
                  <p className="text-2xl font-bold">{overview.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MousePointerClick className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs 上期
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总转化</p>
                  <p className="text-2xl font-bold">{overview.totalConversions}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% vs 上期
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">转化率</p>
                  <p className="text-2xl font-bold">{overview.conversionRate}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.5% vs 上期
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总收益</p>
                  <p className="text-2xl font-bold">${overview.totalRevenue}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% vs 上期
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>趋势分析</CardTitle>
          <CardDescription>点击、转化、收益的每日趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clicks">
            <TabsList>
              <TabsTrigger value="clicks">点击趋势</TabsTrigger>
              <TabsTrigger value="conversions">转化趋势</TabsTrigger>
              <TabsTrigger value="revenue">收益趋势</TabsTrigger>
            </TabsList>
            <TabsContent value="clicks">
              <div>
                <p className="text-sm text-muted-foreground mb-4">过去30天的点击量变化</p>
                <SimpleTrendChart data={trends} valueKey="clicks" color="#3b82f6" />
              </div>
            </TabsContent>
            <TabsContent value="conversions">
              <div>
                <p className="text-sm text-muted-foreground mb-4">过去30天的转化量变化</p>
                <SimpleTrendChart data={trends} valueKey="conversions" color="#22c55e" />
              </div>
            </TabsContent>
            <TabsContent value="revenue">
              <div>
                <p className="text-sm text-muted-foreground mb-4">过去30天的收益变化</p>
                <SimpleTrendChart data={trends} valueKey="revenue" color="#eab308" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 表现排名 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最佳内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              最佳内容（转化）
            </CardTitle>
            <CardDescription>按转化数排序</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentPerformance.slice(0, 5).map((content, index) => (
                <div key={content.productId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{content.productTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {content.views} 浏览 · {content.clicks} 点击 · {content.conversions} 转化
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">${content.revenue}</div>
                    <div className="text-xs text-muted-foreground">{content.conversionRate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最佳市场 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-500" />
              最佳市场（转化）
            </CardTitle>
            <CardDescription>按总收益排序</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketPerformance.slice(0, 5).map((market, index) => (
                <div key={market.asin} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{market.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{market.asin}</div>
                    <div className="text-xs text-muted-foreground">
                      {market.clicks} 点击 · {market.conversions} 转化 · {market.contentCount} 篇内容
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">${market.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最佳渠道 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              最佳渠道
            </CardTitle>
            <CardDescription>按总收益排序</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platformPerformance.map((platform, index) => (
                <div key={platform.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{platform.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {platform.published} 篇发布 · {platform.views} 浏览 · {platform.clicks} 点击
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">${platform.revenue}</div>
                    <div className="text-xs text-muted-foreground">{platform.conversions} 转化</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据表 */}
      <Card>
        <CardHeader>
          <CardTitle>内容表现详情</CardTitle>
          <CardDescription>所有内容的详细表现数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">内容标题</th>
                  <th className="text-right py-3 px-4 font-medium">浏览</th>
                  <th className="text-right py-3 px-4 font-medium">点击</th>
                  <th className="text-right py-3 px-4 font-medium">转化</th>
                  <th className="text-right py-3 px-4 font-medium">转化率</th>
                  <th className="text-right py-3 px-4 font-medium">收益</th>
                </tr>
              </thead>
              <tbody>
                {contentPerformance.map((content) => (
                  <tr key={content.productId} className="border-b hover:bg-muted">
                    <td className="py-3 px-4">{content.productTitle}</td>
                    <td className="text-right py-3 px-4">{content.views.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{content.clicks}</td>
                    <td className="text-right py-3 px-4">{content.conversions}</td>
                    <td className="text-right py-3 px-4">{content.conversionRate}%</td>
                    <td className="text-right py-3 px-4 font-bold text-green-600">${content.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
