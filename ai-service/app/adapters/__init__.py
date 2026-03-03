"""
AI Model Adapters Package

Provides unified interface for multiple AI model providers:
- Qwen (DashScope/Alibaba Cloud)
- OpenAI (GPT models)
- ChatGLM (Zhipu AI)
"""
from app.adapters.base import BaseAdapter, GenerationResult
from app.adapters.chatglm_adapter import ChatGLMAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.qwen_adapter import QwenAdapter

__all__ = [
    "BaseAdapter",
    "GenerationResult",
    "QwenAdapter",
    "OpenAIAdapter",
    "ChatGLMAdapter",
]
