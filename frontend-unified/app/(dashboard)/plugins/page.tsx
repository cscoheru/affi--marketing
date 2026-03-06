'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Plugin {
  id: number
  name: string
  description: string
  status: 'enabled' | 'disabled'
  icon: string
  config?: Record<string, string>
}

export default function PluginsPage() {
  const { toast } = useToast()
  const [plugins, setPlugins] = useState<Plugin[]>([
    { id: 1, name: 'AI 内容生成', description: '自动生成产品描述和营销文案', status: 'enabled', icon: '🤖', config: { model: 'qwen', tone: 'professional' } },
    { id: 2, name: '智能分析', description: '分析用户行为并提供优化建议', status: 'enabled', icon: '📊', config: { threshold: '80' } },
    { id: 3, name: '自动投放', description: '自动将内容发布到多个平台', status: 'disabled', icon: '🚀' },
    { id: 4, name: '竞品监控', description: '监控竞争对手的价格和策略', status: 'enabled', icon: '🔍', config: { interval: 'daily' } },
  ])
  const [configPlugin, setConfigPlugin] = useState<Plugin | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})

  const handleToggle = (id: number) => {
    setPlugins(plugins.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'enabled' ? 'disabled' : 'enabled'
        toast({
          title: newStatus === 'enabled' ? '插件已启用' : '插件已禁用',
          description: `"${p.name}" ${newStatus === 'enabled' ? '现在正在运行' : '已停止运行'}`,
        })
        return { ...p, status: newStatus }
      }
      return p
    }))
  }

  const handleConfig = (plugin: Plugin) => {
    setConfigPlugin(plugin)
    setConfigValues(plugin.config || {})
  }

  const handleSaveConfig = () => {
    if (configPlugin) {
      setPlugins(plugins.map(p =>
        p.id === configPlugin.id ? { ...p, config: configValues } : p
      ))
      setConfigPlugin(null)
      toast({
        title: '配置已保存',
        description: `"${configPlugin.name}" 的配置已更新`,
      })
    }
  }

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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{plugin.name}</CardTitle>
                      <Badge variant={plugin.status === 'enabled' ? 'default' : 'secondary'}>
                        {plugin.status === 'enabled' ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{plugin.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={plugin.status === 'enabled'}
                  onCheckedChange={() => handleToggle(plugin.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {plugin.config ? `${Object.keys(plugin.config).length} 项配置` : '无配置项'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfig(plugin)}
                  disabled={plugin.status === 'disabled'}
                >
                  {plugin.status === 'enabled' ? '配置' : '先启用'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config Dialog */}
      <Dialog open={!!configPlugin} onOpenChange={() => setConfigPlugin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>配置 {configPlugin?.name}</DialogTitle>
            <DialogDescription>
              调整插件设置以自定义行为
            </DialogDescription>
          </DialogHeader>
          {configPlugin && (
            <div className="space-y-4 py-4">
              {configPlugin.id === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="model">AI 模型</Label>
                    <select
                      id="model"
                      className="w-full px-3 py-2 border rounded-md"
                      value={configValues.model || 'qwen'}
                      onChange={(e) => setConfigValues({ ...configValues, model: e.target.value })}
                    >
                      <option value="qwen">通义千问</option>
                      <option value="openai">OpenAI</option>
                      <option value="chatglm">智谱GLM</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">语调风格</Label>
                    <select
                      id="tone"
                      className="w-full px-3 py-2 border rounded-md"
                      value={configValues.tone || 'professional'}
                      onChange={(e) => setConfigValues({ ...configValues, tone: e.target.value })}
                    >
                      <option value="professional">专业严谨</option>
                      <option value="casual">轻松随意</option>
                      <option value="friendly">友好热情</option>
                    </select>
                  </div>
                </>
              )}
              {configPlugin.id === 2 && (
                <div className="space-y-2">
                  <Label htmlFor="threshold">分析阈值 (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={configValues.threshold || '80'}
                    onChange={(e) => setConfigValues({ ...configValues, threshold: e.target.value })}
                  />
                </div>
              )}
              {configPlugin.id === 4 && (
                <div className="space-y-2">
                  <Label htmlFor="interval">监控频率</Label>
                  <select
                    id="interval"
                    className="w-full px-3 py-2 border rounded-md"
                    value={configValues.interval || 'daily'}
                    onChange={(e) => setConfigValues({ ...configValues, interval: e.target.value })}
                  >
                    <option value="hourly">每小时</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                  </select>
                </div>
              )}
              {configPlugin.id === 3 && (
                <div className="text-center py-4 text-muted-foreground">
                  此插件暂无可配置项
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfigPlugin(null)}>
              取消
            </Button>
            <Button onClick={handleSaveConfig}>
              保存配置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
