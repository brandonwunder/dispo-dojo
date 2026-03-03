"""Pipeline orchestrator — 4-phase search for agent contact info.

Phase 1: Brokerage directory lookup (batch by franchise)
Phase 2: DuckDuckGo search (remaining agents)
Phase 3: Realtor.com profile search (still-missing agents)
Phase 4: Email pattern guessing (agents with phone but no email)

Key improvements over v2:
- Deduplication: same agent on multiple properties = search once
- Brokerage-first: ~45% of agents resolved via franchise directories
- Cross-job caching: previously found contacts skip all passes
- Chunked processing with gc.collect() for memory safety
"""

import gc
import logging
from pathlib import Path
from typing import Callable

import httpx

from .models import AgentRow, ContactResult, ContactStatus
from .cache import FileCache
from .searchers.brokerage_router import group_by_franchise
from .searchers import ddg_search
from .searchers.realtor_profile import search_batch as realtor_search_batch
from .searchers.email_guesser import guess_batch as email_guess_batch

# Brokerage scraper imports
from .brokerages.kw import KWBrokerageScraper
from .brokerages.remax import ReMaxBrokerageScraper
from .brokerages.exp_realty import ExpRealtyBrokerageScraper
from .brokerages.coldwell_banker import ColdwellBankerBrokerageScraper
from .brokerages.compass import CompassBrokerageScraper
from .brokerages.century21 import Century21BrokerageScraper
from .brokerages.bhhs import BHHSBrokerageScraper
from .brokerages.generic import GenericBrokerageScraper

logger = logging.getLogger("agent_finder.pipeline")

DATA_DIR = Path(__file__).parent / "data"

# Map franchise keys to scraper classes
SCRAPER_CLASSES: dict[str, type] = {
    "keller_williams": KWBrokerageScraper,
    "remax": ReMaxBrokerageScraper,
    "exp_realty": ExpRealtyBrokerageScraper,
    "coldwell_banker": ColdwellBankerBrokerageScraper,
    "compass": CompassBrokerageScraper,
    "century21": Century21BrokerageScraper,
    "bhhs": BHHSBrokerageScraper,
}

# Franchises handled by the generic scraper
GENERIC_FRANCHISES = {"homesmart", "realty_one", "exit_realty", "howard_hanna",
                      "weichert", "long_foster", "sothebys", "redfin"}

CHUNK_SIZE = 200


def _deduplicate(agents: list[AgentRow]) -> tuple[list[AgentRow], dict[str, list[int]]]:
    """Deduplicate agents by (name, brokerage). Returns unique agents
    and a map from dedup key -> list of original row indices."""
    seen: dict[str, AgentRow] = {}
    index_map: dict[str, list[int]] = {}

    for agent in agents:
        key = f"{agent.name.strip().lower()}|{agent.brokerage.strip().lower()}"
        if key not in seen:
            seen[key] = agent
            index_map[key] = [agent.row_index]
        else:
            index_map[key].append(agent.row_index)

    unique = list(seen.values())
    logger.info("Deduplicated: %d -> %d unique agents", len(agents), len(unique))
    return unique, index_map


