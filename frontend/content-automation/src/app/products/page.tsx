"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Search, Package, Loader2, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import type { Product } from "@/types";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generating, setGenerating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "review",
    model: "claude",
  });

  // 获取产品列表
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/v1/products?page=1&pageSize=100`,
        {
          headers: {
            Origin: "http://localhost:3001",
          },
        }
      );
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      // 如果 API 失败，使用空数组
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.asin.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleGenerateContent = (product: Product) => {
    setSelectedProduct(product);
    setGenerateDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;

    setGenerating(true);
    try {
      console.log("Generating content for:", selectedProduct.asin, "type:", createForm.type, "model:", createForm.model);

      // 调用内容生成 API
      const response = await fetch("http://localhost:8080/api/v1/contents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asin: selectedProduct.asin,
          contentType: createForm.type,
          model: createForm.model,
        }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Generation result:", result);
        alert(`内容生成任务已创建！任务ID: ${result.taskId}\n请前往"内容管理"页面查看生成进度。`);
        setGenerateDialogOpen(false);
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Generation error:", error);
        alert(`生成失败: ${error.error || "未知错误"}\n状态码: ${response.status}`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert(`网络错误: ${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewMaterials = (product: Product) => {
    // 导航到素材库页面，并过滤该产品的素材
    window.location.href = `/materials?asin=${product.asin}`;
  };

  const handleAddProduct = () => {
    alert("添加产品功能正在开发中。\n\n您可以：\n1. 通过素材收集功能自动添加产品\n2. 在数据库中直接添加产品记录\n3. 等待后续更新支持手动添加");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索产品名称或 ASIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            添加产品
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            共 <strong className="text-foreground">{filteredProducts.length}</strong> 个产品
          </span>
          <span>
            调研中 <strong className="text-foreground">{filteredProducts.filter((p) => p.status === "researching").length}</strong>
          </span>
          <span>
            已覆盖 <strong className="text-foreground">{filteredProducts.filter((p) => p.status === "covered").length}</strong>
          </span>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Products grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onGenerate={handleGenerateContent}
                onViewMaterials={handleViewMaterials}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-muted-foreground">
            <Package className="mb-3 h-12 w-12 opacity-40" />
            <p className="text-base font-medium">暂无匹配的产品</p>
            <p className="mt-1 text-sm">尝试调整筛选条件或添加新产品</p>
          </div>
        )}
      </div>

      {/* AI 生成内容对话框 */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 生成内容</DialogTitle>
            <DialogDescription>
              为 <strong>{selectedProduct?.title}</strong> 生成 {createForm.type === "review" ? "评测" : createForm.type === "science" ? "科普" : "指南"}文章
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4">
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
                    Claude
                  </SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {generating ? "生成中..." : "开始生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ProductCard({
  product,
  onGenerate,
  onViewMaterials,
}: {
  product: Product;
  onGenerate: (product: Product) => void;
  onViewMaterials: (product: Product) => void;
}) {
  const hasImage = product.imageUrl && product.imageUrl.trim() !== "";

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full overflow-hidden bg-muted flex items-center justify-center">
        {hasImage ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={300}
            height={300}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
            <Package className="h-16 w-16 opacity-20" />
            <p className="mt-2 text-sm">暂无图片</p>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="line-clamp-2 font-semibold">{product.title}</h3>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="font-medium">${product.price}</span>
          <span className="text-muted-foreground">★ {product.rating}</span>
          <span className="text-muted-foreground">{product.reviewCount} 评论</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {product.category}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              product.status === "covered"
                ? "bg-green-100 text-green-800"
                : product.status === "researching"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {product.status === "covered"
              ? "已覆盖"
              : product.status === "researching"
                ? "调研中"
                : "待处理"}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewMaterials(product)}
          >
            查看素材
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onGenerate(product)}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            生成内容
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
