'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ExperimentsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const experiments = [
    { id: 1, name: '产品页 A/B 测试', status: 'active', clicks: 1234, conversion: '3.2%', created: '2024-03-01' },
    { id: 2, name: '标题优化测试', status: 'completed', clicks: 5678, conversion: '4.1%', created: '2024-02-15' },
    { id: 3, name: '按钮颜色测试', status: 'paused', clicks: 890, conversion: '2.8%', created: '2024-02-20' },
    { id: 4, name: '价格策略测试', status: 'active', clicks: 2345, conversion: '3.5%', created: '2024-03-05' },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      active: '运行中',
      completed: '已完成',
      paused: '已暂停',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">实验管理</h1>
          <p className="text-muted-foreground">管理和监控你的 A/B 测试实验</p>
        </div>
        <Button>创建新实验</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>实验列表</CardTitle>
            <Input
              placeholder="搜索实验..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experiments.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{exp.name}</h3>
                    {getStatusBadge(exp.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">创建于 {exp.created}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">点击</p>
                    <p className="font-semibold">{exp.clicks.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">转化率</p>
                    <p className="font-semibold">{exp.conversion}</p>
                  </div>
                  <Button variant="outline" size="sm">查看详情</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
