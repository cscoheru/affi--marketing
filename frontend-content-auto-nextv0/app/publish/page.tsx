'use client'

import { useState } from 'react'
import {
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Settings2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  mockPublishTasks,
  mockPlatforms,
  mockPublishLogs,
  mockContents,
} from '@/lib/mock-data'
import type { PublishTask } from '@/lib/types'

const taskStatusConfig: Record<PublishTask['status'], { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: '等待中', icon: Clock, className: 'text-muted-foreground' },
  running: { label: '发布中', icon: Loader2, className: 'text-primary animate-spin' },
  success: { label: '已完成', icon: CheckCircle2, className: 'text-success' },
  failed: { label: '失败', icon: XCircle, className: 'text-destructive' },
}

const logTypeColors: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-primary',
}

export default function PublishPage() {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const approvedContents = mockContents.filter(
    (c) => c.status === 'approved' || c.status === 'published'
  )

  const handlePublish = () => {
    console.log('Publishing:', selectedContent, selectedPlatforms)
    setPublishDialogOpen(false)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <DashboardLayout title="发布中心">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>队列中 <strong className="text-foreground">{mockPublishTasks.length}</strong> 个任务</span>
            <span>成功 <strong className="text-foreground">{mockPublishTasks.filter(t => t.status === 'success').length}</strong></span>
            <span>失败 <strong className="text-destructive">{mockPublishTasks.filter(t => t.status === 'failed').length}</strong></span>
          </div>
          <Button onClick={() => setPublishDialogOpen(true)}>
            <Send className="mr-1.5 size-4" />
            一键发布
          </Button>
        </div>

        {/* Publish queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">发布队列</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>内容标题</TableHead>
                  <TableHead className="w-[200px]">目标平台</TableHead>
                  <TableHead className="w-[120px]">状态</TableHead>
                  <TableHead className="w-[160px]">创建时间</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPublishTasks.map((task) => {
                  const statusConfig = taskStatusConfig[task.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-foreground">
                        {task.contentTitle}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.platforms.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`size-4 ${statusConfig.className}`} />
                          <span className="text-sm">{statusConfig.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.createdAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {task.results.some(r => r.url) && (
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="size-3.5" />
                            </Button>
                          )}
                          {task.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="mr-1 size-3.5" />
                              重试
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Platform config */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">平台配置</CardTitle>
                <Button variant="ghost" size="sm">
                  <Settings2 className="mr-1 size-3.5" />
                  管理
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {mockPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground">
                        {platform.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {platform.configured ? '已配置' : '未配置'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={platform.enabled ? 'default' : 'outline'} className="text-xs">
                        {platform.enabled ? '已启用' : '未启用'}
                      </Badge>
                      <Switch checked={platform.enabled} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Publish logs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">发布日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex flex-col gap-0">
                {mockPublishLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`size-2.5 shrink-0 rounded-full ${logTypeColors[log.type]}`} />
                      {index < mockPublishLogs.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 -mt-0.5">
                      <p className="text-sm leading-relaxed text-foreground">{log.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Publish dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>一键发布</DialogTitle>
            <DialogDescription>
              选择要发布的内容和目标平台
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label>选择内容</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择内容" />
                </SelectTrigger>
                <SelectContent>
                  {approvedContents.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>目标平台</Label>
              {mockPlatforms
                .filter((p) => p.enabled)
                .map((platform) => (
                  <div key={platform.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`platform-${platform.id}`}
                      checked={selectedPlatforms.includes(platform.name)}
                      onCheckedChange={() => togglePlatform(platform.name)}
                    />
                    <Label htmlFor={`platform-${platform.id}`} className="font-normal">
                      {platform.name}
                    </Label>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!selectedContent || selectedPlatforms.length === 0}
            >
              确认发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
