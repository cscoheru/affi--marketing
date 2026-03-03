"""
FastAPI Application for AI Service
"""
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from loguru import logger

from app.config import settings
from app.services.manager import AIServiceManager, GenerationRequest, ModelTier, ModelProvider
from app.adapters.qwen_adapter import QwenAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.chatglm_adapter import ChatGLMAdapter
from app.services.seo import ContentGenerator, ContentGenerationRequest, KeywordAnalyzer
from app.services.affiliate import AffiliateLinkInjector, InjectionResult


# Pydantic models for API requests/responses
class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    models_available: Dict[str, int]
    uptime_seconds: float


class GenerateContentRequest(BaseModel):
    """Request to generate content"""
    keyword: str = Field(..., description="Primary keyword for content")
    content_type: str = Field(default="article", description="Type of content: article, review, comparison, guide")
    tone: str = Field(default="professional", description="Tone of content")
    target_length: int = Field(default=1500, description="Target word count")
    include_html: bool = Field(default=True, description="Include HTML structure")
    language: str = Field(default="zh-CN", description="Content language")
    custom_instructions: Optional[str] = Field(default=None, description="Additional instructions")
    secondary_keywords: List[str] = Field(default_factory=list, description="Secondary keywords")
    inject_affiliate_links: bool = Field(default=False, description="Inject affiliate links")


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


class AnalyzeKeywordRequest(BaseModel):
    """Request to analyze keyword"""
    keyword: str = Field(..., description="Keyword to analyze")


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


class InjectLinksRequest(BaseModel):
    """Request to inject affiliate links"""
    content: str = Field(..., description="Content to inject links into")
    keywords: List[str] = Field(..., description="Relevant keywords")
    max_links: int = Field(default=5, description="Maximum links to inject")


class InjectLinksResponse(BaseModel):
    """Response from link injection"""
    content: str
    links_injected: int
    links_used: List[Dict]
    affiliate_networks: List[str]


class GenerateTextRequest(BaseModel):
    """Request to generate text with AI"""
    prompt: str = Field(..., description="Text generation prompt")
    system_prompt: Optional[str] = Field(default=None, description="System prompt")
    max_tokens: int = Field(default=2000, description="Maximum tokens to generate")
    temperature: float = Field(default=0.7, description="Sampling temperature")
    tier: str = Field(default="standard", description="Model tier: economy, standard, premium")
    model: Optional[str] = Field(default=None, description="Specific model to use")


class GenerateTextResponse(BaseModel):
    """Response from text generation"""
    content: str
    model_used: str
    tokens_used: Dict[str, int]
    cost_estimate: float
    finish_reason: str


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Global service instances
ai_manager: Optional[AIServiceManager] = None
content_generator: Optional[ContentGenerator] = None
keyword_analyzer: Optional[KeywordAnalyzer] = None
link_injector: Optional[AffiliateLinkInjector] = None

# Startup time
startup_time: Optional[datetime] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global startup_time, ai_manager, content_generator, keyword_analyzer, link_injector

    startup_time = datetime.utcnow()
    logger.info("Starting AI Service...")

    # Initialize AI Service Manager
    try:
        ai_manager = AIServiceManager()
        logger.info("AI Service Manager initialized")
    except Exception as e:
        logger.error(f"Failed to initialize AI Manager: {e}")
        raise

    # Initialize and register AI adapters
    try:
        # Register Qwen adapter
        if settings.dashscope_api_key:
            qwen_adapter = QwenAdapter(api_key=settings.dashscope_api_key)
            ai_manager.register_adapter(ModelProvider.QWEN, qwen_adapter)
            logger.info("Qwen adapter registered")

        # Register OpenAI adapter
        if settings.openai_api_key:
            openai_adapter = OpenAIAdapter(api_key=settings.openai_api_key)
            ai_manager.register_adapter(ModelProvider.OPENAI, openai_adapter)
            logger.info("OpenAI adapter registered")

        # Register ChatGLM adapter
        if settings.chatglm_api_key:
            chatglm_adapter = ChatGLMAdapter(api_key=settings.chatglm_api_key)
            ai_manager.register_adapter(ModelProvider.CHATGLM, chatglm_adapter)
            logger.info("ChatGLM adapter registered")

        logger.info(f"Total adapters registered: {len(ai_manager._adapters)}")
    except Exception as e:
        logger.error(f"Failed to register adapters: {e}")
        raise

    # Initialize Content Generator
    try:
        content_generator = ContentGenerator(ai_manager)
        logger.info("Content Generator initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Content Generator: {e}")
        raise

    # Initialize Keyword Analyzer
    try:
        keyword_analyzer = KeywordAnalyzer()
        logger.info("Keyword Analyzer initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Keyword Analyzer: {e}")
        raise

    # Initialize Link Injector
    try:
        link_injector = AffiliateLinkInjector()
        logger.info("Affiliate Link Injector initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Link Injector: {e}")
        raise

    yield

    # Cleanup
    logger.info("Shutting down AI Service...")


