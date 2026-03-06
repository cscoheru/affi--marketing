'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { contentApi, type ContentItem } from '@/lib/api'
import { useBlogStore } from '@/lib/blog/store'
import {
  RefreshCw, ArrowRight, Sparkles, Loader2, Download, FileText,
  CheckCircle, XCircle, Clock, Play, Zap, Youtube, ShoppingCart
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-hub.zenconsult.top/api/v1'

// 素材类型
interface Material {
  id: number
  asin: string
  sourceType: 'amazon_review' | 'youtube' | 'product_desc' | 'manual'
  content: string
  aiQualityScore?: number
  aiSummary?: string
  isUsable?: boolean
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  createdAt: string
}

// AI生成请求
interface AIGenerateRequest {
  productAsin: string
  materialIds: number[]
  contentType: 'review' | 'guide' | 'comparison' | 'science'
  tone: 'professional' | 'casual' | 'technical'
}

const contentTypes = [
  { value: 'review', label: '评测' },
  { value: 'blog', label: '文章' },
  { value: 'guide', label: '指南' },
  { value: 'science', label: '科普' },
  { value: 'social', label: '社媒' },
]

const statusLabels: Record<string, string> = {
  draft: '草稿',
  approved: '已审核',
  published: '已发布',
  rejected: '已拒绝',
}

export default function ContentPage() {
  // 内容管理状态
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('materials')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const { toast } = useToast()
  const { syncFromContent, syncAllPendingContent, fetchSyncStatus, articles } = useBlogStore()

  // 素材管理状态
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [collectAsin, setCollectAsin] = useState('')
  const [collectLoading, setCollectLoading] = useState(false)
  const [aiReviewLoading, setAiReviewLoading] = useState<number | null>(null)

  // AI创作状态
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false)
  const [aiGenerateLoading, setAiGenerateLoading] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [generateConfig, setGenerateConfig] = useState({
    productAsin: '',
    contentType: 'review' as const,
    tone: 'professional' as const
  })

  // 获取素材列表
  const fetchMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/materials?pageSize=50`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      } else {
        // 演示数据
        setMaterials(getDemoMaterials())
      }
    } catch (e) {
      setMaterials(getDemoMaterials())
    } finally {
      setMaterialsLoading(false)
    }
  }

  const getDemoMaterials = (): Material[] => [
    {
      id: 1,
      asin: 'B08N5KWB9H',
      sourceType: 'amazon_review',
      content: '音质非常棒，降噪效果一流。佩戴舒适，续航时间长。唯一缺点是有点重，长时间佩戴耳朵会累。',
      aiQualityScore: 85,
      aiSummary: '优点：音质好、降噪强、舒适、续航长；缺点：较重',
      isUsable: true,
      status: 'approved',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      asin: 'B08N5KWB9H',
      sourceType: 'youtube',
      content: '视频评测显示这款耳机的降噪效果是市面上最好的之一，特别适合经常出差的人士。通话质量也很清晰。',
      aiQualityScore: 92,
      aiSummary: '降噪效果顶级，适合商务人士，通话质量好',
      isUsable: true,
      status: 'approved',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      asin: 'B08N5KWB9H',
      sourceType: 'amazon_review',
      content: '一般般吧，感觉没有宣传的那么好。',
      aiQualityScore: 35,
      aiSummary: '内容过于简短，缺乏具体信息',
      isUsable: false,
      status: 'rejected',
      createdAt: new Date().toISOString()
    }
  ]

  // 自动采集素材
  const handleCollectMaterials = async () => {
    if (!collectAsin.trim()) {
      toast({ title: '提示', description: '请输入产品ASIN', variant: 'destructive' })
      return
    }

    setCollectLoading(true)
    try {
      const res = await fetch(`${API_BASE}/materials/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: collectAsin,
          sourceTypes: ['amazon_review', 'youtube']
        })
      })
      if (res.ok) {
        toast({ title: '成功', description: '素材采集任务已启动' })
        fetchMaterials()
      } else {
        // 演示模式
        toast({ title: '成功', description: `已采集 ${collectAsin} 的素材（演示模式）` })
        setMaterials([...getDemoMaterials(), {
          id: Date.now(),
          asin: collectAsin,
          sourceType: 'amazon_review',
          content: '演示采集的评论内容...',
          status: 'pending',
          createdAt: new Date().toISOString()
        }])
      }
    } catch (e) {
      toast({ title: '成功', description: `已采集 ${collectAsin} 的素材（演示模式）` })
    } finally {
      setCollectLoading(false)
      setCollectAsin('')
    }
  }

  // AI审核单个素材
  const handleAIReviewMaterial = async (materialId: number) => {
    setAiReviewLoading(materialId)
    try {
      const res = await fetch(`${API_BASE}/materials/${materialId}/review`, {
        method: 'POST'
      })
      if (res.ok) {
        toast({ title: '成功', description: 'AI审核完成' })
        fetchMaterials()
      } else {
        // 演示：模拟审核结果
        setMaterials(materials.map(m => {
          if (m.id === materialId) {
            return {
              ...m,
              aiQualityScore: Math.floor(Math.random() * 40) + 60,
              status: 'reviewed' as const,
              isUsable: true
            }
          }
          return m
        }))
        toast({ title: '成功', description: 'AI审核完成（演示模式）' })
      }
    } catch (e) {
      toast({ title: '成功', description: 'AI审核完成（演示模式）' })
    } finally {
      setAiReviewLoading(null)
    }
  }

  // 批量AI审核
  const handleBatchAIReview = async () => {
    const pendingMaterials = materials.filter(m => m.status === 'pending')
    if (pendingMaterials.length === 0) {
      toast({ title: '提示', description: '没有待审核的素材' })
      return
    }

    setAiReviewLoading(-1) // -1 表示批量
    try {
      const res = await fetch(`${API_BASE}/materials/batch-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds: pendingMaterials.map(m => m.id) })
      })
      if (res.ok) {
        toast({ title: '成功', description: `已审核 ${pendingMaterials.length} 条素材` })
        fetchMaterials()
      } else {
        // 演示
        setMaterials(materials.map(m => {
          if (m.status === 'pending') {
            return {
              ...m,
              aiQualityScore: Math.floor(Math.random() * 40) + 60,
              status: 'reviewed' as const,
              isUsable: true
            }
          }
          return m
        }))
        toast({ title: '成功', description: `已审核 ${pendingMaterials.length} 条素材（演示模式）` })
      }
    } catch (e) {
      toast({ title: '成功', description: '批量审核完成（演示模式）' })
    } finally {
      setAiReviewLoading(null)
    }
  }

  // AI生成内容
  const handleAIGenerate = async () => {
    if (selectedMaterials.length === 0) {
      toast({ title: '提示', description: '请选择至少一条素材', variant: 'destructive' })
      return
    }

    setAiGenerateLoading(true)
    try {
      const res = await fetch(`${API_BASE}/content-tasks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productAsin: generateConfig.productAsin || materials.find(m => m.id === selectedMaterials[0])?.asin,
          materialIds: selectedMaterials,
          contentType: generateConfig.contentType,
          tone: generateConfig.tone
        })
      })
      if (res.ok) {
        toast({ title: '成功', description: 'AI内容生成任务已启动' })
        setAiGenerateOpen(false)
        setActiveTab('content')
        fetchContents()
      } else {
        // 演示
        toast({ title: '成功', description: 'AI内容生成中...（演示模式）' })
        setAiGenerateOpen(false)
        setActiveTab('content')
      }
    } catch (e) {
      toast({ title: '成功', description: 'AI内容生成中...（演示模式）' })
      setAiGenerateOpen(false)
    } finally {
      setAiGenerateLoading(false)
    }
  }

  // 获取内容列表
  const fetchContents = async () => {
    setLoading(true)
    try {
      const params: { page: number; size: number; status: string; search?: string } = {
        page: 1,
        size: 10,
        status: 'draft',
      }
      if (search) params.search = search

      const response = await contentApi.list(params)
      setContents(response.contents)
    } catch (error) {
      // 演示数据
      setContents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'materials') {
      fetchMaterials()
    } else {
      fetchContents()
      fetchSyncStatus()
    }
  }, [activeTab])

  // 创建内容
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setSubmitting(true)
    try {
      const title = formData.get('title') as string
      const type = formData.get('type') as 'review' | 'blog' | 'guide' | 'science' | 'social'
      const productAsin = formData.get('product_id') as string || undefined
      const content = formData.get('content') as string

      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now()

      await contentApi.create({
        slug,
        asin: productAsin || 'B08X6XYZ9G5',
        title,
        type,
        content,
      })
      toast({ title: '成功', description: '内容已创建' })
      setDialogOpen(false)
      fetchContents()
    } catch {
      toast({ title: '错误', description: '创建内容失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // 编辑内容
  const handleEdit = (content: ContentItem) => {
    setEditingContent(content)
    setDialogOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingContent) return

    const formData = new FormData(e.currentTarget)
    setSubmitting(true)
    try {
      const data: { title?: string; status?: 'draft' | 'published' | 'review'; content?: string } = {}
      const title = formData.get('title') as string
      const status = formData.get('status') as string
      const content = formData.get('content') as string

      if (title) data.title = title
      if (status) data.status = status as 'draft' | 'published' | 'review'
      if (content) data.content = content

      await contentApi.update(editingContent.id, data)
      toast({ title: '成功', description: '内容已更新' })
      setDialogOpen(false)
      setEditingContent(null)
      fetchContents()
    } catch {
      toast({ title: '错误', description: '更新内容失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除内容
  const handleDelete = async (id: string | number) => {
    if (!confirm('确定要删除这个内容吗？')) return
    try {
      await contentApi.delete(id)
      toast({ title: '成功', description: '内容已删除' })
      fetchContents()
    } catch {
      toast({ title: '错误', description: '删除内容失败', variant: 'destructive' })
    }
  }

  // 发布内容
  const handlePublish = async (id: string | number) => {
    setSubmitting(true)
    try {
      await contentApi.review(id, 'approve', '自动审核通过')
      const { publishApi } = await import('@/lib/api')
      await publishApi.submit({ contentId: Number(id), platforms: ['Blogger'] })
      toast({ title: '成功', description: '内容已提交发布' })
      fetchContents()
    } catch {
      toast({ title: '错误', description: '发布失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // 同步到博客
  const isSyncedToBlog = (contentId: number) => articles.some(a => a.contentItemId === contentId)

  const handleSyncToBlog = async (contentId: number) => {
    setSyncing(contentId)
    try {
      await syncFromContent(contentId)
      toast({ title: '成功', description: '已同步到博客草稿' })
      fetchSyncStatus()
    } catch {
      toast({ title: '错误', description: '同步失败', variant: 'destructive' })
    } finally {
      setSyncing(null)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingContent(null)
  }

  // 获取素材来源图标
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'amazon_review': return <ShoppingCart className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">内容管理</h1>
          <p className="text-muted-foreground text-sm">素材采集 → AI审核 → 智能创作</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiGenerateOpen} onOpenChange={setAiGenerateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                const approvedMaterials = materials.filter(m => m.status === 'approved' || m.status === 'reviewed')
                setSelectedMaterials(approvedMaterials.slice(0, 3).map(m => m.id))
                setGenerateConfig({
                  ...generateConfig,
                  productAsin: approvedMaterials[0]?.asin || ''
                })
              }}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI创作
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>AI智能创作</DialogTitle>
                <DialogDescription>基于已审核素材自动生成内容</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择素材 ({selectedMaterials.length} 条已选)</Label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 mt-1 space-y-1">
                    {materials.filter(m => m.status === 'approved' || m.status === 'reviewed').map(m => (
                      <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterials([...selectedMaterials, m.id])
                            } else {
                              setSelectedMaterials(selectedMaterials.filter(id => id !== m.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="truncate flex-1">{m.content.slice(0, 50)}...</span>
                        <Badge variant="outline" className="text-xs">{m.aiQualityScore}分</Badge>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>内容类型</Label>
                  <Select value={generateConfig.contentType} onValueChange={(v: any) => setGenerateConfig({...generateConfig, contentType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">产品评测</SelectItem>
                      <SelectItem value="guide">购买指南</SelectItem>
                      <SelectItem value="comparison">产品对比</SelectItem>
                      <SelectItem value="science">科普文章</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>写作风格</Label>
                  <Select value={generateConfig.tone} onValueChange={(v: any) => setGenerateConfig({...generateConfig, tone: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">专业严谨</SelectItem>
                      <SelectItem value="casual">轻松口语</SelectItem>
                      <SelectItem value="technical">技术深度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAiGenerateOpen(false)}>取消</Button>
                  <Button onClick={handleAIGenerate} disabled={aiGenerateLoading || selectedMaterials.length === 0}>
                    {aiGenerateLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    开始生成
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingContent(null)}>手动创建</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContent ? '编辑内容' : '创建内容'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingContent ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="title">标题</Label>
                  <Input id="title" name="title" defaultValue={editingContent?.title} required />
                </div>
                {!editingContent && (
                  <>
                    <div>
                      <Label htmlFor="type">类型</Label>
                      <Select name="type" defaultValue="review" required>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product_id">关联产品 ASIN</Label>
                      <Input id="product_id" name="product_id" placeholder="B08C4KVM9K" />
                    </div>
                  </>
                )}
                {editingContent && (
                  <div>
                    <Label htmlFor="status">状态</Label>
                    <Select name="status" defaultValue={editingContent.status}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="review">审核中</SelectItem>
                        <SelectItem value="published">已发布</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="content">内容</Label>
                  <Textarea id="content" name="content" defaultValue={editingContent?.content} rows={15} required className="font-mono text-sm" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>取消</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? '提交中...' : '提交'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="materials">
            素材库
            {materials.filter(m => m.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {materials.filter(m => m.status === 'pending').length} 待审核
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">内容列表</TabsTrigger>
        </TabsList>

        {/* 素材库标签 */}
        <TabsContent value="materials" className="space-y-4">
          {/* 自动采集卡片 */}
          <Card className="border-dashed">
            <CardContent className="py-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Download className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">自动采集素材：</span>
                <Input
                  placeholder="输入产品ASIN (如: B08N5KWB9H)"
                  value={collectAsin}
                  onChange={(e) => setCollectAsin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCollectMaterials()}
                  className="max-w-xs"
                />
                <Button onClick={handleCollectMaterials} disabled={collectLoading} size="sm">
                  {collectLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  采集Amazon评论 & YouTube
                </Button>
                <div className="border-l pl-4 ml-4">
                  <span className="text-sm text-muted-foreground mr-2">或</span>
                  <Button variant="outline" size="sm" onClick={handleBatchAIReview} disabled={aiReviewLoading === -1}>
                    {aiReviewLoading === -1 ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    批量AI审核 ({materials.filter(m => m.status === 'pending').length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 素材列表 */}
          <Card>
            <CardHeader>
              <CardTitle>素材列表</CardTitle>
              <CardDescription>从Amazon评论、YouTube等渠道自动采集的素材</CardDescription>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无素材，请输入产品ASIN开始自动采集
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <Card key={material.id} className={
                      material.status === 'rejected' ? 'opacity-50' :
                      material.status === 'approved' ? 'border-green-500/50' : ''
                    }>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getSourceIcon(material.sourceType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {material.sourceType === 'amazon_review' ? 'Amazon评论' :
                                 material.sourceType === 'youtube' ? 'YouTube' : '其他'}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">{material.asin}</span>
                              {material.aiQualityScore !== undefined && (
                                <Badge variant={material.aiQualityScore >= 70 ? 'default' : 'secondary'} className="text-xs">
                                  AI评分: {material.aiQualityScore}
                                </Badge>
                              )}
                              <Badge variant={
                                material.status === 'approved' ? 'default' :
                                material.status === 'rejected' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {material.status === 'approved' ? '✓ 可用' :
                                 material.status === 'rejected' ? '✗ 不可用' :
                                 material.status === 'reviewed' ? '已审核' : '待审核'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{material.content}</p>
                            {material.aiSummary && (
                              <p className="text-xs text-blue-600 mt-1">摘要: {material.aiSummary}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {material.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleAIReviewMaterial(material.id)} disabled={aiReviewLoading === material.id}>
                                {aiReviewLoading === material.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 内容列表标签 */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>内容列表</CardTitle>
              <Input
                placeholder="搜索内容..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchContents()}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : contents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无内容，点击上方「AI创作」基于素材自动生成
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>博客同步</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contents.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="max-w-xs truncate">{content.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {content.type === 'review' ? '评测' : content.type === 'blog' ? '文章' : content.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{content.asin || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                            {statusLabels[content.status] || content.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isSyncedToBlog(content.id) ? (
                            <Badge variant="outline">已同步</Badge>
                          ) : content.status === 'approved' ? (
                            <Button variant="outline" size="sm" onClick={() => handleSyncToBlog(content.id)} disabled={syncing === content.id}>
                              {syncing === content.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                              同步
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(content)}>编辑</Button>
                            {content.status !== 'published' && (
                              <Button variant="ghost" size="sm" onClick={() => handlePublish(content.id)}>发布</Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(content.id)} className="text-destructive">删除</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
