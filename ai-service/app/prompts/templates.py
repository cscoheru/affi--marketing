"""
Prompt Templates for AI Content Generation
"""
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class PromptType(Enum):
    """Types of prompt templates"""
    SYSTEM = "system"
    USER = "user"
    CONTENT_BRIEF = "content_brief"
    SEO_OPTIMIZATION = "seo_optimization"
    AFFILIATE_INTEGRATION = "affiliate_integration"
    REWRITING = "rewriting"
    SUMMARIZATION = "summarization"


class Language(Enum):
    """Supported languages"""
    ZH_CN = "zh-CN"
    EN_US = "en-US"
    JA_JP = "ja-JP"
    KO_KR = "ko-KR"


@dataclass
class PromptTemplate:
    """Prompt template definition"""
    name: str
    type: PromptType
    template: str
    variables: List[str]
    language: Language
    description: str


class PromptTemplates:
    """Centralized prompt templates management"""

    # System Prompts
    SYSTEM_PROMPTS = {
        Language.ZH_CN: """你是一位专业的内容创作者，专门为联盟营销平台创作高质量、SEO优化的内容。

## 核心能力
- 深入理解SEO最佳实践
- 自然地整合关键词
- 创作引人入胜、有价值的内容
- 优化可读性和用户体验

## 写作原则
1. **原创性**: 所有内容必须原创，避免抄袭
2. **价值导向**: 提供真正有用的信息，不堆砌关键词
3. **结构清晰**: 使用标题、列表和段落提高可读性
4. **语言自然**: 避免机械重复，保持流畅自然
5. **用户意图**: 深刻理解并满足用户的搜索意图

## SEO要求
- 在标题和前100字中包含主要关键词
- 关键词密度保持在1-2%
- 使用H2/H3标签组织结构
- 每段不超过5句话
- 使用列表和要点提高可读性

请始终以专业、友好的态度创作内容。""",

        Language.EN_US: """You are a professional content creator specializing in high-quality, SEO-optimized content for affiliate marketing platforms.

## Core Capabilities
- Deep understanding of SEO best practices
- Natural keyword integration
- Creation of engaging, valuable content
- Optimization for readability and user experience

## Writing Principles
1. **Originality**: All content must be original, avoid plagiarism
2. **Value-First**: Provide genuinely useful information, don't keyword stuff
3. **Clear Structure**: Use headings, lists, and paragraphs for readability
4. **Natural Language**: Avoid mechanical repetition, keep it flowing
5. **User Intent**: Deeply understand and satisfy user search intent

## SEO Requirements
- Include primary keyword in title and first 100 words
- Maintain keyword density of 1-2%
- Use H2/H3 tags for structure
- Keep paragraphs under 5 sentences
- Use lists and bullet points for readability

Always approach content creation with professionalism and friendliness."""
    }

    # Content Type Templates
    CONTENT_TYPE_TEMPLATES = {
        "article": {
            "structure": ["引言", "核心内容", "要点总结", "结论", "Introduction", "Key Content", "Key Takeaways", "Conclusion"],
            "tone": "信息丰富且引人入胜",
            "call_to_action": "了解更多详情",
        },
        "review": {
            "structure": ["产品概述", "核心功能", "优缺点分析", "使用体验", "购买建议", "Overview", "Key Features", "Pros & Cons", "User Experience", "Buying Guide"],
            "tone": "客观且专业",
            "call_to_action": "查看最新价格",
        },
        "comparison": {
            "structure": ["对比引言", "详细对比", "价格对比", "使用场景", "推荐结论", "Introduction", "Detailed Comparison", "Price Comparison", "Use Cases", "Recommendation"],
            "tone": "客观分析",
            "call_to_action": "选择最适合的产品",
        },
        "guide": {
            "structure": ["指南简介", "准备工作", "详细步骤", "常见问题", "技巧提示", "Introduction", "Preparation", "Step-by-Step", "FAQ", "Tips & Tricks"],
            "tone": "教学导向且友好",
            "call_to_action": "开始实践",
        },
    }

    # SEO Optimization Prompts
    SEO_OPTIMIZATION_PROMPTS = {
        Language.ZH_CN: """
## SEO优化清单

### 关键词策略
- [ ] 主要关键词出现在标题中
- [ ] 主要关键词在前100字中
- [ ] 关键词密度保持在1-2%
- [ ] 自然地使用次要关键词
- [ ] 避免关键词堆砌

### 内容结构
- [ ] 使用H1标签作为主标题
- [ ] 使用H2/H3标签组织内容
- [ ] 每段不超过5句话
- [ ] 使用列表和要点
- [ ] 添加内部链接机会

### 可读性
- [ ] 使用简单易懂的语言
- [ ] 避免过长的句子
- [ ] 段落之间有适当空行
- [ ] 使用过渡词连接段落

### 元数据
- [ ] 编写吸引人的标题（50-60字符）
- [ ] 创建优化的描述（150-160字符）
- [ ] 包含关键词的URL建议
""",

        Language.EN_US: """
## SEO Optimization Checklist

### Keyword Strategy
- [ ] Primary keyword in title
- [ ] Primary keyword in first 100 words
- [ ] Keyword density maintained at 1-2%
- [ ] Natural use of secondary keywords
- [ ] Avoid keyword stuffing

### Content Structure
- [ ] Use H1 tag for main title
- [ ] Use H2/H3 tags for organization
- [ ] Keep paragraphs under 5 sentences
- [ ] Use lists and bullet points
- [ ] Add internal link opportunities

### Readability
- [ ] Use simple, clear language
- [ ] Avoid overly long sentences
- [ ] Proper spacing between paragraphs
- [ ] Use transition words between paragraphs

### Metadata
- [ ] Write compelling title (50-60 characters)
- [ ] Create optimized description (150-160 characters)
- [ ] Keyword-rich URL suggestions
"""
    }

    # Tone-specific Instructions
    TONE_INSTRUCTIONS = {
        "professional": {
            "style": "正式、客观、专业",
            "language": "避免口语化，使用专业术语",
            "examples": "使用数据和研究支持观点",
        },
        "casual": {
            "style": "轻松、亲切、易读",
            "language": "可以使用口语化表达",
            "examples": "使用个人经历和故事",
        },
        "friendly": {
            "style": "友好、热情、乐于助人",
            "language": "平衡正式和轻松",
            "examples": "使用鼓励性的语言",
        },
        "formal": {
            "style": "严谨、学术、权威",
            "language": "使用正式的书面语",
            "examples": "引用权威来源",
        },
        "humorous": {
            "style": "幽默、风趣、轻松",
            "language": "适度使用幽默元素",
            "examples": "使用有趣的比喻和例子",
        },
    }

    @classmethod
    def get_system_prompt(cls, language: Language = Language.ZH_CN) -> str:
        """Get system prompt for specified language"""
        return cls.SYSTEM_PROMPTS.get(language, cls.SYSTEM_PROMPTS[Language.ZH_CN])

    @classmethod
    def get_content_template(cls, content_type: str, language: Language = Language.ZH_CN) -> Dict:
        """Get content template by type"""
        template = cls.CONTENT_TYPE_TEMPLATES.get(content_type, cls.CONTENT_TYPE_TEMPLATES["article"])
        return template

    @classmethod
    def get_seo_prompt(cls, language: Language = Language.ZH_CN) -> str:
        """Get SEO optimization prompt"""
        return cls.SEO_OPTIMIZATION_PROMPTS.get(language, cls.SEO_OPTIMIZATION_PROMPTS[Language.ZH_CN])

    @classmethod
    def get_tone_instructions(cls, tone: str) -> Dict:
        """Get tone-specific instructions"""
        return cls.TONE_INSTRUCTIONS.get(tone, cls.TONE_INSTRUCTIONS["professional"])

    @classmethod
    def build_content_generation_prompt(
        cls,
        keyword: str,
        content_type: str,
        tone: str,
        language: Language = Language.ZH_CN,
        custom_instructions: Optional[str] = None,
        **kwargs
    ) -> str:
        """Build complete content generation prompt"""
        parts = []

        # Add content type instruction
        template = cls.get_content_template(content_type, language)
        parts.append(f"## 内容类型: {content_type}")
        parts.append(f"语气风格: {tone}")
        parts.append(f"关键词: {keyword}\n")

        # Add structure
        parts.append("## 内容结构")
        structure = template["structure"]
        for i, section in enumerate(structure, 1):
            parts.append(f"{i}. {section}")

        # Add tone instructions
        tone_inst = cls.get_tone_instructions(tone)
        parts.append("\n## 语气要求")
        parts.append(f"- 风格: {tone_inst['style']}")
        parts.append(f"- 语言: {tone_inst['language']}")
        parts.append(f"- 表达: {tone_inst['examples']}")

        # Add custom instructions
        if custom_instructions:
            parts.append("\n## 额外要求")
            parts.append(custom_instructions)

        # Add output format
        parts.append("\n## 输出格式")
        parts.append("```")
        parts.append("TITLE: [文章标题]")
        parts.append("")
        parts.append("[文章正文内容]")
        parts.append("```")

        return "\n".join(parts)

    @classmethod
    def build_keyword_analysis_prompt(
        cls,
        keyword: str,
        language: Language = Language.ZH_CN
    ) -> str:
        """Build prompt for keyword analysis"""
        if language == Language.ZH_CN:
            return f"""请分析关键词「{keyword}」的SEO价值。

分析维度：
1. 搜索意图：信息型、导航型、交易型、商业调查型
2. 竞争程度：低、中、高
3. 难度评分：0-100分
4. 搜索量估算
5. 相关关键词建议
6. 内容创作建议
7. 机会识别

请提供详细的分析结果。"""
        else:
            return f"""Please analyze the SEO value of the keyword '{keyword}'.

Analysis dimensions:
1. Search intent: informational, navigational, transactional, commercial investigation
2. Competition level: low, medium, high
3. Difficulty score: 0-100
4. Search volume estimate
5. Related keyword suggestions
6. Content creation suggestions
7. Opportunity identification

Please provide detailed analysis results."""

    @classmethod
    def build_affiliate_integration_prompt(
        cls,
        product_name: str,
        features: List[str],
        benefits: List[str],
        language: Language = Language.ZH_CN
    ) -> str:
        """Build prompt for affiliate product integration"""
        if language == Language.ZH_CN:
            return f"""请自然地将以下产品信息整合到内容中：

产品名称: {product_name}
核心功能: {', '.join(features[:5])}
用户利益: {', '.join(benefits[:5])}

要求：
1. 自然地提及产品，不显得生硬
2. 在适当的地方添加产品链接
3. 突出产品的独特价值
4. 保持内容的客观性和可信度"""
        else:
            return f"""Please naturally integrate the following product information into the content:

Product Name: {product_name}
Key Features: {', '.join(features[:5])}
User Benefits: {', '.join(benefits[:5])}

Requirements:
1. Mention the product naturally, not abruptly
2. Add product links where appropriate
3. Highlight the product's unique value
4. Maintain content objectivity and credibility"""


