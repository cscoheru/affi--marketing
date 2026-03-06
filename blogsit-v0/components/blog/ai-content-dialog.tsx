'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, RefreshCw } from 'lucide-react'
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

interface AIContentDialogProps {
  onAccept: (result: AIGenerationResult) => void
}

export function AIContentDialog({ onAccept }: AIContentDialogProps) {
  const { generateWithAI, categories } = useBlogStore()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<AITone>('professional')
  const [length, setLength] = useState<AILength>('medium')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIGenerationResult | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    setLoading(true)
    try {
      const generated = await generateWithAI({
        topic,
        tone,
        length,
        category: category || undefined,
      })
      setResult(generated)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (result) {
      onAccept(result)
      setOpen(false)
      setResult(null)
      setTopic('')
    }
  }

  const handleRegenerate = () => {
    setResult(null)
    handleGenerate()
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setResult(null)
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
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 内容生成助手
          </DialogTitle>
          <DialogDescription>
            输入主题和偏好，让 AI 为您生成高质量的博客内容
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic">主题</Label>
              <Input
                id="topic"
                placeholder="例如：Next.js 15 性能优化最佳实践"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
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
              disabled={!topic.trim() || loading}
              className="w-full"
            >
              {loading ? (
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
            <ScrollArea className="h-80 rounded-md border p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">标题</Label>
                  <p className="font-semibold text-lg">{result.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">摘要</Label>
                  <p className="text-sm text-muted-foreground">{result.excerpt}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">内容预览</Label>
                  <div className="text-sm whitespace-pre-wrap mt-1">
                    {result.content.slice(0, 500)}...
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">标签</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
              <Button onClick={handleAccept}>
                <Check className="h-4 w-4 mr-2" />
                采用此内容
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
