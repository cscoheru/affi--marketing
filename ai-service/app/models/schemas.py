from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = "healthy"
    version: str = "1.0.0"
    services: Dict[str, str] = {}


class ContentGenerateRequest(BaseModel):
    """内容生成请求"""
    keyword: str = Field(..., description="关键词或主题")
    content_type: str = Field(..., description="内容类型: seo_article, product_description, etc.")
    target_length: int = Field(1000, description="目标字数", ge=100, le=5000)
    style: Optional[str] = Field("professional", description="写作风格")
    language: str = Field("zh", description="语言")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MetaTags(BaseModel):
    """SEO 元标签"""
    title: str
    description: str
    keywords: str
    og_title: Optional[str] = None
    og_image: Optional[str] = None
    canonical: Optional[str] = None


class ContentMetrics(BaseModel):
    """内容生成指标"""
    tokens_used: int
    cost: float
    duration_ms: int
    model: str


class ContentGenerateResponse(BaseModel):
    """内容生成响应"""
    success: bool
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: int


class ContentData(BaseModel):
    """生成的内容数据"""
    title: str
    content: str
    summary: str
    meta_tags: MetaTags
    metrics: ContentMetrics