# Create FastAPI app
app = FastAPI(
    title="Affiliate Marketing AI Service",
    description="AI-powered content generation and SEO optimization service",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get AI manager
async def get_ai_manager() -> AIServiceManager:
    """Get AI manager instance"""
    if ai_manager is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not initialized"
        )
    return ai_manager


# Dependency to get content generator
async def get_content_generator() -> ContentGenerator:
    """Get content generator instance"""
    if content_generator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Content generator not initialized"
        )
    return content_generator


# Dependency to get keyword analyzer
async def get_keyword_analyzer() -> KeywordAnalyzer:
    """Get keyword analyzer instance"""
    if keyword_analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Keyword analyzer not initialized"
        )
    return keyword_analyzer


# Dependency to get link injector
async def get_link_injector() -> AffiliateLinkInjector:
    """Get link injector instance"""
    if link_injector is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Link injector not initialized"
        )
    return link_injector


# API Endpoints

@app.get("/", response_model=Dict)
async def root():
    """Root endpoint"""
    return {
        "service": "Affiliate Marketing AI Service",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check(
    ai_mgr: AIServiceManager = Depends(get_ai_manager)
):
    """Health check endpoint"""
    uptime = (datetime.utcnow() - startup_time).total_seconds() if startup_time else 0

    # Check model availability
    models_available = {}
    for provider_name in ai_mgr._adapters.keys():
        models_available[provider_name.value] = 1  # Each adapter represents one provider

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_available=models_available,
        uptime_seconds=uptime,
    )


