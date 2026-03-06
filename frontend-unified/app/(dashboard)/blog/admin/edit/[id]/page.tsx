'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Send, ImagePlus, X } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { AIContentDialog } from '@/components/blog/ai-content-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Category, AIGenerationResult, Article } from '@/lib/blog/types'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const { articles, categories, updateArticle, publishArticle, fetchCategories, fetchArticles } = useBlogStore()
  const { toast } = useToast()

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [coverImage, setCoverImage] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    fetchCategories()
    fetchArticles()
  }, [fetchCategories, fetchArticles])

  useEffect(() => {
    if (articles.length > 0 && params.id) {
      const foundArticle = articles.find(a => a.id === params.id)
      if (foundArticle) {
        setArticle(foundArticle)
        setTitle(foundArticle.title)
        setSlug(foundArticle.slug)
        setExcerpt(foundArticle.excerpt || '')
        setContent(foundArticle.content || '')
        setCategory(foundArticle.category)
        setCoverImage(foundArticle.coverImage || '')
        setMetaDescription(foundArticle.metaDescription || '')
        setTags(foundArticle.tags || [])
        setLoading(false)
      } else {
        toast({
          title: '文章未找到',
          description: '该文章不存在或已被删除',
          variant: 'destructive',
        })
        router.push('/blog/admin')
      }
    }
  }, [articles, params.id, router, toast])

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generatedSlug || `article-${Date.now()}`)
  }

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
    handleTitleChange(result.title)
    setContent(result.content)
    setExcerpt(result.excerpt)
    setTags(result.tags)
    setMetaDescription(result.metaDescription)
    if (result.suggestedSlug) {
      setSlug(result.suggestedSlug)
    }
    toast({
      title: 'AI 内容已生成',
      description: '文章内容已填充到编辑器，您可以继续编辑',
    })
  }

  const handleSaveDraft = async () => {
    if (!article || !title || !category) {
      toast({
        title: '验证失败',
        description: '请至少填写标题和选择分类',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await updateArticle(article.id, {
        title,
        slug,
        excerpt,
        content,
        category: category!,
        coverImage: coverImage || undefined,
        tags,
        metaDescription,
        status: 'draft',
      })
      toast({
        title: '草稿已保存',
        description: '文章已更新',
      })
      router.push('/blog/admin')
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存草稿失败',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!article || !title || !content || !category) {
      toast({
        title: '验证失败',
        description: '请填写标题、内容并选择分类',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Update article first
      await updateArticle(article.id, {
        title,
        slug,
        excerpt,
        content,
        category: category!,
        coverImage: coverImage || undefined,
        tags,
        metaDescription,
      })
      // Then publish it
      await publishArticle(article.id)
      toast({
        title: '发布成功',
        description: '文章已发布',
      })
      router.push('/blog/admin')
    } catch (error) {
      toast({
        title: '发布失败',
        description: error instanceof Error ? error.message : '发布文章失败',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <p className="text-muted-foreground">文章未找到</p>
          <Button asChild className="mt-4">
            <Link href="/blog/admin">返回文章管理</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 max-w-6xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">编辑文章</h1>
            <p className="text-sm text-muted-foreground">修改文章内容</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIContentDialog onAccept={handleAIAccept} />
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving || !title}>
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button onClick={handlePublish} disabled={saving || !title || !content}>
            <Send className="h-4 w-4 mr-2" />
            发布
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
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
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL 别名</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
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
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {content.length} 字符
                </p>
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
                  value={category?.id || ''}
                  onValueChange={(id) => {
                    const cat = categories.find(c => c.id === id)
                    if (cat) setCategory(cat)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
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

          <Card>
            <CardHeader>
              <CardTitle>文章信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态</span>
                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                  {article.status === 'published' ? '已发布' : article.status === 'review' ? '审核中' : '草稿'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间</span>
                <span>{new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              {article.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">发布时间</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">作者</span>
                <span>{article.author?.name || '未知'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
