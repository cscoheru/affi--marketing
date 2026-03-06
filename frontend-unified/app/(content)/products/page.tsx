'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ProductForm, type ProductFormData } from '@/components/product-form'
import { useToast } from '@/hooks/use-toast'
import { productsApi, type Product } from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // 获取产品列表
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await productsApi.list({ page: 1, pageSize: 10, search: search || undefined })
      setProducts(response.products)
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取产品列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 搜索处理
  const handleSearch = () => {
    fetchProducts()
  }

  // 创建产品
  const handleCreate = async (data: ProductFormData) => {
    setSubmitting(true)
    try {
      const createData = {
        asin: data.asin,
        title: data.title,
        price: data.price ? parseFloat(data.price) : 0,
        imageUrl: data.image_url || '',
        status: 'pending' as const,
      }
      await productsApi.create(createData)
      toast({
        title: '成功',
        description: '产品已添加',
      })
      setDialogOpen(false)
      fetchProducts()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '添加产品失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 编辑产品
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleUpdate = async (data: ProductFormData) => {
    if (!editingProduct) return

    setSubmitting(true)
    try {
      const updateData: any = {}
      if (data.title) updateData.title = data.title
      if (data.price) updateData.price = parseFloat(data.price!)
      if (data.image_url) updateData.imageUrl = data.image_url
      if (data.description !== undefined) updateData.category = data.description

      // 使用 ASIN 而不是 ID
      await productsApi.update(editingProduct!.asin, updateData)
      toast({
        title: '成功',
        description: '产品已更新',
      })
      setDialogOpen(false)
      setEditingProduct(null)
      fetchProducts()
    } catch {
      toast({
        title: '错误',
        description: '更新产品失败',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除产品 - 使用 ASIN
  const handleDelete = async (asin: string) => {
    if (!confirm('确定要删除这个产品吗？')) return

    try {
      await productsApi.delete(asin)
      toast({
        title: '成功',
        description: '产品已删除',
      })
      fetchProducts()
    } catch {
      toast({
        title: '错误',
        description: '删除产品失败',
        variant: 'destructive',
      })
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProduct(null)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>添加产品</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? '编辑产品' : '添加产品'}</DialogTitle>
            </DialogHeader>
            <ProductForm
              defaultValues={editingProduct ? {
                asin: editingProduct.asin,
                title: editingProduct.title,
                price: editingProduct.price?.toString(),
                image_url: editingProduct.imageUrl,
                description: editingProduct.category,
              } : undefined}
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              onCancel={handleCloseDialog}
              isSubmitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品列表</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} variant="secondary">搜索</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无产品数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ASIN</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.asin}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span>{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.price ? `¥${product.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === 'covered' ? 'default' : 'secondary'}
                      >
                        {product.status === 'covered' ? '已覆盖' :
                         product.status === 'researching' ? '调研中' : product.status || '未知'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.asin)}
                          className="text-destructive hover:text-destructive"
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
