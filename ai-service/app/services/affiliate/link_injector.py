"""
Affiliate Link Injection Service
"""
import re
import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
from loguru import logger

from app.config import settings


class AffiliateNetwork(Enum):
    """Supported affiliate networks"""
    AMAZON = "amazon"
    JD = "jd"
    TAOBAO = "taobao"
    TMALL = "tmall"
    PINDUODUO = "pinduoduo"
    VIPOUTLET = "vipoutlet"
    SUNING = "suning"
    CUSTOM = "custom"


class LinkType(Enum):
    """Types of affiliate links"""
    PRODUCT = "product"  # Direct product link
    CATEGORY = "category"  # Category browse link
    SEARCH = "search"  # Search results link
    SHORT = "short"  # Shortened link


@dataclass
class AffiliateLink:
    """Affiliate link configuration"""
    network: AffiliateNetwork
    link_type: LinkType
    url: str
    product_id: Optional[str] = None
    title: str = ""
    keywords: List[str] = field(default_factory=list)
    priority: int = 1  # Higher = more likely to be used
    max_usage_per_article: int = 3


@dataclass
class InjectionResult:
    """Result of link injection"""
    content: str
    links_injected: int
    links_used: List[Dict[str, str]]
    affiliate_networks: List[str]


@dataclass
class LinkInjectionConfig:
    """Configuration for link injection"""
    max_links_per_article: int = 5
    min_links_per_article: int = 2
    link_density: float = 0.01  # Links per word
    diversity_ratio: float = 0.6  # Ratio of different networks to use
    prefer_product_links: bool = True
    allow_consecutive_links: bool = False
    min_distance_between_links: int = 100  # Minimum characters between links


