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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 模拟数据
const mockContent = [
  { id: '1', title: 'Nespresso 咖啡机深度测评', type: 'article', status: 'published', product: 'B08C4KVM9K', createdAt: '2026-03-05' },
  { id: '2', title: '2025年最佳咖啡机推荐', type: 'article', status: 'draft', product: 'B09F3K2L7M', createdAt: '2026-03-04' },
  { id: '3', title: '咖啡机使用指南视频', type: 'video', status: 'review', product: 'B08C4KVM9K', createdAt: '2026-03-03' },
]

export default function ContentPage() {
  const [search, setSearch] = useState('')
  const [contents] = useState(mockContent)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">内容管理</h1>
        <Button>创建内容</Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="article">文章</TabsTrigger>
          <TabsTrigger value="video">视频</TabsTrigger>
          <TabsTrigger value="social">社交媒体</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>内容列表</CardTitle>
              <Input
                placeholder="搜索内容..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>产品</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>{content.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{content.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{content.product}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            content.status === 'published' ? 'default' :
                            content.status === 'draft' ? 'secondary' :
                            'outline'
                          }
                        >
                          {content.status === 'published' ? '已发布' :
                           content.status === 'draft' ? '草稿' : '审核中'}
                        </Badge>
                      </TableCell>
                      <TableCell>{content.createdAt}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">编辑</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="article">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">文章内容列表</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">视频内容列表</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">社交媒体内容列表</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
