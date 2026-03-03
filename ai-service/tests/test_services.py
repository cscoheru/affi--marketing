"""
Tests for AI Service
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch

from app.services.manager import AIServiceManager, ModelTier, GenerationRequest
from app.services.seo import KeywordAnalyzer, ContentGenerator
from app.services.affiliate import AffiliateLinkInjector, AffiliateNetwork, AffiliateLink, LinkType


class TestKeywordAnalyzer:
    """Test keyword analyzer service"""

    @pytest.fixture
    def analyzer(self):
        return KeywordAnalyzer()

    @pytest.mark.asyncio
    async def test_analyze_keyword(self, analyzer):
        """Test keyword analysis"""
        result = await analyzer.analyze("how to learn python")

        assert result.keyword == "how to learn python"
        assert result.search_intent == "informational"
        assert result.difficulty_score >= 0
        assert result.difficulty_score <= 100
        assert len(result.related_keywords) > 0
        assert len(result.suggestions) > 0

    @pytest.mark.asyncio
    async def test_transactional_intent(self, analyzer):
        """Test transactional intent detection"""
        result = await analyzer.analyze("buy python books")

        assert result.search_intent == "transactional"

    @pytest.mark.asyncio
    async def test_chinese_keyword(self, analyzer):
        """Test Chinese keyword analysis"""
        result = await analyzer.analyze("如何学习Python")

        assert result.search_intent == "informational"


class TestAffiliateLinkInjector:
    """Test affiliate link injection"""

    @pytest.fixture
    def injector(self):
        return AffiliateLinkInjector()

    def test_register_link(self, injector):
        """Test link registration"""
        link = AffiliateLink(
            network=AffiliateNetwork.AMAZON,
            link_type=LinkType.PRODUCT,
            url="https://amazon.com/dp/B123456",
            title="Python Programming Book",
            keywords=["python", "programming"],
            priority=5,
        )

        injector.register_link(link)

        stats = injector.get_usage_statistics()
        assert stats["total_links"] == 1

    def test_inject_links(self, injector):
        """Test link injection"""
        # Register test link
        link = AffiliateLink(
            network=AffiliateNetwork.AMAZON,
            link_type=LinkType.PRODUCT,
            url="https://amazon.com/dp/B123456",
            title="Python Book",
            keywords=["python"],
            priority=5,
        )
        injector.register_link(link)

        content = "Python is a great programming language. You should learn Python."
        result = injector.inject_links(content, ["python"])

        assert result.links_injected > 0
        assert "python" in result.content.lower()
        assert len(result.affiliate_networks) > 0


class TestAIServiceManager:
    """Test AI service manager"""

    @pytest.fixture
    def manager(self):
        return AIServiceManager()

    def test_model_registry(self, manager):
        """Test model registry initialization"""
        assert len(manager.model_registry) > 0

    def test_tier_selection(self, manager):
        """Test tier-based model selection"""
        # Test economy tier
        economy_models = manager.get_models_for_tier(ModelTier.ECONOMY)
        assert len(economy_models) > 0

        # Test standard tier
        standard_models = manager.get_models_for_tier(ModelTier.STANDARD)
        assert len(standard_models) > 0

    def test_cost_estimation(self, manager):
        """Test cost estimation"""
        request = GenerationRequest(
            prompt="test prompt",
            tier=ModelTier.STANDARD,
        )

        estimated_cost = manager.estimate_cost(request, 1000, 500)
        assert estimated_cost > 0

    @pytest.mark.asyncio
    async def test_health_check(self, manager):
        """Test health check"""
        # This would require actual API keys, so we skip it
        # In real tests, use mocking
        pass


class TestContentGenerator:
    """Test content generator"""

    @pytest.fixture
    def generator(self):
        mock_manager = Mock()
        mock_manager.generate_content = AsyncMock(
            return_value=Mock(
                content="TITLE: Test\n\nThis is test content.",
                input_tokens=100,
                output_tokens=200,
                cost=0.01,
                model="qwen-turbo",
            )
        )
        return ContentGenerator(mock_manager)

    @pytest.mark.asyncio
    async def test_generate_content(self, generator):
        """Test content generation"""
        from app.services.seo import ContentGenerationRequest

        request = ContentGenerationRequest(
            keyword="python programming",
            content_type="article",
            target_length=500,
        )

        result = await generator.generate(request)

        assert result.title
        assert result.content
        assert result.word_count > 0


# Test utilities
def test_helpers():
    """Test utility functions"""
    from app.utils.helpers import (
        sanitize_filename,
        count_words,
        format_cost,
        truncate_text,
    )

    # Test filename sanitization
    assert sanitize_filename("test/file:name.txt") == "testfilename.txt"

    # Test word counting
    assert count_words("Hello world 你好") > 0

    # Test cost formatting
    assert "$" in format_cost(0.5)

    # Test text truncation
    assert truncate_text("long text", 5) == "long..."



if __name__ == "__main__":
    pytest.main([__file__, "-v"])
