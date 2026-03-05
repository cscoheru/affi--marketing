import { test, expect } from '@playwright/test';

/**
 * 导航功能集成测试
 * 测试侧边栏切换、页面跳转
 */

test.describe('导航功能', () => {
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  // 每个测试前登录
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('侧边栏导航正常', async ({ page }) => {
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));
    await expect(sidebar).toBeVisible();

    // 点击"实验管理"
    const experimentsLink = page.locator('text=实验管理').or(
      page.locator('[data-testid="nav-experiments"]')
    );
    await experimentsLink.click();
    await expect(page).toHaveURL(/.*experiments/);

    // 点击"产品管理"
    const productsLink = page.locator('text=产品管理').or(
      page.locator('[data-testid="nav-products"]')
    );
    await productsLink.click();
    await expect(page).toHaveURL(/.*products/);
  });

  test('侧边栏分组导航', async ({ page }) => {
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));

    // 测试控制台分组
    const consoleGroup = page.locator('text=控制台').or(
      page.locator('[data-testid="group-console"]')
    );
    await expect(consoleGroup).toBeVisible();

    // 测试内容自动化分组
    const contentGroup = page.locator('text=内容自动化').or(
      page.locator('[data-testid="group-content"]')
    );
    await expect(contentGroup).toBeVisible();
  });

  test('侧边栏折叠功能', async ({ page }) => {
    const sidebar = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));
    const toggleButton = page.locator('[data-testid="sidebar-toggle"]').or(
      page.locator('button:has-text("←")').or(page.locator('button[aria-label*="toggle"]'))
    );

    // 检查初始状态（展开）
    await expect(sidebar).toBeVisible();
    const initialWidth = await sidebar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.width;
    });

    // 点击折叠按钮
    if (await toggleButton.isVisible()) {
      await toggleButton.first().click();

      // 等待动画完成
      await page.waitForTimeout(300);

      // 检查折叠状态
      const collapsedWidth = await sidebar.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.width;
      });

      // 宽度应该变小
      expect(collapsedWidth).not.toBe(initialWidth);
    }
  });

  test('直接URL访问受保护页面', async ({ page }) => {
    // 直接访问各种页面URL
    const pages = [
      '/dashboard',
      '/experiments',
      '/products',
      '/materials',
      '/content',
      '/publish',
      '/plugins',
      '/analytics',
      '/settlements',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // 应该能正常访问（不会重定向到登录页）
      expect(page.url()).toContain(pagePath);
    }
  });

  test('导航高亮当前页面', async ({ page }) => {
    // 访问实验管理页面
    await page.goto('/experiments');
    await page.waitForLoadState('networkidle');

    // 检查对应的导航项是否有高亮样式
    const activeNav = page.locator('[data-testid="nav-experiments"]').or(
      page.locator('a[href="/experiments"]')
    );

    // 检查是否有 active 或高亮类名
    const isActive = await activeNav.evaluate(el => {
      return el.classList.contains('active') ||
             el.classList.contains('bg-accent') ||
             window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
    });

    expect(isActive).toBeTruthy();
  });

  test('浏览器前进后退按钮', async ({ page }) => {
    // 访问仪表板
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 点击到实验管理
    await page.click('text=实验管理');
    await page.waitForURL('/experiments');

    // 点击到产品管理
    await page.click('text=产品管理');
    await page.waitForURL('/products');

    // 浏览器后退
    await page.goBack();
    await expect(page).toHaveURL(/.*experiments/);

    // 浏览器再后退
    await page.goBack();
    await expect(page).toHaveURL(/.*dashboard/);

    // 浏览器前进
    await page.goForward();
    await expect(page).toHaveURL(/.*experiments/);
  });
});
