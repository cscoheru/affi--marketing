'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, Bot } from 'lucide-react'
import { useBlogStore } from '@/lib/blog/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function BlogSettingsPage() {
  const { settings, updateSettings, fetchCategories, categories, syncStatus, fetchSyncStatus, toggleAutoSync } = useBlogStore()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)
  const [refreshingSync, setRefreshingSync] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchSyncStatus()
  }, [fetchCategories, fetchSyncStatus])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleRefreshSync = async () => {
    setRefreshingSync(true)
    await fetchSyncStatus()
    setRefreshingSync(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateSettings(localSettings)
      setHasChanges(false)
      toast({
        title: '保存成功',
        description: '博客设置已更新',
      })
    } catch {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('确定要重置为默认设置吗？')) {
      updateSettings({}) // Reset to defaults
      setHasChanges(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">博客设置</h1>
            <p className="text-sm text-muted-foreground">配置博客的基本信息和功能</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            重置默认
          </Button>
          <Button onClick={handleSave} disabled={loading || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">站点名称</Label>
                <Input
                  id="siteName"
                  value={localSettings.siteName}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, siteName: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="Affi-Marketing 博客"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">站点描述</Label>
                <Textarea
                  id="siteDescription"
                  value={localSettings.siteDescription}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, siteDescription: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="探索联盟营销、SEO 优化、技术教程和产品测评的最新内容"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">站点 URL</Label>
                <Input
                  id="siteUrl"
                  value={localSettings.siteUrl}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, siteUrl: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="https://yourblog.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Comment Settings */}
          <Card>
            <CardHeader>
              <CardTitle>评论设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用评论</Label>
                  <p className="text-sm text-muted-foreground">
                    允许访客在文章下方发表评论
                  </p>
                </div>
                <Switch
                  checked={localSettings.commentsEnabled}
                  onCheckedChange={(checked) => {
                    setLocalSettings({ ...localSettings, commentsEnabled: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>评论需要审核</Label>
                  <p className="text-sm text-muted-foreground">
                    新评论需要管理员审核后才会显示
                  </p>
                </div>
                <Switch
                  checked={localSettings.commentsRequireApproval}
                  onCheckedChange={(checked) => {
                    setLocalSettings({ ...localSettings, commentsRequireApproval: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>登录才能评论</Label>
                  <p className="text-sm text-muted-foreground">
                    只有登录用户才能发表评论
                  </p>
                </div>
                <Switch
                  checked={localSettings.commentsRequireLogin}
                  onCheckedChange={(checked) => {
                    setLocalSettings({ ...localSettings, commentsRequireLogin: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO 设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultMetaDescription">默认 Meta 描述</Label>
                <Textarea
                  id="defaultMetaDescription"
                  value={localSettings.defaultMetaDescription}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, defaultMetaDescription: e.target.value })
                    setHasChanges(true)
                  }}
                  placeholder="默认的搜索引擎描述..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  当文章没有设置 Meta 描述时使用此默认值
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="articlesPerPage">每页文章数</Label>
                <Input
                  id="articlesPerPage"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.articlesPerPage}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, articlesPerPage: parseInt(e.target.value) || 12 })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle>功能开关</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>阅读进度</Label>
                  <p className="text-sm text-muted-foreground">
                    显示文章阅读进度条
                  </p>
                </div>
                <Switch
                  checked={localSettings.features.readingProgress}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      features: { ...localSettings.features, readingProgress: checked },
                    })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>分享按钮</Label>
                  <p className="text-sm text-muted-foreground">
                    显示社交媒体分享按钮
                  </p>
                </div>
                <Switch
                  checked={localSettings.features.shareButtons}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      features: { ...localSettings.features, shareButtons: checked },
                    })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>相关文章</Label>
                  <p className="text-sm text-muted-foreground">
                    在文章底部显示相关文章推荐
                  </p>
                </div>
                <Switch
                  checked={localSettings.features.relatedArticles}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      features: { ...localSettings.features, relatedArticles: checked },
                    })
                    setHasChanges(true)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>目录索引</Label>
                  <p className="text-sm text-muted-foreground">
                    自动生成文章目录索引
                  </p>
                </div>
                <Switch
                  checked={localSettings.features.tableOfContents}
                  onCheckedChange={(checked) => {
                    setLocalSettings({
                      ...localSettings,
                      features: { ...localSettings.features, tableOfContents: checked },
                    })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories Preview */}
          <Card>
            <CardHeader>
              <CardTitle>当前分类</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${category.color}`} />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>快速统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">分类数量</span>
                  <span className="font-medium">{categories.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Sync Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  内容同步
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshSync}
                  disabled={refreshingSync}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingSync ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">待同步内容</span>
                <Badge variant={syncStatus.pendingCount > 0 ? 'default' : 'secondary'}>
                  {syncStatus.pendingCount} 篇
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">自动同步</span>
                <Switch
                  checked={syncStatus.autoSyncEnabled}
                  onCheckedChange={toggleAutoSync}
                />
              </div>
              {syncStatus.lastSyncAt && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    上次同步: {new Date(syncStatus.lastSyncAt).toLocaleString('zh-CN')}
                  </p>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <Link href="/content">管理内容自动化</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
