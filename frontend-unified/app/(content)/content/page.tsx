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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { RefreshCw, ArrowRight } from 'lucide-react'

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
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const { toast } = useToast()
  const { syncFromContent, syncAllPendingContent, fetchSyncStatus, articles } = useBlogStore()

  // 获取内容列表
  const fetchContents = async () => {
    setLoading(true)
    try {
      const params: { page: number; size: number; status: string; search?: string; type?: string } = {
        page: 1,
        size: 10,
        status: 'draft',
      }
      if (search) params.search = search
      if (activeTab !== 'all') params.type = activeTab

      const response = await contentApi.list(params)
      setContents(response.contents)
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取内容列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
    fetchSyncStatus()
  }, [activeTab])

  // 搜索处理
  const handleSearch = () => {
    fetchContents()
  }

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

      // 生成 slug (从标题转成小写并替换空格为连字符)
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now()

      const data = {
        slug,
        asin: productAsin || 'B08X6YZ9G5',
        title,
        type,
        content,
      }

      await contentApi.create(data)
      toast({
        title: '成功',
        description: '内容已创建',
      })
      setDialogOpen(false)
      fetchContents()
    } catch {
      toast({
        title: '错误',
        description: '创建内容失败',
        variant: 'destructive',
      })
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
      toast({
        title: '成功',
        description: '内容已更新',
      })
      setDialogOpen(false)
      setEditingContent(null)
      fetchContents()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '更新内容失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除内容
  const handleDelete = async (id: string | number) => {
    if (!confirm('确定要删除这个内容吗？')) return

    try {
      await contentApi.delete(id)
      toast({
        title: '成功',
        description: '内容已删除',
      })
      fetchContents()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '删除内容失败',
        variant: 'destructive',
      })
    }
  }

  // 发布内容 - 先审核通过，再提交发布任务
  const handlePublish = async (id: string | number) => {
    setSubmitting(true)
    try {
      // 步骤1: 审核通过
      await contentApi.review(id, 'approve', '自动审核通过')

      // 步骤2: 提交发布任务（发布到 Blogger 等平台）
      const { publishApi } = await import('@/lib/api')
      await publishApi.submit({
        contentId: Number(id),
        platforms: ['Blogger'],
      })

      toast({
        title: '成功',
        description: '内容已审核通过并提交发布',
      })
      fetchContents()
    } catch {
      toast({
        title: '错误',
        description: '发布内容失败，请确保内容已通过审核',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingContent(null)
  }

  // 检查内容是否已同步到博客
  const isSyncedToBlog = (contentId: number) => {
    return articles.some(a => a.contentItemId === contentId)
  }

  // 同步单个内容到博客
  const handleSyncToBlog = async (contentId: number) => {
    setSyncing(contentId)
    try {
      await syncFromContent(contentId)
      toast({
        title: '同步成功',
        description: '内容已同步到博客草稿',
      })
      fetchSyncStatus()
    } catch (error) {
      toast({
        title: '同步失败',
        description: error instanceof Error ? error.message : '同步到博客失败',
        variant: 'destructive',
      })
    } finally {
      setSyncing(null)
    }
  }

  // 批量同步所有已审核通过的内容
  const handleBatchSync = async () => {
    setBatchSyncing(true)
    try {
      const result = await syncAllPendingContent()
      toast({
        title: '批量同步完成',
        description: `成功同步 ${result.synced} 篇，失败 ${result.failed} 篇`,
      })
      fetchSyncStatus()
    } catch (error) {
      toast({
        title: '批量同步失败',
        description: error instanceof Error ? error.message : '批量同步失败',
        variant: 'destructive',
      })
    } finally {
      setBatchSyncing(false)
    }
  }

  // 过滤后的内容
  const filteredContents = contents.filter(c =>
    activeTab === 'all' || c.type === activeTab
  )

  // 获取待同步数量（已审核通过但未同步的内容）
  const pendingSyncCount = contents.filter(c =>
    c.status === 'approved' && !isSyncedToBlog(c.id)
  ).length

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">内容管理</h1>
          {pendingSyncCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchSync}
              disabled={batchSyncing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${batchSyncing ? 'animate-spin' : ''}`} />
              同步 {pendingSyncCount} 篇到博客
            </Button>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContent(null)}>创建内容</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContent ? '编辑内容' : '创建内容'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingContent ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingContent?.title}
                  required
                />
              </div>

              {!editingContent && (
                <>
                  <div>
                    <Label htmlFor="type">类型</Label>
                    <Select name="type" defaultValue="review" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="product_id">关联产品 ASIN (可选)</Label>
                    <Input
                      id="product_id"
                      name="product_id"
                      placeholder="B08C4KVM9K"
                    />
                  </div>
                </>
              )}

              {editingContent && (
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select name="status" defaultValue={editingContent.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingContent?.content}
                  rows={15}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '提交中...' : '提交'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="review">评测</TabsTrigger>
          <TabsTrigger value="blog">文章</TabsTrigger>
          <TabsTrigger value="guide">指南</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>内容列表</CardTitle>
              <Input
                placeholder="搜索内容..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : filteredContents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无内容数据
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
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContents.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="max-w-xs truncate">{content.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {content.type === 'review' ? '评测' :
                             content.type === 'blog' ? '文章' :
                             content.type === 'guide' ? '指南' :
                             content.type === 'science' ? '科普' : '社媒'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{content.asin || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={content.status === 'published' ? 'default' : 'secondary'}
                          >
                            {statusLabels[content.status] || content.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isSyncedToBlog(content.id) ? (
                            <Badge variant="outline" className="gap-1">
                              <span>已同步</span>
                            </Badge>
                          ) : content.status === 'approved' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncToBlog(content.id)}
                              disabled={syncing === content.id}
                              className="gap-1"
                            >
                              {syncing === content.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <ArrowRight className="h-3 w-3" />
                              )}
                              同步
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(content.createdAt).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(content)}
                            >
                              编辑
                            </Button>
                            {content.status !== 'published' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublish(content.id)}
                              >
                                发布
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(content.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              删除
                            </Button>
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
