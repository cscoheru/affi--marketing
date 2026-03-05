'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { mockProducts } from '@/lib/mock-data'
import type { Product } from '@/lib/types'

const categories = ['全部', '咖啡机', '咖啡豆', '磨豆机', '手冲器具']

export default function ProductsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [asinInput, setAsinInput] = useState('')

  const filteredProducts = mockProducts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.asin.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === '全部' || p.category === category
    return matchSearch && matchCategory
  })

  const handleViewMaterials = (product: Product) => {
    router.push(`/materials?asin=${product.asin}`)
  }

  const handleGenerate = (product: Product) => {
    router.push(`/content?generate=${product.asin}`)
  }

  return (
    <DashboardLayout title="产品候选库">
      <div className="flex flex-col gap-6">
        {/* Header actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索产品名称或 ASIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            添加产品
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>共 <strong className="text-foreground">{filteredProducts.length}</strong> 个产品</span>
          <span>调研中 <strong className="text-foreground">{filteredProducts.filter(p => p.status === 'researching').length}</strong></span>
          <span>已覆盖 <strong className="text-foreground">{filteredProducts.filter(p => p.status === 'covered').length}</strong></span>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewMaterials={handleViewMaterials}
              onGenerate={handleGenerate}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="mb-3 size-12 opacity-40" />
            <p className="text-base font-medium">暂无匹配的产品</p>
            <p className="mt-1 text-sm">尝试调整筛选条件或添加新产品</p>
          </div>
        )}
      </div>

      {/* Add product dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加产品</DialogTitle>
            <DialogDescription>
              输入 Amazon ASIN 编号，系统将自动获取产品信息
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asin">ASIN 编号</Label>
              <Input
                id="asin"
                placeholder="例如: B0BVMHH9B7"
                value={asinInput}
                onChange={(e) => setAsinInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setAddDialogOpen(false)}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function Package({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}
