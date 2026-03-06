'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

const colorOptions = [
  { value: 'bg-gray-500', label: '灰色', class: 'bg-gray-500' },
  { value: 'bg-red-500', label: '红色', class: 'bg-red-500' },
  { value: 'bg-orange-500', label: '橙色', class: 'bg-orange-500' },
  { value: 'bg-amber-500', label: '琥珀', class: 'bg-amber-500' },
  { value: 'bg-yellow-500', label: '黄色', class: 'bg-yellow-500' },
  { value: 'bg-lime-500', label: '青柠', class: 'bg-lime-500' },
  { value: 'bg-green-500', label: '绿色', class: 'bg-green-500' },
  { value: 'bg-emerald-500', label: '翠绿', class: 'bg-emerald-500' },
  { value: 'bg-teal-500', label: '青色', class: 'bg-teal-500' },
  { value: 'bg-cyan-500', label: '蓝绿', class: 'bg-cyan-500' },
  { value: 'bg-sky-500', label: '天蓝', class: 'bg-sky-500' },
  { value: 'bg-blue-500', label: '蓝色', class: 'bg-blue-500' },
  { value: 'bg-indigo-500', label: '靛蓝', class: 'bg-indigo-500' },
  { value: 'bg-violet-500', label: '紫罗兰', class: 'bg-violet-500' },
  { value: 'bg-purple-500', label: '紫色', class: 'bg-purple-500' },
  { value: 'bg-fuchsia-500', label: '紫红', class: 'bg-fuchsia-500' },
  { value: 'bg-pink-500', label: '粉色', class: 'bg-pink-500' },
  { value: 'bg-rose-500', label: '玫瑰', class: 'bg-rose-500' },
]

export default function CategoryManagePage() {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, articles } = useBlogStore()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<typeof categories[0] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: 'bg-blue-500',
  })

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const getArticleCount = (categoryId: string) => {
    return articles.filter(a => a.category.id === categoryId).length
  }

  const handleOpenCreate = () => {
    setEditCategory(null)
    setFormData({ name: '', slug: '', description: '', color: 'bg-blue-500' })
    setDialogOpen(true)
  }

  const handleOpenEdit = (category: typeof categories[0]) => {
    setEditCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editCategory) {
        await updateCategory(editCategory.id, formData)
      } else {
        await createCategory(formData)
      }
      setDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCategory(deleteId)
      setDeleteId(null)
    }
  }

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    setFormData({ ...formData, name, slug: slug || '' })
  }

  if (categories.length === 0 && !loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">分类管理</h1>
            <p className="text-sm text-muted-foreground">管理博客文章分类</p>
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">分类管理</h1>
            <p className="text-sm text-muted-foreground">管理博客文章分类</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建分类
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="cursor-grab text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center text-white font-bold`}>
                  {category.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {getArticleCount(category.id)} 篇文章
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Slug: {category.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteId(category.id)}
                    disabled={getArticleCount(category.id) > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? '编辑分类' : '新建分类'}</DialogTitle>
            <DialogDescription>
              {editCategory ? '修改分类信息' : '创建一个新的博客文章分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                placeholder="例如：技术"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL 别名</Label>
              <Input
                id="slug"
                placeholder="technology"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="分类描述..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>颜色</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-lg ${color.class} ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.name}>
              {loading ? '保存中...' : editCategory ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这个分类吗？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteId && getArticleCount(deleteId) > 0
                ? '无法删除：该分类下还有文章'
                : '此操作无法撤销。分类将被永久删除。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteId ? getArticleCount(deleteId) > 0 : false}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