async def run_pipeline(
    agents: list[AgentRow],
    progress_callback: Callable[[dict], None] | None = None,
) -> list[ContactResult]:
    """Run the 4-phase search pipeline on a list of agents."""
    total = len(agents)

    # Results indexed by row_index
    results: dict[int, ContactResult] = {a.row_index: ContactResult(agent=a) for a in agents}

    found_count = 0
    completed_count = 0
    cached_hits = 0
    counted_rows: set[int] = set()  # Track which rows have been counted

    def emit(current_agent: str, phase: str, phase_detail: str = ""):
        if progress_callback:
            progress_callback({
                "completed": completed_count,
                "total": total,
                "found": found_count,
                "not_found": completed_count - found_count,
                "current_agent": current_agent,
                "phase": phase,
                "phase_detail": phase_detail,
                "cached_hits": cached_hits,
            })

    def apply_result(r: ContactResult, dedup_key: str):
        """Apply a result to all original rows sharing this dedup key."""
        nonlocal found_count, completed_count
        row_indices = index_map.get(dedup_key, [r.agent.row_index])
        for idx in row_indices:
            original_agent = results[idx].agent
            was_found = results[idx].has_contact
            results[idx] = ContactResult(
                agent=original_agent,
                phone=r.phone,
                email=r.email,
                source=r.source,
                status=r.status,
                error_message=r.error_message,
            )
            if idx not in counted_rows:
                counted_rows.add(idx)
                completed_count += 1
                if r.has_contact:
                    found_count += 1
            elif r.has_contact and not was_found:
                # Previously counted as not-found, now found
                found_count += 1

    # ── Step 0: Deduplicate ──
    unique_agents, index_map = _deduplicate(agents)

    def _key(a: AgentRow) -> str:
        return f"{a.name.strip().lower()}|{a.brokerage.strip().lower()}"

    # ── Step 1: Cache check ──
    cache = FileCache(DATA_DIR / "cache.json")
    uncached: list[AgentRow] = []

    for agent in unique_agents:
        cached = cache.get(agent)
        if cached:
            apply_result(cached, _key(agent))
            cached_hits += 1
        else:
            uncached.append(agent)

    if cached_hits:
        logger.info("Cache hits: %d/%d", cached_hits, len(unique_agents))
        emit("Cache lookup complete", "cache")

    # ── Step 2: Group by franchise ──
    brokerage_groups, unmatched = group_by_franchise(uncached)

    # Track which unique agents still need searching
    still_need: set[int] = {a.row_index for a in uncached}

    async with httpx.AsyncClient(
        follow_redirects=True,
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    ) as client:

        # ── Phase 1: Brokerage directory lookups ──
        for franchise, franchise_agents in brokerage_groups.items():
            if not franchise_agents:
                continue

            emit(franchise_agents[0].name, "brokerage", franchise)
            logger.info("Phase 1: %s directory (%d agents)", franchise, len(franchise_agents))

            # Get the right scraper
            if franchise in SCRAPER_CLASSES:
                scraper = SCRAPER_CLASSES[franchise](client)
            elif franchise in GENERIC_FRANCHISES:
                scraper = GenericBrokerageScraper(client, franchise_key=franchise)
            else:
                # No scraper — agents fall through to Phase 2
                continue

            def on_brokerage_result(r: ContactResult, _franchise=franchise):
                key = _key(r.agent)
                apply_result(r, key)
                if r.has_contact:
                    cache.put(r)
                    still_need.discard(r.agent.row_index)
                emit(r.agent.name, "brokerage", _franchise)

            await scraper.search_batch(franchise_agents, on_result=on_brokerage_result)
            gc.collect()

        # ── Phase 2: DDG search for remaining agents ──
        ddg_agents = [a for a in uncached if a.row_index in still_need]

        if ddg_agents:
            logger.info("Phase 2: DDG search for %d agents", len(ddg_agents))
            emit(ddg_agents[0].name, "search")

            def on_ddg_result(r: ContactResult):
                key = _key(r.agent)
                apply_result(r, key)
                if r.has_contact:
                    cache.put(r)
                    still_need.discard(r.agent.row_index)
                emit(r.agent.name, "search")

            for chunk_start in range(0, len(ddg_agents), CHUNK_SIZE):
                chunk = ddg_agents[chunk_start : chunk_start + CHUNK_SIZE]
                await ddg_search.search_batch(chunk, on_result=on_ddg_result)
                gc.collect()

        # ── Phase 3: Realtor.com for still-missing agents ──
        realtor_agents = [a for a in uncached if a.row_index in still_need]

        if realtor_agents:
            logger.info("Phase 3: Realtor.com for %d agents", len(realtor_agents))
            emit(realtor_agents[0].name, "realtor")

            def on_realtor_result(r: ContactResult):
                key = _key(r.agent)
                if r.has_contact:
                    apply_result(r, key)
                    cache.put(r)
                    still_need.discard(r.agent.row_index)
                else:
                    apply_result(r, key)
                emit(r.agent.name, "realtor")

            for chunk_start in range(0, len(realtor_agents), CHUNK_SIZE):
                chunk = realtor_agents[chunk_start : chunk_start + CHUNK_SIZE]
                await realtor_search_batch(chunk, client, on_result=on_realtor_result)
                gc.collect()

        # ── Phase 4: Email guessing for agents with phone but no email ──
        need_email = [
            results[idx].agent
            for idx in results
            if results[idx].phone and not results[idx].email
        ]

        if need_email:
            logger.info("Phase 4: Email guessing for %d agents", len(need_email))
            emit(need_email[0].name, "email")

            def on_email_result(agent: AgentRow, email: str | None):
                if email:
                    r = results.get(agent.row_index)
                    if r:
                        r.email = email
                        if r.source:
                            r.source += "+email_guess"
                        else:
                            r.source = "email_guess"
                        r.status = ContactStatus.FOUND
                        cache.put(r)
                emit(agent.name, "email")

            await email_guess_batch(need_email, on_result=on_email_result)

    # ── Save cache ──
    cache.save()

    # ── Final cleanup ──
    for idx, r in results.items():
        if not r.has_contact and r.status != ContactStatus.ERROR:
            r.status = ContactStatus.NOT_FOUND

    # Build ordered result list matching original input order
    ordered = [results[a.row_index] for a in agents]

    final_found = sum(1 for r in ordered if r.has_contact)
    logger.info(
        "Pipeline complete: %d/%d found (%d%%) | cache hits: %d",
        final_found, total,
        round(final_found / total * 100) if total > 0 else 0,
        cached_hits,
    )

    return ordered
