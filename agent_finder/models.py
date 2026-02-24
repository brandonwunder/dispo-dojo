"""Data models for Agent Finder."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class LookupStatus(str, Enum):
    FOUND = "found"
    PARTIAL = "partial"          # Found agent name but missing contact info
    NOT_FOUND = "not_found"
    ERROR = "error"
    CACHED = "cached"
    PENDING = "pending"


@dataclass
class Property:
    """A property address to look up."""
    raw_address: str
    address_line: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    # Original row index for merging back
    row_index: int = 0

    @property
    def normalized(self) -> str:
        """Return a normalized full address string."""
        parts = [self.address_line, self.city, self.state, self.zip_code]
        return ", ".join(p for p in parts if p).strip()

    @property
    def search_query(self) -> str:
        """Return a normalized string suitable for search queries."""
        from .utils import normalize_address
        raw = self.normalized or self.raw_address
        return normalize_address(raw)


@dataclass
class AgentInfo:
    """Listing agent information found for a property."""
    agent_name: str = ""
    brokerage: str = ""
    phone: str = ""
    email: str = ""
    source: str = ""             # Which scraper found this data
    listing_url: str = ""        # URL of the listing where data was found
    list_date: str = ""          # Date listing was posted (ISO or display format)
    days_on_market: str = ""     # Days on market (computed or from source)
    listing_price: str = ""      # Listing price (e.g. "$450,000")

    @property
    def has_contact_info(self) -> bool:
        return bool(self.phone or self.email)

    @property
    def is_complete(self) -> bool:
        return bool(self.agent_name and (self.phone or self.email))

    def merge(self, other: "AgentInfo") -> "AgentInfo":
        """Merge another AgentInfo, filling in missing fields."""
        return AgentInfo(
            agent_name=self.agent_name or other.agent_name,
            brokerage=self.brokerage or other.brokerage,
            phone=self.phone or other.phone,
            email=self.email or other.email,
            source=f"{self.source}+{other.source}" if other.source else self.source,
            listing_url=self.listing_url or other.listing_url,
            list_date=self.list_date or other.list_date,
            days_on_market=self.days_on_market or other.days_on_market,
            listing_price=self.listing_price or other.listing_price,
        )


@dataclass
class ScrapeResult:
    """Result of a scrape attempt for a single property."""
    property: Property
    agent_info: Optional[AgentInfo] = None
    status: LookupStatus = LookupStatus.PENDING
    sources_tried: list[str] = field(default_factory=list)
    error_message: str = ""
    confidence: float = 0.0
    verified: bool = False
    sources_matched: list[str] = field(default_factory=list)

    @property
    def found(self) -> bool:
        return self.status in (LookupStatus.FOUND, LookupStatus.PARTIAL, LookupStatus.CACHED)
