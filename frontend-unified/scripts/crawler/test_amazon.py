"""
Amazon 爬虫可行性测试
测试 Playwright 能否成功抓取产品页面
"""
import asyncio
from playwright.async_api import async_playwright

async def test_amazon_product(asin: str = "B08C4KVM9K"):
    """测试抓取 Amazon 产品页面"""
    url = f"https://www.amazon.com/dp/{asin}"
    
    async with async_playwright() as p:
        # 启动浏览器（headless模式）
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="en-US"
        )
        page = await context.new_page()
        
        try:
            print(f"🔍 正在访问: {url}")
            
            # 访问页面，设置超时
            response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            print(f"📡 响应状态: {response.status}")
            
            # 等待页面加载
            await page.wait_for_timeout(2000)
            
            # 检查是否被重定向到验证码页面
            current_url = page.url
            if "captcha" in current_url.lower() or "signin" in current_url.lower():
                print(f"⚠️ 被重定向到: {current_url}")
                print("❌ 触发了反爬机制")
                return None
            
            # 尝试提取产品标题
            title = await page.locator("#productTitle").inner_text() if await page.locator("#productTitle").count() > 0 else None
            
            # 尝试提取价格
            price = None
            price_selectors = [".a-price-whole", "#priceblock_ourprice", "#priceblock_dealprice", ".a-offscreen"]
            for selector in price_selectors:
                if await page.locator(selector).count() > 0:
                    price = await page.locator(selector).first.inner_text()
                    break
            
            # 尝试提取评分
            rating = None
            if await page.locator(".a-icon-star-small").count() > 0:
                rating = await page.locator(".a-icon-star-small").first.inner_text()
            
            # 尝试提取评论数
            review_count = None
            if await page.locator("#acrCustomerReviewText").count() > 0:
                review_count = await page.locator("#acrCustomerReviewText").inner_text()
            
            result = {
                "asin": asin,
                "url": url,
                "title": title.strip() if title else None,
                "price": price.strip() if price else None,
                "rating": rating.strip() if rating else None,
                "review_count": review_count.strip() if review_count else None,
                "status": "success" if title else "partial"
            }
            
            print("\n📊 提取结果:")
            print(f"  标题: {result['title'][:80]}..." if result['title'] else "  标题: 未获取")
            print(f"  价格: {result['price']}")
            print(f"  评分: {result['rating']}")
            print(f"  评论数: {result['review_count']}")
            print(f"\n✅ 状态: {result['status']}")
            
            return result
            
        except Exception as e:
            print(f"❌ 错误: {e}")
            return {"status": "error", "error": str(e)}
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_amazon_product())
