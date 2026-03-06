'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { publishApi, type PublishTask, type ContentItem } from '@/lib/api'
import { contentApi } from '@/lib/api'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const platforms = [
  { value: 'Blogger', label: 'Blogger' },
  { value: 'Medium', label: 'Medium' },
  { value: 'WordPress', label: 'WordPress' },
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
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // 获取发布任务列表
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, pageSize: 10 }
      if (activeTab !== 'all') params.status = activeTab

      const response = await publishApi.list(params)
      setTasks(response.queue)
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取发布任务失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取可发布内容列表
  const fetchContents = async () => {
    try {
      const response = await contentApi.list({ status: 'published', size: 100 })
      setContents(response.contents)
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [activeTab])

  useEffect(() => {
    if (dialogOpen) {
      fetchContents()
    }
  }, [dialogOpen])

  // 创建发布任务
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setSubmitting(true)
    try {
      const contentId = Number(formData.get('content_id'))
      const platform = formData.get('platform') as string

      // 调用发布 API
      await publishApi.submit({
        contentId,
        platforms: [platform],
      })

      toast({
        title: '成功',
        description: '发布任务已创建，正在后台执行',
      })
      setDialogOpen(false)
      fetchTasks()
    } catch {
      toast({
        title: '错误',
        description: '创建发布任务失败，请确保内容已审核通过',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 重试发布任务
  const handleRetry = async (id: number) => {
    setExecuting(String(id))
    try {
      await publishApi.retry(id)
      toast({
        title: '成功',
        description: '发布任务已重新启动',
      })
      fetchTasks()
    } catch {
      toast({
        title: '错误',
        description: '重试发布任务失败',
        variant: 'destructive',
      })
    } finally {
      setExecuting(null)
    }
  }

  // 获取内容标题
  const getContentTitle = (contentId: string | number) => {
    const content = contents.find(c => c.id === contentId)
    return content?.title || String(contentId)
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">发布中心</h1>
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
                <Select name="platform" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '提交中...' : '提交发布'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
              <CardTitle>
                发布任务
                {activeTab !== 'all' && ` (${statusConfig[activeTab]?.label})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无发布任务
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => {
                    // Parse platforms from JSON string
                    let platformList: string[] = []
                    try {
                      platformList = JSON.parse(task.platforms)
                    } catch {
                      platformList = []
                    }

                    // Parse results to extract URLs
                    let resultsData: Record<string, {url?: string; status?: string}> = {}
                    try {
                      resultsData = JSON.parse(task.results)
                    } catch {
                      resultsData = {}
                    }

                    return (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{getContentTitle(String(task.contentId))}</h3>
                          {platformList.map((p) => (
                            <Badge key={p} variant="outline">{p}</Badge>
                          ))}
                          <Badge variant={statusConfig[task.status]?.variant}>
                            {statusConfig[task.status]?.label || task.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          创建时间: {formatTime(task.createdAt)}
                        </div>
                      </div>

                      {/* Display publish results */}
                      {Object.keys(resultsData).length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-2">发布结果:</p>
                          {Object.entries(resultsData).map(([platform, result]) => (
                            <div key={platform} className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{platform}:</span>
                              {result.url ? (
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {result.url}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">
                                  {result.status || '未知状态'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {task.errorMsg && (
                        <p className="mt-3 text-sm text-destructive">错误: {task.errorMsg}</p>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
