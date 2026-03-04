#!/usr/bin/env python3
"""
RSS Feed 生成器
为 Medium 创建可导入的 RSS feed
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
from urllib.parse import quote
import base64

# 配置
BASE_URL = "https://hub.zenconsult.top"
BLOG_PATH = "/blog"  # 部署后的文章路径
AUTHOR_NAME = "Coffee Enthusiast"
AUTHOR_EMAIL = "contact@zenconsult.top"

def get_article_metadata():
    """返回文章元数据列表"""

    articles = [
        {
            "file": "science_01_coffee_storage.md",
            "title": "How to Store Coffee Beans: Freezer vs Counter",
            "description": "Does storing coffee in the freezer really keep it fresh? Or should you leave it on the counter? Let's settle this debate once and for all.",
            "category": "Coffee Basics"
        },
        {
            "file": "science_02_water_hardness.md",
            "title": "Hard Water vs Soft Water: Does It Affect Your Coffee?",
            "description": "You've probably heard coffee snobs talk about water like it's the most important ingredient. But does water hardness actually matter?",
            "category": "Coffee Basics"
        },
        {
            "file": "science_03_arabica_robusta.md",
            "title": "Arabica vs Robusta: What's the Difference?",
            "description": "Single-origin is having a moment. Coffee shops act like it's the only respectable choice. But are blends actually bad?",
            "category": "Coffee Basics"
        },
        {
            "file": "science_04_why_bitter.md",
            "title": "Why Your Coffee Tastes Bitter (And How to Fix It)",
            "description": "Bitter coffee is the universal coffee complaint. But here's the thing — some bitterness is actually good.",
            "category": "Troubleshooting"
        },
        {
            "file": "science_05_water_temperature.md",
            "title": "Perfect Water Temperature for Coffee: Myth vs Fact",
            "description": "Water temperature can make or break your coffee. Get it wrong, and you'll be drinking regret.",
            "category": "Coffee Basics"
        },
        {
            "file": "science_06_single_origin_blend.md",
            "title": "Single-Origin vs Blend: Which Coffee Should You Buy?",
            "description": "Single-origin is having a moment. Coffee shops act like it's the only respectable choice. But are blends actually bad?",
            "category": "Coffee Basics"
        },
        {
            "file": "science_07_cleaning_machines.md",
            "title": "How to Clean Your Coffee Machine (Without Chemicals)",
            "description": "Daily cleaning keeps your coffee tasting fresh. Here's how to do it right without harsh chemicals.",
            "category": "Maintenance"
        },
        {
            "file": "review_01_delonghi_regret.md",
            "title": "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months",
            "description": "Spoiler: I don't actually regret it. But there are things I wish I knew before dropping $350 on this machine.",
            "category": "Coffee Machine Reviews"
        },
        {
            "file": "review_02_comparison.md",
            "title": "De'Longhi vs Breville vs Nespresso: Which Coffee Machine Is Worth It?",
            "description": "I spent way too much time researching coffee machines. Here's what I learned so you don't have to.",
            "category": "Coffee Machine Reviews"
        },
        {
            "file": "review_03_buying_guide.md",
            "title": "Coffee Machine Buying Guide for Beginners (2024 Edition)",
            "description": "I bought three different coffee machines so you don't have to. Here's everything I learned.",
            "category": "Buying Guides"
        }
    ]
    return articles

def read_article_content(file_path):
    """读取文章内容（截取部分作为内容）"""
    import re
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 移除 markdown 标记（用于纯文本预览）
        content = re.sub(r'# + .+', '', content)  # 标题
        content = re.sub(r'\*\*(.+?)\*\*', r'\1', content)  # 加粗
        content = re.sub(r'\*(.+?)\*', r'\1', content)  # 斜体
        content = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', content)  # 链接
        content = re.sub(r'\[IMAGE:.*?\]', '', content)  # 图片标记

        # 截取前 500 字符
        if len(content) > 500:
            content = content[:500] + "..."

        return content
    except Exception as e:
        return f"Click to read full article... (Error: {e})"

def generate_rss():
    """生成 RSS feed"""
    import xml.dom.minidom as minidom

    # 创建 RSS 根元素
    rss = ET.Element('rss', {
        'version': '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/'
    })

    channel = ET.SubElement(rss, 'channel')

    # Channel 信息
    ET.SubElement(channel, 'title').text = 'Coffee Enthusiast - Honest Coffee Reviews'
    ET.SubElement(channel, 'link').text = f'{BASE_URL}{BLOG_PATH}'
    ET.SubElement(channel, 'atom:link', {
        'href': f'{BASE_URL}/feed.xml',
        'rel': 'self',
        'type': 'application/rss+xml'
    })
    ET.SubElement(channel, 'description').text = 'Honest coffee reviews and brewing tips for regular people who love coffee but don't want to make it a religion.'
    ET.SubElement(channel, 'language').text = 'en-us'
    ET.SubElement(channel, 'lastBuildDate').text = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S %Z')

    # 获取文章列表
    articles = get_article_metadata()
    drafts_dir = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/drafts')

    for i, article_meta in enumerate(articles):
        article_file = drafts_dir / article_meta['file']

        if not article_file.exists():
            continue

        # 读取文章内容
        content = read_article_content(article_file)

        # 创建 item
        item = ET.SubElement(channel, 'item')

        # 标题
        ET.SubElement(item, 'title').text = article_meta['title']

        # 链接
        url = f"{BASE_URL}{BLOG_PATH}/{article_meta['file'][:-3]}"  # 去掉 .md
        ET.SubElement(item, 'link').text = url
        ET.SubElement(item, 'guid', {'isPermaLink': 'false'}).text = f"hub-coffee-{i}"

        # 描述
        description = ET.SubElement(item, 'description')
        description.text = article_meta['description'] + '\n\n' + content

        # 内容
        content_elem = ET.SubElement(item, 'content:encoded')
        content_elem.text = f'<p>{article_meta["description"]}</p><p>{content}</p>'

        # 分类
        category = ET.SubElement(item, 'category')
        category.set('domain', article_meta['category'])
        category.text = article_meta['category']

        # 发布日期
        pub_date = (datetime.now(timezone.utc).replace(hour=12, minute=0, second=0) -
                     datetime.timedelta(days=9-i))  # 倒序日期
        ET.SubElement(item, 'pubDate').text = pub_date.strftime('%a, %d %b %Y %H:%M:%S %Z')

        # 作者
        author = ET.SubElement(item, 'author')
        ET.SubElement(author, 'name').text = AUTHOR_NAME

    # 生成 XML
    xml_str = minidom.parseString(ET.tostring(rss, encoding='unicode')).toprettyxml(indent='  ')

    return xml_str

def main():
    import xml.dom.minidom as minidom

    output_file = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/feed.xml')
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # 生成 RSS
    xml_str = generate_rss()

    # 写入文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(xml_str)

    print(f"✅ RSS Feed 已生成: {output_file}")
    print(f"📤 Feed URL: {BASE_URL}/feed.xml")
    print(f"\n💡 在 Medium 中导入这个 URL 即可订阅所有文章！")
    print(f"\n📋 包含文章数: 10")
    print(f"🔄 重新生成: 运行 python3 scripts/generate_rss_feed.py")

if __name__ == '__main__':
    main()
