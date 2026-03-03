"""
AI Service Configuration
"""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = Field(default="affi-marketing-ai", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: str = Field(default="development", description="Environment (development/staging/production)")
    debug: bool = Field(default=False, description="Debug mode")
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")

    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="CORS allowed origins"
    )
    cors_allow_credentials: bool = Field(default=True, description="CORS allow credentials")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/business_hub",
        description="Database URL"
    )
    database_pool_size: int = Field(default=20, description="Database pool size")
    database_max_overflow: int = Field(default=10, description="Database max overflow")

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis URL"
    )
    redis_cache_ttl: int = Field(default=3600, description="Redis cache TTL in seconds")
    redis_cache_prefix: str = Field(default="affi_ai:", description="Redis cache key prefix")

    # AI API Keys
    dashscope_api_key: str = Field(default="", description="DashScope API key for Qwen")
    openai_api_key: str = Field(default="", description="OpenAI API key for GPT")
    chatglm_api_key: str = Field(default="", description="ChatGLM API key")

    # AI Model Configuration
    default_model: str = Field(default="qwen-turbo", description="Default AI model")
    fallback_model: str = Field(default="gpt-3.5-turbo", description="Fallback AI model")

    # Model Costs (per 1M tokens)
    cost_qwen_turbo_input: float = Field(default=0.0008, description="Qwen Turbo input cost per 1M tokens")
    cost_qwen_turbo_output: float = Field(default=0.002, description="Qwen Turbo output cost per 1M tokens")
    cost_qwen_plus_input: float = Field(default=0.004, description="Qwen Plus input cost per 1M tokens")
    cost_qwen_plus_output: float = Field(default=0.012, description="Qwen Plus output cost per 1M tokens")
    cost_gpt35_input: float = Field(default=0.0005, description="GPT-3.5 Turbo input cost per 1M tokens")
    cost_gpt35_output: float = Field(default=0.0015, description="GPT-3.5 Turbo output cost per 1M tokens")
    cost_gpt4_input: float = Field(default=0.03, description="GPT-4 input cost per 1M tokens")
    cost_gpt4_output: float = Field(default=0.06, description="GPT-4 output cost per 1M tokens")
    cost_chatglm_turbo_input: float = Field(default=0.001, description="ChatGLM Turbo input cost per 1M tokens")
    cost_chatglm_turbo_output: float = Field(default=0.002, description="ChatGLM Turbo output cost per 1M tokens")
    cost_chatglm_plus_input: float = Field(default=0.005, description="ChatGLM Plus input cost per 1M tokens")
    cost_chatglm_plus_output: float = Field(default=0.01, description="ChatGLM Plus output cost per 1M tokens")

    # Budget & Limits
    daily_token_limit: int = Field(default=1000000, description="Daily token limit")
    daily_cost_limit: float = Field(default=100, description="Daily cost limit in USD")
    alert_threshold: float = Field(default=80, description="Alert threshold percentage")

    # Content Generation
    default_max_tokens: int = Field(default=2000, description="Default max tokens for generation")
    default_temperature: float = Field(default=0.7, description="Default temperature for generation")
    content_generation_timeout: int = Field(default=300, description="Content generation timeout in seconds")
    batch_size: int = Field(default=10, description="Batch processing size")

    # SEO Configuration
    default_search_engine: str = Field(default="google", description="Default search engine")
    keyword_research_depth: int = Field(default=3, description="Keyword research depth")
    content_optimization_level: str = Field(default="standard", description="Content optimization level")

    # Affiliate Link Injection
    max_links_per_article: int = Field(default=5, description="Maximum links per article")
    min_link_distance: int = Field(default=200, description="Minimum characters between links")
    link_injection_similarity_threshold: float = Field(default=0.7, description="Link injection similarity threshold")

    # Monitoring
    prometheus_port: int = Field(default=9090, description="Prometheus metrics port")
    log_level: str = Field(default="INFO", description="Log level")
    log_format: str = Field(default="json", description="Log format")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=100, description="Rate limit per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Rate limit per hour")

    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"


# Global settings instance
settings = Settings()
