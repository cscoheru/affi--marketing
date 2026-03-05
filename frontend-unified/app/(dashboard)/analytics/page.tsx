'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据分析</h1>
        <p className="text-muted-foreground">查看你的实验和收益数据</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>总点击量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12,345</div>
            <p className="text-sm text-green-600">+15% 环比上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>转化率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.8%</div>
            <p className="text-sm text-green-600">+0.3% 环比上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>总收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">¥8,765</div>
            <p className="text-sm text-green-600">+22% 环比上月</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>数据趋势</CardTitle>
          <CardDescription>最近 30 天的点击和转化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            图表组件 - 开发中
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
