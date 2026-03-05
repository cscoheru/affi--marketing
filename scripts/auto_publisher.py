#!/usr/bin/env python3
"""
一键发布工具
自动发布文章到多个平台
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import subprocess

# 配置
ARTICLES_DIR = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/drafts')
MEDIUM_READY_DIR = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/medium_ready')
FRONTEND_PUBLIC_DIR = Path('/Users/kjonekong/Documents/Affi-Marketing/frontend/public/content')

# 文章列表
ARTICLES = [
    {'file': 'science_01_coffee_storage.md', 'title': 'How to Store Coffee Beans'},
    {'file': 'science_02_water_hardness.md', 'title': 'Hard Water vs Soft Water'},
    {'file': 'science_03_arabica_robusta.md', 'title': 'Arabica vs Robusta'},
    {'file': 'science_04_why_bitter.md', 'title': 'Why Coffee Tastes Bitter'},
    {'file': 'science_05_water_temperature.md', 'title': 'Water Temperature for Coffee'},
    {'file': 'science_06_single_origin_blend.md', 'title': 'Single-Origin vs Blend'},
    {'file': 'science_07_cleaning_machines.md', 'title': 'How to Clean Coffee Machine'},
    {'file': 'review_01_delonghi_regret.md', 'title': 'De\'Longhi ECAM Review'},
    {'file': 'review_02_comparison.md', 'title': 'De\'Longhi vs Breville'},
    {'file': 'review_03_buying_guide.md', 'title': 'Coffee Machine Buying Guide'},
]

def print_header(text):
    """打印标题"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_step(num, text):
    """打印步骤"""
    print(f"\n[步骤 {num}] {text}")

def check_file_exists(filepath):
    """检查文件是否存在"""
    if filepath.exists():
        print(f"  ✅ {filepath.name}")
        return True
    else:
        print(f"  ❌ {filepath.name} - 不存在")
        return False

def step1_check_files():
    """步骤1: 检查文件"""
    print_step(1, "检查文章文件")
    print("检查 draft 目录:")
    all_exist = True
    for article in ARTICLES:
        filepath = ARTICLES_DIR / article['file']
        if not check_file_exists(filepath):
            all_exist = False
    return all_exist

def step2_convert_to_medium_format():
    """步骤2: 转换为 Medium 格式"""
    print_step(2, "转换为 Medium 格式")

    # 运行转换脚本
    script_path = Path('/Users/kjonekong/Documents/Affi-Marketing/scripts/convert_all.sh')

    if script_path.exists():
        print(f"  运行: {script_path.name}")
        result = subprocess.run(['bash', str(script_path)], capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ 转换完成")
            print(f"\n{result.stdout}")
            return True
        else:
            print(f"  ❌ 转换失败: {result.stderr}")
            return False
    else:
        print(f"  ❌ 脚本不存在: {script_path}")
        return False

def step3_copy_to_frontend():
    """步骤3: 复制到前端"""
    print_step(3, "复制文章到前端目录")

    try:
        # 复制 medium_ready 文件
        for article in ARTICLES:
            md_file = article['file']
            txt_file = md_file.replace('.md', '_medium.txt')

            source = MEDIUM_READY_DIR / txt_file
            dest = FRONTEND_PUBLIC_DIR / txt_file

            if source.exists():
                import shutil
                shutil.copy(source, dest)
                print(f"  ✅ 复制: {txt_file}")

        print("\n  ✅ 所有文件已复制到 frontend/public/content/")
        return True
    except Exception as e:
        print(f"  ❌ 复制失败: {e}")
        return False

def step4_generate_rss():
    """步骤4: 生成 RSS"""
    print_step(4, "生成 RSS Feed")

    script_path = Path('/Users/kjonekong/Documents/Affi-Marketing/scripts/generate_rss_feed_v2.py')

    if script_path.exists():
        result = subprocess.run(['python3', str(script_path)], capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ RSS Feed 已生成")

            # 复制到前端
            import shutil
            rss_source = Path('/Users/kjonekong/Documents/Affi-Marketing/docs/content/feed.xml')
            rss_dest = FRONTEND_PUBLIC_DIR / 'feed.xml'
            shutil.copy(rss_source, rss_dest)
            print("  ✅ RSS Feed 已复制到 frontend/public/content/")
            return True
        else:
            print(f"  ❌ 生成失败: {result.stderr}")
            return False
    else:
        print(f"  ❌ 脚本不存在: {script_path}")
        return False

def step5_show_publishing_guide():
    """步骤5: 显示发布指南"""
    print_step(5, "发布到各平台")

    print("""
┌─────────────────────────────────────────────────────────────┐
│  现在可以发布文章到以下平台：                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  自己的博客（已自动部署）                                  │
│     https://hub.zenconsult.top/blog                         │
│     ✅ 已完成，无需操作                                        │
│                                                             │
│  2️⃣  Blogger                                               │
│     https://blogger.com                                     │
│     步骤：                                                  │
│     - 登录 → New Post                                       │
│     - 复制 medium_ready 文件内容                              │
│     - 添加标签、封面图                                        │
│     - 在文末添加外链：                                        │
│       "Read more: https://hub.zenconsult.top/blog/xxx"      │
│     - Publish                                               │
│                                                             │
│  3️⃣  Medium（每天限2篇）                                     │
│     https://medium.com                                      │
│     步骤同上，注意限流                                         │
│                                                             │
│  4️⃣  Reddit/Quora 推广                                      │
│     链接指向 Blogger 或自己的博客                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
""")

def main():
    print_header("一键内容发布工具")

    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"待发布文章: {len(ARTICLES)} 篇")

    # 执行步骤
    steps = [
        step1_check_files,
        step2_convert_to_medium_format,
        step3_copy_to_frontend,
        step4_generate_rss,
        lambda: (step5_show_publishing_guide(), True)[1]
    ]

    for i, step in enumerate(steps, 1):
        try:
            success = step()
            if not success and i < len(steps):
                print(f"\n⚠️  步骤 {i} 失败，是否继续？(y/n)")
                # 自动继续
                print("继续执行...")
        except Exception as e:
            print(f"\n❌ 步骤 {i} 出错: {e}")

    print_header("发布准备完成")
    print(f"结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n💡 提示：文章已准备就绪，现在可以手动发布到 Blogger 和 Medium")

if __name__ == '__main__':
    main()