@app.post("/api/v1/generate/text", response_model=GenerateTextResponse)
async def generate_text(
    request: GenerateTextRequest,
    background_tasks: BackgroundTasks,
    ai_mgr: AIServiceManager = Depends(get_ai_manager),
):
    """
    Generate text using AI models

    Supports multiple tiers:
    - economy: Cost-effective, fast models
    - standard: Balanced quality and speed
    - premium: Highest quality output
    """
    try:
        # Map tier string to enum
        tier_map = {
            "economy": ModelTier.ECONOMY,
            "standard": ModelTier.STANDARD,
            "premium": ModelTier.PREMIUM,
        }
        tier = tier_map.get(request.tier, ModelTier.STANDARD)

        # Create generation request
        gen_request = GenerationRequest(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            tier=tier,
            preferred_model=request.model,
        )

        # Generate content
        response = await ai_mgr.generate(
            prompt=gen_request.prompt,
            system_prompt=gen_request.system_prompt,
            max_tokens=gen_request.max_tokens,
            temperature=gen_request.temperature,
            model=gen_request.preferred_model,
            tier=gen_request.tier,
        )

        return GenerateTextResponse(
            content=response.content,
            model_used=response.model_used,
            tokens_used={
                "input": response.input_tokens,
                "output": response.output_tokens,
            },
            cost_estimate=response.cost,
            finish_reason=response.finish_reason,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/generate/content", response_model=GenerateContentResponse)
async def generate_content(
    request: GenerateContentRequest,
    background_tasks: BackgroundTasks,
    generator: ContentGenerator = Depends(get_content_generator),
):
    """
    Generate SEO-optimized content

    This endpoint combines keyword analysis, AI content generation,
    and optional affiliate link injection.
    """
    try:
        # Create content generation request
        content_request = ContentGenerationRequest(
            keyword=request.keyword,
            content_type=request.content_type,
            tone=request.tone,
            target_length=request.target_length,
            include_html=request.include_html,
            language=request.language,
            custom_instructions=request.custom_instructions,
            secondary_keywords=request.secondary_keywords,
        )

        # Generate content
        result = await generator.generate(content_request)

        # Inject affiliate links if requested
        if request.inject_affiliate_links and link_injector:
            keywords = [request.keyword] + request.secondary_keywords
            injection_result = link_injector.inject_links(
                result.content,
                keywords,
            )
            result.content = injection_result.content
            result.html_content = link_injector._wrap_in_html(
                result.title,
                result.content,
                request.keyword
            )

        return GenerateContentResponse(
            success=True,
            title=result.title,
            content=result.content,
            html_content=result.html_content,
            meta_description=result.meta_description,
            keywords=result.keywords,
            word_count=result.word_count,
            seo_score=result.seo_score,
            readability_score=result.readability_score,
            model_used=result.model_used,
            tokens_used=result.tokens_used,
            cost_estimate=result.cost_estimate,
        )

    except Exception as e:
        logger.error(f"Content generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/seo/analyze", response_model=AnalyzeKeywordResponse)
async def analyze_keyword(
    request: AnalyzeKeywordRequest,
    analyzer: KeywordAnalyzer = Depends(get_keyword_analyzer),
):
    """
    Analyze a keyword for SEO opportunities

    Returns:
    - Search volume estimate
    - Competition level
    - Difficulty score
    - Search intent
    - Related keywords
    - Content suggestions
    - Opportunities
    """
    try:
        analysis = await analyzer.analyze(request.keyword)

        return AnalyzeKeywordResponse(
            keyword=analysis.keyword,
            search_volume=analysis.search_volume,
            competition_level=analysis.competition_level,
            difficulty_score=analysis.difficulty_score,
            search_intent=analysis.search_intent,
            related_keywords=analysis.related_keywords,
            suggestions=analysis.suggestions,
            opportunities=analysis.opportunities,
        )

    except Exception as e:
        logger.error(f"Keyword analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/affiliate/inject", response_model=InjectLinksResponse)
async def inject_links(
    request: InjectLinksRequest,
    injector: AffiliateLinkInjector = Depends(get_link_injector),
):
    """
    Inject affiliate links into content

    Analyzes content and naturally inserts relevant affiliate links
    while maintaining readability and SEO value.
    """
    try:
        result = injector.inject_links(
            request.content,
            request.keywords,
        )

        return InjectLinksResponse(
            content=result.content,
            links_injected=result.links_injected,
            links_used=result.links_used,
            affiliate_networks=result.affiliate_networks,
        )

    except Exception as e:
        logger.error(f"Link injection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/models")
async def list_models(
    ai_mgr: AIServiceManager = Depends(get_ai_manager)
):
    """List available AI models"""
    models = ai_mgr.get_available_models()

    # Convert to response format
    return {
        "models": {
            name: {
                "provider": config.provider.value,
                "tier": config.tier.value,
                "max_tokens": config.max_tokens,
                "cost_per_1k_tokens": {
                    "input": config.input_cost_per_1m / 1000,  # Convert to per-1k
                    "output": config.output_cost_per_1m / 1000,
                }
            }
            for name, config in models.items()
        }
    }


@app.get("/api/v1/stats/usage")
async def get_usage_stats(
    ai_mgr: AIServiceManager = Depends(get_ai_manager)
):
    """Get usage statistics"""
    stats = ai_mgr.get_statistics()
    return {
        "total_requests": stats.total_requests,
        "total_tokens": stats.total_tokens,
        "total_cost": float(stats.total_cost),
        "errors": stats.errors,
        "last_reset": stats.last_reset.isoformat() if stats.last_reset else None,
        "by_model": {
            model: {
                "requests": stats.requests_by_model.get(model, 0),
                "tokens": stats.tokens_by_model.get(model, 0),
                "cost": float(stats.cost_by_model.get(model, 0.0))
            }
            for model in set(list(stats.requests_by_model.keys()) + list(stats.tokens_by_model.keys()))
        }
    }


@app.get("/api/v1/stats/costs")
async def get_cost_stats(
    ai_mgr: AIServiceManager = Depends(get_ai_manager)
):
    """Get cost statistics"""
    stats = ai_mgr.get_statistics()
    return {
        "total_cost": float(stats.total_cost),
        "costs_by_model": {
            model: float(cost)
            for model, cost in stats.cost_by_model.items()
        },
        "daily_limit": settings.daily_cost_limit,
        "requests": stats.total_requests,
        "errors": stats.errors
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else None,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
