"""
OpenAI (GPT) Adapter
"""
from typing import Optional

from openai import AsyncOpenAI
from loguru import logger

from app.adapters.base import BaseAdapter, GenerationResult


class OpenAIAdapter(BaseAdapter):
    """Adapter for OpenAI GPT models"""

    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        model: str = "gpt-3.5-turbo",
        streaming: bool = False,
        **kwargs
    ) -> GenerationResult:
        """Generate content using OpenAI model"""

        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            if streaming:
                # Streaming generation
                stream = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                )

                content_parts = []
                finish_reason = "unknown"
                input_tokens = 0
                output_tokens = 0

                async for chunk in stream:
                    if chunk.choices[0].finish_reason is not None:
                        finish_reason = chunk.choices[0].finish_reason
                    if chunk.choices[0].delta.content is not None:
                        content_parts.append(chunk.choices[0].delta.content)

                    # Update token counts if available
                    if hasattr(chunk, 'usage') and chunk.usage:
                        input_tokens = chunk.usage.prompt_tokens or 0
                        output_tokens = chunk.usage.completion_tokens or 0

                content = "".join(content_parts)

                return GenerationResult(
                    content=content,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    finish_reason=finish_reason,
                    model=model,
                    raw_response={"streaming": True},
                )

            else:
                # Non-streaming generation
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

                content = response.choices[0].message.content
                finish_reason = response.choices[0].finish_reason
                input_tokens = response.usage.prompt_tokens
                output_tokens = response.usage.completion_tokens

                return GenerationResult(
                    content=content,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    finish_reason=finish_reason,
                    model=model,
                    raw_response=response.model_dump(),
                )

        except Exception as e:
            logger.error(f"Error in OpenAI generation: {e}")
            raise

    async def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken (if available) or approximation"""
        try:
            import tiktoken

            # Try to get encoding for the model
            try:
                encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
            except KeyError:
                encoding = tiktoken.get_encoding("cl100k_base")

            return len(encoding.encode(text))

        except ImportError:
            # Fallback to approximation
            return len(text) // 3

    def get_model_info(self, model: str) -> dict:
        """Get OpenAI model information"""
        model_info = {
            "gpt-3.5-turbo": {
                "name": "GPT-3.5 Turbo",
                "description": "Fast, efficient model for most tasks",
                "context_length": 4096,
            },
            "gpt-4": {
                "name": "GPT-4",
                "description": "Most capable model for complex tasks",
                "context_length": 8192,
            },
            "gpt-4-turbo": {
                "name": "GPT-4 Turbo",
                "description": "Balanced capability and speed",
                "context_length": 128000,
            },
        }
        return model_info.get(model, {"name": "Unknown", "description": "Unknown model"})

    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible"""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return True
        except Exception as e:
            logger.warning(f"OpenAI health check failed: {e}")
            return False

    @property
    def provider_name(self) -> str:
        """Get provider name"""
        return "openai"
