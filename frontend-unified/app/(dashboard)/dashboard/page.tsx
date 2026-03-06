'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const stats = [
    { title: '总实验', value: '12', icon: '🧪', description: '+2 本月新增' },
    { title: '活跃插件', value: '5', icon: '🔌', description: '运行正常' },
    { title: '本月点击', value: '1,234', icon: '📊', description: '+15% 环比' },
    { title: '本月收益', value: '¥3,456', icon: '💰', description: '+8% 环比' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仪表板</h1>
          <p className="text-muted-foreground">欢迎回来，{user?.name || '用户'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>最近的实验和插件更新</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">实验 &quot;产品页测试&quot; 已完成</p>
                  <p className="text-xs text-muted-foreground">2 小时前</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">新插件 &quot;AI 分析&quot; 已启用</p>
                  <p className="text-xs text-muted-foreground">昨天</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">结算报告已生成</p>
                  <p className="text-xs text-muted-foreground">3 天前</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/experiments" className="block p-3 rounded-lg hover:bg-accent transition">
              <div className="flex items-center gap-3">
                <span>🧪</span>
                <div>
                  <p className="text-sm font-medium">创建新实验</p>
                  <p className="text-xs text-muted-foreground">开始新的 A/B 测试</p>
                </div>
              </div>
            </Link>
            <Link href="/plugins" className="block p-3 rounded-lg hover:bg-accent transition">
              <div className="flex items-center gap-3">
                <span>🔌</span>
                <div>
                  <p className="text-sm font-medium">管理插件</p>
                  <p className="text-xs text-muted-foreground">启用或配置插件</p>
                </div>
              </div>
            </Link>
            <Link href="/analytics" className="block p-3 rounded-lg hover:bg-accent transition">
              <div className="flex items-center gap-3">
                <span>📈</span>
                <div>
                  <p className="text-sm font-medium">查看分析</p>
                  <p className="text-xs text-muted-foreground">数据分析与报告</p>
                </div>
              </div>
            </Link>
            <Link href="/products" className="block p-3 rounded-lg hover:bg-accent transition">
              <div className="flex items-center gap-3">
                <span>📦</span>
                <div>
                  <p className="text-sm font-medium">管理产品</p>
                  <p className="text-xs text-muted-foreground">添加和编辑产品信息</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
