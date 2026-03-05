import { test, expect } from '@playwright/test';

/**
 * 认证功能集成测试
 * 测试登录页面、路由保护、登出流程
 */

test.describe('认证功能', () => {
  // 使用演示账户
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('登录页面正常显示', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/Affi-Marketing/);

    // 检查登录表单元素
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 检查是否有登录相关文本
    await expect(page.locator('text=登录').or(page.locator('text=Login')).first()).toBeVisible();
  });

  test('使用演示账户登录成功', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);

    // 提交登录
    await page.click('button[type="submit"]');

    // 应该重定向到 dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // 验证 URL 变化
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('未登录访问受保护页面被重定向', async ({ page }) => {
    // 清除所有存储（模拟未登录状态）
    await page.context().clearCookies();

    // 直接访问受保护页面
    await page.goto('/dashboard');

    // 应该被重定向到登录页
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('受保护页面重定向后返回原始URL', async ({ page }) => {
    // 清除所有存储
    await page.context().clearCookies();

    // 访问受保护页面
    const targetUrl = '/experiments';
    await page.goto(targetUrl);

    // 应该被重定向到登录页，并包含回调URL
    await page.waitForURL('/login', { timeout: 5000 });

    // 登录后应该返回到原始页面
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');

    // 应该返回到原始目标页面
    await page.waitForURL(/.*experiments/, { timeout: 5000 });
  });

  test('侧边栏显示用户信息', async ({ page }) => {
    // 登录
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 检查侧边栏用户区域
    const userArea = page.locator('aside').or(page.locator('[data-testid="sidebar"]'));
    await expect(userArea).toBeVisible();

    // 检查用户头像或名称
    const userAvatar = page.locator('[data-testid="user-avatar"]').or(
      page.locator('.avatar').or(page.locator('img[alt*="user"]'))
    );
    // 用户信息可能需要异步加载，增加超时
    await expect(userAvatar.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('登出功能', () => {
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('点击登出按钮返回登录页', async ({ page }) => {
    // 点击用户下拉菜单
    const userDropdown = page.locator('[data-testid="user-dropdown"]').or(
      page.locator('button:has-text("demo")')
    );
    await userDropdown.click();

    // 点击登出
    const logoutButton = page.locator('text=登出').or(page.locator('text=Logout')).or(
      page.locator('[data-testid="logout-button"]')
    );
    await logoutButton.click();

    // 应该返回登录页
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('登出后无法访问受保护页面', async ({ page }) => {
    // 登出
    const userDropdown = page.locator('[data-testid="user-dropdown"]').or(
      page.locator('button:has-text("demo")')
    );
    await userDropdown.click();
    const logoutButton = page.locator('text=登出').or(page.locator('text=Logout'));
    await logoutButton.click();
    await page.waitForURL('/login');

    // 尝试访问受保护页面
    await page.goto('/dashboard');

    // 应该被重定向回登录页
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });
});
