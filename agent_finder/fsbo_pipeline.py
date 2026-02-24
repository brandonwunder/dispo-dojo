"""FSBO Pipeline — orchestrates concurrent FSBO scrapers, deduplicates, enriches."""

import asyncio
import logging
from typing import Callable, List, Optional

import httpx

from .fsbo_models import FSBOListing, FSBOSearchCriteria
from .scrapers.fsbo_com import FsboComScraper
from .scrapers.forsalebyowner_com import ForSaleByOwnerScraper
from .scrapers.zillow_fsbo import ZillowFSBOScraper
from .scrapers.realtor_fsbo import RealtorFSBOScraper
from .scrapers.craigslist_fsbo import CraigslistFSBOScraper
from .utils import normalize_address

logger = logging.getLogger("agent_finder.fsbo_pipeline")


def _normalize_for_dedup(listing: FSBOListing) -> str:
    """Create a normalized address string for deduplication."""
    return normalize_address(listing.address.split(",")[0])  # street line only


class FSBOPipeline:
    """
    Runs all 5 FSBO scrapers concurrently, merges results by address,
    and streams progress via a callback.

    Usage:
        pipeline = FSBOPipeline(progress_callback=cb)
        listings = await pipeline.run(criteria)
    """

    SCRAPERS_TOTAL = 5

    def __init__(self, progress_callback: Optional[Callable] = None):
        self.progress_callback = progress_callback

    async def run(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        """Run all scrapers concurrently and return deduplicated results."""
        all_listings: List[FSBOListing] = []
        scrapers_done = 0

        async def _emit(source: str, new_count: int, done: bool = False):
            nonlocal scrapers_done
            if done:
                scrapers_done += 1
            if self.progress_callback:
                await self.progress_callback({
                    "scrapers_done": scrapers_done,
                    "scrapers_total": self.SCRAPERS_TOTAL,
                    "listings_found": len(all_listings) + new_count,
                    "current_source": source,
                    "source_count": new_count,
                    "status": "complete" if scrapers_done == self.SCRAPERS_TOTAL else "running",
                })

        async with httpx.AsyncClient(
            http2=True,
            follow_redirects=True,
            timeout=45.0,
        ) as client:
            scrapers = [
                FsboComScraper(client),
                ForSaleByOwnerScraper(client),
                ZillowFSBOScraper(client),
                RealtorFSBOScraper(client),
                CraigslistFSBOScraper(client),
            ]

            async def _run_scraper(scraper):
                try:
                    results = await scraper.search_area(criteria)
                    await _emit(scraper.name, len(results), done=True)
                    return results
                except Exception as e:
                    logger.warning("Scraper %s raised: %s", scraper.name, e)
                    await _emit(scraper.name, 0, done=True)
                    return []

            results_per_scraper = await asyncio.gather(
                *[_run_scraper(s) for s in scrapers]
            )

        for scraper_results in results_per_scraper:
            all_listings.extend(scraper_results)

        merged = self._deduplicate_and_merge(all_listings)

        logger.info("FSBOPipeline: %d raw listings -> %d after dedup",
                    len(all_listings), len(merged))
        return merged

    def _deduplicate_and_merge(self, listings: List[FSBOListing]) -> List[FSBOListing]:
        """Group by normalized address, merge contact info from multiple sources."""
        seen: dict = {}

        for listing in listings:
            key = _normalize_for_dedup(listing)
            if not key or len(key) < 4:
                # Address too short to dedup reliably — keep as-is
                key = listing.listing_url or listing.address

            if key in seen:
                seen[key].merge(listing)
            else:
                seen[key] = listing

        return list(seen.values())
