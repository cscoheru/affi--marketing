'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Send, ImagePlus, X } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { AIContentDialog } from '@/components/blog/ai-content-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Category, AIGenerationResult } from '@/lib/blog/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditArticlePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { articles, categories, fetchArticles, updateArticle, publishArticle } = useBlogStore()
  
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Category>(categories[0])
  const [coverImage, setCoverImage] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'draft' | 'review' | 'published'>('draft')

  useEffect(() => {
    const loadArticle = async () => {
      if (articles.length === 0) {
        await fetchArticles()
      }
      
      const article = articles.find(a => a.id === id)
      if (article) {
        setTitle(article.title)
        setSlug(article.slug)
        setExcerpt(article.excerpt)
        setContent(article.content)
        setCategory(article.category)
        setCoverImage(article.coverImage || '')
        setMetaDescription(article.metaDescription || '')
        setTags(article.tags)
        setStatus(article.status)
      }
      setLoading(false)
    }
    
    loadArticle()
  }, [id, articles, fetchArticles])

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleAIAccept = (result: AIGenerationResult) => {
    setTitle(result.title)
    setContent(result.content)
    setExcerpt(result.excerpt)
    setTags(result.tags)
    setMetaDescription(result.metaDescription)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateArticle(id, {
        title,
        slug,
        excerpt,
        content,
        category,
        coverImage: coverImage || undefined,
        tags,
        metaDescription,
      })
      router.push('/blog/admin')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      await updateArticle(id, {
        title,
        slug,
        excerpt,
        content,
        category,
        coverImage: coverImage || undefined,
        tags,
        metaDescription,
      })
      await publishArticle(id)
      router.push('/blog/admin')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">编辑文章</h1>
            <p className="text-sm text-muted-foreground">
              状态: {status === 'draft' ? '草稿' : status === 'review' ? '待审核' : '已发布'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIContentDialog onAccept={handleAIAccept} />
          <Button variant="outline" onClick={handleSave} disabled={saving || !title}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
          {status !== 'published' && (
            <Button onClick={handlePublish} disabled={saving || !title || !content}>
              <Send className="h-4 w-4 mr-2" />
              发布
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>文章内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="输入文章标题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL 别名</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/article/</span>
                  <Input
                    id="slug"
                    placeholder="article-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">摘要</Label>
                <Textarea
                  id="excerpt"
                  placeholder="文章摘要，会显示在文章列表中..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">正文内容</Label>
                <Textarea
                  id="content"
                  placeholder="在这里编写文章内容...支持 Markdown 格式"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <Select 
                  value={category.id} 
                  onValueChange={(catId) => {
                    const cat = categories.find(c => c.id === catId)
                    if (cat) setCategory(cat)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>封面图片</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="图片 URL..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
                {coverImage && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={coverImage}
                      alt="封面预览"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>标签</Label>
                <Input
                  placeholder="输入标签后按回车添加..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO 设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="meta">Meta 描述</Label>
                <Textarea
                  id="meta"
                  placeholder="搜索引擎结果中显示的描述..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 字符
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