class AffiliateLinkInjector:
    """Inject affiliate links into content naturally"""

    # Network-specific URL patterns
    NETWORK_PATTERNS = {
        AffiliateNetwork.AMAZON: {
            "product": r"https?://([a-z0-9-]+\.)*amazon\.(com|co\.uk|de|fr|es|it|co\.jp)/[^/]+/dp/([A-Z0-9]+)",
            "search": r"https?://([a-z0-9-]+\.)*amazon\.(com|co\.uk|de|fr|es|it|co\.jp)/s\?.*k=([^&]+)",
        },
        AffiliateNetwork.JD: {
            "product": r"https?://item\.jd\.com/(\d+)\.html",
            "search": r"https?://search\.jd\.com/Search\?.*keyword=([^&]+)",
        },
        AffiliateNetwork.TAOBAO: {
            "product": r"https?://item\.taobao\.com/item\.htm\?.*id=(\d+)",
        },
        AffiliateNetwork.TMALL: {
            "product": r"https?://detail\.tmall\.com/item\.htm\?.*id=(\d+)",
        },
        AffiliateNetwork.PINDUODUO: {
            "product": r"https?://mobile\.yangkeduo\.com/goods\.html\?.*goods_id=(\d+)",
        },
    }

    # Link insertion templates
    ANCHOR_TEMPLATES = [
        "推荐的{keyword}",
        "这款{keyword}",
        "{keyword}产品",
        "优质的{keyword}",
        "{keyword}精选",
        "{keyword}推荐",
        "关于{keyword}",
        "{keyword}详情",
    ]

    # Context patterns where links make sense
    INSERTION_PATTERNS = [
        r"(.{50,300})(?:推荐|建议|选择|购买|使用|尝试)(.{10,100})",
        r"(.{50,300})(?:可以|能够|适合|适合于)(.{10,100})",
        r"(.{100,300})(?:例如|比如|包括)(.{10,100})",
        r"(.{100,300})，(.{10,100})",  # After comma
        r"(.{100,300})。(.{10,100})",  # After period
    ]

    def __init__(self, config: Optional[LinkInjectionConfig] = None):
        self.config = config or LinkInjectionConfig()
        self.link_registry: Dict[str, List[AffiliateLink]] = {}
        self.usage_stats: Dict[str, int] = {}

        # Initialize with default links from settings
        self._initialize_default_links()

    def _initialize_default_links(self):
        """Initialize default affiliate links from settings"""
        # Load from settings or database
        # This is a placeholder for actual link loading
        pass

    def register_link(self, link: AffiliateLink):
        """Register an affiliate link for injection"""
        network = link.network.value

        if network not in self.link_registry:
            self.link_registry[network] = []

        self.link_registry[network].append(link)

        # Sort by priority
        self.link_registry[network].sort(key=lambda x: x.priority, reverse=True)

        logger.info(f"Registered affiliate link: {link.title} ({network})")

    def register_links_batch(self, links: List[AffiliateLink]):
        """Register multiple affiliate links"""
        for link in links:
            self.register_link(link)

    def inject_links(
        self,
        content: str,
        keywords: List[str],
        context: Optional[Dict] = None
    ) -> InjectionResult:
        """
        Inject affiliate links into content

        Args:
            content: The content to inject links into
            keywords: Keywords relevant to the content
            context: Optional context (category, tone, audience)

        Returns:
            InjectionResult with modified content and metadata
        """
        logger.info(f"Starting link injection for {len(keywords)} keywords")

        # Find relevant links
        relevant_links = self._find_relevant_links(keywords, context)

        if not relevant_links:
            logger.warning("No relevant links found for injection")
            return InjectionResult(
                content=content,
                links_injected=0,
                links_used=[],
                affiliate_networks=[],
            )

        # Determine optimal link positions
        positions = self._find_insertion_positions(content, relevant_links)

        # Inject links at positions
        modified_content = content
        links_injected = []
        injection_points = sorted(positions.items(), key=lambda x: x[0], reverse=True)

        for position, link in injection_points:
            anchor_text = self._generate_anchor_text(link, keywords)
            link_html = f'<a href="{link.url}" rel="nofollow noopener" target="_blank" data-affiliate="{link.network.value}">{anchor_text}</a>'

            # Insert the link
            modified_content = (
                modified_content[:position] +
                link_html +
                modified_content[position:]
            )

            links_injected.append({
                "network": link.network.value,
                "type": link.link_type.value,
                "title": link.title,
                "url": link.url,
                "anchor": anchor_text,
                "position": position,
            })

        # Get unique networks used
        networks_used = list(set(l["network"] for l in links_injected))

        logger.info(f"Injected {len(links_injected)} links from {len(networks_used)} networks")

        return InjectionResult(
            content=modified_content,
            links_injected=len(links_injected),
            links_used=links_injected,
            affiliate_networks=networks_used,
        )

    def _find_relevant_links(
        self,
        keywords: List[str],
        context: Optional[Dict]
    ) -> List[AffiliateLink]:
        """Find relevant affiliate links for keywords"""
        relevant_links = []
        keywords_lower = [kw.lower() for kw in keywords]

        for network, links in self.link_registry.items():
            for link in links:
                # Check keyword match
                if link.keywords:
                    for kw in link.keywords:
                        if kw.lower() in keywords_lower:
                            relevant_links.append(link)
                            break
                else:
                    # No keywords specified, use title matching
                    title_lower = link.title.lower()
                    if any(kw in title_lower for kw in keywords_lower):
                        relevant_links.append(link)

        # Sort by priority and limit
        relevant_links.sort(key=lambda x: x.priority, reverse=True)

        # Apply diversity: limit links per network
        diversified_links = []
        network_counts: Dict[str, int] = {}

        for link in relevant_links:
            network = link.network.value
            count = network_counts.get(network, 0)

            # Calculate max links per network based on diversity ratio
            max_per_network = max(1, int(self.config.max_links_per_article * (1 - self.config.diversity_ratio)))

            if count < max_per_network:
                diversified_links.append(link)
                network_counts[network] = count + 1

            if len(diversified_links) >= self.config.max_links_per_article * 2:
                break

        return diversified_links

    def _find_insertion_positions(
        self,
        content: str,
        links: List[AffiliateLink]
    ) -> Dict[int, AffiliateLink]:
        """Find optimal positions for link insertion"""
        positions = {}
        link_index = 0
        last_position = 0
        used_keywords = set()

        # Find candidate positions using regex patterns
        for pattern in self.INSERTION_PATTERNS:
            for match in re.finditer(pattern, content):
                position = match.end() - len(match.group(2)) // 2

                # Check minimum distance
                if position - last_position < self.config.min_distance_between_links:
                    continue

                # Check if we've hit max links
                if len(positions) >= self.config.max_links_per_article:
                    break

                # Get next suitable link
                link = self._get_next_link(links, link_index, used_keywords)
                if not link:
                    break

                positions[position] = link
                last_position = position
                link_index += 1

                # Add link keywords to used set
                used_keywords.update(link.keywords)

                # Shuffle links for variety
                if link_index >= len(links):
                    link_index = 0
                    random.shuffle(links)

        return positions

    def _get_next_link(
        self,
        links: List[AffiliateLink],
        start_index: int,
        used_keywords: set
    ) -> Optional[AffiliateLink]:
        """Get next suitable link for injection"""
        for i in range(start_index, len(links)):
            link = links[i]

            # Check if this link has unused keywords
            if link.keywords and not any(kw in used_keywords for kw in link.keywords):
                return link

            # If no keyword restriction, just return the link
            if not link.keywords:
                return link

        return None

    def _generate_anchor_text(self, link: AffiliateLink, keywords: List[str]) -> str:
        """Generate natural anchor text for the link"""
        # Prefer link's predefined keywords
        if link.keywords:
            keyword = link.keywords[0]
        else:
            # Use content keyword that best matches link title
            keyword = self._find_best_matching_keyword(link.title, keywords)

        # Use a template
        template = random.choice(self.ANCHOR_TEMPLATES)
        anchor = template.format(keyword=keyword)

        return anchor

    def _find_best_matching_keyword(self, title: str, keywords: List[str]) -> str:
        """Find the keyword that best matches the link title"""
        title_lower = title.lower()

        for kw in keywords:
            if kw.lower() in title_lower:
                return kw

        # Default to first keyword
        return keywords[0] if keywords else "产品"

    def extract_existing_links(self, content: str) -> List[Dict[str, str]]:
        """Extract existing affiliate links from content"""
        links = []

        for network, patterns in self.NETWORK_PATTERNS.items():
            for link_type, pattern in patterns.items():
                for match in re.finditer(pattern, content):
                    links.append({
                        "network": network.value,
                        "type": link_type,
                        "url": match.group(0),
                        "position": match.start(),
                    })

        return links

    def validate_link(self, url: str, network: AffiliateNetwork) -> bool:
        """Validate affiliate link format"""
        if network not in self.NETWORK_PATTERNS:
            return True  # Unknown network, assume valid

        patterns = self.NETWORK_PATTERNS[network]
        for link_type, pattern in patterns.values():
            if re.match(pattern, url):
                return True

        return False

    def generate_tracking_link(
        self,
        base_url: str,
        affiliate_id: str,
        network: AffiliateNetwork,
        params: Optional[Dict[str, str]] = None
    ) -> str:
        """Generate tracking link with affiliate parameters"""
        tracking_url = base_url

        # Network-specific tracking parameters
        if network == AffiliateNetwork.AMAZON:
            tracking_url += f"?tag={affiliate_id}"
        elif network == AffiliateNetwork.JD:
            tracking_url += f"?utm_source=affiliate&utm_campaign={affiliate_id}"
        elif network in [AffiliateNetwork.TAOBAO, AffiliateNetwork.TMALL]:
            tracking_url += f"&mm_eid={affiliate_id}"

        # Add custom parameters
        if params:
            for key, value in params.items():
                separator = "&" if "?" in tracking_url else "?"
                tracking_url += f"{separator}{key}={value}"

        return tracking_url

    def get_usage_statistics(self) -> Dict[str, any]:
        """Get link usage statistics"""
        return {
            "total_links": sum(len(links) for links in self.link_registry.values()),
            "links_by_network": {
                network: len(links)
                for network, links in self.link_registry.items()
            },
            "usage_stats": self.usage_stats,
        }

    def optimize_for_seo(self, content: str) -> str:
        """Optimize affiliate links for SEO"""
        # Add rel="nofollow" to all external links
        content = re.sub(
            r'<a\s+(href="https?://[^"]+")([^>]*?)>',
            lambda m: f'<a {m.group(1)} rel="nofollow noopener"{m.group(2)}>' if 'rel=' not in m.group(2) else m.group(0),
            content
        )

        return content


