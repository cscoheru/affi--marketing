"""
API Models for Request/Response Validation
"""
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ModelTier(str, Enum):
    """Model tier for generation"""
    ECONOMY = "economy"
    STANDARD = "standard"
    PREMIUM = "premium"


class ContentType(str, Enum):
    """Content types"""
    ARTICLE = "article"
    REVIEW = "review"
    COMPARISON = "comparison"
    GUIDE = "guide"


class Tone(str, Enum):
    """Content tone options"""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    FRIENDLY = "friendly"
    FORMAL = "formal"
    HUMOROUS = "humorous"


class Language(str, Enum):
    """Supported languages"""
    ZH_CN = "zh-CN"
    EN_US = "en-US"


# Request Models

class GenerateTextRequest(BaseModel):
    """Request to generate text with AI"""
    prompt: str = Field(..., description="Text generation prompt", min_length=1)
    system_prompt: Optional[str] = Field(default=None, description="System prompt")
    max_tokens: int = Field(default=2000, ge=1, le=32000, description="Maximum tokens")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    tier: ModelTier = Field(default=ModelTier.STANDARD, description="Model tier")
    model: Optional[str] = Field(default=None, description="Specific model override")


class GenerateContentRequest(BaseModel):
    """Request to generate SEO-optimized content"""
    keyword: str = Field(..., description="Primary keyword", min_length=1)
    content_type: ContentType = Field(default=ContentType.ARTICLE, description="Content type")
    tone: Tone = Field(default=Tone.PROFESSIONAL, description="Content tone")
    target_length: int = Field(default=1500, ge=100, le=10000, description="Target word count")
    include_html: bool = Field(default=True, description="Include HTML structure")
    language: Language = Field(default=Language.ZH_CN, description="Content language")
    custom_instructions: Optional[str] = Field(default=None, description="Additional instructions")
    secondary_keywords: List[str] = Field(default_factory=list, description="Secondary keywords")
    inject_affiliate_links: bool = Field(default=False, description="Inject affiliate links")


class AnalyzeKeywordRequest(BaseModel):
    """Request to analyze keyword"""
    keyword: str = Field(..., description="Keyword to analyze", min_length=1)


class InjectLinksRequest(BaseModel):
    """Request to inject affiliate links"""
    content: str = Field(..., description="Content to inject links into", min_length=1)
    keywords: List[str] = Field(..., description="Relevant keywords", min_items=1)
    max_links: int = Field(default=5, ge=1, le=20, description="Maximum links")


class RegisterLinkRequest(BaseModel):
    """Request to register affiliate link"""
    network: str = Field(..., description="Affiliate network")
    link_type: str = Field(default="product", description="Link type")
    url: str = Field(..., description="Affiliate URL")
    product_id: Optional[str] = Field(default=None, description="Product ID")
    title: str = Field(..., description="Link title")
    keywords: List[str] = Field(default_factory=list, description="Target keywords")
    priority: int = Field(default=1, ge=1, le=10, description="Link priority")


# Response Models

class GenerateTextResponse(BaseModel):
    """Response from text generation"""
    content: str
    model_used: str
    tokens_used: Dict[str, int]
    cost_estimate: float
    finish_reason: str


class GenerateContentResponse(BaseModel):
    """Response from content generation"""
    success: bool
    title: str
    content: str
    html_content: str
    meta_description: str
    keywords: List[str]
    word_count: int
    seo_score: float
    readability_score: float
    model_used: str
    tokens_used: int
    cost_estimate: float


class AnalyzeKeywordResponse(BaseModel):
    """Response from keyword analysis"""
    keyword: str
    search_volume: int
    competition_level: str
    difficulty_score: float
    search_intent: str
    related_keywords: List[str]
    suggestions: List[str]
    opportunities: List[str]


class InjectLinksResponse(BaseModel):
    """Response from link injection"""
    content: str
    links_injected: int
    links_used: List[Dict]
    affiliate_networks: List[str]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    models_available: Dict[str, int]
    uptime_seconds: float


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Info Models

class ModelInfo(BaseModel):
    """Model information"""
    name: str
    tier: str
    provider: str
    context_length: int
    cost_per_1k_tokens: Dict[str, float]


class UsageStatistics(BaseModel):
    """Usage statistics"""
    total_requests: int
    total_tokens: int
    total_cost: float
    by_model: Dict[str, Dict]
    by_tier: Dict[str, int]
    daily_stats: Dict[str, Dict]
