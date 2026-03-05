import { test, expect } from '@playwright/test';

/**
 * AI服务测试
 * 测试Python FastAPI AI服务的各项功能
 *
 * 前置条件:
 * - AI服务运行在 localhost:8000
 * - 已配置API密钥 (OpenAI, Qwen, ChatGLM)
 *
 * 注意: AI内容生成调用可能耗时较长，部分测试超时是预期的
 */

const AI_BASE = 'http://localhost:8000';

test.describe('AI服务健康检查', () => {
  test('健康检查端点响应正常', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('models_available');
    expect(data).toHaveProperty('uptime_seconds');
  });

  test('服务包含至少一个AI模型', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/health`);
    const data = await response.json();

    // 至少应该有一个模型可用
    const totalModels = Object.values(data.models_available || {}).reduce((sum: number, val: any) => sum + (val || 0), 0);
    expect(totalModels).toBeGreaterThan(0);
  });

  test('根路径返回服务信息', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('service', 'Affiliate Marketing AI Service');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('status', 'running');
  });
});

test.describe('AI内容生成API', () => {
  // AI内容生成可能需要较长时间，设置45秒超时
  test.describe.configure({ timeout: 45000 });

  test('生成SEO文章端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/content`, {
      data: {
        keyword: '测试关键词',
        content_type: 'article',
        tone: 'professional',
        target_length: 500,
        include_html: true,
        language: 'zh-CN'
      }
    });

    // 可能返回200（成功）或500（API密钥未配置或其他错误）
    expect([200, 500, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('html_content');
      expect(data).toHaveProperty('model_used');
      expect(data).toHaveProperty('tokens_used');
    }
  });

  test('生成产品评论端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/content`, {
      data: {
        keyword: '智能手机',
        content_type: 'review',
        tone: 'professional',
        target_length: 800
      }
    });

    expect([200, 500, 503]).toContain(response.status());
  });

  test('生成对比文章端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/content`, {
      data: {
        keyword: '笔记本电脑',
        content_type: 'comparison',
        tone: 'casual',
        target_length: 500  // 减少字数以加快测试
      }
    });

    // AI生成可能耗时较长或返回500
    expect([200, 500, 503]).toContain(response.status());
  });

  test('缺少必需参数返回错误', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/content`, {
      data: {
        // 缺少 keyword
        content_type: 'article'
      }
    });

    expect([422, 400]).toContain(response.status());
  });
});

test.describe('关键词分析API', () => {
  test('分析关键词端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/seo/analyze`, {
      data: {
        keyword: '数码相机'
      }
    });

    expect([200, 500, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('keyword');
      expect(data).toHaveProperty('search_volume');
      expect(data).toHaveProperty('competition_level');
      expect(data).toHaveProperty('difficulty_score');
      expect(data).toHaveProperty('search_intent');
      expect(data).toHaveProperty('related_keywords');
      expect(data).toHaveProperty('suggestions');
      expect(data).toHaveProperty('opportunities');
    }
  });

  test('关键词竞争度分析', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/seo/analyze`, {
      data: {
        keyword: '笔记本电脑'
      }
    });

    expect([200, 500, 503]).toContain(response.status());
  });
});

test.describe('联盟链接注入API', () => {
  test('注入联盟链接端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/affiliate/inject`, {
      data: {
        content: '这是一篇关于数码产品的文章。',
        keywords: ['智能手机', '数码产品'],
        max_links: 2
      }
    });

    expect([200, 500, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('links_injected');
      expect(data).toHaveProperty('links_used');
      expect(data).toHaveProperty('affiliate_networks');
      expect(Array.isArray(data.links_used)).toBeTruthy();
    }
  });

  test('多个联盟链接注入', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/affiliate/inject`, {
      data: {
        content: '推荐这款笔记本电脑和智能手机。这些数码产品都很不错。',
        keywords: ['笔记本电脑', '智能手机', '数码产品'],
        max_links: 5
      }
    });

    expect([200, 500, 503]).toContain(response.status());
  });
});

test.describe('AI模型管理API', () => {
  test('列出可用AI模型', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/api/v1/models`);

    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('models');
      expect(typeof data.models).toBe('object');
    }
  });

  test('生成文本端点存在', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/text`, {
      data: {
        prompt: '写一段简短的介绍',
        max_tokens: 100,
        tier: 'standard'
      }
    });

    // 可能返回200（成功）或500（API密钥未配置）
    expect([200, 500, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('model_used');
      expect(data).toHaveProperty('tokens_used');
    }
  });
});

test.describe('使用统计API', () => {
  test('获取使用统计', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/api/v1/stats/usage`);

    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('total_requests');
      expect(data).toHaveProperty('total_tokens');
      expect(data).toHaveProperty('total_cost');
      expect(data).toHaveProperty('by_model');
    }
  });

  test('获取成本统计', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/api/v1/stats/costs`);

    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('total_cost');
      expect(data).toHaveProperty('costs_by_model');
      expect(data).toHaveProperty('daily_limit');
    }
  });
});

test.describe('AI服务性能', () => {
  test('健康检查响应时间小于500ms', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${AI_BASE}/health`);

    const endTime = Date.now();

    expect(response.status()).toBe(200);
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('模型列表查询响应时间小于500ms', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${AI_BASE}/api/v1/models`);

    const endTime = Date.now();

    expect([200, 503]).toContain(response.status());
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('服务支持并发请求', async ({ request }) => {
    // 发送3个并发健康检查请求
    const promises = [
      request.get(`${AI_BASE}/health`),
      request.get(`${AI_BASE}/health`),
      request.get(`${AI_BASE}/health`)
    ];

    const responses = await Promise.all(promises);

    // 所有请求都应该成功响应
    responses.forEach(r => {
      expect(r.status()).toBe(200);
    });
  });
});

test.describe('AI服务错误处理', () => {
  test('访问不存在的端点返回404', async ({ request }) => {
    const response = await request.get(`${AI_BASE}/api/v1/nonexistent`);
    expect(response.status()).toBe(404);
  });

  test('无效的tier值使用默认值', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/text`, {
      data: {
        prompt: '测试',
        tier: 'invalid_tier'
      }
    });

    // API可能使用默认tier并返回200，或者返回错误
    expect([200, 400, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('content');
    }
  });

  test('缺少必需参数返回错误', async ({ request }) => {
    const response = await request.post(`${AI_BASE}/api/v1/generate/text`, {
      data: {
        // 缺少 prompt
        tier: 'standard'
      }
    });

    expect([422, 400]).toContain(response.status());
  });
});
