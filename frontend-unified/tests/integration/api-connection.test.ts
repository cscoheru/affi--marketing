import { test, expect } from '@playwright/test';

/**
 * 后端API连接测试
 * 测试Go后端API的各项端点
 *
 * 前置条件:
 * - Go后端服务器运行在 localhost:8080
 * - PostgreSQL数据库连接正常
 */

const API_BASE = 'http://localhost:8080';

test.describe('后端API连接测试', () => {
  // 不需要登录，直接测试API端点

  test.describe('健康检查', () => {
    test('健康检查端点响应正常', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('service', 'affi-marketing-api');
      expect(data).toHaveProperty('version');
    });

    test('根路径返回欢迎信息', async ({ request }) => {
      const response = await request.get(`${API_BASE}/`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe('认证API', () => {
    test('登录端点存在并响应', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
        data: {
          email: 'demo@example.com',
          password: 'password'
        }
      });

      // 可能返回200或401，取决于用户是否存在
      expect([200, 401, 422]).toContain(response.status());

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('使用无效凭证登录返回401', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('缺少必需字段返回422', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/auth/login`, {
        data: {
          email: 'test@example.com'
          // 缺少password
        }
      });

      expect(response.status()).toBe(422);
    });
  });

  test.describe('实验管理API', () => {
    test('获取实验列表端点存在', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/v1/experiments`);

      // 可能返回200（有数据）或401（需要认证）
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBeTruthy();
      }
    });

    test('创建实验端点存在（需要认证）', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/experiments`, {
        data: {
          name: '测试实验',
          description: '自动化测试创建的实验',
          type: 'seo'
        }
      });

      // 应该返回401（未认证）或422（验证失败）
      expect([401, 422]).toContain(response.status());
    });
  });

  test.describe('追踪服务API', () => {
    test('记录追踪事件端点存在', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/tracking/events`, {
        data: {
          session_id: 'test-session-123',
          event_type: 'page_view',
          properties: {
            page: '/dashboard',
            referrer: ''
          }
        }
      });

      // 可能返回200、401或422
      expect([200, 201, 401, 422]).toContain(response.status());
    });

    test('获取事件列表端点存在', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/v1/tracking/events`);

      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('结算服务API', () => {
    test('获取结算记录列表端点存在', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/v1/settlement/records`);

      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('插件管理API', () => {
    test('获取插件列表端点存在', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/v1/plugins`);

      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('AI内容生成API', () => {
    test('AI内容生成端点存在（需要认证）', async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/v1/ai/generate-content`, {
        data: {
          keyword: '测试关键词',
          type: 'seo_article'
        }
      });

      // 应该返回401（未认证）或503（AI服务不可用）
      expect([401, 503, 422]).toContain(response.status());
    });
  });

  test.describe('API响应格式', () => {
    test('健康检查返回有效的JSON', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`);
      expect(response.headers()['content-type']).toContain('application/json');

      const data = await response.json();
      expect(typeof data).toBe('object');
    });

    test('API支持CORS', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`, {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      const corsHeaders = response.headers()['access-control-allow-origin'];
      expect(corsHeaders).toBeDefined();
    });
  });

  test.describe('API错误处理', () => {
    test('访问不存在的端点返回404', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/v1/nonexistent`);
      expect(response.status()).toBe(404);
    });

    test('使用无效的HTTP方法返回405或404', async ({ request }) => {
      const response = await request.post(`${API_BASE}/health`);
      expect([404, 405]).toContain(response.status());
    });
  });

  test.describe('数据库连接', () => {
    test('API能连接到数据库', async ({ request }) => {
      // 健康检查已经验证了数据库连接
      const response = await request.get(`${API_BASE}/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });
});

/**
 * API性能测试
 */
test.describe('API性能测试', () => {
  test('健康检查响应时间小于500ms', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${API_BASE}/health`);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);
  });

  test('并发请求处理能力', async ({ request }) => {
    // 发送10个并发请求
    const promises = Array(10).fill(null).map(() =>
      request.get(`${API_BASE}/health`)
    );

    const responses = await Promise.all(promises);
    const allSuccessful = responses.every(r => r.status() === 200);
    expect(allSuccessful).toBeTruthy();
  });
});
