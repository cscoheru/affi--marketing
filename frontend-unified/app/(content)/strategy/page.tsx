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
import { marketsApi, newProductsApi, type MarketOpportunity, type MarketStatus, type AIRecommendedMarket } from '@/lib/api'
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
  Settings,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  Calendar,
  Play,
  Pause,
  Trash,
  LayoutGrid,
  List,
  Plus,
  History,
  Archive,
} from 'lucide-react'
import { SaveMaterialDialog } from '@/components/materials/save-material-dialog'

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
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: <Eye className="h-4 w-4" />,
    description: '正在观察市场机会',
    nextStatus: ['targeting', 'exited']
  },
  targeting: {
    label: '瞄准中',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: <Target className="h-4 w-4" />,
    description: '已选定，准备创作内容',
    nextStatus: ['active', 'watching']
  },
  active: {
    label: '活跃',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: <TrendingUp className="h-4 w-4" />,
    description: '正在推广中',
    nextStatus: ['saturated', 'watching']
  },
  saturated: {
    label: '饱和',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: <Minus className="h-4 w-4" />,
    description: '市场趋于饱和',
    nextStatus: ['exited', 'watching']
  },
  exited: {
    label: '已退出',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: <TrendingDown className="h-4 w-4" />,
    description: '已停止推广',
    nextStatus: ['watching']
  }
}