class PromptBuilder:
    """Dynamic prompt building utility"""

    def __init__(self, templates: PromptTemplates = None):
        self.templates = templates or PromptTemplates()
        self._variables: Dict[str, str] = {}

    def set_variable(self, name: str, value: str) -> "PromptBuilder":
        """Set a template variable"""
        self._variables[name] = value
        return self

    def set_variables(self, variables: Dict[str, str]) -> "PromptBuilder":
        """Set multiple template variables"""
        self._variables.update(variables)
        return self

    def build(
        self,
        template_name: str,
        language: Language = Language.ZH_CN
    ) -> str:
        """Build prompt from template"""
        # Get base template
        if template_name == "system":
            template = self.templates.get_system_prompt(language)
        elif template_name == "seo":
            template = self.templates.get_seo_prompt(language)
        else:
            raise ValueError(f"Unknown template: {template_name}")

        # Replace variables
        for var_name, var_value in self._variables.items():
            template = template.replace(f"{{{var_name}}}", var_value)

        return template

    def clear(self) -> "PromptBuilder":
        """Clear all variables"""
        self._variables.clear()
        return self


def get_prompt_builder() -> PromptBuilder:
    """Get a new prompt builder instance"""
    return PromptBuilder()


# Default templates export
default_templates = PromptTemplates()
