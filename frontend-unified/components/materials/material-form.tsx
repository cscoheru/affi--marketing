'use client'

import { useState } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { materialsApi, marketsApi, type MaterialType, type MarketOpportunity } from '@/lib/api'
import { Loader2, Youtube, FileText, MessageSquare, Upload, Link2 } from 'lucide-react'

interface MaterialFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultMarketId?: number
  defaultType?: MaterialType
}

const materialTypes = [
  { value: 'product_intro', label: '产品介绍', icon: FileText, description: '官方产品说明、规格参数等' },
  { value: 'user_review', label: '用户评论', icon: MessageSquare, description: '真实用户的使用反馈' },
  { value: 'youtube_review', label: 'YouTube评测', icon: Youtube, description: '视频评测的字幕内容' },
  { value: 'attachment', label: '附件', icon: Upload, description: '上传的文档或图片' },
]

export function MaterialForm({
  open,
  onOpenChange,
  onSuccess,
  defaultMarketId,
  defaultType = 'product_intro',
}: MaterialFormProps) {
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingMarkets, setFetchingMarkets] = useState(false)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MaterialType>(defaultType)
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [marketId, setMarketId] = useState(defaultMarketId?.toString() || '')

  const { toast } = useToast()

  // Fetch markets when dialog opens
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

  // Handle dialog open change
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchMarkets()
      // Reset form if not editing
      if (!defaultMarketId) {
        setTitle('')
        setContent('')
        setSourceUrl('')
        setMarketId('')
      }
    }
    onOpenChange(newOpen)
  }

  // Fetch YouTube transcript
  const fetchYoutubeTranscript = async () => {
    if (!sourceUrl.trim()) {
      toast({ title: '错误', description: '请先输入 YouTube 链接', variant: 'destructive' })
      return
    }

    setYoutubeLoading(true)
    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '获取字幕失败')
      }

      setContent(data.transcript)
      if (!title) {
        setTitle(`YouTube 评测 - ${data.videoId}`)
      }
      toast({
        title: '成功',
        description: `已获取字幕内容（约 ${data.wordCount} 字）`,
      })
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取字幕失败',
        variant: 'destructive',
      })
    } finally {
      setYoutubeLoading(false)
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
      await materialsApi.create({
        title,
        type,
        content: content || undefined,
        sourceUrl: sourceUrl || undefined,
        marketId: parseInt(marketId),
      })

      toast({ title: '成功', description: '素材已创建' })
      onSuccess()
      onOpenChange(false)

      // Reset form
      setTitle('')
      setContent('')
      setSourceUrl('')
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '创建素材失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedType = materialTypes.find((t) => t.value === type)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加素材</DialogTitle>
          <DialogDescription>
            创建新的内容素材，支持产品介绍、用户评论、YouTube评测和附件
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Market Selection */}
          <div className="space-y-2">
            <Label htmlFor="marketId">关联市场 *</Label>
            <Select value={marketId} onValueChange={setMarketId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="选择关联的市场" />
              </SelectTrigger>
              <SelectContent>
                {fetchingMarkets ? (
                  <SelectItem value="_loading" disabled>
                    加载中...
                  </SelectItem>
                ) : (
                  markets.map((market) => (
                    <SelectItem key={market.id} value={market.id.toString()}>
                      {market.title} ({market.asin})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Material Type */}
          <div className="space-y-2">
            <Label htmlFor="type">素材类型 *</Label>
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
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入素材标题"
              disabled={loading}
            />
          </div>

          {/* YouTube URL (for youtube_review type) */}
          {type === 'youtube_review' && (
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">YouTube 链接</Label>
              <div className="flex gap-2">
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={loading || youtubeLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchYoutubeTranscript}
                  disabled={youtubeLoading || loading}
                >
                  {youtubeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span className="ml-2">获取字幕</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                输入 YouTube 视频链接，点击获取字幕自动填充内容
              </p>
            </div>
          )}

          {/* Source URL (for other types) */}
          {type !== 'youtube_review' && (
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">来源链接</Label>
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === 'product_intro'
                  ? '粘贴产品介绍内容...'
                  : type === 'user_review'
                  ? '粘贴用户评论内容...'
                  : '素材内容...'
              }
              rows={8}
              disabled={loading}
              className="resize-none"
            />
            {content && (
              <p className="text-xs text-muted-foreground">
                约 {content.length} 字符 / {content.split(/\s+/).filter(Boolean).length} 词
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建素材
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
