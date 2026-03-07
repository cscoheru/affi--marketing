'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Loader2, Check, RefreshCw, Wifi, WifiOff, Square, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBlogStore } from '@/lib/blog/store'
import type { AITone, AILength, AIGenerationResult } from '@/lib/blog/types'
import { Badge } from '@/components/ui/badge'

type AIModel = 'glm-4-plus' | 'glm-4-air' | 'glm-4-flash' | 'glm-4'

const aiModels = [
  { value: 'glm-4-plus', label: 'GLM-4-Plus', description: '最新最强，适合复杂任务' },
  { value: 'glm-4-air', label: 'GLM-4-Air', description: '性价比高，适合日常使用' },
  { value: 'glm-4-flash', label: 'GLM-4-Flash', description: '快速响应，适合简单任务' },
  { value: 'glm-4', label: 'GLM-4', description: '标准版，平衡性能' },
]

interface AIContentDialogProps {
  onAccept: (result: AIGenerationResult) => void
}

export function AIContentDialog({ onAccept }: AIContentDialogProps) {
  const { categories } = useBlogStore()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<AITone>('professional')
  const [length, setLength] = useState<AILength>('medium')
  const [category, setCategory] = useState('')
  const [model, setModel] = useState<AIModel>('glm-4-plus')
  const [aiHealthy, setAiHealthy] = useState<boolean | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 检查AI API 健康状态
  useEffect(() => {
    const checkHealth = async () => {
      setCheckingHealth(true)
      try {
        const response = await fetch('/api/ai/generate', {
          method: 'OPTIONS',
        })
        setAiHealthy(response.ok || response.status === 405)
      } catch {
        setAiHealthy(false)
      } finally {
        setCheckingHealth(false)
      }
    }

    if (open) {
      checkHealth()
    }
  }, [open])

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [streamContent])

  // 流式生成内容
  const generateContent = useCallback(async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    setStreamContent('')
    setError(null)
    setShowResult(true)

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          length,
          category,
          model,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // 解析 SSE 格式
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:"')) {
            // 提取文本内容
            const text = line.slice(3, -1)
            // 处理转义字符
            const unescaped = text
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
            accumulatedContent += unescaped
            setStreamContent(accumulatedContent)
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Generation stopped by user')
      } else {
        console.error('AI generation error:', err)
        setError(err instanceof Error ? err.message : '生成失败，请稍后重试')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [topic, tone, length, category, model])

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
  }

  const handleRegenerate = () => {
    setStreamContent('')
    setError(null)
    generateContent()
  }

  const handleBack = () => {
    setShowResult(false)
    setStreamContent('')
    setError(null)
  }

  // 解析生成的内容
  const parseResult = (content: string): AIGenerationResult => {
    const lines = content.split('\n')

    let title = topic
    const titleLine = lines.find(line => line.startsWith('# '))
    if (titleLine) {
      title = titleLine.replace('# ', '').trim()
    }

    let tags: string[] = []
    const tagLine = lines.find(line => line.startsWith('标签：') || line.startsWith('标签:'))
    if (tagLine) {
      tags = tagLine.replace(/标签[：:]/, '').split(',').map(t => t.trim()).filter(Boolean)
    }

    let excerpt = ''
    let contentStarted = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      if (line.startsWith('# ')) {
        contentStarted = true
        continue
      }
      if (contentStarted && !line.startsWith('#') && !line.startsWith('标签')) {
        excerpt = line.slice(0, 150) + (line.length > 150 ? '...' : '')
        break
      }
    }

    const cleanContent = lines
      .filter(line => !line.startsWith('标签：') && !line.startsWith('标签:'))
      .join('\n')
      .trim()

    return {
      title,
      content: cleanContent,
      excerpt,
      tags: tags.length > 0 ? tags : [topic, category || '通用'].filter(Boolean),
      metaDescription: excerpt,
      suggestedSlug: title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-'),
    }
  }

  const handleAccept = () => {
    if (streamContent) {
      const result = parseResult(streamContent)
      onAccept(result)
      setOpen(false)
      resetState()
    }
  }

  const resetState = () => {
    setShowResult(false)
    setStreamContent('')
    setError(null)
    setTopic('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      abortControllerRef.current?.abort()
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI 生成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 内容生成助手
            </DialogTitle>
            <div className="flex items-center gap-2">
              {checkingHealth ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : aiHealthy ? (
                <Badge variant="outline" className="gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  AI在线
                </Badge>
              ) : aiHealthy === false ? (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  AI离线
                </Badge>
              ) : null}
            </div>
          </div>
          <DialogDescription>
            输入主题和偏好，让 AI 为您生成高质量的博客内容
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic">主题</Label>
              <Input
                id="topic"
                placeholder="例如：Next.js 15 性能优化最佳实践"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateContent()}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>AI模型</Label>
                <Select value={model} onValueChange={(v: AIModel) => setModel(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {aiModels.find(m => m.value === model)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>语调风格</Label>
                <Select value={tone} onValueChange={(v: AITone) => setTone(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">专业严谨</SelectItem>
                    <SelectItem value="casual">轻松随意</SelectItem>
                    <SelectItem value="friendly">友好热情</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>内容长度</Label>
                <Select value={length} onValueChange={(v: AILength) => setLength(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">简短 (~500字)</SelectItem>
                    <SelectItem value="medium">中等 (~1000字)</SelectItem>
                    <SelectItem value="long">详细 (~2000字)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>文章分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateContent}
              disabled={!topic.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  正在生成...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成内容
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <ScrollArea className="h-80 rounded-md border p-4" ref={scrollRef}>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {streamContent}
                {isGenerating && !streamContent && (
                  <span className="text-muted-foreground">正在连接 AI 服务...</span>
                )}
                {isGenerating && streamContent && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
              </div>
            </ScrollArea>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* 状态指示器 */}
            {isGenerating && !error && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  正在生成...
                </span>
                <Button variant="ghost" size="sm" onClick={handleStop} className="text-red-500 hover:text-red-600">
                  <Square className="h-3 w-3 mr-1" />
                  停止
                </Button>
              </div>
            )}

            {!isGenerating && streamContent && !error && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                生成完成
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack}>
                返回修改
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
                <Button onClick={handleAccept} disabled={isGenerating || !streamContent || !!error}>
                  <Check className="h-4 w-4 mr-2" />
                  采用此内容
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
