'use client'

import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/lib/types'

const statusMap: Record<Product['status'], { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: '待处理', variant: 'outline' },
  researching: { label: '调研中', variant: 'default' },
  covered: { label: '已覆盖', variant: 'secondary' },
  ignored: { label: '已忽略', variant: 'destructive' },
}

export function ProductCard({
  product,
  onViewMaterials,
  onGenerate,
}: {
  product: Product
  onViewMaterials: (product: Product) => void
  onGenerate: (product: Product) => void
}) {
  const status = statusMap[product.status]

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="size-full object-cover transition-transform hover:scale-105"
          crossOrigin="anonymous"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.title}
        </h3>
        <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">${product.price}</span>
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            {product.rating}
          </span>
          <span>{product.reviewCount.toLocaleString()} 评论</span>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{product.category}</Badge>
          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
          <Badge variant="secondary" className="ml-auto text-xs">
            潜力 {product.potentialScore}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewMaterials(product)}
          >
            查看素材
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onGenerate(product)}
          >
            生成内容
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
