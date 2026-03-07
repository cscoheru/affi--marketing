'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, marketsApi, type MaterialType, type MarketOpportunity } from '@/lib/api'
import { Loader2, Youtube, FileText, MessageSquare, Upload, Save } from 'lucide-react'

interface SaveMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultContent?: string
  defaultTitle?: string
  defaultMarketId?: number
  defaultType?: MaterialType
  onSuccess?: (materialId: number) => void
}

const materialTypes = [
  { value: 'product_intro', label: '产品介绍', icon: FileText, description: '官方产品说明、规格参数等' },
  { value: 'user_review', label: '用户评论', icon: MessageSquare, description: '真实用户的使用反馈' },
  { value: 'youtube_review', label: 'YouTube评测', icon: Youtube, description: '视频评测的字幕内容' },
  { value: 'attachment', label: '附件', icon: Upload, description: '上传的文档或图片' },
]

export function SaveMaterialDialog({
  open,
  onOpenChange,
  defaultContent = '',
  defaultTitle = '',
  defaultMarketId,
  defaultType = 'product_intro',
  onSuccess,
}: SaveMaterialDialogProps) {
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingMarkets, setFetchingMarkets] = useState(false)

  // Form state
  const [title, setTitle] = useState(defaultTitle)
  const [type, setType] = useState<MaterialType>(defaultType)
  const [content, setContent] = useState(defaultContent)
  const [sourceUrl, setSourceUrl] = useState('')
  const [marketId, setMarketId] = useState(defaultMarketId?.toString() || '')
  const [saveAsDraft, setSaveAsDraft] = useState(true)

  const { toast } = useToast()

  // Fetch markets when dialog opens
  useEffect(() => {
    if (open) {
      fetchMarkets()
      // Reset form with defaults when dialog opens
      setTitle(defaultTitle)
      setContent(defaultContent)
      setType(defaultType)
      if (defaultMarketId) {
        setMarketId(defaultMarketId.toString())
      }
    }
  }, [open, defaultContent, defaultTitle, defaultMarketId, defaultType])

  const fetchMarkets = async () => {
    if (markets.length > 0) return
    setFetchingMarkets(true)
    try {
      const response = await marketsApi.list({ page: 1, pageSize: 100 })
      setMarkets(response.markets)
    } catch (error) {
      console.error('Failed to fetch markets:', error)
    } finally {
      setFetchingMarkets(false)
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({ title: '错误', description: '请输入标题', variant: 'destructive' })
      return
    }
    if (!marketId) {
      toast({ title: '错误', description: '请选择关联市场', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await materialsApi.create({
        title,
        type,
        content: content || undefined,
        sourceUrl: sourceUrl || undefined,
        marketId: parseInt(marketId),
      })

      toast({ title: '成功', description: '素材已保存' })
      onSuccess?.(response.id)
      onOpenChange(false)

      // Reset form
      setSourceUrl('')
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '保存素材失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedType = materialTypes.find((t) => t.value === type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            保存为素材
          </DialogTitle>
          <DialogDescription>
            将内容保存到素材库，方便后续使用和AI创作引用
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Market Selection */}
          <div className="space-y-2">
            <Label htmlFor="save-marketId">关联市场 *</Label>
            <Select value={marketId} onValueChange={setMarketId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={fetchingMarkets ? "加载中..." : "选择关联的市场"} />
              </SelectTrigger>
              <SelectContent>
                {markets.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    {market.title} ({market.asin})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material Type */}
          <div className="space-y-2">
            <Label htmlFor="save-type">素材类型 *</Label>
            <Select value={type} onValueChange={(v) => setType(v as MaterialType)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((t) => {
                  const Icon = t.icon
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-xs text-muted-foreground">{selectedType.description}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="save-title">标题 *</Label>
            <Input
              id="save-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入素材标题"
              disabled={loading}
            />
          </div>

          {/* Source URL */}
          <div className="space-y-2">
            <Label htmlFor="save-sourceUrl">来源链接</Label>
            <Input
              id="save-sourceUrl"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="save-content">内容</Label>
              {content && (
                <span className="text-xs text-muted-foreground">
                  约 {content.length} 字符
                </span>
              )}
            </div>
            <Textarea
              id="save-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="素材内容..."
              rows={8}
              disabled={loading}
              className="resize-none"
            />
          </div>

          {/* Save as draft option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-as-draft"
              checked={saveAsDraft}
              onCheckedChange={(checked) => setSaveAsDraft(checked as boolean)}
            />
            <Label htmlFor="save-as-draft" className="text-sm font-normal">
              保存为草稿（不立即在素材库中显示）
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              保存素材
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
