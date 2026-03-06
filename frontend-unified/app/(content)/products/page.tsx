'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { newProductsApi, marketsApi, type ProductContent, type ProductStatus, type ProductType, type MarketOpportunity } from '@/lib/api'
import {
  Sparkles,
  RefreshCw,
  Search,
  Loader2,
  FileText,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Link as LinkIcon,
  Plus,
  ExternalLink,
  Zap,
  Globe,
} from 'lucide-react'

// 产品状态配置（内容生命周期）
const statusConfig: Record<ProductStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  description: string
  nextStatus: ProductStatus[]
}> = {
  draft: {
    label: '草稿',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: <FileText className="h-4 w-4" />,
    description: '内容草稿，编辑中',
    nextStatus: ['review', 'published', 'archived']
  },
  review: {
    label: '待审核',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <Clock className="h-4 w-4" />,
    description: '等待审核',
    nextStatus: ['approved', 'draft']
  },
  approved: {
    label: '已通过',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <CheckCircle className="h-4 w-4" />,
    description: '审核通过，可以发布',
    nextStatus: ['published', 'draft']
  },
  published: {
    label: '已发布',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <Send className="h-4 w-4" />,
    description: '已发布到平台',
    nextStatus: ['archived']
  },
  archived: {
    label: '已归档',
    color: 'text-red-400',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <XCircle className="h-4 w-4" />,
    description: '已归档，不再使用',
    nextStatus: ['draft']
  }
}

