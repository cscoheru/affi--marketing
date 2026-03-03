"""
AI Service Manager - Multi-model AI service management system
"""
import asyncio
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Type, Union
from decimal import Decimal

from loguru import logger
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings


class ModelProvider(str, Enum):
    """AI Model Providers"""
    QWEN = "qwen"
    OPENAI = "openai"
    CHATGLM = "chatglm"


class ModelTier(str, Enum):
    """Model Tiers based on capability and cost"""
    ECONOMY = "economy"      # Low cost, fast, simple tasks
    STANDARD = "standard"    # Balanced cost/performance
    PREMIUM = "premium"      # High cost, best quality


@dataclass
class ModelConfig:
    """Model Configuration"""
    provider: ModelProvider
    model_id: str
    tier: ModelTier
    max_tokens: int
    supports_streaming: bool = False
    supports_function_calling: bool = False
    input_cost_per_1m: float = 0.0
    output_cost_per_1m: float = 0.0


# Available Models Registry
MODELS: Dict[str, ModelConfig] = {
    # Qwen Models (DashScope)
    "qwen-turbo": ModelConfig(
        provider=ModelProvider.QWEN,
        model_id="qwen-turbo",
        tier=ModelTier.ECONOMY,
        max_tokens=8192,
        supports_streaming=True,
        input_cost_per_1m=settings.cost_qwen_turbo_input,
        output_cost_per_1m=settings.cost_qwen_turbo_output,
    ),
    "qwen-plus": ModelConfig(
        provider=ModelProvider.QWEN,
        model_id="qwen-plus",
        tier=ModelTier.STANDARD,
        max_tokens=32768,
        supports_streaming=True,
        input_cost_per_1m=settings.cost_qwen_plus_input,
        output_cost_per_1m=settings.cost_qwen_plus_output,
    ),
    "qwen-max": ModelConfig(
        provider=ModelProvider.QWEN,
        model_id="qwen-max",
        tier=ModelTier.PREMIUM,
        max_tokens=32768,
        supports_streaming=True,
        input_cost_per_1m=0.02,  # Approximated
        output_cost_per_1m=0.06,
    ),

    # OpenAI Models
    "gpt-3.5-turbo": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-3.5-turbo",
        tier=ModelTier.ECONOMY,
        max_tokens=4096,
        supports_streaming=True,
        supports_function_calling=True,
        input_cost_per_1m=settings.cost_gpt35_input,
        output_cost_per_1m=settings.cost_gpt35_output,
    ),
    "gpt-4": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4",
        tier=ModelTier.PREMIUM,
        max_tokens=8192,
        supports_streaming=False,
        supports_function_calling=True,
        input_cost_per_1m=settings.cost_gpt4_input,
        output_cost_per_1m=settings.cost_gpt4_output,
    ),
    "gpt-4-turbo": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4-turbo",
        tier=ModelTier.STANDARD,
        max_tokens=128000,
        supports_streaming=True,
        supports_function_calling=True,
        input_cost_per_1m=0.01,
        output_cost_per_1m=0.03,
    ),

    # ChatGLM Models
    "chatglm-turbo": ModelConfig(
        provider=ModelProvider.CHATGLM,
        model_id="chatglm-turbo",
        tier=ModelTier.ECONOMY,
        max_tokens=128000,
        supports_streaming=True,
        input_cost_per_1m=settings.cost_chatglm_turbo_input,
        output_cost_per_1m=settings.cost_chatglm_turbo_output,
    ),
    "chatglm-plus": ModelConfig(
        provider=ModelProvider.CHATGLM,
        model_id="chatglm-plus",
        tier=ModelTier.STANDARD,
        max_tokens=128000,
        supports_streaming=True,
        input_cost_per_1m=settings.cost_chatglm_plus_input,
        output_cost_per_1m=settings.cost_chatglm_plus_output,
    ),
}


@dataclass
class GenerationRequest:
    """Generation Request"""
    prompt: str
    system_prompt: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: float = 0.7
    model: Optional[str] = None  # Specific model to use
    tier: Optional[ModelTier] = None  # Or tier preference
    streaming: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)
    preferred_model: Optional[str] = None  # Alias for model (for backward compatibility)


@dataclass
class GenerationResponse:
    """Generation Response"""
    content: str
    model_used: str
    provider: ModelProvider
    tokens_used: int
    input_tokens: int
    output_tokens: int
    cost: float
    duration_ms: int
    finish_reason: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UsageStatistics:
    """Usage Statistics"""
    total_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    requests_by_model: Dict[str, int] = field(default_factory=dict)
    tokens_by_model: Dict[str, int] = field(default_factory=dict)
    cost_by_model: Dict[str, float] = field(default_factory=dict)
    errors: int = 0
    last_reset: datetime = field(default_factory=datetime.now)


class CostExceededError(Exception):
    """Raised when cost budget is exceeded"""
    pass


class RateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    pass


