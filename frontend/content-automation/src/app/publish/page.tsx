"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Settings2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function PublishPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载发布队列
      const queueRes = await fetch("http://localhost:8080/api/v1/publish/queue", {
        headers: { Origin: "http://localhost:3001" }
      });
      const queueData = await queueRes.json();
      setQueue(queueData.queue || []);

      // 加载发布平台
      const platformsRes = await fetch("http://localhost:8080/api/v1/publish/platforms", {
        headers: { Origin: "http://localhost:3001" }
      });
      const platformsData = await platformsRes.json();
      setPlatforms(platformsData.platforms || []);

      // 加载已通过的内容（用于发布）
      const contentRes = await fetch(
        "http://localhost:8080/api/v1/contents?page=1&size=100&status=approved",
        { headers: { Origin: "http://localhost:3001" }
      });
      const contentData = await contentRes.json();
      setContents(contentData.contents || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPublish = async () => {
    if (!selectedContent || selectedPlatforms.length === 0) {
      alert("请选择内容和发布平台");
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/publish/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: selectedContent.id,
          platforms: selectedPlatforms,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`发布任务已创建！任务ID: ${result.taskId}`);
        setSubmitDialogOpen(false);
        setSelectedContent(null);
        setSelectedPlatforms([]);
        loadData(); // 刷新队列
      } else {
        const error = await response.json();
        alert(`提交失败: ${error.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("提交失败，请稍后重试");
    } finally {
      setPublishing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: "default",
      completed: "default",
      failed: "destructive",
      running: "secondary",
      processing: "secondary",
      pending: "outline",
    };

    const labels: Record<string, string> = {
      success: "成功",
      completed: "已完成",
      failed: "失败",
      running: "发布中",
      processing: "处理中",
      pending: "等待中",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const enabledPlatforms = platforms.filter((p) => p.enabled);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">发布中心</h2>
            <p className="text-sm text-muted-foreground">
              管理内容发布到各平台
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Button size="sm" onClick={() => setSubmitDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              发布内容
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                发布队列
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{queue.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                待处理任务
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已启用平台
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enabledPlatforms.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                共 {platforms.length} 个平台
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                可发布内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                已审核通过的内容
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Publish Queue */}
        <div>
          <h3 className="text-lg font-semibold mb-4">发布队列</h3>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <Send className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p>暂无发布任务</p>
                <p className="text-sm mt-1">
                  请先在"内容管理"中审核通过内容，然后在此发布
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {queue.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {task.title || `任务 #${task.id}`}
                      </CardTitle>
                      {getStatusBadge(task.status || "pending")}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(task.status || "pending")}
                        <span className="text-muted-foreground">
                          状态: {task.status || "pending"}
                        </span>
                      </div>
                      {task.platformResults && (
                        <div className="mt-3 space-y-2">
                          {task.platformResults.map((result: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-2">
                                {getStatusIcon(result.status)}
                                <span className="text-sm font-medium">
                                  {result.platformName || `平台 ${idx + 1}`}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {result.status === "success" && result.url && (
                                  <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    查看发布 →
                                  </a>
                                )}
                                {result.error && (
                                  <span className="text-red-600">{result.error}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Platforms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">发布平台</h3>
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              配置平台
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {platforms.map((platform) => (
              <Card key={platform.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {platform.displayName || platform.name}
                    </CardTitle>
                    <Badge variant={platform.enabled ? "default" : "secondary"}>
                      {platform.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">类型:</span>
                      <span className="font-medium">{platform.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">状态:</span>
                      <Badge
                        variant={platform.status === "connected" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {platform.status === "connected" ? "已连接" : "未连接"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发布内容</DialogTitle>
            <DialogDescription>
              选择要发布的内容和目标平台
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label>选择内容</Label>
              {contents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无可发布内容。请先在"内容管理"中审核通过内容。
                </p>
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedContent?.id || ""}
                  onChange={(e) => {
                    const content = contents.find((c) => c.id === parseInt(e.target.value));
                    setSelectedContent(content);
                  }}
                >
                  <option value="">请选择内容</option>
                  {contents.map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>选择平台</Label>
              <div className="space-y-2">
                {enabledPlatforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    暂无可用平台。请先启用发布平台。
                  </p>
                ) : (
                  enabledPlatforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platform-${platform.id}`}
                        checked={selectedPlatforms.includes(platform.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform.name]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform.name));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`platform-${platform.id}`}
                        className="font-normal"
                      >
                        {platform.displayName || platform.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={publishing}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitPublish}
              disabled={publishing || !selectedContent || selectedPlatforms.length === 0}
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {publishing ? "提交中..." : "开始发布"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