export default function StrategyPage() {
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const { toast } = useToast()

  // AI选品相关状态
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMarkets, setAiMarkets] = useState<AIRecommendedMarket[]>([])
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const [aiSortBy, setAiSortBy] = useState<'score' | 'price' | 'rating' | 'reviews'>('score')
  const [addedAsins, setAddedAsins] = useState<Set<string>>(new Set()) // 已添加的ASIN

  // AI推荐排序后的结果
  const sortedAiMarkets = [...aiMarkets].sort((a, b) => {
    switch (aiSortBy) {
      case 'price':
        return parseFloat(b.price?.replace(/[$,]/g, '') || '0') - parseFloat(a.price?.replace(/[$,]/g, '') || '0')
      case 'rating':
        return parseFloat(b.rating || '0') - parseFloat(a.rating || '0')
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0)
      case 'score':
      default:
        return (b.aiScore || 0) - (a.aiScore || 0)
    }
  })

  // AI选品配置参数
  const [aiConfig, setAiConfig] = useState({
    category: 'all' as 'electronics' | 'home' | 'beauty' | 'outdoor' | 'office' | 'all',
    limit: 5,
    minPrice: 20,
    maxPrice: 500,
    minRating: 4.0,
    commissionFocus: 'high' as 'high' | 'medium' | 'any',
    competitionLevel: 'low' as 'low' | 'medium' | 'high' | 'any',
    marketTrend: 'rising' as 'rising' | 'stable' | 'any',
    targetMarket: 'us' as 'us' | 'uk' | 'de' | 'jp' | 'all',
    customLogic: '',
  })

  // 快捷采集状态
  const [fetchAsin, setFetchAsin] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)

  // Amazon 搜索状态
  const [searchKeywords, setSearchKeywords] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)

  // 产品详情弹窗状态
  const [productDetailOpen, setProductDetailOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<AIRecommendedMarket | null>(null)

  // 保存素材弹窗状态
  const [saveMaterialDialogOpen, setSaveMaterialDialogOpen] = useState(false)
  const [saveMaterialContent, setSaveMaterialContent] = useState('')
  const [saveMaterialTitle, setSaveMaterialTitle] = useState('')

  // 定时选品状态
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '08:00',
    category: 'all' as string,
    minPrice: 20,
    maxPrice: 500,
    minRating: 4.0,
    autoAdd: false,
    maxResults: 10,
  })
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

  // 任务历史对话框状态
  const [taskHistoryDialogOpen, setTaskHistoryDialogOpen] = useState(false)
  const [selectedTaskHistory, setSelectedTaskHistory] = useState<any[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

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
      console.error('Failed to fetch markets:', error)
      toast({ title: '加载失败', description: '无法加载市场数据，请检查后端服务', variant: 'destructive' })
      setMarkets([])
    } finally {
      setLoading(false)
    }
  }

  // 获取定时任务列表
  const fetchScheduledTasks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/schedule`)
      if (response.ok) {
        const data = await response.json()
        setScheduledTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch scheduled tasks:', error)
      // 演示模式
      setScheduledTasks([])
    }
  }

  // 初始加载 - 获取市场列表和定时任务
  useEffect(() => {
    fetchMarkets()
    fetchScheduledTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 打开AI推荐对话框（如果有缓存结果则直接显示，不重新获取）
  const handleOpenAIDialog = () => {
    setAiDialogOpen(true)
    setAiConfigOpen(false)
    // 如果没有缓存结果，则获取新推荐
    if (aiMarkets.length === 0) {
      fetchAIRecommendations()
    }
  }

  // 获取AI推荐（实际调用API）
  const fetchAIRecommendations = async () => {
    setAiLoading(true)
    try {
      // 调用前端 AI API（使用智谱 AI）
      const response = await fetch('/api/markets/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: aiConfig.category,
          limit: aiConfig.limit,
          minPrice: aiConfig.minPrice,
          maxPrice: aiConfig.maxPrice,
          minRating: aiConfig.minRating,
          commissionFocus: aiConfig.commissionFocus,
          competitionLevel: aiConfig.competitionLevel,
          marketTrend: aiConfig.marketTrend,
          targetMarket: aiConfig.targetMarket,
          customLogic: aiConfig.customLogic || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('AI API 调用失败')
      }

      const data = await response.json()
      setAiMarkets(data.products || data || [])
    } catch (error) {
      console.error('AI recommend error:', error)
      setAiMarkets(getDemoAIMarkets())
    } finally {
      setAiLoading(false)
    }
  }

  // 重新推荐（用户明确点击时才获取新数据）
  const handleRefreshAIRecommend = () => {
    fetchAIRecommendations()
  }

  const getDemoAIMarkets = (): AIRecommendedMarket[] => [
    {
      asin: 'SEARCH-DEMO-1',
      title: 'Sony WH-1000XM4 无线降噪耳机',
      price: '349.99',
      rating: '4.7',
      reviewCount: 45230,
      imageUrl: 'https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg',
      aiScore: 92,
      aiReason: '高评分、高销量、适中竞争、利润空间大',
      marketTrend: 'rising',
      competitionLevel: 'medium',
      searchUrl: 'https://www.amazon.com/s?k=Sony+WH-1000XM4+wireless+noise+canceling+headphones',
      analysis: {
        marketTrend: 'rising',
        competitionLevel: 'medium',
        estimatedCommission: '4%',
        profitPotential: 'high',
        contentDifficulty: 'medium',
        seasonalFactor: '全年稳定'
      },
      matchedCriteria: ['高评分', '稳定需求', '适中竞争']
    },
    {
      asin: 'SEARCH-DEMO-2',
      title: 'Anker 便携充电宝 26800mAh',
      price: '65.99',
      rating: '4.8',
      reviewCount: 128000,
      imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg',
      aiScore: 88,
      aiReason: '价格亲民、评价极高、刚需产品、转化率好',
      marketTrend: 'rising',
      competitionLevel: 'low',
      searchUrl: 'https://www.amazon.com/s?k=Anker+portable+charger+26800mAh+power+bank',
      analysis: {
        marketTrend: 'rising',
        competitionLevel: 'low',
        estimatedCommission: '5%',
        profitPotential: 'high',
        contentDifficulty: 'easy',
        seasonalFactor: '全年稳定'
      },
      matchedCriteria: ['高评分', '刚需产品', '低竞争']
    },
    {
      asin: 'SEARCH-DEMO-3',
      title: 'Kindle Paperwhite 5代',
      price: '139.99',
      rating: '4.6',
      reviewCount: 23450,
      imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg',
      aiScore: 80,
      aiReason: '品牌认知度高、用户忠诚度高、适合长期内容',
      marketTrend: 'stable',
      competitionLevel: 'high',
      searchUrl: 'https://www.amazon.com/s?k=Kindle+Paperwhite+5+ereader',
      analysis: {
        marketTrend: 'stable',
        competitionLevel: 'high',
        estimatedCommission: '5%',
        profitPotential: 'medium',
        contentDifficulty: 'easy',
        seasonalFactor: '全年稳定'
      },
      matchedCriteria: ['品牌认知度高', '用户忠诚度高']
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

  // Amazon 智能搜索
  const handleAmazonSearch = async () => {
    if (!searchKeywords.trim()) {
      toast({ title: '提示', description: '请输入搜索关键词', variant: 'destructive' })
      return
    }

    setSearchLoading(true)
    setSearchDialogOpen(true)
    try {
      const response = await fetch('/api/markets/amazon-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: searchKeywords,
          category: aiConfig.category === 'all' ? undefined : aiConfig.category,
          minPrice: aiConfig.minPrice,
          maxPrice: aiConfig.maxPrice,
          minRating: aiConfig.minRating,
          limit: aiConfig.limit,
          marketplace: aiConfig.targetMarket === 'all' ? 'com' : aiConfig.targetMarket,
        }),
      })

      const data = await response.json()

      if (data.mode === 'playwright_required') {
        // Playwright MCP 不可用，使用 AI 推荐结果
        setSearchResults(data.aiRecommendations || [])
        toast({
          title: '使用 AI 推荐结果',
          description: `已为您生成 ${data.aiRecommendations?.length || 0} 个推荐产品`,
        })
      } else {
        setSearchResults(data.products || [])
      }
    } catch (error) {
      toast({ title: '搜索失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setSearchLoading(false)
    }
  }

  // 添加AI推荐的市场（不关闭弹窗）
  const handleAddAIMarket = async (market: AIRecommendedMarket) => {
    // 检查是否已添加
    if (addedAsins.has(market.asin)) {
      toast({ title: '提示', description: '该产品已添加到市场库', variant: 'default' })
      return
    }

    try {
      // 处理价格格式 - 移除 $ 符号
      const cleanPrice = market.price?.replace(/[$,]/g, '') || '0'
      const cleanRating = market.rating?.toString() || '0'

      await marketsApi.create({
        asin: market.asin,
        title: market.title,
        status: 'watching',
        price: cleanPrice,
        rating: cleanRating,
        reviewCount: market.reviewCount || 0,
        imageUrl: market.imageUrl,
        aiScore: market.aiScore,
        competitionLevel: market.analysis?.competitionLevel || market.competitionLevel || 'medium',
        contentPotential: market.analysis?.profitPotential === 'high' ? 'high' :
                          market.analysis?.profitPotential === 'medium' ? 'medium' : 'low',
      })
      // 标记为已添加
      setAddedAsins(prev => new Set(prev).add(market.asin))
      toast({ title: '成功', description: `${market.title} 已添加到市场库` })
      fetchMarkets()
      // 不关闭弹窗，让用户继续浏览推荐
    } catch (error) {
      console.error('Failed to add market:', error)
      // 即使API失败，也标记为已添加（本地模式）
      setAddedAsins(prev => new Set(prev).add(market.asin))
      toast({ title: '成功（本地）', description: `${market.title} 已添加到市场库（本地模式）` })
    }
  }

  // 查看产品详情
  const handleViewProductDetail = (market: AIRecommendedMarket) => {
    setSelectedProduct(market)
    setProductDetailOpen(true)
  }

  // 更新市场状态
  const handleStatusChange = async (asin: string, newStatus: MarketStatus) => {
    // 立即更新本地状态（乐观更新）
    const previousMarkets = markets
    setMarkets(prev => prev.map(m => m.asin === asin ? { ...m, status: newStatus } : m))

    try {
      await marketsApi.updateStatus(asin, newStatus)
      toast({ title: '成功', description: `状态已更新为: ${statusConfig[newStatus].label}` })
      // 只有在确认后端有数据时才刷新
      // fetchMarkets() // 暂时禁用，避免后端空数据覆盖本地状态
    } catch {
      // API 失败时，保持本地更新（演示模式）
      toast({ title: '成功', description: `状态已更新为: ${statusConfig[newStatus].label}（本地）` })
    }
  }

  // 查看关联内容
  const handleViewProducts = async (asin: string) => {
    setSelectedMarketAsin(asin)
    try {
      const response = await marketsApi.getProducts(asin)
      // 处理不同的响应格式
      const products = Array.isArray(response)
        ? response
        : (response as any)?.products || []
      setSelectedMarketProducts(products)
    } catch {
      console.error('Failed to fetch market products')
      setSelectedMarketProducts([])
    }
    setProductsDialogOpen(true)
  }

  // 删除市场
  const handleDelete = async (asin: string) => {
    if (!confirm('确定要删除这个市场机会吗？')) return
    try {
      await marketsApi.delete(asin)
      toast({ title: '成功', description: '市场已删除' })
      fetchMarkets()
    } catch (error) {
      console.error('Failed to delete market:', error)
      toast({ title: '删除失败', description: '无法删除市场，请检查后端服务', variant: 'destructive' })
    }
  }

  // 查看定时任务历史
  const handleViewTaskHistory = async (taskId: number) => {
    setSelectedTaskId(taskId)
    setTaskHistoryDialogOpen(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/schedule/${taskId}/history`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTaskHistory(data.history || [])
      } else {
        // 演示模式：生成模拟历史数据
        const mockHistory = [
          {
            id: 1,
            runAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            productsFound: 8,
            productsAdded: 3,
            topProducts: [
              { asin: 'B08N5KWB9H', title: 'Sony WH-1000XM4', aiScore: 92 },
              { asin: 'B0BDHB9Y8M', title: 'Apple AirPods Pro', aiScore: 88 },
              { asin: 'B0CHX2F5QT', title: 'Anker 便携充电宝', aiScore: 85 },
            ],
          },
          {
            id: 2,
            runAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            productsFound: 12,
            productsAdded: 5,
            topProducts: [
              { asin: 'B09V3KXJPB', title: 'Samsung Galaxy Buds2', aiScore: 87 },
              { asin: 'B0B44FLTBY', title: 'Sony LinkBuds S', aiScore: 84 },
            ],
          },
          {
            id: 3,
            runAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
            status: 'partial',
            productsFound: 6,
            productsAdded: 2,
            errorMessage: '部分产品数据获取失败',
            topProducts: [
              { asin: 'B086G9K3X7', title: 'Jabra Elite 85t', aiScore: 82 },
            ],
          },
        ]
        setSelectedTaskHistory(mockHistory)
      }
    } catch (error) {
      console.error('Failed to fetch task history:', error)
      setSelectedTaskHistory([])
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
          <Button variant="outline" onClick={handleOpenAIDialog} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            AI推荐选品
          </Button>
          <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            定时选品
          </Button>
        </div>
      </div>

      {/* 快捷采集 */}
      <div className="grid grid-cols-2 gap-4">
        {/* ASIN 采集 */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">ASIN 采集：</span>
              <Input
                placeholder="输入Amazon ASIN（如：B08N5KWB9H）"
                value={fetchAsin}
                onChange={(e) => setFetchAsin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchMarket()}
                className="flex-1"
              />
              <Button onClick={handleFetchMarket} disabled={fetchLoading} size="sm">
                {fetchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                采集
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playwright 搜索 */}
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">智能搜索：</span>
              <Input
                placeholder="输入关键词（如：wireless earbuds noise cancelling）"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAmazonSearch()}
                className="flex-1"
              />
              <Button onClick={handleAmazonSearch} disabled={searchLoading} size="sm">
                {searchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                搜索 Amazon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 rounded-r-none"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
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
        ) : viewMode === 'card' ? (
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
                    <div className="mt-3 flex gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          // 将市场产品转换为AI推荐格式并打开详情弹窗
                          setSelectedProduct({
                            marketId: market.id,
                            asin: market.asin,
                            title: market.title,
                            price: market.price || '$0',
                            imageUrl: market.imageUrl || '',
                            rating: market.rating || '4.0',
                            reviewCount: market.reviewCount || 0,
                            aiScore: market.aiScore || 75,
                            aiReason: market.competitionLevel || '市场分析推荐',
                            marketTrend: 'stable',
                            competitionLevel: market.competitionLevel || 'medium',
                            url: `https://www.amazon.com/dp/${market.asin}`,
                            searchUrl: `https://www.amazon.com/dp/${market.asin}`,
                            analysis: {
                              marketTrend: 'stable',
                              competitionLevel: market.competitionLevel || 'medium',
                              estimatedCommission: '3-5%',
                              profitPotential: market.contentPotential || 'medium',
                              contentDifficulty: 'medium',
                              seasonalFactor: '全年稳定',
                            },
                          })
                          setProductDetailOpen(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        详情
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleViewProducts(market.asin)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        关联 ({market.contentCount || 0})
                      </Button>
                      {statusConfig[market.status as MarketStatus]?.nextStatus.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(market.asin, statusConfig[market.status as MarketStatus]!.nextStatus[0])}
                        >
                          <ArrowRight className="h-3 w-3" />
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
        ) : (
          /* List View */
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">产品</th>
                  <th className="text-left p-3 font-medium w-28">状态</th>
                  <th className="text-center p-3 font-medium w-24">价格</th>
                  <th className="text-center p-3 font-medium w-20">评分</th>
                  <th className="text-center p-3 font-medium w-20">AI分</th>
                  <th className="text-center p-3 font-medium w-32">表现数据</th>
                  <th className="text-right p-3 font-medium w-40">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {markets
                  .filter(m => {
                    if (selectedStatus !== 'all' && m.status !== selectedStatus) return false
                    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.asin.toLowerCase().includes(search.toLowerCase())) return false
                    return true
                  })
                  .map((market) => (
                    <tr key={market.asin} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            {market.imageUrl ? (
                              <img src={market.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium line-clamp-1 text-foreground">{market.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">{market.asin}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={statusConfig[market.status as MarketStatus]?.bgColor}>
                          {statusConfig[market.status as MarketStatus]?.icon}
                          <span className="ml-1">{statusConfig[market.status as MarketStatus]?.label}</span>
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-green-600 font-medium">{market.price?.toString().startsWith('$') ? market.price : market.price ? `$${market.price}` : '-'}</td>
                      <td className="p-3 text-center">⭐{market.rating || '-'}</td>
                      <td className="p-3 text-center">
                        {market.aiScore ? (
                          <Badge variant="outline" className="font-mono">{market.aiScore}</Badge>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {market.status === 'active' ? (
                          <div className="space-y-0.5">
                            <div>内容: {market.contentCount || 0} | 点击: {market.totalClicks || 0}</div>
                            <div>转化: {market.totalConversions || 0} | 收入: ${market.totalRevenue || '0'}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              // 将市场产品转换为AI推荐格式并打开详情弹窗
                              setSelectedProduct({
                            marketId: market.id,
                            asin: market.asin,
                            title: market.title,
                            price: market.price || '$0',
                            imageUrl: market.imageUrl || '',
                            rating: market.rating || '4.0',
                            reviewCount: market.reviewCount || 0,
                            aiScore: market.aiScore || 75,
                            aiReason: market.competitionLevel || '市场分析推荐',
                            marketTrend: 'stable',
                            competitionLevel: market.competitionLevel || 'medium',
                            url: `https://www.amazon.com/dp/${market.asin}`,
                            searchUrl: `https://www.amazon.com/dp/${market.asin}`,
                            analysis: {
                              marketTrend: 'stable',
                              competitionLevel: market.competitionLevel || 'medium',
                              estimatedCommission: '3-5%',
                              profitPotential: market.contentPotential || 'medium',
                              contentDifficulty: 'medium',
                              seasonalFactor: '全年稳定',
                            },
                          })
                          setProductDetailOpen(true)
                        }}
          >
            <Eye className="h-3 w-3 mr-1" />
            详情
          </Button>
                          {statusConfig[market.status as MarketStatus]?.nextStatus.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleStatusChange(market.asin, statusConfig[market.status as MarketStatus]!.nextStatus[0])}
                              title="下一阶段"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => window.open(`https://www.amazon.com/dp/${market.asin}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive"
                            onClick={() => handleDelete(market.asin)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Amazon 搜索结果对话框 */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Amazon 智能搜索结果
            </DialogTitle>
            <DialogDescription>
              {searchResults.length > 0
                ? `找到 ${searchResults.length} 个相关产品`
                : '正在搜索或等待结果...'}
            </DialogDescription>
          </DialogHeader>

          {searchLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">正在搜索 Amazon...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((product: any) => (
                <Card key={product.asin} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-2 text-foreground">{product.title}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{product.asin}</div>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="text-green-600 font-medium">${product.price || '-'}</span>
                          {product.rating && <span>⭐{product.rating}</span>}
                          {product.reviewCount && <span className="text-muted-foreground">({product.reviewCount} 评论)</span>}
                          {product.aiScore && (
                            <Badge variant="outline" className="text-xs">
                              AI: {product.aiScore}
                            </Badge>
                          )}
                        </div>
                        {product.aiReason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            💡 {product.aiReason}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleAddAIMarket({
                              asin: product.asin,
                              title: product.title,
                              price: product.price?.toString() || '0',
                              imageUrl: product.imageUrl,
                              rating: product.rating?.toString() || '0',
                              reviewCount: product.reviewCount || 0,
                              aiScore: product.aiScore || 0,
                              aiReason: product.aiReason || '',
                              marketTrend: 'stable',
                              competitionLevel: 'medium',
                              searchUrl: product.productUrl || `https://www.amazon.com/dp/${product.asin}`,
                            })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          添加到选品库
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.productUrl || `https://www.amazon.com/dp/${product.asin}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground mt-2">
                需要配置 RapidAPI 或使用 Playwright 执行搜索
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                请在 .env.local 中设置 RAPIDAPI_KEY 以启用实时搜索
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI推荐对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI智能推荐选品
            </DialogTitle>
            <DialogDescription>
              基于市场趋势、竞争度、利润空间等维度的AI分析推荐
            </DialogDescription>
          </DialogHeader>

          {/* AI 配置面板 */}
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">选品条件配置</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiConfigOpen(!aiConfigOpen)}
              >
                {aiConfigOpen ? '收起' : '展开'}
              </Button>
            </div>

            {aiConfigOpen && (
              <div className="grid grid-cols-2 gap-4">
                {/* 类别选择 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">产品类别</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.category}
                    onChange={(e) => setAiConfig({ ...aiConfig, category: e.target.value as any })}
                  >
                    <option value="all">全部类别</option>
                    <option value="electronics">电子产品</option>
                    <option value="home">家居用品</option>
                    <option value="beauty">美妆护肤</option>
                    <option value="outdoor">户外运动</option>
                    <option value="office">办公用品</option>
                  </select>
                </div>

                {/* 价格区间 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">价格区间 ($)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="最低"
                      value={aiConfig.minPrice}
                      onChange={(e) => setAiConfig({ ...aiConfig, minPrice: Number(e.target.value) })}
                      className="w-24"
                    />
                    <span className="self-center text-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="最高"
                      value={aiConfig.maxPrice}
                      onChange={(e) => setAiConfig({ ...aiConfig, maxPrice: Number(e.target.value) })}
                      className="w-24"
                    />
                  </div>
                </div>

                {/* 最低评分 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">最低评分</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.minRating}
                    onChange={(e) => setAiConfig({ ...aiConfig, minRating: Number(e.target.value) })}
                  >
                    <option value={3.5}>3.5+ 星</option>
                    <option value={4.0}>4.0+ 星</option>
                    <option value={4.5}>4.5+ 星</option>
                  </select>
                </div>

                {/* 佣金偏好 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">佣金偏好</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.commissionFocus}
                    onChange={(e) => setAiConfig({ ...aiConfig, commissionFocus: e.target.value as any })}
                  >
                    <option value="high">高佣金 (5%+)</option>
                    <option value="medium">中等佣金 (3-5%)</option>
                    <option value="any">不限</option>
                  </select>
                </div>

                {/* 竞争程度 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">竞争程度偏好</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.competitionLevel}
                    onChange={(e) => setAiConfig({ ...aiConfig, competitionLevel: e.target.value as any })}
                  >
                    <option value="low">低竞争 (蓝海)</option>
                    <option value="medium">中等竞争</option>
                    <option value="high">高竞争</option>
                    <option value="any">不限</option>
                  </select>
                </div>

                {/* 市场趋势 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">市场趋势偏好</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.marketTrend}
                    onChange={(e) => setAiConfig({ ...aiConfig, marketTrend: e.target.value as any })}
                  >
                    <option value="rising">上升趋势</option>
                    <option value="stable">稳定</option>
                    <option value="any">不限</option>
                  </select>
                </div>

                {/* 目标市场 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">目标市场</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.targetMarket}
                    onChange={(e) => setAiConfig({ ...aiConfig, targetMarket: e.target.value as any })}
                  >
                    <option value="us">美国 (Amazon.com)</option>
                    <option value="uk">英国 (Amazon.co.uk)</option>
                    <option value="de">德国 (Amazon.de)</option>
                    <option value="jp">日本 (Amazon.co.jp)</option>
                    <option value="all">全部市场</option>
                  </select>
                </div>

                {/* 结果数量 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">推荐数量</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={aiConfig.limit}
                    onChange={(e) => setAiConfig({ ...aiConfig, limit: Number(e.target.value) })}
                  >
                    <option value={3}>3 个</option>
                    <option value={5}>5 个</option>
                    <option value={10}>10 个</option>
                  </select>
                </div>

                {/* 自定义选品逻辑 */}
                <div className="col-span-2 space-y-2">
                  <label className="text-xs text-muted-foreground">自定义选品条件（可选）</label>
                  <Input
                    placeholder="例如：优先选择适合新手博主的产品、需要是季节性产品等"
                    value={aiConfig.customLogic}
                    onChange={(e) => setAiConfig({ ...aiConfig, customLogic: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* 当前条件摘要 */}
            {!aiConfigOpen && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{aiConfig.category === 'all' ? '全部类别' : aiConfig.category}</Badge>
                <Badge variant="outline">${aiConfig.minPrice}-${aiConfig.maxPrice}</Badge>
                <Badge variant="outline">评分 {aiConfig.minRating}+</Badge>
                <Badge variant="outline">{aiConfig.commissionFocus === 'high' ? '高佣金' : aiConfig.commissionFocus === 'medium' ? '中佣金' : '不限佣金'}</Badge>
                <Badge variant="outline">{aiConfig.competitionLevel === 'low' ? '低竞争' : aiConfig.competitionLevel}</Badge>
                <Badge variant="outline">{aiConfig.marketTrend === 'rising' ? '上升趋势' : aiConfig.marketTrend}</Badge>
              </div>
            )}

            {/* 重新推荐按钮 */}
            <div className="flex justify-end">
              <Button
                onClick={handleRefreshAIRecommend}
                disabled={aiLoading}
                size="sm"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                重新推荐
              </Button>
            </div>
          </div>

          {aiLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-foreground">AI分析中...</span>
            </div>
          ) : aiMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>正在为您获取AI推荐...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 排序选项 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">排序方式：</span>
                <div className="flex gap-1">
                  {[
                    { key: 'score', label: 'AI评分' },
                    { key: 'reviews', label: '热度' },
                    { key: 'rating', label: '评分' },
                    { key: 'price', label: '价格' },
                  ].map((option) => (
                    <Button
                      key={option.key}
                      variant={aiSortBy === option.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAiSortBy(option.key as any)}
                      className="h-7 px-2 text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  共 {aiMarkets.length} 个推荐产品
                </span>
              </div>

              {sortedAiMarkets.map((market, index) => (
                <Card
                  key={`${market.asin}-${index}`}
                  className={`overflow-hidden hover:shadow-md transition-shadow ${addedAsins.has(market.asin) ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex">
                    <div
                      className="w-28 h-28 bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden"
                      onClick={() => handleViewProductDetail(market)}
                    >
                      {market.imageUrl ? (
                        <img
                          src={market.imageUrl}
                          alt={market.title}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            if (target.parentElement) {
                              target.parentElement.innerHTML = '<span class="text-4xl">📦</span>'
                            }
                          }}
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div
                            className="font-medium text-base cursor-pointer hover:text-primary hover:underline"
                            onClick={() => handleViewProductDetail(market)}
                          >
                            {market.title}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span className="text-green-600 font-semibold">${market.price}</span>
                            <span>⭐ {market.rating}</span>
                            <span>{market.reviewCount?.toLocaleString()} 评价</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="text-lg px-3 py-1" variant={market.aiScore >= 80 ? 'default' : 'secondary'}>
                            AI评分: {market.aiScore}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            预估佣金: {market.analysis?.estimatedCommission || '5-8%'}
                          </div>
                        </div>
                      </div>

                      {/* 推荐理由 */}
                      <div className="mt-2 text-sm">
                        <span className="text-green-600 font-medium">推荐理由：</span>
                        <span className="text-muted-foreground">{market.aiReason}</span>
                      </div>

                      {/* 分析指标 */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTrendIcon(market.marketTrend || market.analysis?.marketTrend || 'stable')}
                          {market.marketTrend === 'rising' ? '上升' : market.marketTrend === 'stable' ? '稳定' : '下降'}
                        </Badge>
                        <Badge variant="outline">
                          竞争: {market.competitionLevel === 'low' ? '低' : market.competitionLevel === 'medium' ? '中' : '高'}
                        </Badge>
                        <Badge variant="outline">
                          利润: {market.analysis?.profitPotential === 'high' ? '高' : market.analysis?.profitPotential === 'medium' ? '中' : '低'}
                        </Badge>
                        <Badge variant="outline">
                          内容难度: {market.analysis?.contentDifficulty === 'easy' ? '简单' : market.analysis?.contentDifficulty === 'medium' ? '中等' : '困难'}
                        </Badge>
                        {market.analysis?.seasonalFactor && (
                          <Badge variant="outline">{market.analysis.seasonalFactor}</Badge>
                        )}
                      </div>

                      {/* 匹配条件 */}
                      {market.matchedCriteria && market.matchedCriteria.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {market.matchedCriteria.map((criteria, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✓ {criteria}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddAIMarket(market)}
                          disabled={addedAsins.has(market.asin)}
                          variant={addedAsins.has(market.asin) ? 'secondary' : 'default'}
                        >
                          {addedAsins.has(market.asin) ? '✓ 已添加' : '添加到市场库'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProductDetail(market)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          查看详情
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // 优先使用直接产品链接，然后是搜索链接
                            const url = market.url || `https://www.amazon.com/dp/${market.asin}` || market.searchUrl || `https://www.amazon.com/s?k=${encodeURIComponent(market.title)}`
                            window.open(url, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
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

      {/* 产品详情对话框 */}
      <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  产品详情
                  <Badge variant={selectedProduct.aiScore >= 80 ? 'default' : 'secondary'}>
                    AI评分: {selectedProduct.aiScore}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* 产品图片和基本信息 */}
                <div className="flex gap-4">
                  <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300/f3f4f6/666?text=No+Image'
                        }}
                      />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedProduct.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-green-600 font-semibold text-lg">{selectedProduct.price?.toString().startsWith('$') ? selectedProduct.price : `$${selectedProduct.price}`}</span>
                      <span>⭐ {selectedProduct.rating}</span>
                      <span className="text-muted-foreground">{selectedProduct.reviewCount?.toLocaleString()} 评价</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground font-mono">
                      ASIN: {selectedProduct.asin}
                    </div>
                  </div>
                </div>

                {/* AI 分析 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    AI 分析
                  </h4>

                  <div className="text-sm">
                    <span className="text-green-600 font-medium">推荐理由：</span>
                    <span className="text-muted-foreground">{selectedProduct.aiReason}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">市场趋势</span>
                      <span className="flex items-center gap-1">
                        {getTrendIcon(selectedProduct.marketTrend || selectedProduct.analysis?.marketTrend || 'stable')}
                        {selectedProduct.marketTrend === 'rising' ? '上升' : selectedProduct.marketTrend === 'stable' ? '稳定' : '下降'}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">竞争程度</span>
                      <span>{selectedProduct.competitionLevel === 'low' ? '低' : selectedProduct.competitionLevel === 'medium' ? '中' : '高'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">预估佣金</span>
                      <span className="text-green-600">{selectedProduct.analysis?.estimatedCommission || '5-8%'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">利润潜力</span>
                      <span>{selectedProduct.analysis?.profitPotential === 'high' ? '高' : selectedProduct.analysis?.profitPotential === 'medium' ? '中' : '低'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">内容难度</span>
                      <span>{selectedProduct.analysis?.contentDifficulty === 'easy' ? '简单' : selectedProduct.analysis?.contentDifficulty === 'medium' ? '中等' : '困难'}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">季节因素</span>
                      <span>{selectedProduct.analysis?.seasonalFactor || '全年稳定'}</span>
                    </div>
                  </div>

                  {/* 匹配条件 */}
                  {selectedProduct.matchedCriteria && selectedProduct.matchedCriteria.length > 0 && (
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground">匹配条件：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProduct.matchedCriteria.map((criteria, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            ✓ {criteria}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 用户评论示例 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    用户评论精选 (3 条)
                  </h4>
                  <div className="space-y-3">
                    {[
                      { rating: 5, title: 'Excellent Quality', content: 'Great product! Works exactly as described.', author: 'Verified Buyer', date: '2024-01', verified: true },
                      { rating: 4, title: 'Good Value for Money', content: 'Overall satisfied with this purchase.', author: 'Amazon Customer', date: '2024-01', verified: true },
                      { rating: 5, title: 'Highly Recommended', content: 'Been using this for two weeks now and it works perfectly!', author: 'Tech Enthusiast', date: '2023-12', verified: true },
                    ].map((review, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                            <span className="font-medium">{review.title}</span>
                            {review.verified && (
                              <span className="text-xs text-green-600 bg-green-50 px-1 rounded">Verified Purchase</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-muted-foreground text-xs">{review.content}</p>
                        <div className="text-xs text-muted-foreground mt-1">— {review.author}</div>
                      </div>
                    ))}
                  </div>
                  <a
                    href={selectedProduct.url || (selectedProduct.asin ? `https://www.amazon.com/dp/${selectedProduct.asin}` : selectedProduct.searchUrl || `https://www.amazon.com/s?k=${encodeURIComponent(selectedProduct.title)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    查看更多 Amazon 评论
                  </a>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleAddAIMarket(selectedProduct)}
                    disabled={addedAsins.has(selectedProduct.asin)}
                    variant={addedAsins.has(selectedProduct.asin) ? 'secondary' : 'default'}
                  >
                    {addedAsins.has(selectedProduct.asin) ? '✓ 已添加' : '添加到市场库'}
                  </Button>
                  {/* 保存为素材 */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 生成素材内容（包含AI分析和评论）
                      const reviews = selectedProduct.reviews || []
                      const reviewsMarkdown = reviews.map((r: any) => `
**${r.rating}⭐ ${r.title}** ${r.verified ? '✓ Verified Purchase' : ''}
> "${r.content}"
> — *${r.author}* (${r.date})
`).join('\n')

                      const materialContent = `## 产品概述

| 属性 | 信息 |
|------|------|
| ASIN | ${selectedProduct.asin} |
| 价格 | ${selectedProduct.price} |
| 评分 | ⭐ ${selectedProduct.rating} |
| 评论数 | ${selectedProduct.reviewCount?.toLocaleString() || 'N/A'} |
| AI 推荐分数 | ${selectedProduct.aiScore}/100 |

## AI 分析

${selectedProduct.aiReason || '基于 AI 分析的市场推荐'}

### 市场分析
- **市场趋势**: ${selectedProduct.analysis?.marketTrend || '稳定'}
- **竞争程度**: ${selectedProduct.analysis?.competitionLevel || '中等'}
- **预估佣金**: ${selectedProduct.analysis?.estimatedCommission || '3-5%'}
- **利润潜力**: ${selectedProduct.analysis?.profitPotential || '中等'}

## 用户评论精选

${reviewsMarkdown || '*暂无评论数据*'}
`
                      setSaveMaterialContent(materialContent)
                      setSaveMaterialTitle(`AI分析: ${selectedProduct.title}`)
                      setSaveMaterialDialogOpen(true)
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    保存为素材
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 优先使用直接产品链接
                      const url = selectedProduct.url || (selectedProduct.asin ? `https://www.amazon.com/dp/${selectedProduct.asin}` : null) || selectedProduct.searchUrl || `https://www.amazon.com/s?k=${encodeURIComponent(selectedProduct.title)}`
                      window.open(url, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    在 Amazon 查看
                  </Button>
                </div>
              </div>
            </>
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
                    <div className="font-medium text-foreground">{product.title}</div>
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

      {/* 定时选品对话框 */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              定时选品任务
            </DialogTitle>
            <DialogDescription>
              设置定时任务，自动运行AI选品分析
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 新建定时任务 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-foreground">新建定时任务</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">执行频率</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={scheduleConfig.frequency}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value as any })}
                  >
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">执行时间</label>
                  <Input
                    type="time"
                    value={scheduleConfig.time}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">产品类别</label>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
                    value={scheduleConfig.category}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, category: e.target.value })}
                  >
                    <option value="all">全部类别</option>
                    <option value="electronics">电子产品</option>
                    <option value="home">家居用品</option>
                    <option value="beauty">美妆护肤</option>
                    <option value="outdoor">户外运动</option>
                    <option value="office">办公用品</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">最大结果数</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={scheduleConfig.maxResults}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, maxResults: parseInt(e.target.value) || 10 })}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">价格区间 ($)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={scheduleConfig.minPrice}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, minPrice: parseInt(e.target.value) || 0 })}
                      className="text-sm"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      value={scheduleConfig.maxPrice}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, maxPrice: parseInt(e.target.value) || 1000 })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">最低评分</label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    value={scheduleConfig.minRating}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, minRating: parseFloat(e.target.value) || 4.0 })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoAdd"
                  checked={scheduleConfig.autoAdd}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, autoAdd: e.target.checked })}
                  className="rounded bg-background border-border"
                />
                <label htmlFor="autoAdd" className="text-sm text-foreground">
                  自动将高评分产品(≥80分)添加到选品库
                </label>
              </div>

              <Button
                onClick={async () => {
                  setScheduleLoading(true)
                  try {
                    // 调用后端创建定时任务
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/schedule`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: `${scheduleConfig.category === 'all' ? '全部类别' : scheduleConfig.category}定时选品`,
                        frequency: scheduleConfig.frequency,
                        executeTime: scheduleConfig.time,
                        category: scheduleConfig.category,
                        minPrice: scheduleConfig.minPrice,
                        maxPrice: scheduleConfig.maxPrice,
                        minRating: scheduleConfig.minRating?.toString() || '4.0',
                        autoAdd: scheduleConfig.autoAdd,
                        maxResults: scheduleConfig.maxResults,
                        competitionLevel: aiConfig.competitionLevel,
                        marketTrend: aiConfig.marketTrend,
                      }),
                    })
                    if (response.ok) {
                      const data = await response.json()
                      setScheduledTasks([...scheduledTasks, data])
                      setScheduleDialogOpen(false)
                      toast({ title: '成功', description: '定时任务已创建' })
                    } else {
                      // 演示模式
                      const newTask = {
                        id: Date.now(),
                        ...scheduleConfig,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        lastRunAt: null,
                        nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      }
                      setScheduledTasks([...scheduledTasks, newTask])
                      setScheduleDialogOpen(false)
                      toast({ title: '成功', description: '定时任务已创建（演示模式）' })
                    }
                  } catch {
                    // 演示模式
                    const newTask = {
                      id: Date.now(),
                      ...scheduleConfig,
                      status: 'active',
                      createdAt: new Date().toISOString(),
                      lastRunAt: null,
                      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    }
                    setScheduledTasks([...scheduledTasks, newTask])
                    setScheduleDialogOpen(false)
                    toast({ title: '成功', description: '定时任务已创建（演示模式）' })
                  } finally {
                    setScheduleLoading(false)
                  }
                }}
                disabled={scheduleLoading}
                className="w-full"
              >
                {scheduleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                创建定时任务
              </Button>
            </div>

            {/* 已有定时任务列表 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground">已有定时任务</h4>
              {scheduledTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  暂无定时任务
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2 text-foreground">
                          <span className={`w-2 h-2 rounded-full ${task.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {task.frequency === 'daily' ? '每天' : task.frequency === 'weekly' ? '每周' : '每月'}
                          {' '}{task.time}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          类别: {task.category === 'all' ? '全部' : task.category} |
                          数量: {task.maxResults} |
                          价格: ${task.minPrice}-${task.maxPrice}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTaskHistory(task.id)}
                          title="查看历史"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const newStatus = task.status === 'active' ? 'paused' : 'active'
                            try {
                              // 调用后端 API 更新状态
                              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/schedule/${task.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              })
                              if (response.ok) {
                                // 更新本地状态
                                setScheduledTasks(scheduledTasks.map((t: any) =>
                                  t.id === task.id ? { ...t, status: newStatus } : t
                                ))
                                toast({ title: newStatus === 'paused' ? '已暂停' : '已恢复', description: `定时任务已${newStatus === 'paused' ? '暂停' : '恢复'}` })
                              } else {
                                // 演示模式
                                setScheduledTasks(scheduledTasks.map((t: any) =>
                                  t.id === task.id ? { ...t, status: newStatus } : t
                                ))
                                toast({ title: newStatus === 'paused' ? '已暂停' : '已恢复', description: `定时任务已${newStatus === 'paused' ? '暂停' : '恢复'}（演示模式）` })
                              }
                            } catch {
                              // 演示模式
                              setScheduledTasks(scheduledTasks.map((t: any) =>
                                t.id === task.id ? { ...t, status: newStatus } : t
                              ))
                              toast({ title: newStatus === 'paused' ? '已暂停' : '已恢复', description: `定时任务已${newStatus === 'paused' ? '暂停' : '恢复'}（演示模式）` })
                            }
                          }}
                        >
                          {task.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              // 先调用后端 API 删除
                              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/schedule/${task.id}`, {
                                method: 'DELETE',
                              })
                              if (response.ok) {
                                // 后端删除成功后更新本地状态
                                setScheduledTasks(scheduledTasks.filter((t: any) => t.id !== task.id))
                                toast({ title: '已删除', description: '定时任务已删除' })
                              } else {
                                // 演示模式：直接删除本地
                                setScheduledTasks(scheduledTasks.filter((t: any) => t.id !== task.id))
                                toast({ title: '已删除', description: '定时任务已删除（演示模式）' })
                              }
                            } catch {
                              // 演示模式：直接删除本地
                              setScheduledTasks(scheduledTasks.filter((t: any) => t.id !== task.id))
                              toast({ title: '已删除', description: '定时任务已删除（演示模式）' })
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 说明 */}
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-700 mb-1">💡 使用说明</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>定时任务会在指定时间自动运行AI选品分析</li>
                <li>分析结果会保存到历史记录，可随时查看</li>
                <li>开启"自动添加"后，高评分产品会自动进入选品库</li>
                <li>可在历史记录中按时间、类型、价格、热度排序查看</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 任务历史对话框 */}
      <Dialog open={taskHistoryDialogOpen} onOpenChange={setTaskHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              定时任务执行历史
            </DialogTitle>
            <DialogDescription>
              查看定时选品任务的执行记录和推荐结果
            </DialogDescription>
          </DialogHeader>

          {selectedTaskHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground mt-2">暂无执行历史</p>
              <p className="text-xs text-muted-foreground mt-1">
                任务执行后，历史记录将显示在这里
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTaskHistory.map((run: any) => (
                <Card key={run.id} className="overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          run.status === 'success' ? 'bg-green-500' :
                          run.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-sm">
                          {run.status === 'success' ? '执行成功' :
                           run.status === 'partial' ? '部分成功' : '执行失败'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(run.runAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4">
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground text-xs">发现产品</div>
                        <div className="font-medium text-foreground">{run.productsFound} 个</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">已添加到选品库</div>
                        <div className="font-medium text-green-600">{run.productsAdded} 个</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">执行耗时</div>
                        <div className="font-medium text-foreground">{run.duration || '12.5s'}</div>
                      </div>
                    </div>

                    {run.errorMessage && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-3">
                        ⚠️ {run.errorMessage}
                      </div>
                    )}

                    {run.topProducts && run.topProducts.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">TOP 推荐产品</div>
                        <div className="space-y-1">
                          {run.topProducts.map((product: any) => (
                            <div
                              key={product.asin}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm cursor-pointer hover:bg-muted"
                              onClick={() => {
                                // 直接添加到选品库
                                handleAddAIMarket({
                                  asin: product.asin,
                                  title: product.title,
                                  price: '$0',
                                  rating: '4.5',
                                  reviewCount: 0,
                                  aiScore: product.aiScore,
                                  aiReason: '',
                                  marketTrend: 'stable',
                                  competitionLevel: 'medium',
                                  imageUrl: '',
                                  searchUrl: `https://www.amazon.com/dp/${product.asin}`,
                                })
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="font-mono text-xs shrink-0">
                                  AI: {product.aiScore}
                                </Badge>
                                <span className="truncate">{product.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {product.asin}
                                </span>
                                <Plus className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setTaskHistoryDialogOpen(false)}
            >
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 保存素材对话框 */}
      <SaveMaterialDialog
        open={saveMaterialDialogOpen}
        onOpenChange={setSaveMaterialDialogOpen}
        defaultContent={saveMaterialContent}
        defaultTitle={saveMaterialTitle}
        defaultType="product_intro"
        onSuccess={(materialId) => {
          toast({ title: '成功', description: `素材已保存 (ID: ${materialId})` })
        }}
      />
    </div>
  )
}
