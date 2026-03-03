"""
Qwen (DashScope) Adapter
"""
import json
from typing import Optional

import dashscope
from dashscope import Generation
from loguru import logger

from app.adapters.base import BaseAdapter, GenerationResult


class QwenAdapter(BaseAdapter):
    """Adapter for Alibaba's Qwen models via DashScope API"""

    def __init__(self, api_key: str):
        super().__init__(api_key)
        dashscope.api_key = api_key

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        model: str = "qwen-turbo",
        streaming: bool = False,
        **kwargs
    ) -> GenerationResult:
        """Generate content using Qwen model"""

        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Generation parameters
        generation_params = {
            "model": model,
            "messages": messages,
            "result_format": "message",
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        # Add optional parameters
        if "top_p" in kwargs:
            generation_params["top_p"] = kwargs["top_p"]

        try:
            if streaming:
                # Streaming generation
                response = Generation.call(
                    **generation_params,
                    stream=True,
                )

                content_parts = []
                finish_reason = "unknown"

                for chunk in response:
                    if chunk.output.choices:
                        content_parts.append(chunk.output.choices[0].message.content)
                        finish_reason = chunk.output.choices[0].finish_reason

                content = "".join(content_parts)
                raw_response = {"streaming": True}

            else:
                # Non-streaming generation
                response = Generation.call(**generation_params)

                if response.status_code != 200:
                    error_msg = f"DashScope API error: {response.message}"
                    if response.code:
                        error_msg = f"DashScope API error [{response.code}]: {response.message}"
                    raise RuntimeError(error_msg)

                content = response.output.choices[0].message.content
                finish_reason = response.output.choices[0].finish_reason
                raw_response = response.output.model_dump()

            # Count tokens (approximate)
            input_text = system_prompt + "\n\n" + prompt if system_prompt else prompt
            input_tokens = len(input_text) // 3  # Rough approximation
            output_tokens = len(content) // 3

            return GenerationResult(
                content=content,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                finish_reason=finish_reason,
                model=model,
                raw_response=raw_response,
            )

        except Exception as e:
            logger.error(f"Error in Qwen generation: {e}")
            raise

    async def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (rough approximation for Qwen)

        Qwen uses a similar tokenization to GPT, so we approximate
        """
        # Approximate: 1 token ≈ 3 characters for mixed English/Chinese
        return len(text) // 3

    def get_model_info(self, model: str) -> dict:
        """Get Qwen model information"""
        model_info = {
            "qwen-turbo": {
                "name": "Qwen Turbo",
                "description": "Fast, cost-effective model for simple tasks",
                "context_length": 8192,
                "training_data": "Up to Oct 2023",
            },
            "qwen-plus": {
                "name": "Qwen Plus",
                "description": "Balanced model for complex tasks",
                "context_length": 32768,
                "training_data": "Up to Feb 2024",
            },
            "qwen-max": {
                "name": "Qwen Max",
                "description": "Flagship model with best quality",
                "context_length": 32768,
                "training_data": "Up to Feb 2024",
            },
        }
        return model_info.get(model, {"name": "Unknown", "description": "Unknown model"})

    async def health_check(self) -> bool:
        """Check if DashScope API is accessible"""
        try:
            response = Generation.call(
                model="qwen-turbo",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=10,
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Qwen health check failed: {e}")
            return False

    @property
    def provider_name(self) -> str:
        """Get provider name"""
        return "qwen"
