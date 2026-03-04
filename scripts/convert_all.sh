#!/bin/bash
# 批量转换所有 Markdown 文件为 Medium 友好格式

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRAFTS_DIR="/Users/kjonekong/Documents/Affi-Marketing/docs/content/drafts"
OUTPUT_DIR="/Users/kjonekong/Documents/Affi-Marketing/docs/content/medium_ready"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "🔄 开始转换 Markdown 文件..."
echo ""

# 转换所有非 template 文件
for file in "$DRAFTS_DIR"/*.md; do
    filename=$(basename "$file")

    # 跳过模板文件
    if [[ "$filename" == *"template"* ]]; then
        continue
    fi

    echo "转换: $filename"

    python3 "$SCRIPT_DIR/markdown_to_medium.py" "$file" "$OUTPUT_DIR/${filename%.md}_medium.txt"
done

echo ""
echo "✅ 转换完成！"
echo ""
echo "📁 输出目录: $OUTPUT_DIR"
echo ""
echo "💡 现在打开 _medium.txt 文件，复制内容到 Medium 即可"
echo ""
ls -la "$OUTPUT_DIR" | grep "_medium.txt"
