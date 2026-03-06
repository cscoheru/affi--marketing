/**
 * AI内容生成服务
 * 连接到后端AI服务API
 */

const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'https://ai-api.zenconsult.top'

interface AIGenerateRequest {
  topic: string
  tone: 'professional' | 'casual' | 'friendly'
  length: 'short' | 'medium' | 'long'
  category?: string
  model?: 'qwen' | 'openai' | 'chatglm'
}

interface AIGenerateResponse {
  success: boolean
  code: number
  message: string
  data: {
    title: string
    content: string
    excerpt: string
    tags: string[]
    metaDescription: string
    suggestedSlug?: string
  }
  timestamp: number
}

class AIServiceClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'AI服务请求失败' }))
      throw new Error(error.message || 'AI服务请求失败')
    }

    return response.json()
  }

  async generateContent(options: AIGenerateRequest): Promise<AIGenerateResponse['data']> {
    try {
      const result = await this.request<AIGenerateResponse>('/api/v1/generate/blog-content', {
        method: 'POST',
        body: JSON.stringify(options),
      })

      if (result.success && result.data) {
        return result.data
      }

      throw new Error(result.message || 'AI生成失败')
    } catch (error) {
      // 如果API调用失败，返回mock数据作为fallback
      console.warn('AI服务调用失败，使用fallback:', error)
      return this.getFallbackContent(options)
    }
  }

  // Fallback内容生成（当AI服务不可用时）
  private getFallbackContent(options: AIGenerateRequest) {
    const lengthMap = {
      short: 300,
      medium: 600,
      long: 1000,
    }

    const toneMap = {
      professional: '专业、严谨、权威',
      casual: '轻松、随意、亲切',
      friendly: '友好、热情、互动',
    }

    const title = `${options.topic} - 深度解析与实践指南`
    const slug = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')

    return {
      title,
      content: `# ${options.topic}\n\n这是一篇关于 ${options.topic} 的${toneMap[options.tone]}风格文章。\n\n## 概述\n\n本文将深入探讨 ${options.topic} 的各个方面，为您提供全面的理解和实践指导。\n\n## 核心要点\n\n1. **基础概念** - 了解 ${options.topic} 的基本原理\n2. **实践应用** - 如何在实际场景中应用\n3. **最佳实践** - 行业推荐的做法\n4. **常见问题** - 解答常见疑问\n\n## 详细内容\n\n${'这里是详细的内容...'.repeat(lengthMap[options.length] / 20)}\n\n## 总结\n\n通过本文，您应该对 ${options.topic} 有了更深入的理解。`,
      excerpt: `深入了解 ${options.topic}，掌握核心概念和实践技巧，提升您在该领域的专业能力。`,
      tags: [options.topic, options.category || '通用', '教程'],
      metaDescription: `全面解析 ${options.topic}，包含详细的概念解释和实践指南。`,
      suggestedSlug: slug,
    }
  }

  // 检查AI服务健康状态
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      const data = await response.json()
      return data.status === 'healthy'
    } catch {
      return false
    }
  }

  // 获取可用模型列表
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      const data = await response.json()
      if (data.models_available) {
        return Object.keys(data.models_available)
      }
      return ['qwen', 'openai', 'chatglm']
    } catch {
      return []
    }
  }
}

// 导出单例实例
export const aiService = new AIServiceClient(AI_API_BASE)
