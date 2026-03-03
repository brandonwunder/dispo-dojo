"""Routes agents to the correct franchise brokerage scraper.

Normalizes brokerage names and groups agents by franchise so each
franchise scraper can batch-search its own agents.
"""

import logging
import re
from collections import defaultdict

from ..models import AgentRow

logger = logging.getLogger("agent_finder.brokerage_router")

# Franchise matching patterns — ordered by frequency in real data.
# Each key maps to a list of substrings that identify the franchise.
FRANCHISE_PATTERNS: dict[str, list[str]] = {
    "keller_williams": [
        "keller williams", "kw realty", "kw ",
    ],
    "remax": [
        "re/max", "remax", "re max",
    ],
    "exp_realty": [
        "exp realty", "exprealty", "exp real",
    ],
    "real_broker": [
        "real broker", "real brokerage", "the real brokerage",
    ],
    "coldwell_banker": [
        "coldwell banker", "cb realty", "coldwell",
    ],
    "compass": [
        "compass re", "compass ",
    ],
    "century21": [
        "century 21", "century21",
    ],
    "bhhs": [
        "berkshire hathaway", "bhhs",
    ],
    "homesmart": [
        "homesmart",
    ],
    "realty_one": [
        "realty one group", "realty one",
    ],
    "exit_realty": [
        "exit realty", "exit real estate",
    ],
    "howard_hanna": [
        "howard hanna",
    ],
    "weichert": [
        "weichert",
    ],
    "long_foster": [
        "long & foster", "long and foster",
    ],
    "sothebys": [
        "sotheby",
    ],
    "redfin": [
        "redfin",
    ],
}


def identify_franchise(brokerage: str) -> str | None:
    """Return the franchise key for a brokerage name, or None."""
    if not brokerage:
        return None
    normalized = brokerage.lower().strip()
    # Special case: "Compass" alone (not "Compass Re Texas")
    if normalized == "compass":
        return "compass"
    for franchise, patterns in FRANCHISE_PATTERNS.items():
        for pattern in patterns:
            if pattern in normalized:
                return franchise
    return None


def group_by_franchise(
    agents: list[AgentRow],
) -> tuple[dict[str, list[AgentRow]], list[AgentRow]]:
    """Group agents by franchise. Returns (grouped, unmatched)."""
    groups: dict[str, list[AgentRow]] = defaultdict(list)
    unmatched: list[AgentRow] = []

    for agent in agents:
        franchise = identify_franchise(agent.brokerage)
        if franchise:
            groups[franchise].append(agent)
        else:
            unmatched.append(agent)

    total_matched = sum(len(v) for v in groups.values())
    logger.info(
        "Brokerage routing: %d matched (%d franchises), %d unmatched",
        total_matched, len(groups), len(unmatched),
    )
    for franchise, agents_list in sorted(groups.items(), key=lambda x: -len(x[1])):
        logger.info("  %s: %d agents", franchise, len(agents_list))

    return dict(groups), unmatched
