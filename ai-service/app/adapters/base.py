"""
Base Adapter Interface for AI Models
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class GenerationResult:
    """Result from AI generation"""
    content: str
    input_tokens: int
    output_tokens: int
    finish_reason: str
    model: str
    raw_response: Optional[dict] = None


class BaseAdapter(ABC):
    """Base class for AI model adapters"""

    def __init__(self, api_key: str):
        """
        Initialize the adapter

        Args:
            api_key: API key for the service
        """
        self.api_key = api_key

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        model: str = "default",
        streaming: bool = False,
        **kwargs
    ) -> GenerationResult:
        """
        Generate content using the AI model

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            model: Model identifier
            streaming: Whether to stream the response
            **kwargs: Additional model-specific parameters

        Returns:
            GenerationResult with generated content and metadata
        """
        pass

    @abstractmethod
    async def count_tokens(self, text: str) -> int:
        """
        Count tokens in text

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        pass

    @abstractmethod
    def get_model_info(self, model: str) -> dict:
        """
        Get information about a model

        Args:
            model: Model identifier

        Returns:
            Model information dictionary
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the AI service is healthy

        Returns:
            True if service is healthy, False otherwise
        """
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get the provider name"""
        pass
