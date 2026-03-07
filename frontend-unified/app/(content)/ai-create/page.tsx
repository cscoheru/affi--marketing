'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { marketsApi, materialsApi, type Material, type MarketOpportunity } from '@/lib/api'
import {
  Loader2,
  Sparkles,
  FileText,
  MessageSquare,
  Youtube,
  ArrowLeft,
  Copy,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type ContentType = 'product_intro' | 'user_review' | 'youtube_review'
type ToneType = 'professional' | 'casual' | 'friendly'
type LengthType = 'short' | 'medium' | 'long'

const contentTypes: Record<ContentType, { label: string; description: string }> = {
  product_intro: {
    label: '产品介绍',
    description: '基于产品信息和素材撰写专业的产品介绍文章',
  },
  user_review: {
    label: '用户评测',
    description: '整合用户评论，撰写客观全面的产品评测',
  },
  youtube_review: {
    label: '视频摘要',
    description: '提炼 YouTube 视频中的关键信息和评测结论',
  },
}

const toneOptions: Record<ToneType, { label: string; description: string }> = {
  professional: { label: '专业', description: '严谨、权威的正式风格' },
  casual: { label: '轻松', description: '通俗易懂的博客风格' },
  friendly: { label: '亲切', description: '热情友好的分享风格' },
}

const lengthOptions: Record<LengthType, { label: string; words: string }> = {
  short: { label: '简短', words: '300-500字' },
  medium: { label: '适中', words: '800-1200字' },
  long: { label: '详细', words: '1500-2000字' },
}

export default function AICreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [contentType, setContentType] = useState<ContentType>('product_intro')
  const [tone, setTone] = useState<ToneType>('professional')
  const [length, setLength] = useState<LengthType>('medium')
  const [customInstructions, setCustomInstructions] = useState('')
  const [section, setSection] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [saving, setSaving] = useState(false)

  // UI state
  const [loadingMarkets, setLoadingMarkets] = useState(true)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [showMaterials, setShowMaterials] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  // Load markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await marketsApi.list({ page: 1, pageSize: 100 })
        setMarkets(response.markets)

        // Check for marketId in URL params
        const marketIdParam = searchParams.get('marketId')
        if (marketIdParam && response.markets.some(m => m.id === parseInt(marketIdParam))) {
          setSelectedMarket(marketIdParam)
        }
      } catch (error) {
        console.error('Failed to fetch markets:', error)
        toast({
          title: '错误',
          description: '加载市场列表失败',
          variant: 'destructive',
        })
      } finally {
        setLoadingMarkets(false)
      }
    }
    fetchMarkets()
  }, [searchParams, toast])

  // Load materials when market changes
  useEffect(() => {
    if (!selectedMarket) {
      setMaterials([])
      setSelectedMaterials([])
      return
    }

    const fetchMaterials = async () => {
      setLoadingMaterials(true)
      try {
        const response = await materialsApi.byMarket(parseInt(selectedMarket))
        setMaterials(response.materials)
        // Select all materials by default
        setSelectedMaterials(response.materials.map((m: Material) => m.id))
      } catch (error) {
        console.error('Failed to fetch materials:', error)
        toast({
          title: '错误',
          description: '加载素材列表失败',
          variant: 'destructive',
        })
      } finally {
        setLoadingMaterials(false)
      }
    }
    fetchMaterials()
  }, [selectedMarket, toast])

  // Toggle material selection
  const toggleMaterial = (id: number) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  // Select/deselect all materials
  const toggleAllMaterials = () => {
    if (selectedMaterials.length === materials.length) {
      setSelectedMaterials([])
    } else {
      setSelectedMaterials(materials.map((m) => m.id))
    }
  }

  // Generate content
  const handleGenerate = async () => {
    if (!selectedMarket) {
      toast({ title: '错误', description: '请选择市场', variant: 'destructive' })
      return
    }
    if (selectedMaterials.length === 0) {
      toast({ title: '错误', description: '请至少选择一个素材', variant: 'destructive' })
      return
    }

    const market = markets.find((m) => m.id === parseInt(selectedMarket))
    const selectedMaterialObjs = materials.filter((m) => selectedMaterials.includes(m.id))

    setGenerating(true)
    setGeneratedContent('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contentType,
          marketTitle: market?.title,
          marketAsin: market?.asin,
          materials: selectedMaterialObjs.map((m) => ({
            title: m.title,
            type: m.type,
            content: m.content,
            sourceUrl: m.sourceUrl,
          })),
          tone,
          length,
          section: section || undefined,
          customInstructions: customInstructions || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '生成失败')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // Parse streaming format (0:"text"\n)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              accumulatedContent += text
              setGeneratedContent(accumulatedContent)
            } catch {
              // Skip malformed lines
            }
          }
        }
      }

      toast({
        title: '生成完成',
        description: '内容已生成，可以预览和保存',
      })
    } catch (error) {
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // Copy content to clipboard
  const handleCopy = async () => {
    if (!generatedContent) return
    try {
      await navigator.clipboard.writeText(generatedContent)
      toast({ title: '已复制', description: '内容已复制到剪贴板' })
    } catch {
      toast({ title: '复制失败', variant: 'destructive' })
    }
  }

  // Save as draft (product content)
  const handleSaveDraft = async () => {
    if (!generatedContent || !selectedMarket) return

    setSaving(true)
    try {
      // Create a new product (content) with the generated content
      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${contentType === 'product_intro' ? '产品介绍' : contentType === 'user_review' ? '用户评测' : '视频摘要'} - ${markets.find(m => m.id === parseInt(selectedMarket))?.title || ''}`,
          type: contentType === 'product_intro' ? 'guide' : 'review',
          content: generatedContent,
          marketIds: [parseInt(selectedMarket)],
        }),
      })

      if (!response.ok) throw new Error('保存失败')

      toast({ title: '保存成功', description: '内容已保存为草稿' })
      router.push('/products')
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Save as material
  const handleSaveAsMaterial = async () => {
    if (!generatedContent || !selectedMarket) return

    setSaving(true)
    try {
      await materialsApi.create({
        title: `AI生成 - ${contentTypes[contentType].label} - ${new Date().toLocaleDateString()}`,
        type: contentType,
        content: generatedContent,
        marketId: parseInt(selectedMarket),
      })

      toast({ title: '保存成功', description: '内容已保存为素材' })
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const market = markets.find((m) => m.id === parseInt(selectedMarket))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/materials">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI 内容创作
          </h1>
          <p className="text-muted-foreground">选择素材，AI 自动生成高质量内容</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Configuration */}
        <div className="space-y-4">
          {/* Market Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">选择市场</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedMarket}
                onValueChange={setSelectedMarket}
                disabled={loadingMarkets || generating}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMarkets ? '加载中...' : '选择要创作内容的市场'} />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.title} ({m.asin})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {market && (
                <p className="text-xs text-muted-foreground mt-2">
                  当前市场: {market.category || '未分类'} · 状态: {market.status}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Material Selection */}
          {selectedMarket && (
            <Card>
              <Collapsible open={showMaterials} onOpenChange={setShowMaterials}>
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <CardTitle className="text-base">
                        素材选择
                        {materials.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedMaterials.length}/{materials.length}
                          </Badge>
                        )}
                      </CardTitle>
                      {showMaterials ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {loadingMaterials ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : materials.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>暂无素材</p>
                        <Button variant="link" asChild className="mt-2">
                          <Link href={`/materials/new?marketId=${selectedMarket}`}>
                            添加素材
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-muted-foreground">
                            选择要用于生成的素材
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleAllMaterials}
                            disabled={generating}
                          >
                            {selectedMaterials.length === materials.length ? '取消全选' : '全选'}
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-start gap-2 p-2 rounded border hover:bg-accent/50 cursor-pointer"
                              onClick={() => toggleMaterial(material.id)}
                            >
                              <Checkbox
                                checked={selectedMaterials.includes(material.id)}
                                onCheckedChange={() => toggleMaterial(material.id)}
                                disabled={generating}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">
                                    {material.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {material.type === 'product_intro'
                                      ? '产品介绍'
                                      : material.type === 'user_review'
                                      ? '用户评论'
                                      : material.type === 'youtube_review'
                                      ? 'YouTube'
                                      : '附件'}
                                  </Badge>
                                </div>
                                {material.wordCount && (
                                  <p className="text-xs text-muted-foreground">
                                    {material.wordCount} 字
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Content Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">内容设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type */}
              <div className="space-y-2">
                <Label>内容类型</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(contentTypes).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setContentType(key as ContentType)}
                      disabled={generating}
                      className={`p-2 rounded border text-left text-sm transition-colors ${
                        contentType === key
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contentTypes[contentType].description}
                </p>
              </div>

              {/* Tone and Length */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>语气风格</Label>
                  <Select
                    value={tone}
                    onValueChange={(v) => setTone(v as ToneType)}
                    disabled={generating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(toneOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>内容长度</Label>
                  <Select
                    value={length}
                    onValueChange={(v) => setLength(v as LengthType)}
                    disabled={generating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(lengthOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label} ({value.words})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {showAdvanced ? '隐藏高级选项' : '显示高级选项'}
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="section">生成指定部分</Label>
                    <Input
                      id="section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="例如: 产品特点、使用方法、总结..."
                      disabled={generating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">额外要求</Label>
                    <Textarea
                      id="instructions"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="添加额外的创作要求..."
                      rows={2}
                      disabled={generating}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={generating || !selectedMarket || selectedMaterials.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                开始生成
              </>
            )}
          </Button>
        </div>

        {/* Right Panel: Output */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">生成结果</CardTitle>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    重新生成
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generating && !generatedContent ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>AI 正在创作内容...</p>
                <p className="text-sm">这可能需要几秒钟</p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-4">
                <div
                  ref={contentRef}
                  className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg max-h-[60vh] overflow-y-auto"
                >
                  {generatedContent.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    保存为草稿
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveAsMaterial}
                    disabled={saving}
                  >
                    保存为素材
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>选择市场、素材并点击生成</p>
                <p className="text-sm">AI 生成的内容将在这里显示</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
