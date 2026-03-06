"""
Amazon 爬虫可行性测试 v2
使用更可靠的产品和反反爬策略
"""
import asyncio
from playwright.async_api import async_playwright

# 热门产品 ASIN 列表
TEST_PRODUCTS = [
    ("B0BDHB9Y8M", "Apple AirPods Pro 2"),  # 热门产品
    ("B08N5KWB9H", "Sony WH-1000XM4"),       # 热门耳机
    ("B09V3KXJPB", "Apple Watch SE 2"),      # 智能手表
]

async def test_amazon_product(asin: str, name: str = ""):
    """测试抓取 Amazon 产品页面"""
    url = f"https://www.amazon.com/dp/{asin}"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-sandbox',
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale='en-US',
            viewport={'width': 1920, 'height': 1080},
        )
        
        # 注入反检测脚本
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            window.chrome = {runtime: {}};
        """)
        
        page = await context.new_page()
        
        try:
            print(f"\n🔍 测试产品: {name} ({asin})")
            print(f"   URL: {url}")
            
            # 访问页面
            response = await page.goto(url, wait_until="networkidle", timeout=30000)
            print(f"   响应状态: {response.status}")
            
            # 等待页面加载
            await page.wait_for_timeout(2000)
            
            # 检查是否被重定向到验证码页面
            current_url = page.url
            if "captcha" in current_url.lower() or "signin" in current_url.lower():
                print(f"   ⚠️ 被重定向: {current_url}")
                return {"status": "blocked", "redirect": current_url}
            
            # 提取产品信息
            title = await page.title()
            
            # 尝试多种选择器获取标题
            product_title = None
            title_selectors = ["#productTitle", "#title", "h1.a-size-large"]
            for selector in title_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        product_title = await element.inner_text()
                        if product_title:
                            break
                except:
                    continue
            
            if product_title:
                print(f"   ✅ 成功获取标题: {product_title[:60]}...")
                return {"status": "success", "title": product_title, "asin": asin}
            else:
                # 截图保存用于调试
                await page.screenshot(path=f"/tmp/amazon_debug_{asin}.png")
                print(f"   ⚠️ 页面标题: {title}")
                print(f"   📸 截图已保存: /tmp/amazon_debug_{asin}.png")
                return {"status": "partial", "page_title": title}
                
        except Exception as e:
            print(f"   ❌ 错误: {e}")
            return {"status": "error", "error": str(e)}
            
        finally:
            await browser.close()

async def main():
    print("=" * 60)
    print("Amazon 爬虫可行性测试 v2")
    print("=" * 60)
    
    results = []
    for asin, name in TEST_PRODUCTS:
        result = await test_amazon_product(asin, name)
        results.append((name, result))
        await asyncio.sleep(2)  # 避免请求过快
    
    print("\n" + "=" * 60)
    print("测试总结:")
    for name, result in results:
        status = result.get("status", "unknown")
        icon = "✅" if status == "success" else "⚠️" if status == "partial" else "❌"
        print(f"  {icon} {name}: {status}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
