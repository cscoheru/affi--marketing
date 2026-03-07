// 直接调用智谱 API，绕过 AI SDK 的端点兼容问题
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

// 可用的智谱模型
const ZHIPU_MODELS: Record<string, string> = {
  'glm-4-plus': 'glm-4-plus',      // 最新最强
  'glm-4-air': 'glm-4-air',        // 性价比高
  'glm-4-flash': 'glm-4-flash',    // 快速响应
  'glm-4': 'glm-4',                // 标准版
}

// 系统提示词模板 - 博客文章
const SYSTEM_PROMPTS: Record<string, string> = {
  professional: `你是一位专业的内容创作者，擅长撰写严谨、权威的技术文章。
文章要求：
- 结构清晰，使用 Markdown 格式
- 包含代码示例（如适用）
- 提供实用的建议和最佳实践
- 语言简洁准确，避免冗余`,
  casual: `你是一位轻松友好的博主，擅长用通俗易懂的语言分享知识。
文章要求：
- 语气轻松，像和朋友聊天
- 多用比喻和例子
- 避免过于技术化的术语
- 保持内容有趣易懂`,
  friendly: `你是一位热情的内容创作者，喜欢和读者互动。
文章要求：
- 语气热情，多用感叹和提问
- 鼓励读者参与讨论
- 分享个人经验和心得
- 结尾呼吁读者行动`,
}

// 系统提示词模板 - 素材库内容生成
const MATERIAL_SYSTEM_PROMPTS: Record<string, string> = {
  product_intro: `你是一位专业的产品文案撰写专家。你的任务是根据提供的产品信息和素材，撰写引人入胜、专业可信的产品介绍文章。

要求：
1. 结构清晰，层次分明
2. 突出产品核心卖点和独特价值
3. 使用生动但不过度夸张的语言
4. 适合中文读者阅读习惯
5. 输出使用 Markdown 格式`,

  user_review: `你是一位经验丰富的产品评测专家。你的任务是基于真实的用户评论和反馈，撰写客观、全面的产品评测文章。

要求：
1. 平衡呈现产品的优点和不足
2. 引用具体的使用场景和体验
3. 帮助读者做出明智的购买决策
4. 语言客观、可信
5. 输出使用 Markdown 格式`,

  youtube_review: `你是一位视频内容分析专家。你的任务是根据YouTube视频的字幕内容，提炼关键信息并撰写结构化的内容摘要。

要求：
1. 准确概括视频的核心观点
2. 保留重要的技术细节和评测结论
3. 结构化呈现，便于阅读
4. 标注信息来源
5. 输出使用 Markdown 格式`,
}

const LENGTH_GUIDE: Record<string, string> = {
  short: '文章长度约500字，简洁精炼。',
  medium: '文章长度约1000字，内容适中。',
  long: '文章长度约2000字，详细全面。',
}

// 材料内容生成请求接口
interface MaterialGenerateRequest {
  type: 'product_intro' | 'user_review' | 'youtube_review'
  marketTitle: string
  marketAsin: string
  materials: Array<{
    title: string
    type: string
    content: string
    sourceUrl?: string
  }>
  section?: string
  tone?: 'professional' | 'casual' | 'friendly'
  length?: 'short' | 'medium' | 'long'
  customInstructions?: string
  model?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 检查 API Key
    if (!process.env.ZHIPU_API_KEY) {
      return new Response(
        JSON.stringify({ error: '智谱 API Key 未配置，请在环境变量中设置 ZHIPU_API_KEY' }),
        { status: 500 }
      )
    }

    // 判断请求类型：材料生成 vs 主题生成
    const isMaterialGeneration = body.type && body.marketTitle && body.materials

    let systemPrompt: string
    let userPrompt: string
    let modelName: string

    if (isMaterialGeneration) {
      // 材料内容生成模式
      const {
        type,
        marketTitle,
        marketAsin,
        materials,
        section,
        tone = 'professional',
        length = 'medium',
        customInstructions,
        model = 'glm-4-plus',
      } = body as MaterialGenerateRequest

      const baseSystemPrompt = MATERIAL_SYSTEM_PROMPTS[type] || MATERIAL_SYSTEM_PROMPTS.product_intro
      const toneGuide = SYSTEM_PROMPTS[tone] || SYSTEM_PROMPTS.professional
      const lengthGuide = LENGTH_GUIDE[length] || LENGTH_GUIDE.medium

      // 构建素材上下文
      const materialsContext = materials
        .map((m, i) => {
          let context = `【素材${i + 1}】${m.title}\n类型: ${m.type}\n`
          if (m.sourceUrl) context += `来源: ${m.sourceUrl}\n`
          context += `内容:\n${m.content}`
          return context
        })
        .join('\n\n---\n\n')

      systemPrompt = `${baseSystemPrompt}

${toneGuide}

${lengthGuide}`

      userPrompt = `请为以下产品撰写${type === 'product_intro' ? '产品介绍' : type === 'user_review' ? '用户评测' : '视频内容摘要'}。

## 产品信息
- 产品名称: ${marketTitle}
- ASIN: ${marketAsin}

## 参考素材
${materialsContext}

## 要求
${section ? `- 请只生成以下部分: ${section}` : ''}
${customInstructions ? `- 额外要求: ${customInstructions}` : ''}

请开始撰写，直接输出内容，无需额外的解释或前言。使用 Markdown 格式。`

      modelName = ZHIPU_MODELS[model] || 'glm-4-plus'
    } else {
      // 主题生成模式（原有逻辑）
      const { topic, tone = 'professional', length = 'medium', category, model = 'glm-4-plus' } = body

      if (!topic?.trim()) {
        return new Response(JSON.stringify({ error: '请输入主题' }), { status: 400 })
      }

      systemPrompt = `${SYSTEM_PROMPTS[tone] || SYSTEM_PROMPTS.professional}

${LENGTH_GUIDE[length] || LENGTH_GUIDE.medium}

${category ? `文章分类：${category}` : ''}

请直接输出文章内容，使用 Markdown 格式，包含：
1. 标题（# 一级标题）
2. 摘要（2-3句话）
3. 正文内容
4. 标签建议（在文末用一行列出，格式：标签：xxx, xxx, xxx）`

      const lengthHint = LENGTH_GUIDE[length] || LENGTH_GUIDE.medium
      userPrompt = `请为以下主题写一篇文章（${lengthHint}）：${topic}`

      modelName = ZHIPU_MODELS[model] || 'glm-4-plus'
    }

    // 直接调用智谱 API
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Zhipu API error:', errorText)
      return new Response(
        JSON.stringify({ error: `智谱 API 错误: ${response.status}` }),
        { status: response.status }
      )
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const reader = response.body?.getReader()

    if (!reader) {
      return new Response(JSON.stringify({ error: '无法读取响应流' }), { status: 500 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    // 使用 AI SDK 兼容的流格式
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`))
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return new Response(
      JSON.stringify({ error: '生成失败，请稍后重试' }),
      { status: 500 }
    )
  }
}
