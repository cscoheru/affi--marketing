"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Content } from "@/types";
import { cn } from "@/lib/utils";

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewingContent, setReviewingContent] = useState<Content | null>(null);
  const [reviewDecision, setReviewDecision] = useState("approve");
  const [reviewComment, setReviewComment] = useState("");
  const [createForm, setCreateForm] = useState({
    asin: "",
    type: "review",
    model: "claude",
  });
  const [products, setProducts] = useState<Array<{ id: number; asin: string; title: string }>>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载内容列表
      const statusParam = activeTab === "all" ? "" : `&status=${activeTab}`;
      const contentRes = await fetch(
        `http://localhost:8080/api/v1/contents?page=1&size=100${statusParam}`,
        { headers: { Origin: "http://localhost:3001" } }
      );
      const contentData = await contentRes.json();
      setContents(contentData.contents || []);

      // 加载产品列表（用于生成对话框）
      const productRes = await fetch(
        "http://localhost:8080/api/v1/products?page=1&pageSize=100",
        { headers: { Origin: "http://localhost:3001" } }
      );
      const productData = await productRes.json();
      setProducts(productData.products || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载和标签切换时加载数据
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredContents = contents.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const handleGenerate = async () => {
    if (!createForm.asin) {
      alert("请选择产品");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/contents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asin: createForm.asin,
          contentType: createForm.type,
          model: createForm.model,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`内容生成任务已创建！任务ID: ${result.taskId}`);
        setCreateDialogOpen(false);
        loadData(); // 刷新列表
      } else {
        const error = await response.json();
        alert(`生成失败: ${error.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Generate error:", error);
      alert("生成失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = (content: Content) => {
    setReviewingContent(content);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingContent) return;

    setReviewing(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/contents/${reviewingContent.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: reviewDecision,
            comment: reviewComment,
          }),
        }
      );

      if (response.ok) {
        alert("审核成功！");
        setReviewDialogOpen(false);
        loadData(); // 刷新列表
      } else {
        const error = await response.json();
        alert(`审核失败: ${error.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Review error:", error);
      alert("审核失败，请稍后重试");
    } finally {
      setReviewing(false);
    }
  };

  const counts = {
    all: contents.length,
    draft: contents.filter((c) => c.status === "draft").length,
    reviewing: contents.filter((c) => c.status === "reviewing").length,
    approved: contents.filter((c) => c.status === "approved").length,
    published: contents.filter((c) => c.status === "published").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              共 <strong className="text-foreground">{counts.all}</strong> 篇
            </span>
            <span>
              草稿 <strong className="text-foreground">{counts.draft}</strong>
            </span>
            <span>
              待审核 <strong className="text-foreground">{counts.reviewing}</strong>
            </span>
            <span>
              已通过 <strong className="text-foreground">{counts.approved}</strong>
            </span>
            <span>
              已发布 <strong className="text-foreground">{counts.published}</strong>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI 生成内容
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部 ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">草稿 ({counts.draft})</TabsTrigger>
            <TabsTrigger value="reviewing">待审核 ({counts.reviewing})</TabsTrigger>
            <TabsTrigger value="approved">已通过 ({counts.approved})</TabsTrigger>
            <TabsTrigger value="published">已发布 ({counts.published})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ContentTable contents={filteredContents} onReview={handleReview} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 生成内容</DialogTitle>
            <DialogDescription>
              选择产品和内容类型，AI 将自动生成文章
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-2">
              <Label>选择产品</Label>
              <Select
                value={createForm.asin}
                onValueChange={(v) => setCreateForm({ ...createForm, asin: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择产品" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.asin}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>内容类型</Label>
              <RadioGroup
                value={createForm.type}
                onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="review" id="type-review" />
                  <Label htmlFor="type-review" className="font-normal">
                    评测文章
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="science" id="type-science" />
                  <Label htmlFor="type-science" className="font-normal">
                    科普文章
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="guide" id="type-guide" />
                  <Label htmlFor="type-guide" className="font-normal">
                    购买指南
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label>AI 模型</Label>
              <Select
                value={createForm.model}
                onValueChange={(v) => setCreateForm({ ...createForm, model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">
                    Claude (通义千问)
                  </SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={generating}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || !createForm.asin}
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {generating ? "生成中..." : "开始生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>内容审核</DialogTitle>
            <DialogDescription>
              审核 AI 生成的内容，决定是否发布
            </DialogDescription>
          </DialogHeader>
          {reviewingContent && (
            <div className="flex flex-col gap-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {reviewingContent.title}
                </h3>
                <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                  <span>{reviewingContent.type === "review" ? "评测" : reviewingContent.type}</span>
                  <span>{reviewingContent.wordCount} 字</span>
                  <span>ASIN: {reviewingContent.asin}</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                {reviewingContent.content?.substring(0, 500)}...
              </div>
              <div className="flex flex-col gap-2">
                <Label>审核结果</Label>
                <RadioGroup
                  value={reviewDecision}
                  onValueChange={setReviewDecision}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="approve" id="decision-approve" />
                    <Label htmlFor="decision-approve" className="font-normal">
                      通过
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="reject" id="decision-reject" />
                    <Label htmlFor="decision-reject" className="font-normal">
                      拒绝
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="revision" id="decision-revision" />
                    <Label htmlFor="decision-revision" className="font-normal">
                      需修改
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex flex-col gap-2">
                <Label>审核意见</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="输入审核意见（可选）"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewing}
            >
              取消
            </Button>
            <Button onClick={handleSubmitReview} disabled={reviewing}>
              {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ContentTable({
  contents,
  onReview,
}: {
  contents: Content[];
  onReview: (content: Content) => void;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">标题</th>
            <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
            <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
            <th className="px-4 py-3 text-left text-sm font-medium">字数</th>
            <th className="px-4 py-3 text-left text-sm font-medium">AI</th>
            <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
            <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {contents.map((content) => (
            <tr key={content.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{content.title}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {content.type === "review"
                    ? "评测"
                    : content.type === "science"
                      ? "科普"
                      : "指南"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                    content.status === "published" &&
                      "bg-green-100 text-green-800",
                    content.status === "approved" &&
                      "bg-blue-100 text-blue-800",
                    content.status === "reviewing" &&
                      "bg-yellow-100 text-yellow-800",
                    content.status === "draft" &&
                      "bg-gray-100 text-gray-800"
                  )}
                >
                  {content.status === "published" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {content.status === "approved" && (
                    <Eye className="h-3 w-3" />
                  )}
                  {content.status === "reviewing" && (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {content.status === "draft" && (
                    <FileText className="h-3 w-3" />
                  )}
                  {content.status === "draft"
                    ? "草稿"
                    : content.status === "reviewing"
                      ? "待审核"
                      : content.status === "approved"
                        ? "已通过"
                        : "已发布"}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {content.wordCount}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {content.aiModel || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(content.createdAt).toLocaleDateString("zh-CN")}
              </td>
              <td className="px-4 py-3 text-right">
                {content.status === "draft" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReview(content)}
                  >
                    审核
                  </Button>
                ) : content.status === "reviewing" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReview(content)}
                  >
                    再次审核
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">已完成</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {contents.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          暂无内容
        </div>
      )}
    </div>
  );
}
