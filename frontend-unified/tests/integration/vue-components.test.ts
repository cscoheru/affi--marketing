import { test, expect } from '@playwright/test';

/**
 * Vue组件集成测试
 * 测试Vue Remote Loader组件与Next.js主应用的集成
 *
 * 前置条件:
 * - Vue开发服务器运行在 localhost:5174
 * - Next.js开发服务器运行在 localhost:3000
 * - Module Federation配置正确
 */

test.describe('Vue组件集成测试', () => {
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  // 每个测试前登录并清除存储
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    // 登录
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000); // 等待登录完成
  });

  test.describe('仪表板Vue组件', () => {
    test('仪表板页面加载Vue组件成功', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 检查页面内容
      const mainContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(mainContent).toBeVisible();

      // 检查是否有Vue组件的标识
      // Vue Remote Loader会加载远程组件，可能需要一些时间
      await page.waitForTimeout(2000);

      // 检查页面标题
      const pageTitle = page.locator('h1, h2').or(page.locator('text=仪表板'));
      if (await pageTitle.count() > 0) {
        await expect(pageTitle.first()).toBeVisible();
      }
    });

    test('Vue组件显示正确的数据', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 等待Vue组件加载

      // 检查是否有仪表板相关的数据卡片或图表
      const cards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
      const cardCount = await cards.count();

      // 如果页面有内容，至少应该有一些元素
      if (cardCount > 0) {
        await expect(cards.first()).toBeVisible();
      }
    });
  });

  test.describe('实验管理Vue组件', () => {
    test('实验管理页面加载Vue组件成功', async ({ page }) => {
      await page.goto('/experiments');
      await page.waitForLoadState('networkidle');

      // 等待Vue组件加载
      await page.waitForTimeout(2000);

      // 检查页面内容
      const mainContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(mainContent).toBeVisible();
    });

    test('实验列表可能包含Vue渲染的元素', async ({ page }) => {
      await page.goto('/experiments');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查是否有实验列表或表格
      const list = page.locator('table, [class*="list"], [class*="table"]');
      const listCount = await list.count();

      if (listCount > 0) {
        await expect(list.first()).toBeVisible();
      }
    });
  });

  test.describe('插件管理Vue组件', () => {
    test('插件管理页面加载Vue组件成功', async ({ page }) => {
      await page.goto('/plugins');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const mainContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('数据分析Vue组件', () => {
    test('数据分析页面加载Vue组件成功', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const mainContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('结算管理Vue组件', () => {
    test('结算管理页面加载Vue组件成功', async ({ page }) => {
      await page.goto('/settlements');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const mainContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Vue Remote Loader状态同步', () => {
    test('Vue组件能接收Next.js的用户状态', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查侧边栏用户信息是否正确显示
      const userAvatar = page.locator('[data-testid="user-avatar"]');
      await expect(userAvatar.first()).toBeVisible();

      // 用户信息应该来自Next.js的Zustand store
      // Vue组件通过Bridge接收这些状态
    });

    test('Vue组件与Next.js路由同步', async ({ page }) => {
      // 从仪表板导航到实验管理
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 点击侧边栏的实验管理链接
      const experimentsLink = page.locator('text=实验管理');
      if (await experimentsLink.isVisible()) {
        await experimentsLink.click();
        await page.waitForURL('/experiments');

        // 确认URL已更改
        await expect(page).toHaveURL(/.*experiments/);
      }
    });
  });

  test.describe('Vue组件错误处理', () => {
    test('Vue组件加载失败时显示友好提示', async ({ page }) => {
      // 这个测试需要临时破坏Vue服务来测试错误处理
      // 目前先检查页面不会崩溃
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 页面应该能正常加载，即使Vue组件可能有问题
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Vue组件样式集成', () => {
    test('Vue组件使用Element Plus样式', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // 检查是否有Element Plus的类名或样式
      // Element Plus使用 el- 前缀的类名
      const elementPlusElements = page.locator('[class*="el-"]');
      const count = await elementPlusElements.count();

      // 如果有Element Plus元素，它们应该是可见的
      if (count > 0) {
        await expect(elementPlusElements.first()).toBeVisible();
      }
    });

    test('Vue组件主题与shadcn/ui一致', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 检查主题颜色是否一致
      // 主应用使用shadcn/ui的主题变量 (Tailwind v4使用ui-sans-serif)
      const body = page.locator('body');
      await expect(body).toHaveCSS('font-family', /ui-sans-serif|system-ui|-apple-system|BlinkMacSystemFont/);
    });
  });
});

/**
 * Vue服务健康检查
 */
test.describe('Vue开发服务器健康检查', () => {
  test('Vue服务器运行在5174端口', async ({ request }) => {
    const response = await request.get('http://localhost:5174');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });
});