class AIServiceManager:
    """
    AI Service Manager - Manages multiple AI providers with intelligent routing

    Features:
    - Automatic model selection based on cost and capability
    - Failover between providers
    - Token counting and cost tracking
    - Rate limiting
    - Request caching
    """

    def __init__(self):
        self._adapters: Dict[ModelProvider, Any] = {}
        self._usage = UsageStatistics()
        self._daily_limit_reset: Optional[datetime] = None
        self._request_cache: Dict[str, tuple[GenerationResponse, datetime]] = {}
        self._cache_ttl = timedelta(hours=1)

        # Initialize daily limit
        self._check_daily_limits()

    def register_adapter(self, provider: ModelProvider, adapter: Any) -> None:
        """Register an AI adapter for a provider"""
        self._adapters[provider] = adapter
        logger.info(f"Registered adapter for provider: {provider}")

    def _check_daily_limits(self) -> None:
        """Check and reset daily limits if needed"""
        now = datetime.now()

        # Reset at midnight
        if self._daily_limit_reset is None or self._daily_limit_reset.date() < now.date():
            logger.info("Resetting daily usage limits")
            self._daily_limit_reset = now
            self._usage = UsageStatistics(last_reset=now)

    def _check_budget(self, estimated_cost: float) -> None:
        """Check if request is within budget"""
        daily_cost = self._usage.total_cost
        remaining_budget = settings.daily_cost_limit - daily_cost

        if estimated_cost > remaining_budget:
            logger.warning(f"Cost budget exceeded: estimated={estimated_cost}, remaining={remaining_budget}")
            raise CostExceededError(
                f"Estimated cost (${estimated_cost:.4f}) exceeds remaining budget (${remaining_budget:.2f})"
            )

        # Alert if approaching threshold
        usage_percentage = (daily_cost / settings.daily_cost_limit) * 100
        if usage_percentage >= settings.alert_threshold:
            logger.warning(
                f"Approaching cost budget threshold: {usage_percentage:.1f}% used"
            )

    def _select_model(self, request: GenerationRequest) -> str:
        """Select the best model for the request"""
        # If specific model requested, use it (check both model and preferred_model)
        model_to_use = request.model or request.preferred_model
        if model_to_use and model_to_use in MODELS:
            return model_to_use

        # If tier preference, select from that tier
        if request.tier:
            candidates = [
                model_id for model_id, config in MODELS.items()
                if config.tier == request.tier
            ]
            if candidates:
                return candidates[0]

        # Auto-selection based on request characteristics
        prompt_length = len(request.prompt)

        # For simple/short requests, use economy tier
        if prompt_length < 500:
            candidates = [
                model_id for model_id, config in MODELS.items()
                if config.tier == ModelTier.ECONOMY
            ]
            if candidates:
                return candidates[0]

        # For medium requests, use standard tier
        if prompt_length < 2000:
            candidates = [
                model_id for model_id, config in MODELS.items()
                if config.tier == ModelTier.STANDARD
            ]
            if candidates:
                return candidates[0]

        # For complex/long requests, use premium tier
        candidates = [
            model_id for model_id, config in MODELS.items()
            if config.tier == ModelTier.PREMIUM
        ]
        if candidates:
            return candidates[0]

        # Fallback to default
        return settings.default_model

    def _estimate_cost(self, request: GenerationRequest, model_id: str) -> float:
        """Estimate the cost of a request"""
        config = MODELS.get(model_id)
        if not config:
            return 0.0

        # Estimate token count (rough approximation: 1 token ≈ 4 chars for English, 2 chars for Chinese)
        estimated_input_tokens = len(request.prompt) // 3
        estimated_output_tokens = request.max_tokens or settings.default_max_tokens

        input_cost = (estimated_input_tokens / 1_000_000) * config.input_cost_per_1m
        output_cost = (estimated_output_tokens / 1_000_000) * config.output_cost_per_1m

        return input_cost + output_cost

    def _get_cache_key(self, request: GenerationRequest) -> str:
        """Generate cache key for request"""
        import hashlib
        content = f"{request.prompt}:{request.system_prompt}:{request.temperature}:{request.max_tokens}"
        return hashlib.md5(content.encode()).hexdigest()

    def _check_cache(self, request: GenerationRequest) -> Optional[GenerationResponse]:
        """Check if response is cached"""
        key = self._get_cache_key(request)
        if key in self._request_cache:
            response, cached_at = self._request_cache[key]
            if datetime.now() - cached_at < self._cache_ttl:
                logger.debug(f"Cache hit for key: {key}")
                return response
            else:
                # Remove expired cache
                del self._request_cache[key]
        return None

    def _cache_response(self, request: GenerationRequest, response: GenerationResponse) -> None:
        """Cache a response"""
        key = self._get_cache_key(request)
        self._request_cache[key] = (response, datetime.now())

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    )
    async def _generate_with_fallback(
        self,
        request: GenerationRequest,
        model_id: str,
        attempted_models: Optional[List[str]] = None,
    ) -> GenerationResponse:
        """Generate content with automatic fallback"""
        attempted_models = attempted_models or []
        attempted_models.append(model_id)

        config = MODELS[model_id]
        adapter = self._adapters.get(config.provider)

        if not adapter:
            logger.error(f"No adapter registered for provider: {config.provider}")
            # Try fallback model
            if len(attempted_models) < len(MODELS):
                fallback_model = self._get_fallback_model(model_id, attempted_models)
                logger.info(f"Falling back to model: {fallback_model}")
                return await self._generate_with_fallback(request, fallback_model, attempted_models)
            raise RuntimeError(f"No adapter available for any model")

        try:
            logger.info(f"Generating with model: {model_id} (provider: {config.provider})")

            start_time = time.time()
            result = await adapter.generate(
                prompt=request.prompt,
                system_prompt=request.system_prompt,
                max_tokens=request.max_tokens or config.max_tokens,
                temperature=request.temperature,
                model=config.model_id,
                streaming=request.streaming,
            )
            duration_ms = int((time.time() - start_time) * 1000)

            # Build response
            response = GenerationResponse(
                content=result.content,
                model_used=model_id,
                provider=config.provider,
                tokens_used=result.input_tokens + result.output_tokens,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
                cost=self._calculate_cost(model_id, result.input_tokens, result.output_tokens),
                duration_ms=duration_ms,
                finish_reason=result.finish_reason,
                metadata={
                    "cached": False,
                    "attempted_models": attempted_models,
                }
            )

            # Update statistics
            self._update_statistics(response)

            return response

        except Exception as e:
            logger.error(f"Error generating with model {model_id}: {e}")

            # Try fallback
            if len(attempted_models) < len(MODELS):
                fallback_model = self._get_fallback_model(model_id, attempted_models)
                logger.info(f"Falling back to model: {fallback_model}")
                return await self._generate_with_fallback(request, fallback_model, attempted_models)

            raise

    def _get_fallback_model(self, failed_model: str, attempted: List[str]) -> str:
        """Get fallback model"""
        config = MODELS[failed_model]

        # Try different provider first
        for model_id, model_config in MODELS.items():
            if model_id not in attempted and model_config.provider != config.provider:
                return model_id

        # Then try same provider, different tier
        for model_id, model_config in MODELS.items():
            if model_id not in attempted:
                return model_id

        return settings.fallback_model

    def _calculate_cost(self, model_id: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate actual cost"""
        config = MODELS[model_id]
        input_cost = (input_tokens / 1_000_000) * config.input_cost_per_1m
        output_cost = (output_tokens / 1_000_000) * config.output_cost_per_1m
        return input_cost + output_cost

    def _update_statistics(self, response: GenerationResponse) -> None:
        """Update usage statistics"""
        self._usage.total_requests += 1
        self._usage.total_tokens += response.tokens_used
        self._usage.total_cost += response.cost

        model_key = response.model_used
        self._usage.requests_by_model[model_key] = self._usage.requests_by_model.get(model_key, 0) + 1
        self._usage.tokens_by_model[model_key] = self._usage.tokens_by_model.get(model_key, 0) + response.tokens_used
        self._usage.cost_by_model[model_key] = self._usage.cost_by_model.get(model_key, 0.0) + response.cost

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        model: Optional[str] = None,
        tier: Optional[ModelTier] = None,
        streaming: bool = False,
        use_cache: bool = True,
    ) -> GenerationResponse:
        """
        Generate content using AI

        Args:
            prompt: The prompt to send to the AI
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)
            model: Specific model to use (overrides tier)
            tier: Model tier preference (economy/standard/premium)
            streaming: Whether to stream the response
            use_cache: Whether to use cached responses

        Returns:
            GenerationResponse with content and metadata
        """
        # Check daily limits
        self._check_daily_limits()

        # Create request object
        request = GenerationRequest(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            model=model,
            tier=tier,
            streaming=streaming,
        )

        # Check cache
        if use_cache and not streaming:
            cached = self._check_cache(request)
            if cached:
                # Update cached response metadata
                cached.metadata["cached"] = True
                return cached

        # Select model
        model_id = self._select_model(request)

        # Estimate and check budget
        estimated_cost = self._estimate_cost(request, model_id)
        self._check_budget(estimated_cost)

        # Generate with fallback
        response = await self._generate_with_fallback(request, model_id)

        # Cache response
        if use_cache and not streaming:
            self._cache_response(request, response)

        return response

    def get_statistics(self) -> UsageStatistics:
        """Get current usage statistics"""
        return self._usage

    def get_available_models(self) -> Dict[str, ModelConfig]:
        """Get all available models"""
        return MODELS.copy()

    def get_models_by_tier(self, tier: ModelTier) -> Dict[str, ModelConfig]:
        """Get models by tier"""
        return {
            model_id: config
            for model_id, config in MODELS.items()
            if config.tier == tier
        }

    def reset_daily_usage(self) -> None:
        """Reset daily usage statistics"""
        logger.info("Resetting daily usage statistics")
        self._usage = UsageStatistics(last_reset=datetime.now())


# Global AI service manager instance
ai_manager = AIServiceManager()
