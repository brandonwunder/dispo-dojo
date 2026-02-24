"""Configuration for Agent Finder scraping pipeline."""

from dataclasses import dataclass, field


@dataclass
class SourceConfig:
    """Rate limiting and concurrency settings for a single source."""
    name: str
    enabled: bool = True
    requests_per_second: float = 1.0
    max_concurrent: int = 5
    max_retries: int = 3
    timeout_seconds: float = 30.0


# Per-source configurations
REDFIN = SourceConfig(
    name="redfin",
    requests_per_second=2.0,
    max_concurrent=5,
    max_retries=3,
    timeout_seconds=30.0,
)

HOMEHARVEST = SourceConfig(
    name="homeharvest",
    requests_per_second=1.0,
    max_concurrent=3,
    max_retries=2,
    timeout_seconds=45.0,
)

REALTOR = SourceConfig(
    name="realtor",
    requests_per_second=0.5,
    max_concurrent=3,
    max_retries=2,
    timeout_seconds=30.0,
)

ZILLOW = SourceConfig(
    name="zillow",
    requests_per_second=0.5,
    max_concurrent=2,
    max_retries=2,
    timeout_seconds=30.0,
)

GOOGLE_SEARCH = SourceConfig(
    name="google_search",
    enabled=False,  # Requires API key to enable
    requests_per_second=0.2,
    max_concurrent=2,
    max_retries=1,
    timeout_seconds=15.0,
)

# Ordered list of sources to try (waterfall priority)
SOURCE_PRIORITY = [REDFIN, HOMEHARVEST, REALTOR, ZILLOW, GOOGLE_SEARCH]

# Global pipeline settings
MAX_GLOBAL_CONCURRENCY = 50
CACHE_TTL_DAYS = 7
CACHE_DB_PATH = "agent_finder_cache.db"

# Redfin API base
REDFIN_BASE_URL = "https://www.redfin.com"
REDFIN_STINGRAY_BASE = "https://www.redfin.com/stingray"

# Realtor.com base
REALTOR_BASE_URL = "https://www.realtor.com"

# Google Custom Search
GOOGLE_CSE_URL = "https://www.googleapis.com/customsearch/v1"
