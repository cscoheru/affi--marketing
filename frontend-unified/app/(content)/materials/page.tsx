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
const mockMaterials = [
  { id: '1', name: '咖啡机测评视频.png', type: 'image', size: '2.3MB', createdAt: '2026-03-05' },
  { id: '2', name: '产品介绍文章.md', type: 'document', size: '45KB', createdAt: '2026-03-04' },
  { id: '3', name: '宣传横 banner.png', type: 'image', size: '1.8MB', createdAt: '2026-03-03' },
]

export default function MaterialsPage() {
  const [search, setSearch] = useState('')
  const [materials] = useState(mockMaterials)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">素材库</h1>
        <Button>上传素材</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>素材列表</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="搜索素材..."
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
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{material.type}</Badge>
                  </TableCell>
                  <TableCell>{material.size}</TableCell>
                  <TableCell>{material.createdAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">下载</Button>
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
