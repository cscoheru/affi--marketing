'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Video,
  Globe,
  HelpCircle,
  Search,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { mockMaterials, mockProducts } from '@/lib/mock-data'
import type { Material } from '@/lib/types'

const sourceTypeMap: Record<Material['sourceType'], { label: string; icon: typeof MessageSquare; color: string }> = {
  amazon_review: { label: 'Amazon 评论', icon: MessageSquare, color: 'text-chart-1' },
  youtube: { label: 'YouTube', icon: Video, color: 'text-chart-5' },
  reddit: { label: 'Reddit', icon: Globe, color: 'text-chart-3' },
  quora: { label: 'Quora', icon: HelpCircle, color: 'text-chart-2' },
}

function SentimentBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage}%</span>
    </div>
  )
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<DashboardLayout title="素材库"><div className="flex items-center justify-center py-20 text-muted-foreground">加载中...</div></DashboardLayout>}>
      <MaterialsContent />
    </Suspense>
  )
}

function MaterialsContent() {
  const searchParams = useSearchParams()
  const initialAsin = searchParams.get('asin') || '全部'

  const [selectedAsin, setSelectedAsin] = useState(initialAsin)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const asins = useMemo(() => {
    const uniqueAsins = Array.from(new Set(mockMaterials.map((m) => m.asin)))
    return ['全部', ...uniqueAsins]
  }, [])

  const filteredMaterials = useMemo(() => {
    return mockMaterials.filter((m) => {
      const matchAsin = selectedAsin === '全部' || m.asin === selectedAsin
      const matchSource = sourceFilter === 'all' || m.sourceType === sourceFilter
      const matchSearch = m.content.toLowerCase().includes(searchTerm.toLowerCase())
      return matchAsin && matchSource && matchSearch
    })
  }, [selectedAsin, sourceFilter, searchTerm])

  const getProductName = (asin: string) => {
    const product = mockProducts.find((p) => p.asin === asin)
    return product ? product.title : asin
  }

  return (
    <DashboardLayout title="素材库">
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索素材内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedAsin} onValueChange={setSelectedAsin}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="选择产品" />
            </SelectTrigger>
            <SelectContent>
              {asins.map((asin) => (
                <SelectItem key={asin} value={asin}>
                  {asin === '全部' ? '全部产品' : asin}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-1.5 size-4" />
            刷新素材
          </Button>
        </div>

        {/* Source type tabs */}
        <Tabs value={sourceFilter} onValueChange={setSourceFilter}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="amazon_review">Amazon 评论</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="reddit">Reddit</TabsTrigger>
            <TabsTrigger value="quora">Quora</TabsTrigger>
          </TabsList>

          <TabsContent value={sourceFilter} className="mt-4">
            <div className="flex flex-col gap-6 text-sm text-muted-foreground">
              <span>共 <strong className="text-foreground">{filteredMaterials.length}</strong> 条素材</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredMaterials.map((material) => {
                const source = sourceTypeMap[material.sourceType]
                const Icon = source.icon
                return (
                  <Card key={material.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4 ${source.color}`} />
                          <Badge variant="outline" className="text-xs">{source.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{material.createdAt}</span>
                      </div>
                      <CardTitle className="mt-2 text-xs font-normal text-muted-foreground">
                        {getProductName(material.asin)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-foreground">
                        {material.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">情感值</span>
                          <SentimentBar score={material.sentimentScore} />
                        </div>
                        <a
                          href={material.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          来源
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="mb-3 size-12 opacity-40" />
                <p className="text-base font-medium">暂无素材</p>
                <p className="mt-1 text-sm">尝试调整筛选条件或刷新素材</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
