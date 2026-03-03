"""
Keyword Analyzer Service
"""
import re
from dataclasses import dataclass
from typing import Dict, List, Optional
from loguru import logger


@dataclass
class KeywordAnalysis:
    """Result of keyword analysis"""
    keyword: str
    search_volume: int
    competition_level: str
    difficulty_score: float  # 0-100
    search_intent: str  # informational, navigational, transactional, commercial investigation
    related_keywords: List[str]
    suggestions: List[str]
    opportunities: List[str]


@dataclass
class ContentBrief:
    """Content generation brief"""
    primary_keyword: str
    secondary_keywords: List[str]
    target_intent: str
    target_audience: str
    content_type: str  # article, review, comparison, guide
    tone: str
    length_hint: int
    key_points: List[str]
    call_to_action: Optional[str]


class KeywordAnalyzer:
    """Analyze keywords for SEO content generation"""

    def __init__(self):
        # Search intent patterns
        self.intent_patterns = {
            "informational": [
                r"\bhow to\b",
                r"\bwhat is\b",
                r"\bwhy\b",
                r"\bguide\b",
                r"\btutorial\b",
                r"\btips\b",
                r"\b最佳",
                r"\b如何",
                r"\b什么是",
                r"\b教程",
                r"\b指南",
            ],
            "navigational": [
                r"\blogin\b",
                r"\bregister\b",
                r"\bofficial site\b",
                r"\b官网",
                r"\b官方网站",
                r"\b登录",
                r"\b注册",
            ],
            "transactional": [
                r"\bbuy\b",
                r"\bpurchase\b",
                r"\border\b",
                r"\bprice\b",
                r"\bcheap\b",
                r"\bdiscount\b",
                r"\bdeal\b",
                r"\b购买",
                r"\b订单",
                r"\b价格",
                r"\b优惠",
                r"\b折扣",
            ],
            "commercial_investigation": [
                r"\bbest\b",
                r"\bcompare\b",
                r"\bvs\b",
                r"\breview\b",
                r"\btop\b",
                r"\b推荐",
                r"\b最好",
                r"\b比较",
                r"\b评测",
            ],
        }

        # Competition indicators
        self.competition_indicators = [
            "forum",
            "reddit",
            "quora",
            "stack overflow",
            "知乎",
            "百度知道",
            "豆瓣",
        ]

    async def analyze(self, keyword: str, additional_context: Optional[Dict] = None) -> KeywordAnalysis:
        """
        Analyze a keyword for SEO opportunities

        Args:
            keyword: The keyword to analyze
            additional_context: Optional additional data (search volume, etc.)

        Returns:
            KeywordAnalysis with detailed analysis
        """
        logger.info(f"Analyzing keyword: {keyword}")

        # Determine search intent
        intent = self._determine_intent(keyword)

        # Calculate difficulty score (0-100, higher = harder)
        difficulty = self._calculate_difficulty(keyword)

        # Determine competition level
        competition = self._determine_competition(difficulty)

        # Estimate search volume (mock - would use API in production)
        search_volume = self._estimate_search_volume(keyword, intent)

        # Generate related keywords
        related_keywords = await self._generate_related_keywords(keyword)

        # Generate opportunities
        opportunities = self._identify_opportunities(keyword, intent, related_keywords)

        # Generate content suggestions
        suggestions = self._generate_content_suggestions(keyword, intent)

        return KeywordAnalysis(
            keyword=keyword,
            search_volume=search_volume,
            competition_level=competition,
            difficulty_score=difficulty,
            search_intent=intent,
            related_keywords=related_keywords,
            suggestions=suggestions,
            opportunities=opportunities,
        )

    def _determine_intent(self, keyword: str) -> str:
        """Determine search intent from keyword"""
        keyword_lower = keyword.lower()

        max_matches = 0
        detected_intent = "informational"  # Default

        for intent, patterns in self.intent_patterns.items():
            matches = sum(1 for pattern in patterns if re.search(pattern, keyword_lower, re.IGNORECASE))
            if matches > max_matches:
                max_matches = matches
                detected_intent = intent

        return detected_intent

    def _calculate_difficulty(self, keyword: str) -> float:
        """Calculate keyword difficulty score (0-100)"""
        score = 20.0  # Base score

        # Length factor (longer keywords usually easier)
        word_count = len(keyword.split())
        score -= word_count * 2

        # Numbers and years indicate specific, easier
        if re.search(r'\d{4}', keyword):
            score -= 10
        elif re.search(r'\d+', keyword):
            score -= 5

        # Question words indicate informational, easier
        if re.search(r'\b(how|what|why|where|when|who|如何|什么|为什么)\b', keyword, re.IGNORECASE):
            score -= 15

        # Commercial words indicate higher difficulty
        commercial_words = [
            "best", "buy", "cheap", "price", "discount", "deal",
            "最好", "购买", "价格", "优惠", "折扣"
        ]
        if any(word in keyword.lower() for word in commercial_words):
            score += 15

        # Brand names increase difficulty
        # (This would need a brand database in production)

        return max(0, min(100, score))

    def _determine_competition(self, difficulty: float) -> str:
        """Determine competition level from difficulty score"""
        if difficulty < 30:
            return "LOW"
        elif difficulty < 60:
            return "MEDIUM"
        else:
            return "HIGH"

    def _estimate_search_volume(self, keyword: str, intent: str) -> int:
        """
        Estimate search volume (mock implementation)

        In production, this would call APIs like:
        - Google Keyword Planner
        - Ahrefs
        - SEMrush
        """
        # Rough estimation based on intent
        base_volumes = {
            "informational": 1000,
            "navigational": 5000,
            "transactional": 500,
            "commercial_investigation": 2000,
        }

        base = base_volumes.get(intent, 1000)

        # Add some randomness based on keyword hash
        keyword_hash = hash(keyword) % 100
        factor = 0.5 + (keyword_hash / 200)

        return int(base * factor)

    async def _generate_related_keywords(self, keyword: str) -> List[str]:
        """Generate related keywords (mock - would use API in production)"""
        # Extract key terms
        words = keyword.split()
        related = []

        # Add variations
        if len(words) == 1:
            # Single word - add modifiers
            modifiers = ["best", "top", "guide", "tutorial", "2024", "cheap", "review"]
            for mod in modifiers[:3]:
                related.append(f"{mod} {keyword}")
        else:
            # Multi-word - create variations
            related.append(keyword.replace("best", "top"))
            related.append(keyword.replace("guide", "tutorial"))

        return related[:5]

    def _identify_opportunities(self, keyword: str, intent: str, related: List[str]) -> List[str]:
        """Identify content opportunities"""
        opportunities = []

        if intent == "informational":
            opportunities.append(f"Comprehensive guide: {keyword}")
            opportunities.append(f"Step-by-step tutorial for {keyword}")

        elif intent == "transactional":
            opportunities.append(f"Product comparison: {keyword}")
            opportunities.append(f"Best deals for {keyword}")

        elif intent == "commercial_investigation":
            opportunities.append(f"Review: Top {keyword} options")
            opportunities.append(f"Comparison: {keyword} vs alternatives")

        return opportunities

    def _generate_content_suggestions(self, keyword: str, intent: str) -> List[str]:
        """Generate content title suggestions"""
        suggestions = []

        if intent == "informational":
            suggestions.append(f"Complete Guide to {keyword}")
            suggestions.append(f"{keyword} 101: Everything You Need to Know")
            suggestions.append(f"How to Master {keyword} in 2024")

        elif intent == "transactional":
            suggestions.append(f"Best {keyword} Deals: Updated 2024")
            suggestions.append(f"Where to Buy {keyword}: Price Comparison")
            suggestions.append(f"{keyword} Discount Codes and Coupons")

        elif intent == "commercial_investigation":
            suggestions.append(f"{keyword} Review: Top Picks and Recommendations")
            suggestions.append(f"{keyword} vs Competitors: Which is Better?")
            suggestions.append(f"Is {keyword} Worth It? Honest Review")

        return suggestions

    async def create_content_brief(
        self,
        keyword: KeywordAnalysis,
        content_type: str = "article",
        target_length: int = 1000,
        tone: str = "professional"
    ) -> ContentBrief:
        """Create a content brief from keyword analysis"""

        # Extract key points from keyword
        key_points = []
        if keyword.search_intent == "informational":
            key_points = [
                f"Introduction to {keyword.keyword}",
                f"Benefits and importance of {keyword.keyword}",
                f"Step-by-step process for {keyword.keyword}",
                f"Common mistakes to avoid when dealing with {keyword.keyword}",
            ]
        elif keyword.search_intent == "transactional":
            key_points = [
                f"Top {keyword.keyword} products available",
                f"Price comparison for {keyword.keyword}",
                f"Features to consider when buying {keyword.keyword}",
                f"Where to find the best deals for {keyword.keyword}",
            ]

        # Determine target audience based on intent
        audience_map = {
            "informational": "Beginners and individuals seeking knowledge",
            "navigational": "Users looking for specific websites or apps",
            "transactional": "Ready-to-buy consumers",
            "commercial_investigation": "Comparison shoppers and researchers",
        }

        return ContentBrief(
            primary_keyword=keyword.keyword,
            secondary_keywords=keyword.related_keywords[:3],
            target_intent=keyword.search_intent,
            target_audience=audience_map.get(keyword.search_intent, "General audience"),
            content_type=content_type,
            tone=tone,
            length_hint=target_length,
            key_points=key_points,
            call_to_action="Learn more" if keyword.search_intent == "informational" else "Buy now",
        )
