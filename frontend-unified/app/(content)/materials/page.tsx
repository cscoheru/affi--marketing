'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, marketsApi, type Material, type MaterialType, type MarketOpportunity } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Youtube, MessageSquare, FileUp, Plus, ExternalLink, Trash2, Search } from 'lucide-react'

const materialTypeConfig: Record<MaterialType, { label: string; icon: typeof FileText; color: string }> = {
  product_intro: { label: '产品介绍', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  user_review: { label: '用户评论', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  youtube_review: { label: 'YouTube评测', icon: Youtube, color: 'bg-red-100 text-red-700' },
  attachment: { label: '附件', icon: FileUp, color: 'bg-gray-100 text-gray-700' },
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [marketFilter, setMarketFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'product_intro' as MaterialType,
    content: '',
    sourceUrl: '',
    marketId: 0,
  })
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  // 获取市场列表（用于筛选和创建时选择）
  const fetchMarkets = async () => {
    try {
      const response = await marketsApi.list({ page: 1, pageSize: 100 })
      setMarkets(response.markets)
    } catch (error) {
      console.error('Failed to fetch markets:', error)
    }
  }

  // 获取素材列表
  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; type?: MaterialType; marketId?: number } = {
        page: 1,
        pageSize: 50,
      }
      if (typeFilter !== 'all') {
        params.type = typeFilter as MaterialType
      }
      if (marketFilter !== 'all') {
        params.marketId = parseInt(marketFilter)
      }

      const response = await materialsApi.list(params)
      setMaterials(response.materials || [])
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取素材列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
    fetchMaterials()
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [typeFilter, marketFilter])

  // 处理搜索
  const handleSearch = () => {
    fetchMaterials()
  }

  // 创建素材
  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast({ title: '错误', description: '请输入标题', variant: 'destructive' })
      return
    }
    if (!createForm.marketId) {
      toast({ title: '错误', description: '请选择关联市场', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      await materialsApi.create({
        title: createForm.title,
        type: createForm.type,
        content: createForm.content || undefined,
        sourceUrl: createForm.sourceUrl || undefined,
        marketId: createForm.marketId,
      })
      toast({ title: '成功', description: '素材已创建' })
      setCreateDialogOpen(false)
      setCreateForm({
        title: '',
        type: 'product_intro',
        content: '',
        sourceUrl: '',
        marketId: 0,
      })
      fetchMaterials()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '创建素材失败',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // 删除素材
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个素材吗？')) return

    try {
      await materialsApi.delete(id)
      toast({ title: '成功', description: '素材已删除' })
      fetchMaterials()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '删除素材失败',
        variant: 'destructive',
      })
    }
  }

  // 获取市场名称
  const getMarketName = (marketId: number) => {
    const market = markets.find(m => m.id === marketId)
    return market ? market.title : `市场 #${marketId}`
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">素材库</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              添加素材
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加素材</DialogTitle>
              <DialogDescription>
                创建新的内容素材，支持产品介绍、用户评论、YouTube评测和附件
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marketId">关联市场 *</Label>
                  <Select
                    value={createForm.marketId ? String(createForm.marketId) : ''}
                    onValueChange={(v) => setCreateForm({ ...createForm, marketId: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择市场" />
                    </SelectTrigger>
                    <SelectContent>
                      {markets.map((market) => (
                        <SelectItem key={market.id} value={String(market.id)}>
                          {market.title} ({market.asin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">素材类型 *</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm({ ...createForm, type: v as MaterialType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(materialTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="输入素材标题"
                />
              </div>
              {createForm.type === 'youtube_review' && (
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">YouTube 链接</Label>
                  <Input
                    id="sourceUrl"
                    value={createForm.sourceUrl}
                    onChange={(e) => setCreateForm({ ...createForm, sourceUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  placeholder={createForm.type === 'product_intro'
                    ? '粘贴产品介绍内容...'
                    : createForm.type === 'user_review'
                    ? '粘贴用户评论内容...'
                    : '素材内容...'}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>素材列表</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索素材..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(materialTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="市场筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部市场</SelectItem>
                {markets.map((market) => (
                  <SelectItem key={market.id} value={String(market.id)}>
                    {market.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无素材数据，点击"添加素材"创建第一个素材
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>关联市场</TableHead>
                  <TableHead>字数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const config = materialTypeConfig[material.type]
                  const IconComponent = config?.icon || FileText
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config?.color}>
                          <IconComponent className="w-3 h-3 mr-1" />
                          {config?.label || material.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getMarketName(material.marketId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {material.wordCount ? `${material.wordCount} 字` : '-'}
                      </TableCell>
                      <TableCell>
                        {material.createdAt
                          ? new Date(material.createdAt).toLocaleDateString('zh-CN')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {material.sourceUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(material.sourceUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
