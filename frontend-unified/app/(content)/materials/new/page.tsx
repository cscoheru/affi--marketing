'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, marketsApi, type MaterialType, type MarketOpportunity } from '@/lib/api'
import { Loader2, Youtube, FileText, MessageSquare, Upload, Link2, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

const materialTypes = [
  { value: 'product_intro', label: '产品介绍', icon: FileText, description: '官方产品说明、规格参数等' },
  { value: 'user_review', label: '用户评论', icon: MessageSquare, description: '真实用户的使用反馈' },
  { value: 'youtube_review', label: 'YouTube评测', icon: Youtube, description: '视频评测的字幕内容' },
  { value: 'attachment', label: '附件', icon: Upload, description: '上传的文档或图片' },
]

export default function NewMaterialPage() {
  const router = useRouter()
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingMarkets, setFetchingMarkets] = useState(true)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MaterialType>('product_intro')
  const [content, setContent] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [marketId, setMarketId] = useState('')

  const { toast } = useToast()

  // Fetch markets on mount
  useState(() => {
    const fetchMarkets = async () => {
      try {
        const response = await marketsApi.list({ page: 1, pageSize: 100 })
        setMarkets(response.markets)
      } catch (error) {
        console.error('Failed to fetch markets:', error)
      } finally {
        setFetchingMarkets(false)
      }
    }
    fetchMarkets()
  })

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
      router.push('/materials')
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
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/materials">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">添加素材</h1>
          <p className="text-muted-foreground">创建新的内容素材</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/ai-create">
            <Sparkles className="w-4 h-4 mr-2" />
            AI 创作
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>素材信息</CardTitle>
          <CardDescription>
            填写素材的基本信息，支持产品介绍、用户评论、YouTube评测等类型
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Market Selection */}
            <div className="space-y-2">
              <Label htmlFor="marketId">关联市场 *</Label>
              <Select value={marketId} onValueChange={setMarketId} disabled={loading || fetchingMarkets}>
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
              {markets.length === 0 && !fetchingMarkets && (
                <p className="text-xs text-muted-foreground">
                  暂无市场数据，请先在市场战略中添加产品
                </p>
              )}
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label htmlFor="type">素材类型 *</Label>
              <div className="grid grid-cols-2 gap-2">
                {materialTypes.map((t) => {
                  const Icon = t.icon
                  const isSelected = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value as MaterialType)}
                      disabled={loading}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
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
                    <span className="ml-2 hidden sm:inline">获取字幕</span>
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
                rows={10}
                disabled={loading}
                className="resize-none"
              />
              {content && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>约 {content.length} 字符</span>
                  <span>{content.split(/\s+/).filter(Boolean).length} 词</span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/materials')}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                创建素材
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
