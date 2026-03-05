'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ExperimentDetailPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">产品页 A/B 测试</h1>
            <Badge variant="default">运行中</Badge>
          </div>
          <p className="text-muted-foreground">创建于 2024-03-01 · 运行 12 天</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">暂停</Button>
          <Button variant="outline">编辑</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>总点击</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>转化率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>参与用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥456</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>变体对比</CardTitle>
          <CardDescription>不同变体的表现对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div>
                <p className="font-medium">变体 A (当前)</p>
                <p className="text-sm text-muted-foreground">使用新的产品布局</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">3.2%</p>
                <p className="text-sm text-green-600">+0.5% vs 对照</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">变体 B</p>
                <p className="text-sm text-muted-foreground">添加用户评价区域</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">2.9%</p>
                <p className="text-sm text-gray-600">+0.2% vs 对照</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">对照组</p>
                <p className="text-sm text-muted-foreground">原始页面设计</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">2.7%</p>
                <p className="text-sm text-muted-foreground">基准</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
