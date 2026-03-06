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

const contentTypes = [
  { value: 'article', label: '文章' },
  { value: 'review', label: '评测' },
  { value: 'comparison', label: '对比' },
]

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  review: '审核中',
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // 获取内容列表
  const fetchContents = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, pageSize: 10, status: 'draft' }
      if (search) params.search = search
      if (activeTab !== 'all') params.type = activeTab

      const response = await contentApi.list(params)
      setContents(response.Contents)
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
      const data = {
        title: formData.get('title') as string,
        type: formData.get('type') as 'article' | 'review' | 'comparison',
        product_id: formData.get('product_id') as string || undefined,
        content: formData.get('content') as string,
      }

      await contentApi.create(data)
      toast({
        title: '成功',
        description: '内容已创建',
      })
      setDialogOpen(false)
      fetchContents()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '创建内容失败',
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
      const data: any = {}
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
  const handleDelete = async (id: string) => {
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

  // 发布内容
  const handlePublish = async (id: string) => {
    try {
      await contentApi.publish(id)
      toast({
        title: '成功',
        description: '内容已发布',
      })
      fetchContents()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '发布内容失败',
        variant: 'destructive',
      })
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingContent(null)
  }

  // 过滤后的内容
  const filteredContents = contents.filter(c =>
    activeTab === 'all' || c.type === activeTab
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">内容管理</h1>
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
                    <Select name="type" defaultValue="article" required>
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
          <TabsTrigger value="article">文章</TabsTrigger>
          <TabsTrigger value="review">评测</TabsTrigger>
          <TabsTrigger value="comparison">对比</TabsTrigger>
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
                            {content.type === 'article' ? '文章' :
                             content.type === 'review' ? '评测' : '对比'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{content.product_asin || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={content.status === 'published' ? 'default' : 'secondary'}
                          >
                            {statusLabels[content.status] || content.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(content.created_at).toLocaleDateString('zh-CN')}
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
