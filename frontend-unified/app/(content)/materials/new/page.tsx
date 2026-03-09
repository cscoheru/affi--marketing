'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Youtube, FileText, MessageSquare, Upload, Link2, ArrowLeft, Sparkles, X } from 'lucide-react'
import Link from 'next/link'

const materialTypes = [
  { value: 'product_intro', label: '产品介绍', icon: FileText, description: '官方产品说明、规格参数等' },
  { value: 'user_review', label: '用户评论', icon: MessageSquare, description: '真实用户的使用反馈' },
  { value: 'youtube_review', label: 'YouTube评测', icon: Youtube, description: '视频评测的字幕内容' },
  { value: 'attachment', label: '附件', icon: Upload, description: '上传的文档或图片 (PDF/图片/MD)' },
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'text/markdown',
  'text/plain',
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const { toast } = useToast()

  // Fetch markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await marketsApi.list({ page: 1, pageSize: 100 })
        setMarkets(response.markets || [])
      } catch (error) {
        console.error('Failed to fetch markets:', error)
      } finally {
        setFetchingMarkets(false)
      }
    }
    fetchMarkets()
  }, [])

  // Auto-fill title when market changes
  useEffect(() => {
    if (marketId && !title) {
      const selectedMarket = markets.find((m) => m.id === parseInt(marketId))
      if (selectedMarket) {
        setTitle(selectedMarket.title)
      }
    }
  }, [marketId, markets, title])

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

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const isValidType = ALLOWED_FILE_TYPES.some(t =>
      file.type === t ||
      (t === 'text/markdown' && file.name.endsWith('.md')) ||
      (t === 'text/plain' && (file.name.endsWith('.md') || file.name.endsWith('.txt')))
    )

    if (!isValidType) {
      toast({
        title: '错误',
        description: '请上传 PDF、图片或 Markdown 文件',
        variant: 'destructive'
      })
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '错误',
        description: '文件大小不能超过 10MB',
        variant: 'destructive'
      })
      return
    }

    setUploadedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }

    // Auto-fill title from filename if not set
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      setTitle(fileName)
    }

    // Read file content for text files
    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setContent(e.target?.result as string || '')
      }
      reader.readAsText(file)
    }

    toast({ title: '成功', description: `已选择文件: ${file.name}` })
  }

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null)
    setFilePreview(null)
    setContent('')
  }

  // Handle form submit
  const handleCreate = async (e: React.FormEvent) => {
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
      // For attachment type with file, create a reference in content
      let materialContent = content
      let materialSourceUrl = sourceUrl

      if (type === 'attachment' && uploadedFile) {
        materialContent = content || `文件: ${uploadedFile.name}\n类型: ${uploadedFile.type}\n大小: ${(uploadedFile.size / 1024).toFixed(2)} KB`
        materialSourceUrl = sourceUrl || `file://${uploadedFile.name}`
      }

      await materialsApi.create({
        title,
        type,
        content: materialContent || undefined,
        sourceUrl: materialSourceUrl || undefined,
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
            填写素材的基本信息，选择市场后标题会自动填充（可编辑）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Market Selection */}
            <div className="space-y-2">
              <Label htmlFor="marketId">关联市场 *</Label>
              <Select
                value={marketId}
                onValueChange={(value) => {
                  setMarketId(value)
                  const selectedMarket = markets.find((m) => m.id === parseInt(value))
                  if (selectedMarket && !title) {
                    setTitle(selectedMarket.title)
                  }
                }}
                disabled={loading || fetchingMarkets}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fetchingMarkets ? "加载中..." : "选择关联的市场（标题将自动填充）"} />
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
              <Label htmlFor="title">标题 *（选择市场后自动填充，可编辑）</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="选择市场后自动填充，或手动输入"
                disabled={loading}
              />
            </div>

            {/* File Upload (for attachment type) */}
            {type === 'attachment' && (
              <div className="space-y-2">
                <Label>上传文件（支持 PDF、图片、MD 格式）</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(uploadedFile.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {filePreview && (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-h-48 rounded border"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        点击或拖拽文件到此处上传
                      </p>
                      <p className="text-xs text-muted-foreground">
                        支持 PDF、PNG、JPG、GIF、WebP、MD 格式，最大 10MB
                      </p>
                      <Input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.md,.txt"
                        onChange={handleFileUpload}
                        className="mt-4"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

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
            {type !== 'youtube_review' && type !== 'attachment' && (
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
                    : type === 'attachment'
                    ? '上传文件后自动填充，或手动输入内容...'
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
