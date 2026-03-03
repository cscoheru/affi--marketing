"""
Affiliate Services Package
"""
from app.services.affiliate.link_injector import (
    AffiliateLinkInjector,
    AffiliateLinkManager,
    AffiliateLink,
    InjectionResult,
    LinkInjectionConfig,
    AffiliateNetwork,
    LinkType,
)

__all__ = [
    "AffiliateLinkInjector",
    "AffiliateLinkManager",
    "AffiliateLink",
    "InjectionResult",
    "LinkInjectionConfig",
    "AffiliateNetwork",
    "LinkType",
]
