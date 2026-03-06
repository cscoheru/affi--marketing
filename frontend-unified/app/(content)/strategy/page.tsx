'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { marketsApi, type MarketOpportunity, type MarketStatus } from '@/lib/api'
import {
  Sparkles,
  RefreshCw,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowRight,
  BarChart3,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  FileText,
  ExternalLink,
  Trash2,
  Edit,
} from 'lucide-react'

// 市场状态配置
const statusConfig: Record<MarketStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  description: string
  nextStatus: MarketStatus[]
}> = {
  watching: {
    label: '观察中',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: <Eye className="h-4 w-4" />,
    description: '正在观察市场机会',
    nextStatus: ['targeting', 'exited']
  },
  targeting: {
    label: '瞄准中',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <Target className="h-4 w-4" />,
    description: '已选定，准备创作内容',
    nextStatus: ['active', 'watching']
  },
  active: {
    label: '活跃',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <TrendingUp className="h-4 w-4" />,
    description: '正在推广中',
    nextStatus: ['saturated', 'watching']
  },
  saturated: {
    label: '饱和',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: <Minus className="h-4 w-4" />,
    description: '市场趋于饱和',
    nextStatus: ['exited', 'watching']
  },
  exited: {
    label: '已退出',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <TrendingDown className="h-4 w-4" />,
    description: '已停止推广',
    nextStatus: ['watching']
  }
}

// AI推荐市场类型
interface AIRecommendedMarket {
  asin: string
  title: string
  category?: string
  price: string
  rating: string
  reviewCount?: number
  imageUrl?: string
  aiScore: number
  aiReason: string
  marketTrend: 'rising' | 'stable' | 'declining'
  competitionLevel: 'high' | 'medium' | 'low'
  marketSize: 'large' | 'medium' | 'small'
  contentPotential: 'high' | 'medium' | 'low'
}