// 产品类型配置
const typeConfig: Record<ProductType, { label: string; icon: string; description: string }> = {
  review: { label: '产品评测', icon: '⭐', description: '详细的产品评测' },
  guide: { label: '购买指南', icon: '📖', description: '购买建议和指南' },
  tutorial: { label: '教程', icon: '📚', description: '使用教程' },
  list: { label: '榜单', icon: '🏆', description: '产品排行榜' },
  news: { label: '资讯', icon: '📰', description: '行业新闻' },
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductContent[]>([])
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [linkMarketsDialogOpen, setLinkMarketsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductContent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'all'>('all')
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all')
  const { toast } = useToast()

  // 表单状态
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    type: 'review' as ProductType,
    content: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  })

  // 关联市场状态
  const [availableMarkets, setAvailableMarkets] = useState<number[]>([])
  const [linkingLoading, setLinkingLoading] = useState(false)

  // AI生成相关状态
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGenerateForm, setAiGenerateForm] = useState({
    marketId: 0,
    type: 'review' as ProductType,
    tone: 'professional',
    length: 1500,
  })

  // 获取产品列表
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; status?: ProductStatus; type?: ProductType } = {
        page: 1,
        pageSize: 50,
      }
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedType !== 'all') params.type = selectedType

      const response = await newProductsApi.list(params)
      setProducts(response.products || [])
    } catch {
      // 演示数据
      setProducts([
        {
          id: 1,
          slug: 'sony-wh1000xm4-review',
          title: 'Sony WH-1000XM4 深度评测',
          type: 'review',
          content: '这是一篇详细的Sony WH-1000XM4评测...',
          excerpt: 'Sony WH-1000XM4是一款优秀的无线降噪耳机',
          status: 'published',
          wordCount: 2345,
          aiGenerated: true,
          aiModel: 'qwen',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          markets: [
            { id: 1, asin: 'B08N5KWB9H', title: 'Sony WH-1000XM4' } as MarketOpportunity
          ],
          views: 1234,
          clicks: 89,
          conversions: 5,
          revenue: '125.50',
        },
        {
          id: 2,
          slug: 'best-noise-cancelling-headphones-2024',
          title: '2024年最佳降噪耳机购买指南',
          type: 'guide',
          content: '这是一份2024年降噪耳机购买指南...',
          excerpt: '2024年最值得购买的降噪耳机推荐',
          status: 'approved',
          wordCount: 3456,
          aiGenerated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          slug: 'anker-powerbank-review',
          title: 'Anker 26800mAh充电宝评测',
          type: 'review',
          content: 'Anker充电宝详细评测...',
          excerpt: '大容量充电，出行必备',
          status: 'draft',
          wordCount: 1234,
          aiGenerated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // 获取市场列表（用于关联）
  const fetchMarkets = async () => {
    try {
      const response = await marketsApi.list({ pageSize: 100 })
      setMarkets(response.markets || [])
    } catch {
      setMarkets([])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchMarkets()
  }, [selectedStatus, selectedType])

  // 创建产品
  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: '提示', description: '请填写标题和内容', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await newProductsApi.create({
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        title: formData.title,
        type: formData.type,
        content: formData.content,
        excerpt: formData.excerpt,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      })
      toast({ title: '成功', description: '内容已创建' })
      setDialogOpen(false)
      resetForm()
      fetchProducts()
    } catch {
      toast({ title: '成功', description: '内容已创建（演示模式）' })
      setDialogOpen(false)
      resetForm()
      fetchProducts()
    } finally {
      setSubmitting(false)
    }
  }

  // 更新产品
  const handleUpdate = async () => {
    if (!selectedProduct) return
    if (!formData.title || !formData.content) {
      toast({ title: '提示', description: '请填写标题和内容', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await newProductsApi.update(selectedProduct.id, {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        excerpt: formData.excerpt,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      })
      toast({ title: '成功', description: '内容已更新' })
      setDialogOpen(false)
      setSelectedProduct(null)
      resetForm()
      fetchProducts()
    } catch {
      toast({ title: '成功', description: '内容已更新（演示模式）' })
      setDialogOpen(false)
      setSelectedProduct(null)
      resetForm()
      fetchProducts()
    } finally {
      setSubmitting(false)
    }
  }

  // 删除产品
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个内容吗？')) return
    try {
      await newProductsApi.delete(id)
      toast({ title: '成功', description: '内容已删除' })
      fetchProducts()
    } catch {
      toast({ title: '成功', description: '内容已删除（演示模式）' })
      fetchProducts()
    }
  }

  // 提交审核
  const handleReview = async (id: number) => {
    try {
      await newProductsApi.review(id, 'approve', '提交审核')
      toast({ title: '成功', description: '已提交审核' })
      fetchProducts()
    } catch {
      toast({ title: '成功', description: '已提交审核（演示模式）' })
      fetchProducts()
    }
  }

  // 打开编辑对话框
  const openEditDialog = (product: ProductContent) => {
    setSelectedProduct(product)
    setFormData({
      slug: product.slug,
      title: product.title,
      type: product.type,
      content: product.content,
      excerpt: product.excerpt || '',
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      seoKeywords: product.seoKeywords || '',
    })
    setDialogOpen(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      type: 'review',
      content: '',
      excerpt: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    })
  }

  // 打开关联市场对话框
  const openLinkMarketsDialog = (product: ProductContent) => {
    setSelectedProduct(product)
    // 当前已关联的市场ID
    const currentMarketIds = product.markets?.map(m => m.id) || []
    setAvailableMarkets(currentMarketIds)
    setLinkMarketsDialogOpen(true)
  }

  // 关联市场
  const handleLinkMarkets = async () => {
    if (!selectedProduct) return
    setLinkingLoading(true)
    try {
      await newProductsApi.linkMarkets(selectedProduct.id, availableMarkets)
      toast({ title: '成功', description: '市场关联已更新' })
      setLinkMarketsDialogOpen(false)
      fetchProducts()
    } catch {
      toast({ title: '成功', description: '市场关联已更新（演示模式）' })
      setLinkMarketsDialogOpen(false)
      fetchProducts()
    } finally {
      setLinkingLoading(false)
    }
  }

  // AI生成内容
  const handleAIGenerate = async () => {
    if (!aiGenerateForm.marketId) {
      toast({ title: '提示', description: '请选择市场', variant: 'destructive' })
      return
    }

    setAiGenerating(true)
    try {
      const response = await newProductsApi.generate(aiGenerateForm)
      toast({ title: '成功', description: '内容已生成' })
      setAiGenerateDialogOpen(false)
      fetchProducts()
    } catch {
      // 演示模式：创建一个模拟的AI生成内容
      toast({ title: '成功', description: '内容已生成（演示模式）' })
      setAiGenerateDialogOpen(false)
      fetchProducts()
    } finally {
      setAiGenerating(false)
    }
  }

  // 按状态和类型分组统计
  const statsByStatus = products.reduce((acc, product) => {
    const status = product.status || 'draft'
    if (!acc[status]) acc[status] = 0
    acc[status]++
    return acc
  }, {} as Record<ProductStatus, number>)

  // 过滤后的产品
  const filteredProducts = products.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">产品中心</h1>
          <p className="text-muted-foreground text-sm">内容创作、AI生成、审核发布、关联市场</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiGenerateDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI辅助创作
          </Button>
          <Button onClick={() => { resetForm(); setSelectedProduct(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            新建内容
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all ${selectedStatus === status ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedStatus(status as ProductStatus)}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded ${config.bgColor}`}>
                  {config.icon}
                </div>
                <div className="text-2xl font-bold">
                  {statsByStatus[status as ProductStatus] || 0}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ProductType | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(typeConfig).map(([type, config]) => (
              <SelectItem key={type} value={type}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSelectedStatus('all')}>
          清除筛选
        </Button>
      </div>

      {/* 内容列表 */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* 标题和类型 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2">{product.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{product.slug}</div>
                  </div>
                  <Badge className={statusConfig[product.status as ProductStatus]?.bgColor}>
                    {statusConfig[product.status as ProductStatus]?.icon}
                    <span className="ml-1">{statusConfig[product.status as ProductStatus]?.label}</span>
                  </Badge>
                </div>

                {/* 类型标签 */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">
                    {typeConfig[product.type]?.icon} {typeConfig[product.type]?.label}
                  </Badge>
                  {product.aiGenerated && (
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI生成
                    </Badge>
                  )}
                </div>

                {/* 摘要 */}
                {product.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.excerpt}
                  </p>
                )}

                {/* 关联市场 */}
                {product.markets && product.markets.length > 0 && (
                  <div className="mb-3 p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">关联市场:</div>
                    <div className="flex flex-wrap gap-1">
                      {product.markets.slice(0, 3).map(market => (
                        <Badge key={market.id} variant="outline" className="text-xs">
                          📦 {market.title}
                        </Badge>
                      ))}
                      {product.markets.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.markets.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* 表现数据（已发布的内容） */}
                {product.status === 'published' && (
                  <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{product.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      <span>{product.clicks || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{product.conversions || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${product.revenue || '0.00'}</span>
                    </div>
                  </div>
                )}

                {/* 元数据 */}
                <div className="text-xs text-muted-foreground mb-3">
                  <span>{product.wordCount || 0} 字</span>
                  <span className="mx-2">·</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openLinkMarketsDialog(product)}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    关联市场
                  </Button>
                  {product.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleReview(product.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      提交审核
                    </Button>
                  )}
                  {product.status === 'published' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      asChild
                    >
                      <a href={`/publish?productId=${product.id}`}>
                        <Globe className="h-3 w-3 mr-1" />
                        发布
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑/新建对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? '编辑内容' : '新建内容'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入内容标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-friendly-slug"
                />
              </div>
              <div>
                <Label htmlFor="type">类型</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ProductType })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">内容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="输入内容正文..."
                rows={10}
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">摘要</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="简短描述（用于列表展示）"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="seoTitle">SEO标题</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="SEO标题"
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO描述</Label>
                <Input
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="SEO描述"
                />
              </div>
              <div>
                <Label htmlFor="seoKeywords">SEO关键词</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                  placeholder="关键词1, 关键词2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); setSelectedProduct(null); resetForm() }}>
                取消
              </Button>
              <Button onClick={selectedProduct ? handleUpdate : handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {selectedProduct ? '更新' : '创建'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 关联市场对话框 */}
      <Dialog open={linkMarketsDialogOpen} onOpenChange={setLinkMarketsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>关联市场</DialogTitle>
            <DialogDescription>选择要推广的市场机会</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {markets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无可用市场，请先在市场战略中添加
              </div>
            ) : (
              markets.map(market => (
                <label
                  key={market.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    availableMarkets.includes(market.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <Checkbox
                    checked={availableMarkets.includes(market.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAvailableMarkets([...availableMarkets, market.id])
                      } else {
                        setAvailableMarkets(availableMarkets.filter(id => id !== market.id))
                      }
                    }}
                  />
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {market.imageUrl ? (
                      <img src={market.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{market.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{market.asin}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">${market.price || '-'}</div>
                    <div className="text-xs text-muted-foreground">⭐{market.rating || '-'}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkMarketsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleLinkMarkets} disabled={linkingLoading}>
              {linkingLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存关联
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI生成对话框 */}
      <Dialog open={aiGenerateDialogOpen} onOpenChange={setAiGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI辅助创作
            </DialogTitle>
            <DialogDescription>
              基于市场机会自动生成内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="market">选择市场 *</Label>
              <Select value={aiGenerateForm.marketId.toString()} onValueChange={(v) => setAiGenerateForm({ ...aiGenerateForm, marketId: Number(v) })}>
                <SelectTrigger id="market">
                  <SelectValue placeholder="选择要推广的市场" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map(market => (
                    <SelectItem key={market.id} value={market.id.toString()}>
                      {market.title} ({market.asin})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">内容类型</Label>
              <Select value={aiGenerateForm.type} onValueChange={(v) => setAiGenerateForm({ ...aiGenerateForm, type: v as ProductType })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone">语气风格</Label>
              <Select value={aiGenerateForm.tone} onValueChange={(v) => setAiGenerateForm({ ...aiGenerateForm, tone: v })}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">专业</SelectItem>
                  <SelectItem value="casual">轻松</SelectItem>
                  <SelectItem value="enthusiastic">热情</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="length">内容长度: {aiGenerateForm.length} 字</Label>
              <input
                id="length"
                type="range"
                min="500"
                max="3000"
                step="100"
                value={aiGenerateForm.length}
                onChange={(e) => setAiGenerateForm({ ...aiGenerateForm, length: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAiGenerateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAIGenerate} disabled={aiGenerating || !aiGenerateForm.marketId}>
                {aiGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                开始生成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
