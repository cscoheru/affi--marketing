#!/usr/bin/env python3
"""
Medium 文章格式转换器
将 Markdown 文件转换为适合 Medium 发布的格式
去除 Markdown 标记，保留基本格式
"""

import re
import sys
from pathlib import Path

def convert_markdown_to_medium(markdown_content):
    """
    将 Markdown 转换为 Medium 友好格式

    转换规则：
    1. 标题 (#) 转换为纯文本（大写）
    2. 加粗 (**) 转换为纯文本（不做任何标记）
    3. 斜体 (*) 转换为纯文本（不做任何标记）
    4. 列表 (-) 转换为纯文本列表
    5. 表格保留，但转换分隔符
    6. 代码块转换为引用格式
    """

    lines = markdown_content.split('\n')
    result_lines = []
    in_code_block = False
    in_table = False
    table_lines = []

    for line in lines:
        # 检测代码块
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            continue

        if in_code_block:
            continue

        # 处理表格
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
            # 检测表格结束
            if len(table_lines) > 2 and not any('|---' in l for l in table_lines):
                # 转换表格
                converted_table = convert_table(table_lines)
                result_lines.extend(converted_table)
                table_lines = []
                in_table = False
            continue
        elif in_table:
            # 表格结束
            converted_table = convert_table(table_lines)
            result_lines.extend(converted_table)
            table_lines = []
            in_table = False
            continue

        # 跳过空行（但保留段落分隔）
        if not line.strip():
            result_lines.append('')
            continue

        # 处理标题
        if line.strip().startswith('#'):
            level = len(re.match(r'^#+', line).group())
            title_text = line.strip().lstrip('#').strip()
            # 根据级别添加格式
            if level == 1:
                result_lines.append(f'═' * len(title_text))
                result_lines.append(title_text.upper())
                result_lines.append('═' * len(title_text))
                result_lines.append('')
            elif level == 2:
                result_lines.append(title_text)
                result_lines.append('—' * len(title_text))
                result_lines.append('')
            else:
                result_lines.append(f'{title_text.upper()}')
                result_lines.append('')
            continue

        # 处理引用块
        if line.strip().startswith('>'):
            quote_text = line.strip().lstrip('>').strip()
            result_lines.append(f'│ {quote_text}')
            continue

        # 处理无序列表
        if line.strip().startswith('- '):
            list_item = line.strip().lstrip('-').strip()
            # 去除 markdown 格式
            list_item = re.sub(r'\*\*(.+?)\*\*', r'\1', list_item)  # 去除加粗
            list_item = re.sub(r'\*(.+?)\*', r'\1', list_item)    # 去除斜体
            result_lines.append(f'• {list_item}')
            continue

        if line.strip().startswith('* '):
            list_item = line.strip().lstrip('*').strip()
            list_item = re.sub(r'\*\*(.+?)\*\*', r'\1', list_item)
            list_item = re.sub(r'\*(.+?)\*', r'\1', list_item)
            result_lines.append(f'• {list_item}')
            continue

        # 处理数字列表
        if re.match(r'^\d+\.', line.strip()):
            list_item = line.strip()
            # 去除数字和点
            list_item = re.sub(r'^\d+\.\s*', '', list_item)
            list_item = re.sub(r'\*\*(.+?)\*\*', r'\1', list_item)
            list_item = re.sub(r'\*(.+?)\*', r'\1', list_item)
            result_lines.append(f'• {list_item}')
            continue

        # 处理分隔线
        if line.strip().startswith('---'):
            result_lines.append('')
            result_lines.append('—' * 30)
            result_lines.append('')
            continue

        # 处理图片标记
        if '[IMAGE:' in line:
            # 保留图片描述
            result_lines.append(f'[插入图片: {line.strip()[8:-1]}]')
            continue

        # 处理链接标记
        if '[**' in line and '**](' in line:
            # Markdown 链接: [**text**](url)
            link_text = re.search(r'\*\*(.+?)\*\*', line).group(1)
            link_url = re.search(r'\((.+?)\)', line).group(1)
            result_lines.append(f'{link_text} → {link_url}')
            continue

        if '[' in line and '](' in line:
            # 普通 Markdown 链接
            link_text = re.search(r'\[(.+?)\]', line).group(1)
            link_url = re.search(r'\((.+?)\)', line).group(1)
            result_lines.append(f'{link_text} → {link_url}')
            continue

        # 处理普通段落（去除 markdown 格式）
        paragraph = line.strip()

        # 去除加粗标记
        paragraph = re.sub(r'\*\*(.+?)\*\*', r'\1', paragraph)
        # 去除斜体标记
        paragraph = re.sub(r'\*(.+?)\*', r'\1', paragraph)
        # 去除代码标记
        paragraph = re.sub(r'`(.+?)`', r'\1', paragraph)

        if paragraph:
            result_lines.append(paragraph)

    return '\n'.join(result_lines)

def convert_table(table_lines):
    """转换 Markdown 表格为更友好的格式"""
    converted = []

    for line in table_lines:
        # 移除 Markdown 表格的边框样式
        cells = [cell.strip() for cell in line.split('|')]
        cells = [c for c in cells if c]  # 移除空单元格

        if cells:
            # 检测是否是分隔行
            if any(re.match(r'^:?-+:?$', cell) for cell in cells):
                converted.append('—' * 50)
            else:
                converted.append('   '.join(cells))

    return converted

def convert_file(input_file, output_file=None):
    """转换单个文件"""
    input_path = Path(input_file)

    if not input_path.exists():
        print(f'错误: 文件不存在 {input_file}')
        return

    # 读取内容
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 转换
    converted = convert_markdown_to_medium(content)

    # 输出
    if output_file:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(converted)
        print(f'✅ 已转换: {input_path.name}')
        print(f'   输出: {output_path}')
    else:
        print(f'\n--- {input_path.name} ---\n')
        print(converted)
        print(f'\n--- 转换完成 ---\n')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('用法: python3 markdown_to_medium.py <input_file> [output_file]')
        print('\n示例:')
        print('  python3 markdown_to_medium.py science_01_coffee_storage.md')
        print('  python3 markdown_to_medium.py science_01_coffee_storage.md output.txt')
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    convert_file(input_file, output_file)
