#!/usr/bin/env python3
"""
RSS Feed 生成器 - Medium 兼容版
"""

from pathlib import Path
from datetime import datetime, timezone

# 配置
BASE_URL = "https://hub.zenconsult.top"

def get_articles():
    """返回文章列表"""
    return [
        {
            "slug": "how-to-store-coffee-beans",
            "title": "How to Store Coffee Beans: Freezer vs Counter",
            "description": "Does storing coffee in the freezer really keep it fresh? Or should you leave it on the counter?",
            "category": "Coffee Basics",
            "date": "Wed, 04 Mar 2026 10:00:00 GMT",
            "content_file": "science_01_coffee_storage_medium.txt"
        },
        {
            "slug": "hard-water-vs-soft-water",
            "title": "Hard Water vs Soft Water: Does It Affect Your Coffee?",
            "description": "You've probably heard coffee snobs talk about water like it's the most important ingredient.",
            "category": "Coffee Basics",
            "date": "Wed, 04 Mar 2026 09:00:00 GMT",
            "content_file": "science_02_water_hardness_medium.txt"
        },
        {
            "slug": "arabica-vs-robusta",
            "title": "Arabica vs Robusta: What's the Difference?",
            "description": "Single-origin is having a moment. Coffee shops act like it's the only respectable choice.",
            "category": "Coffee Basics",
            "date": "Wed, 04 Mar 2026 08:00:00 GMT",
            "content_file": "science_03_arabica_robusta_medium.txt"
        },
        {
            "slug": "why-coffee-tastes-bitter",
            "title": "Why Your Coffee Tastes Bitter (And How to Fix It)",
            "description": "Bitter coffee is the universal coffee complaint. But here's the thing — some bitterness is actually good.",
            "category": "Troubleshooting",
            "date": "Wed, 04 Mar 2026 07:00:00 GMT",
            "content_file": "science_04_why_bitter_medium.txt"
        },
        {
            "slug": "water-temperature-for-coffee",
            "title": "Perfect Water Temperature for Coffee: Myth vs Fact",
            "description": "Water temperature can make or break your coffee. Get it wrong, and you'll be drinking regret.",
            "category": "Coffee Basics",
            "date": "Wed, 04 Mar 2026 06:00:00 GMT",
            "content_file": "science_05_water_temperature_medium.txt"
        },
        {
            "slug": "single-origin-vs-blend",
            "title": "Single-Origin vs Blend: Which Coffee Should You Buy?",
            "description": "Single-origin is having a moment. Coffee shops act like it's the only respectable choice.",
            "category": "Coffee Basics",
            "date": "Wed, 04 Mar 2026 05:00:00 GMT",
            "content_file": "science_06_single_origin_blend_medium.txt"
        },
        {
            "slug": "how-to-clean-coffee-machine",
            "title": "How to Clean Your Coffee Machine (Without Chemicals)",
            "description": "Daily cleaning keeps your coffee tasting fresh. Here's how to do it right without harsh chemicals.",
            "category": "Maintenance",
            "date": "Wed, 04 Mar 2026 04:00:00 GMT",
            "content_file": "science_07_cleaning_machines_medium.txt"
        },
        {
            "slug": "delonghi-ecam22-review",
            "title": "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months",
            "description": "Spoiler: I don't actually regret it. But there are things I wish I knew before dropping $350 on this machine.",
            "category": "Coffee Machine Reviews",
            "date": "Wed, 04 Mar 2026 03:00:00 GMT",
            "content_file": "review_01_delonghi_regret_medium.txt"
        },
        {
            "slug": "delonghi-vs-breville-vs-nespresso",
            "title": "De'Longhi vs Breville vs Nespresso: Which Is Worth It?",
            "description": "I spent way too much time researching coffee machines. Here's what I learned so you don't have to.",
            "category": "Coffee Machine Reviews",
            "date": "Wed, 04 Mar 2026 02:00:00 GMT",
            "content_file": "review_02_comparison_medium.txt"
        },
        {
            "slug": "coffee-machine-buying-guide",
            "title": "Coffee Machine Buying Guide for Beginners (2024)",
            "description": "I bought three different coffee machines so you don't have to. Here's everything I learned.",
            "category": "Buying Guides",
            "date": "Wed, 04 Mar 2026 01:00:00 GMT",
            "content_file": "review_03_buying_guide_medium.txt"
        }
    ]

def read_content_as_html(content_file):
    """读取文章内容并转换为简单HTML"""
    try:
        content_dir = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/medium_ready')
        file_path = content_dir / content_file

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 简单转换为 HTML 段落
        paragraphs = content.split('\n\n')
        html_parts = []

        for para in paragraphs[:8]:  # 前8段
            para = para.strip()
            if len(para) > 20:
                # 转义 HTML 特殊字符
                para = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                html_parts.append(f'<p>{para}</p>')

        return ''.join(html_parts)
    except:
        return '<p>Click to read full article on Coffee Enthusiast...</p>'

def generate_rss():
    """生成 RSS feed"""

    items_xml = []

    for article in get_articles():
        content = read_content_as_html(article['content_file'])

        item_xml = f"""
    <item>
      <title>{article['title']}</title>
      <link>{BASE_URL}/blog/{article['slug']}</link>
      <description>{article['description']}</description>
      <content:encoded><![CDATA[{content}]]></content:encoded>
      <category>{article['category']}</category>
      <pubDate>{article['date']}</pubDate>
      <guid isPermaLink="false">coffee-{article['slug']}</guid>
      <dc:creator>Coffee Enthusiast</dc:creator>
    </item>"""
        items_xml.append(item_xml)

    items_str = ''.join(items_xml)

    rss_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Coffee Enthusiast</title>
    <link>{BASE_URL}/blog</link>
    <atom:link href="{BASE_URL}/content/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Honest coffee reviews and brewing tips for regular people who love coffee but don't want to make it a religion.</description>
    <language>en-us</language>
    <lastBuildDate>{datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')}</lastBuildDate>
    <generator>Coffee Enthusiast RSS Generator</generator>
{items_str}
  </channel>
</rss>'''

    return rss_xml

def main():
    output_file = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/feed.xml')
    output_file.parent.mkdir(parents=True, exist_ok=True)

    xml_str = generate_rss()

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(xml_str)

    print(f"✅ RSS Feed 已生成: {output_file}")
    print(f"📤 Feed URL: {BASE_URL}/content/feed.xml")
    print(f"\n💡 在 Medium 中使用这个 URL 导入文章")

if __name__ == '__main__':
    main()
