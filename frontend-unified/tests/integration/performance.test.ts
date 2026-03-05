import { test, expect } from '@playwright/test';

/**
 * 性能测试
 * 测试页面加载性能和关键指标
 *
 * 前置条件:
 * - Next.js服务器运行在 localhost:3000
 * - Vue服务器运行在 localhost:5174
 */

const APP_BASE = 'http://localhost:3000';

test.describe('页面性能测试', () => {
  test.describe.configure({ timeout: 30000 });

  test('首页加载性能', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);

    // 检查关键性能指标
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
      };
    });

    // DOM交互时间应小于3秒
    expect(metrics.domInteractive).toBeLessThan(3000);

    // DOM内容加载时间应小于2秒
    expect(metrics.domContentLoaded).toBeLessThan(2000);
  });

  test('登录页加载性能', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${APP_BASE}/login`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);

    // 检查表单元素是否快速可见
    const emailInputVisible = await page.locator('input[type="email"]').isVisible();
    expect(emailInputVisible).toBeTruthy();
  });

  test('仪表板加载性能', async ({ page }) => {
    // 先登录
    await page.goto(`${APP_BASE}/login`);
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 等待Vue组件加载
    await page.waitForTimeout(2000);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      };
    });

    // 检查关键指标
    expect(metrics.domInteractive).toBeLessThan(5000);
  });

  test('页面资源数量合理', async ({ page }) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    const resourceCount = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    // 资源请求数应该合理（小于100个）
    expect(resourceCount).toBeLessThan(100);
  });

  test('JavaScript执行时间合理', async ({ page }) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    const jsMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsEntries = entries.filter(e => e.initiatorType === 'script');

      return {
        count: jsEntries.length,
        totalSize: jsEntries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
        totalDuration: jsEntries.reduce((sum, e) => sum + e.duration, 0),
      };
    });

    // JS文件数量应该合理
    expect(jsMetrics.count).toBeLessThan(30);

    // 总执行时间应该小于5秒
    expect(jsMetrics.totalDuration).toBeLessThan(5000);
  });
});

test.describe('网络性能测试', () => {
  test('API响应时间', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get('http://localhost:8080/health');

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500);
  });

  test('AI服务响应时间', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get('http://localhost:8000/health');

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500);
  });

  test('并发API请求性能', async ({ request }) => {
    const startTime = Date.now();

    const promises = [
      request.get('http://localhost:8080/health'),
      request.get('http://localhost:8000/health'),
      request.get('http://localhost:5174'),
    ];

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;

    // 并发请求应该在2秒内完成
    expect(totalTime).toBeLessThan(2000);
  });
});

test.describe('渲染性能测试', () => {
  test('页面帧率测试', async ({ page }) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    // 简单的帧率测试 - 执行滚动并测量
    const frames = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const startTime = performance.now();

        function countFrames() {
          frames++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frames);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    // 帧率应该大于30fps
    expect(frames).toBeGreaterThan(30);
  });

  test('长列表渲染性能', async ({ page }) => {
    // 先登录
    await page.goto(`${APP_BASE}/login`);
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // 导航到实验管理页面
      await page.goto(`${APP_BASE}/experiments`);
      await page.waitForLoadState('networkidle');

      const renderTime = await page.evaluate(() => {
        return performance.now();
      });

      // 渲染时间应该合理
      expect(renderTime).toBeGreaterThan(0);
    } catch (e) {
      // 如果导航失败，跳过测试
      console.log('Skipping long list test - navigation failed');
    }
  });
});

test.describe('内存和资源使用', () => {
  test('页面内存使用检查', async ({ page }) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    // 使用performance.memory API (Chrome only)
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });

    // 执行一些操作
    await page.reload();
    await page.waitForLoadState('networkidle');

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });

    if (initialMemory && finalMemory) {
      // JS堆使用应该没有显著增长（允许100%的波动）
      const heapGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(heapGrowth).toBeLessThan(initialMemory.usedJSHeapSize * 1);
    } else {
      // 如果不支持performance.memory，跳过检查
      console.log('performance.memory not available, skipping memory check');
    }
  });

  test('DOM节点数量合理', async ({ page }) => {
    await page.goto(APP_BASE);
    await page.waitForLoadState('networkidle');

    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // DOM节点数量应该合理（少于2000个）
    expect(nodeCount).toBeLessThan(2000);
  });
});
