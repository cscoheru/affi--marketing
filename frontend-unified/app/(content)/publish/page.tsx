'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 模拟数据
const mockPublishTasks = [
  { id: '1', title: 'Nespresso 咖啡机深度测评', platform: 'blog', status: 'scheduled', publishDate: '2026-03-10 10:00' },
  { id: '2', title: '2025年最佳咖啡机推荐', platform: 'twitter', status: 'published', publishDate: '2026-03-05 14:00' },
  { id: '3', title: '咖啡机使用指南视频', platform: 'youtube', status: 'draft', publishDate: '-' },
]

export default function PublishPage() {
  const [tasks] = useState(mockPublishTasks)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">发布中心</h1>
        <Button>创建发布任务</Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="scheduled">待发布</TabsTrigger>
          <TabsTrigger value="published">已发布</TabsTrigger>
          <TabsTrigger value="draft">草稿</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>发布任务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant="outline">{task.platform}</Badge>
                        <Badge
                          variant={
                            task.status === 'published' ? 'default' :
                            task.status === 'scheduled' ? 'secondary' :
                            'outline'
                          }
                        >
                          {task.status === 'published' ? '已发布' :
                           task.status === 'scheduled' ? '待发布' : '草稿'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        发布时间: {task.publishDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">编辑</Button>
                      {task.status === 'scheduled' && (
                        <Button variant="ghost" size="sm">立即发布</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">待发布的任务 ({tasks.filter(t => t.status === 'scheduled').length})</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">已发布的任务 ({tasks.filter(t => t.status === 'published').length})</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">草稿箱 ({tasks.filter(t => t.status === 'draft').length})</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
