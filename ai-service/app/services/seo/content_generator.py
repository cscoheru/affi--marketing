"""
Content Generator Service
"""
import re
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from loguru import logger

from app.services.manager import AIServiceManager
from app.services.seo.keyword_analyzer import KeywordAnalysis, ContentBrief
from app.config import settings


@dataclass
class GeneratedContent:
    """Result of content generation"""
    title: str
    content: str
    html_content: str
    meta_description: str
    keywords: List[str]
    word_count: int
    model_used: str
    tokens_used: int
    cost_estimate: float
    seo_score: float
    readability_score: float


@dataclass
class ContentGenerationRequest:
    """Request parameters for content generation"""
    keyword: str
    content_type: str = "article"  # article, review, comparison, guide
    tone: str = "professional"
    target_length: int = 1500
    include_html: bool = True
    language: str = "zh-CN"
    custom_instructions: Optional[str] = None
    secondary_keywords: List[str] = field(default_factory=list)


class ContentGenerator:
    """Generate SEO-optimized content using AI models"""

    def __init__(self, ai_manager: AIServiceManager):
        self.ai_manager = ai_manager
        self.keyword_analyzer = None  # Will be imported if needed

        # Content type templates
        self.content_templates = {
            "article": {
                "structure": [
                    "catchy_title",
                    "introduction",
                    "main_body",
                    "key_takeaways",
                    "conclusion"
                ],
                "sections": 4,
            },
            "review": {
                "structure": [
                    "product_title",
                    "overview",
                    "features",
                    "pros_cons",
                    "verdict"
                ],
                "sections": 5,
            },
            "comparison": {
                "structure": [
                    "comparison_title",
                    "introduction",
                    "feature_comparison",
                    "price_comparison",
                    "recommendation"
                ],
                "sections": 5,
            },
            "guide": {
                "structure": [
                    "guide_title",
                    "introduction",
                    "requirements",
                    "step_by_step",
                    "tips_tricks",
                    "faq"
                ],
                "sections": 6,
            },
        }

        # Language-specific prompts
        self.language_prompts = {
            "zh-CN": "你是一位专业的中文内容创作者，擅长撰写SEO优化的文章。",
            "en-US": "You are a professional content writer specializing in SEO-optimized articles.",
        }

    async def generate(
        self,
        request: ContentGenerationRequest,
        keyword_analysis: Optional[KeywordAnalysis] = None
    ) -> GeneratedContent:
        """
        Generate SEO-optimized content based on request

        Args:
            request: Content generation request parameters
            keyword_analysis: Optional pre-computed keyword analysis

        Returns:
            GeneratedContent with title, content, HTML, and metadata
        """
        logger.info(f"Generating content for keyword: {request.keyword}")

        # Analyze keyword if not provided
        if keyword_analysis is None:
            from app.services.seo.keyword_analyzer import KeywordAnalyzer
            analyzer = KeywordAnalyzer()
            keyword_analysis = await analyzer.analyze(request.keyword)

        # Create content brief
        brief = await self._create_content_brief(request, keyword_analysis)

        # Generate the actual content
        title, content = await self._generate_content(request, brief, keyword_analysis)

        # Wrap in HTML if requested
        html_content = ""
        if request.include_html:
            html_content = self._wrap_in_html(title, content, request.keyword)

        # Generate meta description
        meta_description = self._generate_meta_description(title, content, request.keyword)

        # Calculate scores
        seo_score = self._calculate_seo_score(content, keyword_analysis)
        readability_score = self._calculate_readability_score(content, request.language)

        # Get generation stats
        word_count = len(content.split())

        return GeneratedContent(
            title=title,
            content=content,
            html_content=html_content,
            meta_description=meta_description,
            keywords=[request.keyword] + request.secondary_keywords[:5],
            word_count=word_count,
            model_used="qwen-turbo",  # Will be updated from actual response
            tokens_used=0,  # Will be updated from actual response
            cost_estimate=0.0,  # Will be updated from actual response
            seo_score=seo_score,
            readability_score=readability_score,
        )

    async def _create_content_brief(
        self,
        request: ContentGenerationRequest,
        keyword_analysis: KeywordAnalysis
    ) -> ContentBrief:
        """Create content brief for generation"""
        from app.services.seo.keyword_analyzer import ContentBrief, KeywordAnalyzer

        analyzer = KeywordAnalyzer()
        return await analyzer.create_content_brief(
            keyword_analysis,
            content_type=request.content_type,
            target_length=request.target_length,
            tone=request.tone,
        )

    async def _generate_content(
        self,
        request: ContentGenerationRequest,
        brief: ContentBrief,
        keyword_analysis: KeywordAnalysis
    ) -> tuple[str, str]:
        """Generate content using AI service"""

        # Build the prompt
        prompt = self._build_generation_prompt(request, brief, keyword_analysis)

        # Get system prompt for language
        system_prompt = self.language_prompts.get(
            request.language,
            self.language_prompts["zh-CN"]
        )

        # Add SEO optimization instructions
        system_prompt += self._get_seo_system_prompt()

        # Generate using AI manager
        try:
            response = await self.ai_manager.generate_content(
                prompt=prompt,
                system_prompt=system_prompt,
                tier="standard",  # Use standard tier for quality content
                max_tokens=request.target_length * 2,  # Approximate token ratio
            )

            # Parse response to extract title and content
            return self._parse_generated_content(response.content)

        except Exception as e:
            logger.error(f"Error generating content: {e}")
            raise

    def _build_generation_prompt(
        self,
        request: ContentGenerationRequest,
        brief: ContentBrief,
        keyword_analysis: KeywordAnalysis
    ) -> str:
        """Build the generation prompt"""
        template = self.content_templates.get(request.content_type, self.content_templates["article"])

        prompt_parts = [
            f"请为主题「{brief.primary_keyword}」撰写一篇{request.content_type}。",
            f"",
            f"## 内容要求",
            f"- 内容类型: {brief.content_type}",
            f"- 目标受众: {brief.target_audience}",
            f"- 搜索意图: {brief.target_intent}",
            f"- 语气: {brief.tone}",
            f"- 目标长度: {brief.length_hint}字",
            f"",
            f"## 关键词",
            f"- 主要关键词: {brief.primary_keyword}",
        ]

        if brief.secondary_keywords:
            prompt_parts.append(f"- 次要关键词: {', '.join(brief.secondary_keywords)}")

        prompt_parts.append("")
        prompt_parts.append("## 内容结构")

        for i, section in enumerate(template["structure"], 1):
            prompt_parts.append(f"{i}. {section}")

        prompt_parts.append("")
        prompt_parts.append("## 关键点")

        for i, point in enumerate(brief.key_points, 1):
            prompt_parts.append(f"{i}. {point}")

        if request.custom_instructions:
            prompt_parts.append("")
            prompt_parts.append("## 额外要求")
            prompt_parts.append(request.custom_instructions)

        prompt_parts.append("")
        prompt_parts.append("## 输出格式")
        prompt_parts.append("请按以下格式输出：")
        prompt_parts.append("")
        prompt_parts.append("```")
        prompt_parts.append("TITLE: [文章标题]")
        prompt_parts.append("")
        prompt_parts.append("[文章正文内容]")
        prompt_parts.append("```")

        return "\n".join(prompt_parts)

    def _get_seo_system_prompt(self) -> str:
        """Get SEO-optimized system prompt additions"""
        return """

## SEO优化要求
1. 在标题中自然地包含主要关键词
2. 在前100字中包含主要关键词
3. 在文中多次出现关键词（密度1-2%）
4. 使用H2和H3标签组织内容结构
5. 每段不超过5句话
6. 使用简洁、易懂的语言
7. 在适当位置添加次要关键词
8. 确保内容原创、有价值、可读性强
9. 使用列表和要点提高可读性
10. 在结尾包含行动号召

## 内容质量标准
- 信息准确、有用
- 逻辑清晰、结构完整
- 避免重复和冗余
- 符合用户搜索意图
"""

    def _parse_generated_content(self, raw_content: str) -> tuple[str, str]:
        """Parse generated content to extract title and body"""
        # Check if content has TITLE marker
        title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', raw_content, re.IGNORECASE)

        if title_match:
            title = title_match.group(1).strip()
            # Remove title line and any code blocks
            content = re.sub(r'TITLE:\s*.+?\n', '', raw_content, flags=re.IGNORECASE)
            content = re.sub(r'```\n?', '', content)
            content = content.strip()
        else:
            # No explicit title, extract first line as title
            lines = raw_content.strip().split('\n')
            title = lines[0].strip('#').strip()
            content = '\n'.join(lines[1:]).strip()

        return title, content

    def _wrap_in_html(self, title: str, content: str, keyword: str) -> str:
        """Wrap content in SEO-optimized HTML structure"""
        # Convert markdown-style headers to HTML
        html_lines = []
        lines = content.split('\n')

        html_lines.append('<article class="seo-content">')
        html_lines.append(f'  <h1 class="content-title">{title}</h1>')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Headers
            if line.startswith('### '):
                html_lines.append(f'  <h3>{line[4:]}</h3>')
            elif line.startswith('## '):
                html_lines.append(f'  <h2>{line[3:]}</h2>')
            # Lists
            elif line.startswith('- ') or line.startswith('* '):
                html_lines.append(f'  <li>{line[2:]}</li>')
            # Numbered lists
            elif re.match(r'^\d+\.\s', line):
                html_lines.append(f'  <li>{line}</li>')
            # Regular paragraphs
            else:
                html_lines.append(f'  <p>{line}</p>')

        html_lines.append('</article>')

        return '\n'.join(html_lines)

    def _generate_meta_description(self, title: str, content: str, keyword: str) -> str:
        """Generate SEO-optimized meta description"""
        # Take first 160 characters of content
        preview = content[:150].strip()

        # Ensure keyword is included
        if keyword.lower() not in preview.lower():
            preview = f"{keyword} - {preview}"

        # Truncate to 160 chars
        if len(preview) > 160:
            preview = preview[:157].rstrip() + "..."

        return preview

    def _calculate_seo_score(self, content: str, keyword_analysis: KeywordAnalysis) -> float:
        """Calculate SEO score (0-100)"""
        score = 0.0
        max_score = 100.0

        content_lower = content.lower()
        keyword = keyword_analysis.keyword.lower()

        # Keyword presence (20 points)
        if keyword in content_lower:
            score += 20

        # Keyword density (10 points) - aim for 1-2%
        keyword_count = content_lower.count(keyword)
        word_count = len(content.split())
        density = (keyword_count / word_count) * 100 if word_count > 0 else 0
        if 0.5 <= density <= 2.5:
            score += 10

        # Content length (15 points)
        if word_count >= 300:
            score += 15
        elif word_count >= 150:
            score += 10

        # Structure - headers and lists (20 points)
        if re.search(r'##\s+', content):  # Has headers
            score += 10
        if re.search(r'[-*]\s+', content):  # Has lists
            score += 10

        # Internal linking potential (10 points)
        if '相关' in content or '更多' in content or '阅读' in content:
            score += 10

        # Readability indicators (15 points)
        sentences = content.split('。')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        if 10 <= avg_sentence_length <= 25:
            score += 15

        # Secondary keywords presence (10 points)
        for kw in keyword_analysis.related_keywords[:3]:
            if kw.lower() in content_lower:
                score += 3.33

        return min(score, max_score)

    def _calculate_readability_score(self, content: str, language: str) -> float:
        """Calculate readability score (0-100, higher = more readable)"""
        if language == "zh-CN":
            return self._chinese_readability_score(content)
        else:
            return self._english_readability_score(content)

    def _chinese_readability_score(self, content: str) -> float:
        """Calculate Chinese content readability"""
        score = 100.0

        # Deduct for very long sentences
        sentences = re.split(r'[。！？]', content)
        long_sentences = sum(1 for s in sentences if len(s) > 100)
        score -= long_sentences * 2

        # Deduct for excessive punctuation
        if content.count('，') / len(sentences) > 5 if sentences else 0:
            score -= 5

        # Bonus for varied sentence structure
        if any(len(s.strip()) < 20 for s in sentences):
            score += 5

        return max(0, min(100, score))

    def _english_readability_score(self, content: str) -> float:
        """Calculate English content readability (simplified Flesch)"""
        words = content.split()
        sentences = re.split(r'[.!?]', content)
        words = [w for w in words if w]  # Remove empty strings
        sentences = [s for s in sentences if s.strip()]

        if not sentences:
            return 50.0

        avg_sentence_length = len(words) / len(sentences)

        # Simplified scoring
        score = 100 - (avg_sentence_length * 1.5)
        return max(0, min(100, score))

    async def batch_generate(
        self,
        requests: List[ContentGenerationRequest]
    ) -> List[GeneratedContent]:
        """Generate multiple content pieces in batch"""
        results = []
        for request in requests:
            try:
                result = await self.generate(request)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to generate content for {request.keyword}: {e}")
                continue

        return results
