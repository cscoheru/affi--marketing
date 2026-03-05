'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ContentTable } from '@/components/content-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { mockContents, mockProducts } from '@/lib/mock-data'
import type { Content } from '@/lib/types'

export default function ContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reviewingContent, setReviewingContent] = useState<Content | null>(null)
  const [reviewDecision, setReviewDecision] = useState('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [createForm, setCreateForm] = useState({
    product: '',
    type: 'review',
    model: 'claude-3-5-sonnet',
  })

  const filteredContents = useMemo(() => {
    if (activeTab === 'all') return mockContents
    return mockContents.filter((c) => c.status === activeTab)
  }, [activeTab])

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setCreateDialogOpen(false)
    }, 2000)
  }

  const handleReview = (content: Content) => {
    setReviewingContent(content)
    setReviewDialogOpen(true)
  }

  const handleEdit = (content: Content) => {
    // Navigate to editor or open edit dialog
    console.log('Edit:', content.id)
  }

  const handlePublish = (content: Content) => {
    router.push(`/publish?content=${content.id}`)
  }

  const handleSubmitReview = () => {
    console.log('Review:', reviewDecision, reviewComment)
    setReviewDialogOpen(false)
    setReviewComment('')
  }

  const counts = useMemo(() => ({
    all: mockContents.length,
    draft: mockContents.filter(c => c.status === 'draft').length,
    reviewing: mockContents.filter(c => c.status === 'reviewing').length,
    approved: mockContents.filter(c => c.status === 'approved').length,
    published: mockContents.filter(c => c.status === 'published').length,
  }), [])

  return (
    <DashboardLayout title="内容管理">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>共 <strong className="text-foreground">{counts.all}</strong> 篇</span>
            <span>草稿 <strong className="text-foreground">{counts.draft}</strong></span>
            <span>待审核 <strong className="text-foreground">{counts.reviewing}</strong></span>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Sparkles className="mr-1.5 size-4" />
            AI 生成内容
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部 ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">草稿 ({counts.draft})</TabsTrigger>
            <TabsTrigger value="reviewing">待审核 ({counts.reviewing})</TabsTrigger>
            <TabsTrigger value="approved">已通过 ({counts.approved})</TabsTrigger>
            <TabsTrigger value="published">已发布 ({counts.published})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ContentTable
              contents={filteredContents}
              onEdit={handleEdit}
              onReview={handleReview}
              onPublish={handlePublish}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 生成内容</DialogTitle>
            <DialogDescription>
              选择产品和内容类型，AI 将自动生成文章
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label>选择产品</Label>
              <Select value={createForm.product} onValueChange={(v) => setCreateForm({ ...createForm, product: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择产品" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>内容类型</Label>
              <RadioGroup
                value={createForm.type}
                onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="review" id="type-review" />
                  <Label htmlFor="type-review" className="font-normal">评测文章</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="science" id="type-science" />
                  <Label htmlFor="type-science" className="font-normal">科普文章</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="guide" id="type-guide" />
                  <Label htmlFor="type-guide" className="font-normal">购买指南</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label>AI 模型</Label>
              <Select value={createForm.model} onValueChange={(v) => setCreateForm({ ...createForm, model: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !createForm.product}>
              {generating && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {generating ? '生成中...' : '开始生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>内容审核</DialogTitle>
            <DialogDescription>
              审核 AI 生成的内容，决定是否发布
            </DialogDescription>
          </DialogHeader>
          {reviewingContent && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{reviewingContent.title}</h3>
                <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                  <span>{reviewingContent.type === 'review' ? '评测' : reviewingContent.type === 'science' ? '科普' : '指南'}</span>
                  <span>{reviewingContent.wordCount} 字</span>
                  <span>ASIN: {reviewingContent.asin}</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                {reviewingContent.content}
              </div>
              <div className="flex flex-col gap-2">
                <Label>审核结果</Label>
                <RadioGroup
                  value={reviewDecision}
                  onValueChange={setReviewDecision}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="approve" id="decision-approve" />
                    <Label htmlFor="decision-approve" className="font-normal">通过</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="reject" id="decision-reject" />
                    <Label htmlFor="decision-reject" className="font-normal">拒绝</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="revision" id="decision-revision" />
                    <Label htmlFor="decision-revision" className="font-normal">需修改</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex flex-col gap-2">
                <Label>审核意见</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="输入审核意见（可选）"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReview}>
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
