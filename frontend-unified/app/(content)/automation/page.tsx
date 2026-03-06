'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Play, Plus, ArrowRight, Loader2 } from 'lucide-react'

// Types
interface Product {
  id: number
  asin: string
  title: string
  price: number
  rating: number
  reviewCount: number
  imageUrl: string
  status: string
}

interface Workflow {
  id: number
  productId: number
  productAsin: string
  currentStage: string
  stageStatus: string
  materialsCollected: number
  materialsReviewed: number
  contentsGenerated: number
  createdAt: string
}

interface Material {
  id: number
  asin: string
  sourceType: string
  content: string
  aiQualityScore?: number
}

const stageLabels: Record<string, string> = {
  selection: '选品',
  collection: '素材采集',
  review: 'AI审核',
  generation: '内容生成',
  approval: '用户确认',
  publish: '发布'
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('workflow')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { toast } = useToast()

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-hub.zenconsult.top/api/v1'

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const res = await fetch(`${API_BASE}/automation/workflows`)
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch (e) {
      console.error('Failed to fetch workflows:', e)
      // Mock data for development
      setWorkflows([
        {
          id: 1,
          productId: 1,
          productAsin: 'B08N5KWB9H',
          currentStage: 'collection',
          stageStatus: 'in_progress',
          materialsCollected: 15,
          materialsReviewed: 0,
          contentsGenerated: 0,
          createdAt: new Date().toISOString()
        }
      ])
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products?pageSize=20`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (e) {
      console.error('Failed to fetch products:', e)
      setProducts([
        {
          id: 1,
          asin: 'B08N5KWB9H',
          title: 'Sony WH-1000XM4 Wireless Headphones',
          price: 349.99,
          rating: 4.7,
          reviewCount: 45230,
          imageUrl: '/placeholder.png',
          status: 'selected'
        },
        {
          id: 2,
          asin: 'B0BDHB9Y8M',
          title: 'Apple AirPods Pro (2nd Gen)',
          price: 249.00,
          rating: 4.6,
          reviewCount: 89450,
          imageUrl: '/placeholder.png',
          status: 'pending'
        }
      ])
    }
  }

  // Fetch materials
  const fetchMaterials = async (asin: string) => {
    try {
      const res = await fetch(`${API_BASE}/materials?asin=${asin}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      }
    } catch (e) {
      console.error('Failed to fetch materials:', e)
    }
  }

  // Create workflow
  const createWorkflow = async (product: Product) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/automation/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, productAsin: product.asin })
      })
      if (res.ok) {
        toast({ title: '成功', description: '工作流已创建' })
        fetchWorkflows()
      }
    } catch (e) {
      toast({ title: '错误', description: '创建失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Start material collection
  const startCollection = async (workflow: Workflow) => {
    try {
      const res = await fetch(`${API_BASE}/materials/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin: workflow.productAsin, sourceTypes: ['amazon_review', 'youtube'] })
      })
      if (res.ok) {
        toast({ title: '已启动', description: '素材采集任务已开始' })
      }
    } catch (e) {
      toast({ title: '错误', description: '启动失败', variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchWorkflows()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchMaterials(selectedProduct.asin)
    }
  }, [selectedProduct])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">内容自动化</h1>
        <Button variant="outline" size="sm" onClick={() => { fetchWorkflows(); fetchProducts(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflow">工作流</TabsTrigger>
          <TabsTrigger value="products">产品列表</TabsTrigger>
          <TabsTrigger value="materials">素材库</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4 mt-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无工作流，请先选择产品开始
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>ASIN: {workflow.productAsin}</CardTitle>
                      <CardDescription>
                        当前阶段: {stageLabels[workflow.currentStage] || workflow.currentStage}
                      </CardDescription>
                    </div>
                    <Badge variant={workflow.stageStatus === 'completed' ? 'default' : 'secondary'}>
                      {workflow.stageStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      素材: {workflow.materialsCollected} | 
                      已审核: {workflow.materialsReviewed} | 
                      已生成: {workflow.contentsGenerated}
                    </div>
                    <Button size="sm" onClick={() => startCollection(workflow)}>
                      <Play className="h-4 w-4 mr-2" />
                      开始采集
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <img
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.title}</div>
                      <div className="text-lg font-bold">${product.price}</div>
                      <div className="text-xs text-muted-foreground">
                        ⭐ {product.rating} ({product.reviewCount} 评论)
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          createWorkflow(product)
                        }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        开始流程
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          {selectedProduct ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{selectedProduct.title} - 素材</h2>
                <Badge>{materials.length} 条</Badge>
              </div>
              {materials.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    暂无素材，请先进行素材采集
                  </CardContent>
                </Card>
              ) : (
                materials.map((material) => (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {material.sourceType === 'amazon_review' ? 'Amazon评论' : 
                             material.sourceType === 'youtube' ? 'YouTube' : material.sourceType}
                          </Badge>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {material.content}
                          </p>
                        </div>
                        {material.aiQualityScore && (
                          <Badge>{material.aiQualityScore}分</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                请先选择一个产品查看素材
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
