// 直接调用智谱 API，绕过 AI SDK 的端点兼容问题
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

// 可用的智谱模型
const ZHIPU_MODELS: Record<string, string> = {
  'glm-4-plus': 'glm-4-plus',      // 最新最强
  'glm-4-air': 'glm-4-air',        // 性价比高
  'glm-4-flash': 'glm-4-flash',    // 快速响应
  'glm-4': 'glm-4',                // 标准版
}

// 系统提示词模板
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

const LENGTH_GUIDE: Record<string, string> = {
  short: '文章长度约500字，简洁精炼。',
  medium: '文章长度约1000字，内容适中。',
  long: '文章长度约2000字，详细全面。',
}

export async function POST(req: Request) {
  try {
    const { topic, tone = 'professional', length = 'medium', category, model = 'glm-4-plus' } = await req.json()

    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: '请输入主题' }), { status: 400 })
    }

    // 检查 API Key
    if (!process.env.ZHIPU_API_KEY) {
      return new Response(
        JSON.stringify({ error: '智谱 API Key 未配置，请在环境变量中设置 ZHIPU_API_KEY' }),
        { status: 500 }
      )
    }

    const systemPrompt = `${SYSTEM_PROMPTS[tone] || SYSTEM_PROMPTS.professional}

${LENGTH_GUIDE[length] || LENGTH_GUIDE.medium}

${category ? `文章分类：${category}` : ''}

请直接输出文章内容，使用 Markdown 格式，包含：
1. 标题（# 一级标题）
2. 摘要（2-3句话）
3. 正文内容
4. 标签建议（在文末用一行列出，格式：标签：xxx, xxx, xxx）`

    const lengthHint = LENGTH_GUIDE[length] || LENGTH_GUIDE.medium
    const userPrompt = `请为以下主题写一篇文章（${lengthHint}）：${topic}`

    // 获取模型名称
    const modelName = ZHIPU_MODELS[model] || 'glm-4-plus'

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