class AffiliateLinkManager:
    """Manage affiliate link lifecycle and performance"""

    def __init__(self):
        self.injector = AffiliateLinkInjector()
        self.link_performance: Dict[str, Dict] = {}

    def track_link_click(self, link_id: str, context: Dict):
        """Track affiliate link click"""
        if link_id not in self.link_performance:
            self.link_performance[link_id] = {
                "clicks": 0,
                "conversions": 0,
                "revenue": 0.0,
                "last_clicked": None,
            }

        self.link_performance[link_id]["clicks"] += 1
        self.link_performance[link_id]["last_clicked"] = context.get("timestamp")

        logger.info(f"Tracked click for link {link_id}")

    def track_conversion(self, link_id: str, amount: float):
        """Track affiliate conversion"""
        if link_id in self.link_performance:
            self.link_performance[link_id]["conversions"] += 1
            self.link_performance[link_id]["revenue"] += amount

            logger.info(f"Tracked conversion for link {link_id}: ${amount}")

    def get_top_performing_links(self, limit: int = 10) -> List[Dict]:
        """Get top performing affiliate links"""
        sorted_links = sorted(
            self.link_performance.items(),
            key=lambda x: x[1]["revenue"],
            reverse=True
        )

        return [
            {"link_id": link_id, **stats}
            for link_id, stats in sorted_links[:limit]
        ]

    def optimize_link_selection(
        self,
        available_links: List[AffiliateLink],
        context: Dict
    ) -> List[AffiliateLink]:
        """Optimize link selection based on performance"""
        # Sort by performance (revenue per click)
        scored_links = []

        for link in available_links:
            link_id = link.url  # Use URL as ID

            if link_id in self.link_performance:
                stats = self.link_performance[link_id]
                if stats["clicks"] > 0:
                    score = stats["revenue"] / stats["clicks"]
                else:
                    score = link.priority  # Default to priority
            else:
                score = link.priority

            scored_links.append((link, score))

        # Sort by score and return top links
        scored_links.sort(key=lambda x: x[1], reverse=True)

        return [link for link, score in scored_links]
