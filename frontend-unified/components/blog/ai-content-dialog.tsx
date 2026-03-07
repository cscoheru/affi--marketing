'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Loader2, Check, RefreshCw, Wifi, WifiOff, Square } from 'lucide-react'
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
import { useCompletion } from '@ai-sdk/react'

type AIModel = 'qwen' | 'openai' | 'chatglm'

const aiModels = [
  { value: 'qwen', label: '通义千问', description: '阿里云通义千问，适合中文内容' },
  { value: 'openai', label: 'OpenAI', description: 'GPT系列，适合英文内容' },
  { value: 'chatglm', label: '智谱GLM', description: '智谱AI，适合技术内容' },
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
  const [model, setModel] = useState<AIModel>('qwen')
  const [aiHealthy, setAiHealthy] = useState<boolean | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 使用 AI SDK 的 useCompletion hook
  const {
    completion,
    isLoading,
    complete,
    stop,
    setCompletion,
  } = useCompletion({
    api: '/api/ai/generate',
    body: {
      tone,
      length,
      category,
      model,
    },
    onFinish: () => {
      // 生成完成后自动滚动到底部
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    },
  })

  // 检查AI API 健康状态（本地 API 路由）
  useEffect(() => {
    const checkHealth = async () => {
      setCheckingHealth(true)
      try {
        // 检查本地 AI API 路由是否可用
        const response = await fetch('/api/ai/generate', {
          method: 'OPTIONS',
        })
        setAiHealthy(response.ok || response.status === 405) // 405 = 方法不允许但路由存在
      } catch {
        setAiHealthy(false)
      } finally {
        setCheckingHealth(false)
      }
    }

    if (open) {
      checkHealth()
      // 每 60 秒检查一次
      const interval = setInterval(checkHealth, 60000)
      return () => clearInterval(interval)
    }
  }, [open])

  // 自动滚动到最新内容
  useEffect(() => {
    if (isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [completion, isLoading])

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setShowResult(true)
    setCompletion('') // 清空之前的内容

    try {
      await complete(topic)
    } catch (error) {
      console.error('AI generation error:', error)
      setCompletion('# 生成失败\n\n请检查网络连接或稍后重试。')
    }
  }

  const handleStop = () => {
    stop()
  }

  // 解析生成的内容
  const parseResult = (content: string): AIGenerationResult => {
    const lines = content.split('\n')

    // 提取标题（第一个 # 开头的行）
    let title = topic
    const titleLine = lines.find(line => line.startsWith('# '))
    if (titleLine) {
      title = titleLine.replace('# ', '').trim()
    }

    // 提取标签（最后一行以 "标签：" 开头的）
    let tags: string[] = []
    const tagLine = lines.find(line => line.startsWith('标签：') || line.startsWith('标签:'))
    if (tagLine) {
      tags = tagLine.replace(/标签[：:]/, '').split(',').map(t => t.trim()).filter(Boolean)
    }

    // 提取摘要（第二段非空内容，通常在标题之后）
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

    // 清理内容（移除标签行）
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
    if (completion) {
      const result = parseResult(completion)
      onAccept(result)
      setOpen(false)
      resetState()
    }
  }

  const handleRegenerate = () => {
    setCompletion('')
    handleGenerate()
  }

  const handleBack = () => {
    setShowResult(false)
    setCompletion('')
  }

  const resetState = () => {
    setShowResult(false)
    setCompletion('')
    setTopic('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetState()
    }
  }

  // 解析当前内容用于预览
  const currentResult = completion ? parseResult(completion) : null

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
              ) : aiHealthy === null ? (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              ) : aiHealthy ? (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  AI在线
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  AI离线
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription>
            {aiHealthy === false
              ? 'AI服务暂时不可用，将使用备用生成方案'
              : '输入主题和偏好，让 AI 为您生成高质量的博客内容'}
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
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
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
              onClick={handleGenerate}
              disabled={!topic.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
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
              <div className="space-y-4 prose prose-sm max-w-none">
                {/* 实时流式显示 */}
                <div className="whitespace-pre-wrap">
                  {completion}
                  {isLoading && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* 状态指示器 */}
            {isLoading && (
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

            {!isLoading && completion && (
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
                <Button variant="outline" onClick={handleRegenerate} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
                <Button onClick={handleAccept} disabled={isLoading || !completion}>
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
