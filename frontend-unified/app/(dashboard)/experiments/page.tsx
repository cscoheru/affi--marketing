'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function ExperimentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newExperiment, setNewExperiment] = useState({ name: '', type: 'ab' })
  const { toast } = useToast()

  const [experiments, setExperiments] = useState([
    { id: 1, name: '产品页 A/B 测试', status: 'active', clicks: 1234, conversion: '3.2%', created: '2024-03-01' },
    { id: 2, name: '标题优化测试', status: 'completed', clicks: 5678, conversion: '4.1%', created: '2024-02-15' },
    { id: 3, name: '按钮颜色测试', status: 'paused', clicks: 890, conversion: '2.8%', created: '2024-02-20' },
    { id: 4, name: '价格策略测试', status: 'active', clicks: 2345, conversion: '3.5%', created: '2024-03-05' },
  ])

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

  const handleCreateExperiment = () => {
    if (!newExperiment.name.trim()) {
      toast({
        title: '请输入实验名称',
        variant: 'destructive',
      })
      return
    }

    const newId = Math.max(...experiments.map(e => e.id)) + 1
    const experiment = {
      id: newId,
      name: newExperiment.name,
      status: 'paused',
      clicks: 0,
      conversion: '0%',
      created: new Date().toISOString().split('T')[0],
    }

    setExperiments([...experiments, experiment])
    setNewExperiment({ name: '', type: 'ab' })
    setCreateDialogOpen(false)

    toast({
      title: '实验创建成功',
      description: `"${newExperiment.name}" 已添加到实验列表`,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">实验管理</h1>
          <p className="text-muted-foreground">管理和监控你的 A/B 测试实验</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建新实验
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新实验</DialogTitle>
              <DialogDescription>
                设置一个新的 A/B 测试实验来优化你的转化率
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="exp-name">实验名称</Label>
                <Input
                  id="exp-name"
                  placeholder="例如：产品页标题测试"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-type">实验类型</Label>
                <Select value={newExperiment.type} onValueChange={(v) => setNewExperiment({ ...newExperiment, type: v })}>
                  <SelectTrigger id="exp-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ab">A/B 测试</SelectItem>
                    <SelectItem value="multivariate">多变量测试</SelectItem>
                    <SelectItem value="split">分流测试</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateExperiment}>
                创建实验
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            {experiments
              .filter((exp) =>
                exp.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((exp) => (
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/experiments/${exp.id}`}>
                      查看详情
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
