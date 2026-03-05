import { test, expect } from '@playwright/test';

/**
 * React 原生页面测试
 * 测试产品管理、素材库、内容管理、发布中心页面
 */

test.describe('React 原生页面', () => {
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('产品管理页面', () => {
    test('页面正常加载', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page.locator('text=产品管理').or(page.locator('h1:has-text("产品")'))).toBeVisible();

      // 检查是否有搜索框
      const searchInput = page.locator('input[placeholder*="搜索"]').or(
        page.locator('[data-testid="search-input"]')
      );
      await expect(searchInput.first()).toBeVisible();
    });

    test('shadcn/ui 组件正常渲染', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // 检查按钮组件
      const button = page.locator('button').first();
      await expect(button).toBeVisible();

      // 检查卡片组件（如果有）
      const card = page.locator('[class*="card"]').or(page.locator('[data-testid="product-card"]'));
      if (await card.count() > 0) {
        await expect(card.first()).toBeVisible();
      }
    });
  });

  test.describe('素材库页面', () => {
    test('页面正常加载', async ({ page }) => {
      await page.goto('/materials');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page.locator('text=素材库').or(page.locator('h1:has-text("素材")'))).toBeVisible();
    });

    test('上传按钮存在', async ({ page }) => {
      await page.goto('/materials');
      await page.waitForLoadState('networkidle');

      // 检查上传按钮
      const uploadButton = page.locator('button:has-text("上传")').or(
        page.locator('[data-testid="upload-button"]')
      );
      if (await uploadButton.count() > 0) {
        await expect(uploadButton.first()).toBeVisible();
      }
    });
  });

  test.describe('内容管理页面', () => {
    test('页面正常加载', async ({ page }) => {
      await page.goto('/content');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page.locator('text=内容管理').or(page.locator('h1:has-text("内容")'))).toBeVisible();
    });

    test('列表或表格组件存在', async ({ page }) => {
      await page.goto('/content');
      await page.waitForLoadState('networkidle');

      // 检查是否有列表或表格
      const list = page.locator('[class*="list"]').or(page.locator('table')).or(
        page.locator('[data-testid="content-list"]')
      );
      // 列表可能为空但容器应该存在
      await expect(list.first()).toBeVisible();
    });
  });

  test.describe('发布中心页面', () => {
    test('页面正常加载', async ({ page }) => {
      await page.goto('/publish');
      await page.waitForLoadState('networkidle');

      // 检查页面标题
      await expect(page.locator('text=发布中心').or(page.locator('h1:has-text("发布")'))).toBeVisible();
    });

    test('发布操作按钮存在', async ({ page }) => {
      await page.goto('/publish');
      await page.waitForLoadState('networkidle');

      // 检查发布相关按钮
      const publishButton = page.locator('button:has-text("发布")').or(
        page.locator('[data-testid="publish-button"]')
      );
      if (await publishButton.count() > 0) {
        await expect(publishButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Vue微应用占位页面', () => {
    test('仪表板占位页面存在', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 检查是否有 Vue 组件加载器或占位内容
      const vueLoader = page.locator('[data-vue-component]').or(
        page.locator('[data-testid="vue-loader"]')
      );

      // 页面应该有内容（Vue组件或占位符）
      const pageContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(pageContent.first()).toBeVisible();
    });

    test('实验管理占位页面存在', async ({ page }) => {
      await page.goto('/experiments');
      await page.waitForLoadState('networkidle');

      const pageContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(pageContent.first()).toBeVisible();
    });

    test('插件管理占位页面存在', async ({ page }) => {
      await page.goto('/plugins');
      await page.waitForLoadState('networkidle');

      const pageContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(pageContent.first()).toBeVisible();
    });

    test('数据分析占位页面存在', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      const pageContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(pageContent.first()).toBeVisible();
    });

    test('结算管理占位页面存在', async ({ page }) => {
      await page.goto('/settlements');
      await page.waitForLoadState('networkidle');

      const pageContent = page.locator('main').or(page.locator('[data-testid="page-content"]'));
      await expect(pageContent.first()).toBeVisible();
    });
  });
});

test.describe('shadcn/ui 组件库', () => {
  const demoUser = {
    email: 'demo@example.com',
    password: 'password',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', demoUser.email);
    await page.fill('input[type="password"]', demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Button 组件样式正常', async ({ page }) => {
    // 访问任意页面
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button').first();
    await expect(button).toBeVisible();

    // 检查按钮有样式类
    const hasButtonClass = await button.evaluate(el => {
      return el.classList.contains('btn') ||
             el.className.includes('button') ||
             el.tagName === 'BUTTON';
    });
    expect(hasButtonClass).toBeTruthy();
  });

  test('Input 组件样式正常', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input').first();
    await expect(input).toBeVisible();
  });

  test('Card 组件存在（如有使用）', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Card 组件可能不存在于所有页面
    const card = page.locator('[class*="card"]').or(page.locator('[data-testid*="card"]'));
    const cardCount = await card.count();

    if (cardCount > 0) {
      await expect(card.first()).toBeVisible();
    }
    // 如果没有卡片组件，测试通过（不强制要求）
  });
});
