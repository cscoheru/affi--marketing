'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PluginsPage() {
  const plugins = [
    { id: 1, name: 'AI 内容生成', description: '自动生成产品描述和营销文案', status: 'enabled', icon: '🤖' },
    { id: 2, name: '智能分析', description: '分析用户行为并提供优化建议', status: 'enabled', icon: '📊' },
    { id: 3, name: '自动投放', description: '自动将内容发布到多个平台', status: 'disabled', icon: '🚀' },
    { id: 4, name: '竞品监控', description: '监控竞争对手的价格和策略', status: 'enabled', icon: '🔍' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">插件管理</h1>
        <p className="text-muted-foreground">管理和配置系统插件</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plugins.map((plugin) => (
          <Card key={plugin.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{plugin.icon}</span>
                  <div>
                    <CardTitle>{plugin.name}</CardTitle>
                    <CardDescription>{plugin.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${plugin.status === 'enabled' ? 'text-green-600' : 'text-gray-600'}`}>
                  {plugin.status === 'enabled' ? '✓ 已启用' : '○ 已禁用'}
                </span>
                <Button variant={plugin.status === 'enabled' ? 'outline' : 'default'} size="sm">
                  {plugin.status === 'enabled' ? '配置' : '启用'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
