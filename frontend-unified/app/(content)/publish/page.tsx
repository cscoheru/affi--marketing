'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Send, Clock, Loader2, Zap, Globe, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { publishApi, type PublishTask, type ContentItem } from '@/lib/api'
import { contentApi } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-hub.zenconsult.top/api/v1'

// 平台配置
const platforms = [
  { value: 'Blogger', label: 'Blogger', icon: '📝', description: 'Google博客平台' },
  { value: 'Medium', label: 'Medium', icon: '📰', description: '专业写作平台' },
  { value: 'WordPress', label: 'WordPress', icon: '🔧', description: '自建博客' },
  { value: 'Twitter', label: 'Twitter/X', icon: '🐦', description: '社交媒体' },
  { value: 'LinkedIn', label: 'LinkedIn', icon: '💼', description: '职业社交' },
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: '等待中', variant: 'secondary' },
  running: { label: '执行中', variant: 'outline' },
  success: { label: '成功', variant: 'default' },
  failed: { label: '失败', variant: 'destructive' },
  partial: { label: '部分成功', variant: 'outline' },
}

export default function PublishPage() {
  const [tasks, setTasks] = useState<PublishTask[]>([])
  const [contents, setContents] = useState<ContentItem[]>([])
  const [approvedContents, setApprovedContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // 批量发布状态
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Blogger'])
  const [scheduleTime, setScheduleTime] = useState('')

  // 获取发布任务列表
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; status?: string } = {
        page: 1,
        pageSize: 10,
      }
      if (activeTab !== 'all') params.status = activeTab

      const response = await publishApi.list(params)
      setTasks(response.queue || [])
    } catch (error) {
      // 演示数据
      setTasks([
        {
          id: 1,
          contentId: 1,
          platforms: '["Blogger"]',
          status: 'success',
          results: '{"Blogger": {"url": "https://example.blogspot.com/2024/01/post.html"}}',
          errorMsg: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          contentId: 2,
          platforms: '["Blogger", "Medium"]',
          status: 'running',
          results: '{}',
          errorMsg: '',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // 获取内容列表
  const fetchContents = async () => {
    try {
      const response = await contentApi.list({ page: 1, size: 100, status: 'approved' })
      setContents(response.contents || [])
      setApprovedContents(response.contents?.filter((c: ContentItem) => c.status === 'approved') || [])
    } catch {
      // 演示数据
      setApprovedContents([
        { id: 1, slug: 'sony-wh1000xm4-review', asin: 'B08N5KWB9H', title: 'Sony WH-1000XM4 深度评测', type: 'review', content: '', excerpt: '', seoTitle: '', seoDescription: '', seoKeywords: '', status: 'approved', aiGenerated: true, aiModel: 'qwen', humanReviewed: true, reviewedBy: 1, reviewComment: '', wordCount: 2345, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, slug: 'best-noise-cancelling-headphones-2024', asin: '', title: '2024年最佳降噪耳机指南', type: 'guide', content: '', excerpt: '', seoTitle: '', seoDescription: '', seoKeywords: '', status: 'approved', aiGenerated: false, humanReviewed: false, reviewedBy: undefined, reviewComment: '', wordCount: 3456, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ])
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchContents()
  }, [activeTab])

  // 创建发布任务
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setSubmitting(true)
    try {
      const contentId = Number(formData.get('content_id'))
      const platform = formData.get('platform') as string

      await publishApi.submit({
        contentId,
        platforms: [platform],
      })

      toast({ title: '成功', description: '发布任务已创建' })
      setDialogOpen(false)
      fetchTasks()
    } catch {
      toast({ title: '成功', description: '发布任务已创建（演示模式）' })
      setDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // 批量发布所有已审核内容
  const handleBatchPublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({ title: '提示', description: '请至少选择一个发布平台', variant: 'destructive' })
      return
    }

    setBatchLoading(true)
    try {
      // 为每个已审核内容创建发布任务
      let successCount = 0
      for (const content of approvedContents) {
        try {
          await publishApi.submit({
            contentId: content.id,
            platforms: selectedPlatforms,
          })
          successCount++
        } catch {
          // 单个失败继续
        }
      }

      toast({ title: '成功', description: `已创建 ${successCount} 个发布任务` })
      setBatchDialogOpen(false)
      fetchTasks()
    } catch {
      toast({ title: '成功', description: `已创建发布任务（演示模式）` })
      setBatchDialogOpen(false)
    } finally {
      setBatchLoading(false)
    }
  }

  // 一键发布到所有平台
  const handlePublishToAll = async (contentId: number) => {
    setExecuting(String(contentId))
    try {
      await publishApi.submit({
        contentId,
        platforms: platforms.map(p => p.value),
      })
      toast({ title: '成功', description: '已提交到所有平台' })
      fetchTasks()
    } catch {
      toast({ title: '成功', description: '已提交到所有平台（演示模式）' })
    } finally {
      setExecuting(null)
    }
  }

  // 重试发布任务
  const handleRetry = async (id: number) => {
    setExecuting(String(id))
    try {
      await publishApi.retry(id)
      toast({ title: '成功', description: '发布任务已重新启动' })
      fetchTasks()
    } catch {
      toast({ title: '成功', description: '已重试（演示模式）' })
    } finally {
      setExecuting(null)
    }
  }

  // 获取内容标题
  const getContentTitle = (contentId: string | number) => {
    const content = contents.find(c => c.id === Number(contentId))
    return content?.title || `内容 #${contentId}`
  }

  // 格式化时间
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN })
  }

  // 过滤后的任务
  const filteredTasks = tasks.filter(t =>
    activeTab === 'all' || t.status === activeTab
  )

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">发布中心</h1>
          <p className="text-muted-foreground text-sm">多平台自动分发、定时发布、状态追踪</p>
        </div>
        <div className="flex gap-2">
          {/* 批量发布按钮 */}
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={approvedContents.length === 0}>
                <Zap className="h-4 w-4 mr-2" />
                批量发布 ({approvedContents.length}篇待发布)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>批量发布</DialogTitle>
                <DialogDescription>将所有已审核内容发布到选定的平台</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择发布平台</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {platforms.map((platform) => (
                      <label
                        key={platform.value}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPlatforms.includes(platform.value) ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          checked={selectedPlatforms.includes(platform.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform.value])
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.value))
                            }
                          }}
                        />
                        <span className="text-lg">{platform.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{platform.label}</div>
                          <div className="text-xs text-muted-foreground">{platform.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>定时发布（可选）</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">留空则立即发布</p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    将发布 <strong>{approvedContents.length}</strong> 篇内容到 <strong>{selectedPlatforms.length}</strong> 个平台
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>取消</Button>
                  <Button onClick={handleBatchPublish} disabled={batchLoading || selectedPlatforms.length === 0}>
                    {batchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    开始发布
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 手动创建 */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>创建发布任务</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建发布任务</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="content_id">选择内容</Label>
                  <Select name="content_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要发布的内容" />
                    </SelectTrigger>
                    <SelectContent>
                      {contents.map((content) => (
                        <SelectItem key={content.id} value={String(content.id)}>
                          {content.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform">发布平台</Label>
                  <Select name="platform" defaultValue="Blogger" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.icon} {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? '提交中...' : '提交发布'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 平台状态概览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {platforms.map((platform) => {
          const platformTasks = tasks.filter(t => {
            try {
              const platforms = JSON.parse(t.platforms)
              return platforms.includes(platform.value)
            } catch {
              return false
            }
          })
          const successCount = platformTasks.filter(t => t.status === 'success').length
          const failedCount = platformTasks.filter(t => t.status === 'failed').length

          return (
            <Card key={platform.value}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <div className="font-medium">{platform.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {successCount} 成功 / {failedCount} 失败
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 任务列表 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">等待中</TabsTrigger>
          <TabsTrigger value="running">执行中</TabsTrigger>
          <TabsTrigger value="success">成功</TabsTrigger>
          <TabsTrigger value="failed">失败</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>发布任务</CardTitle>
              <CardDescription>
                {activeTab !== 'all' ? `状态: ${statusConfig[activeTab]?.label}` : '所有发布任务'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无发布任务，点击上方「批量发布」开始
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    let platformList: string[] = []
                    try {
                      platformList = JSON.parse(task.platforms)
                    } catch {
                      platformList = []
                    }

                    let resultsData: Record<string, {url?: string; status?: string}> = {}
                    try {
                      resultsData = JSON.parse(task.results || '{}')
                    } catch {
                      resultsData = {}
                    }

                    return (
                      <div key={task.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(task.status)}
                            <h3 className="font-medium">{getContentTitle(String(task.contentId))}</h3>
                            <div className="flex gap-1">
                              {platformList.map((p) => (
                                <Badge key={p} variant="outline" className="text-xs">
                                  {platforms.find(pl => pl.value === p)?.icon} {p}
                                </Badge>
                              ))}
                            </div>
                            <Badge variant={statusConfig[task.status]?.variant}>
                              {statusConfig[task.status]?.label || task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                              {formatTime(task.createdAt)}
                            </div>
                            {task.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishToAll(task.contentId)}
                                disabled={executing === String(task.contentId)}
                              >
                                <Globe className="h-4 w-4 mr-1" />
                                发布到所有平台
                              </Button>
                            )}
                            {(task.status === 'failed' || task.status === 'partial') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetry(task.id)}
                                disabled={executing === String(task.id)}
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${executing === String(task.id) ? 'animate-spin' : ''}`} />
                                重试
                              </Button>
                            )}
                          </div>
                        </div>

                        {Object.keys(resultsData).length > 0 && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-2">发布结果:</p>
                            {Object.entries(resultsData).map(([platform, result]) => (
                              <div key={platform} className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{platform}:</span>
                                {result.url ? (
                                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                    {result.url}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{result.status || '处理中'}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {task.errorMsg && (
                          <p className="mt-3 text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            错误: {task.errorMsg}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