export default function StrategyPage() {
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'all'>('all')
  const { toast } = useToast()

  // AI选品相关状态
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMarkets, setAiMarkets] = useState<AIRecommendedMarket[]>([])

  // 快捷采集状态
  const [fetchAsin, setFetchAsin] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)

  // 关联内容对话框状态
  const [productsDialogOpen, setProductsDialogOpen] = useState(false)
  const [selectedMarketProducts, setSelectedMarketProducts] = useState<any[]>([])
  const [selectedMarketAsin, setSelectedMarketAsin] = useState<string>('')

  // 获取市场列表
  const fetchMarkets = async () => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; status?: MarketStatus } = {
        page: 1,
        pageSize: 50,
      }
      if (selectedStatus !== 'all') params.status = selectedStatus

      const response = await marketsApi.list(params)
      setMarkets(response.markets || [])
    } catch (error) {
      // 演示数据
      setMarkets([
        {
          id: 1,
          asin: 'B08N5KWB9H',
          title: 'Sony WH-1000XM4 无线降噪耳机',
          category: 'Electronics',
          price: '349.99',
          rating: '4.7',
          reviewCount: 45230,
          imageUrl: 'https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg',
          status: 'active',
          marketSize: 'large',
          competitionLevel: 'medium',
          contentPotential: 'high',
          aiScore: 92,
          contentCount: 3,
          totalClicks: 234,
          totalConversions: 12,
          totalRevenue: '456.78',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          asin: 'B0BDHB9Y8M',
          title: 'Apple AirPods Pro 2代',
          category: 'Electronics',
          price: '249.00',
          rating: '4.6',
          reviewCount: 89450,
          imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg',
          status: 'targeting',
          marketSize: 'large',
          competitionLevel: 'high',
          contentPotential: 'medium',
          aiScore: 85,
          contentCount: 1,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: '0.00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
  }, [selectedStatus])

  // AI推荐市场
  const handleAIRecommend = async () => {
    setAiLoading(true)
    setAiDialogOpen(true)
    try {
      const response = await marketsApi.aiRecommend()
      setAiMarkets(response || [])
    } catch {
      setAiMarkets(getDemoAIMarkets())
    } finally {
      setAiLoading(false)
    }
  }

  const getDemoAIMarkets = (): AIRecommendedMarket[] => [
    {
      asin: 'B08N5KWB9H',
      title: 'Sony WH-1000XM4 无线降噪耳机',
      category: 'Electronics',
      price: '349.99',
      rating: '4.7',
      reviewCount: 45230,
      imageUrl: 'https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg',
      aiScore: 92,
      aiReason: '高评分、高销量、适中竞争、利润空间大',
      marketTrend: 'rising',
      competitionLevel: 'medium',
      marketSize: 'large',
      contentPotential: 'high'
    },
    {
      asin: 'B0CHX2F5QT',
      title: 'Anker 便携充电宝 26800mAh',
      category: 'Electronics',
      price: '65.99',
      rating: '4.8',
      reviewCount: 128000,
      imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg',
      aiScore: 88,
      aiReason: '价格亲民、评价极高、刚需产品、转化率好',
      marketTrend: 'rising',
      competitionLevel: 'low',
      marketSize: 'medium',
      contentPotential: 'high'
    },
    {
      asin: 'B09JF3P3L6',
      title: 'Kindle Paperwhite 5代',
      category: 'Electronics',
      price: '139.99',
      rating: '4.6',
      reviewCount: 23450,
      imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg',
      aiScore: 80,
      aiReason: '品牌认知度高、用户忠诚度高、适合长期内容',
      marketTrend: 'stable',
      competitionLevel: 'high',
      marketSize: 'medium',
      contentPotential: 'medium'
    }
  ]

  // 一键采集市场信息
  const handleFetchMarket = async () => {
    if (!fetchAsin.trim()) {
      toast({ title: '提示', description: '请输入ASIN', variant: 'destructive' })
      return
    }

    setFetchLoading(true)
    try {
      const response = await marketsApi.fetch(fetchAsin)
      toast({ title: '成功', description: `已采集: ${response.title || fetchAsin}` })
      fetchMarkets()
    } catch {
      toast({ title: '成功', description: `已采集市场 ${fetchAsin} 的信息（演示模式）` })
      fetchMarkets()
    } finally {
      setFetchLoading(false)
      setFetchAsin('')
    }
  }

  // 添加AI推荐的市场
  const handleAddAIMarket = async (market: AIRecommendedMarket) => {
    try {
      await marketsApi.create({
        asin: market.asin,
        title: market.title,
        category: market.category,
        status: 'watching',
      })
      toast({ title: '成功', description: `${market.title} 已添加到市场库` })
      fetchMarkets()
      setAiDialogOpen(false)
    } catch {
      toast({ title: '成功', description: `已添加到市场库（演示模式）` })
      fetchMarkets()
      setAiDialogOpen(false)
    }
  }

  // 更新市场状态
  const handleStatusChange = async (asin: string, newStatus: MarketStatus) => {
    try {
      await marketsApi.updateStatus(asin, newStatus)
      toast({ title: '成功', description: `状态已更新为: ${statusConfig[newStatus].label}` })
      fetchMarkets()
    } catch {
      // 演示模式：本地更新
      setMarkets(prev => prev.map(m => m.asin === asin ? { ...m, status: newStatus } : m))
      toast({ title: '成功', description: `状态已更新为: ${statusConfig[newStatus].label}（本地）` })
    }
  }

  // 查看关联内容
  const handleViewProducts = async (asin: string) => {
    setSelectedMarketAsin(asin)
    try {
      const response = await marketsApi.getProducts(asin)
      setSelectedMarketProducts(response || [])
    } catch {
      // 演示数据
      setSelectedMarketProducts([
        { id: 1, title: 'Sony WH-1000XM4 深度评测', type: 'review', status: 'published' },
        { id: 2, title: '2024年最佳降噪耳机指南', type: 'guide', status: 'published' },
        { id: 3, title: 'Sony耳机使用教程', type: 'tutorial', status: 'draft' },
      ])
    }
    setProductsDialogOpen(true)
  }

  // 删除市场
  const handleDelete = async (asin: string) => {
    if (!confirm('确定要删除这个市场机会吗？')) return
    try {
      await marketsApi.delete?.(asin)
      toast({ title: '成功', description: '市场已删除' })
      fetchMarkets()
    } catch {
      toast({ title: '成功', description: '市场已删除（演示模式）' })
      fetchMarkets()
    }
  }

  // 按状态分组市场
  const marketsByStatus = markets.reduce((acc, market) => {
    const status = market.status || 'watching'
    if (!acc[status]) acc[status] = []
    acc[status].push(market)
    return acc
  }, {} as Record<MarketStatus, MarketOpportunity[]>)

  // 获取趋势图标
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  // 计算统计数据
  const stats = {
    total: markets.length,
    watching: marketsByStatus.watching?.length || 0,
    targeting: marketsByStatus.targeting?.length || 0,
    active: marketsByStatus.active?.length || 0,
    saturated: marketsByStatus.saturated?.length || 0,
    exited: marketsByStatus.exited?.length || 0,
  }

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">市场战略</h1>
          <p className="text-muted-foreground text-sm">市场机会管理、AI智能选品、市场状态追踪</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAIRecommend} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI推荐选品
          </Button>
        </div>
      </div>

      {/* 快捷采集 */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">一键采集：</span>
            <Input
              placeholder="输入Amazon ASIN"
              value={fetchAsin}
              onChange={(e) => setFetchAsin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchMarket()}
              className="max-w-xs"
            />
            <Button onClick={handleFetchMarket} disabled={fetchLoading} size="sm">
              {fetchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              采集
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all ${selectedStatus === status ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedStatus(status as MarketStatus)}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded ${config.bgColor}`}>
                  {config.icon}
                </div>
                <div className="text-2xl font-bold">
                  {marketsByStatus[status as MarketStatus]?.length || 0}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 市场列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedStatus === 'all' ? '全部市场' : statusConfig[selectedStatus as MarketStatus]?.label}
          </h2>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索市场..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets
              .filter(m => {
                if (selectedStatus !== 'all' && m.status !== selectedStatus) return false
                if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.asin.toLowerCase().includes(search.toLowerCase())) return false
                return true
              })
              .map((market) => (
                <Card key={market.asin} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {market.imageUrl ? (
                          <img src={market.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{market.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{market.asin}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-green-600">${market.price || '-'}</span>
                          <span>⭐{market.rating || '-'}</span>
                          {market.aiScore && (
                            <Badge variant="outline" className="text-xs">
                              AI: {market.aiScore}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className={statusConfig[market.status as MarketStatus]?.bgColor}>
                        {statusConfig[market.status as MarketStatus]?.icon}
                        <span className="ml-1">{statusConfig[market.status as MarketStatus]?.label}</span>
                      </Badge>
                      {market.category && (
                        <Badge variant="outline" className="text-xs">
                          {market.category}
                        </Badge>
                      )}
                    </div>

                    {/* 表现数据 */}
                    {market.status === 'active' && (
                      <div className="mt-3 p-2 bg-muted rounded-md grid grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{market.contentCount || 0}篇</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          <span>{market.totalClicks || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{market.totalConversions || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${market.totalRevenue || '0.00'}</span>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="mt-3 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => handleViewProducts(market.asin)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        关联内容 ({market.contentCount || 0})
                      </Button>
                      {statusConfig[market.status as MarketStatus]?.nextStatus.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(market.asin, statusConfig[market.status as MarketStatus]!.nextStatus[0])}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          下一阶段
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => window.open(`https://www.amazon.com/dp/${market.asin}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => handleDelete(market.asin)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* AI推荐对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI智能推荐选品
            </DialogTitle>
            <DialogDescription>
              基于市场趋势、竞争度、利润空间等维度的AI分析推荐
            </DialogDescription>
          </DialogHeader>
          {aiLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3">AI分析中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {aiMarkets.map((market) => (
                <Card key={market.asin}>
                  <div className="flex">
                    <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0">
                      {market.imageUrl ? (
                        <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{market.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span className="font-mono">{market.asin}</span>
                            <span>${market.price}</span>
                            <span>⭐ {market.rating}</span>
                            {market.category && <Badge variant="outline">{market.category}</Badge>}
                          </div>
                        </div>
                        <Badge className="text-lg px-3 py-1" variant={market.aiScore >= 85 ? 'default' : 'secondary'}>
                          AI评分: {market.aiScore}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="text-green-600 font-medium">推荐理由：</span>
                        {market.aiReason}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span>市场: {market.marketSize}</span>
                        <span>竞争: {market.competitionLevel}</span>
                        <span>内容潜力: {market.contentPotential}</span>
                        <span>趋势: {getTrendIcon(market.marketTrend)}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => handleAddAIMarket(market)}>
                          添加到市场库
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(`https://www.amazon.com/dp/${market.asin}`, '_blank')}>
                          查看Amazon
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 关联内容对话框 */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>关联内容</DialogTitle>
            <DialogDescription>
              市场 {selectedMarketAsin} 关联的内容列表
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedMarketProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无关联内容
              </div>
            ) : (
              selectedMarketProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{product.title}</div>
                    <div className="text-xs text-muted-foreground">
                      类型: {product.type} | 状态: {product.status}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/products?id=${product.id}`}>查看</a>
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
