"use client";

import { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Search,
  MessageSquare,
  Video,
  Users,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Material } from "@/types";

export default function MaterialsPage() {
  const searchParams = useSearchParams();
  const asinParam = searchParams.get("asin");

  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Array<{ id: number; asin: string; title: string }>>([]);
  const [selectedAsin, setSelectedAsin] = useState<string>(asinParam || "");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const productRes = await fetch(
        "http://localhost:8080/api/v1/products?page=1&pageSize=100",
        { headers: { Origin: "http://localhost:3001" } }
      );
      const productData = await productRes.json();
      setProducts(productData.products || []);

      const sourceType = activeTab === "all" ? "" : `&sourceType=${activeTab}`;
      const materialsRes = await fetch(
        `http://localhost:8080/api/v1/materials?page=1&pageSize=100${sourceType}`,
        { headers: { Origin: "http://localhost:3001" } }
      );
      const materialsData = await materialsRes.json();
      setMaterials(materialsData.materials || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (asinParam) {
      setSelectedAsin(asinParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asinParam]);

  const filteredMaterials = materials.filter((m) => {
    const matchAsin = !selectedAsin || m.asin === selectedAsin;
    const matchSearch =
      !search ||
      m.content.toLowerCase().includes(search.toLowerCase());
    return matchAsin && matchSearch;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  const handleCollectMaterials = async () => {
    if (!selectedAsin) {
      alert("请先选择产品");
      return;
    }

    const response = await fetch("http://localhost:8080/api/v1/materials/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asin: selectedAsin,
        sourceTypes: ["amazon_review", "youtube"],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(`素材收集任务已创建！任务ID: ${result.taskId}\n请稍后刷新查看收集结果。`);
    } else {
      const error = await response.json();
      alert(`收集失败: ${error.error || "未知错误"}`);
    }
  };

  const sourceTypes = [
    { value: "all", label: "全部来源", icon: Database },
    { value: "amazon_review", label: "Amazon 评论", icon: MessageSquare },
    { value: "youtube", label: "YouTube 视频", icon: Video },
    { value: "reddit", label: "Reddit 讨论", icon: Users },
    { value: "quora", label: "Quora 问答", icon: HelpCircle },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <Select
              value={selectedAsin || "all"}
              onValueChange={(v) => setSelectedAsin(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择产品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部产品</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.asin}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索素材内容..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              刷新
            </Button>
            <Button
              size="sm"
              onClick={handleCollectMaterials}
              disabled={!selectedAsin}
            >
              <Plus className="mr-2 h-4 w-4" />
              收集素材
            </Button>
          </div>
        </div>

        {(() => {
          const selectedProduct = products.find((p) => p.asin === selectedAsin);
          return selectedProduct ? (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">当前产品: {selectedProduct.title}</span>
                <span className="text-muted-foreground">ASIN: {selectedProduct.asin}</span>
                <span className="text-muted-foreground">素材数量: {filteredMaterials.length}</span>
              </div>
            </div>
          ) : null;
        })()}

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v !== "all") {
              fetch(
                `http://localhost:8080/api/v1/materials?page=1&pageSize=100&sourceType=${v}`,
                { headers: { Origin: "http://localhost:3001" } }
              )
                .then((res) => res.json())
                .then((data) => setMaterials(data.materials || []))
                .catch(() => setMaterials([]));
            }
          }}
        >
          <TabsList>
            {sourceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.value} value={type.value}>
                  <Icon className="mr-2 h-4 w-4" />
                  {type.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
                <Database className="mb-3 h-12 w-12 opacity-40" />
                <p className="text-base font-medium">暂无素材</p>
                <p className="mt-1 text-sm">
                  {selectedAsin
                    ? '选择产品后点击"收集素材"开始收集'
                    : "请先选择产品"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const sourceTypeIcons: Record<string, string> = {
    amazon_review: "🛒",
    youtube: "📺",
    reddit: "💬",
    quora: "❓",
  };

  const sourceTypeNames: Record<string, string> = {
    amazon_review: "Amazon 评论",
    youtube: "YouTube 视频",
    reddit: "Reddit 讨论",
    quora: "Quora 问答",
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {sourceTypeIcons[material.sourceType] || "📄"}
            </span>
            <div>
              <CardTitle className="text-base">
                {sourceTypeNames[material.sourceType] || material.sourceType}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ASIN: {material.asin}
              </p>
            </div>
          </div>
          {material.sentimentScore && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">情感得分</p>
              <p className="text-sm font-medium">
                {(material.sentimentScore * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground line-clamp-3">
          {material.content}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(material.createdAt)}</span>
          {material.sourceUrl && (
            <a
              href={material.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              查看原文 →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
