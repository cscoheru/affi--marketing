"""
ChatGLM Adapter
"""
from typing import Optional
import httpx
from loguru import logger

from app.adapters.base import BaseAdapter, GenerationResult


class ChatGLMAdapter(BaseAdapter):
    """Adapter for ChatGLM models via Zhipu AI API"""

    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://open.bigmodel.cn/api/paas/v4"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        model: str = "chatglm-turbo",
        streaming: bool = False,
        **kwargs
    ) -> GenerationResult:
        """Generate content using ChatGLM model"""

        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Request body
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": streaming,
        }

        try:
            if streaming:
                # Streaming generation
                content_parts = []
                finish_reason = "unknown"

                async with self.client.stream(
                    "chat/completions",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        error_text = (await response.aread()).decode()
                        raise RuntimeError(f"ChatGLM API error: {error_text}")

                    async for line in response.aiter_lines():
                        if line.strip():
                            import json
                            data = json.loads(line)

                            if "choices" in data and data["choices"]:
                                choice = data["choices"][0]
                                if "delta" in choice and "content" in choice["delta"]:
                                    content_parts.append(choice["delta"]["content"])
                                if "finish_reason" in choice:
                                    finish_reason = choice["finish_reason"]

                content = "".join(content_parts)
                input_tokens = 0
                output_tokens = 0

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
                response = await self.client.post(
                    "chat/completions",
                    json=payload,
                )

                if response.status_code != 200:
                    error_text = (await response.aread()).decode()
                    raise RuntimeError(f"ChatGLM API error: {error_text}")

                data = response.json()

                if "error" in data:
                    raise RuntimeError(f"ChatGLM API error: {data['error']}")

                content = data["choices"][0]["message"]["content"]
                finish_reason = data["choices"][0].get("finish_reason", "stop")
                input_tokens = data.get("usage", {}).get("prompt_tokens", 0)
                output_tokens = data.get("usage", {}).get("completion_tokens", 0)

                return GenerationResult(
                    content=content,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    finish_reason=finish_reason,
                    model=model,
                    raw_response=data,
                )

        except Exception as e:
            logger.error(f"Error in ChatGLM generation: {e}")
            raise

    async def count_tokens(self, text: str) -> int:
        """
        Count tokens in text (approximation for ChatGLM)

        ChatGLM uses a similar tokenization to GPT, so we approximate
        """
        # Approximate: 1 token ≈ 3 characters for mixed English/Chinese
        return len(text) // 3

    def get_model_info(self, model: str) -> dict:
        """Get ChatGLM model information"""
        model_info = {
            "chatglm-turbo": {
                "name": "ChatGLM Turbo",
                "description": "Fast, efficient model for Chinese tasks",
                "context_length": 128000,
            },
            "chatglm-plus": {
                "name": "ChatGLM Plus",
                "description": "Enhanced model with better reasoning",
                "context_length": 128000,
            },
        }
        return model_info.get(model, {"name": "Unknown", "description": "Unknown model"})

    async def health_check(self) -> bool:
        """Check if ChatGLM API is accessible"""
        try:
            response = await self.client.post(
                "chat/completions",
                json={
                    "model": "chatglm-turbo",
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 5,
                },
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"ChatGLM health check failed: {e}")
            return False

    @property
    def provider_name(self) -> str:
        """Get provider name"""
        return "chatglm"
