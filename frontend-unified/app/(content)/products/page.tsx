'use client'

import { useState } from 'react'
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

// 模拟数据
const mockProducts = [
  { asin: 'B08C4KVM9K', title: 'Nespresso 咖啡机', status: 'active' },
  { asin: 'B09F3K2L7M', title: 'DeLonghi 全自动咖啡机', status: 'pending' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [products] = useState(mockProducts)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <Button>添加产品</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品列表</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ASIN</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.asin}>
                  <TableCell className="font-mono">{product.asin}</TableCell>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? '活跃' : '待审核'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">编辑</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
