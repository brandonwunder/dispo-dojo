"""Async pipeline orchestrator - coordinates scrapers, caching, and enrichment."""

import asyncio
import logging
from typing import Callable, Optional

import httpx
from rich.progress import (
    Progress, SpinnerColumn, BarColumn, TextColumn,
    TimeRemainingColumn, MofNCompleteColumn,
)
from rich.console import Console

from .cache import ScrapeCache
from .config import (
    SOURCE_PRIORITY, MAX_GLOBAL_CONCURRENCY, CACHE_DB_PATH, CACHE_TTL_DAYS,
)
from .enrichment import enrich_contact_info
from .models import AgentInfo, LookupStatus, Property, ScrapeResult
from .scrapers.base import BaseScraper
from .scrapers.redfin import RedfinScraper
from .scrapers.homeharvest_scraper import HomeHarvestScraper
from .scrapers.realtor import RealtorScraper
from .scrapers.google_search import GoogleSearchScraper

logger = logging.getLogger("agent_finder.pipeline")
console = Console()


class AgentFinderPipeline:
    """
    Main pipeline that orchestrates the scraping process.

    Merge-based waterfall: tries each source in priority order,
    merging results across sources for better coverage and verification.
    """

    def __init__(
        self,
        sources: Optional[list[str]] = None,
        google_api_key: str = "",
        google_cse_id: str = "",
        max_concurrent: int = MAX_GLOBAL_CONCURRENCY,
        cache_path: str = CACHE_DB_PATH,
        cache_ttl_days: int = CACHE_TTL_DAYS,
        enrich: bool = True,
        progress_callback: Optional[Callable] = None,
    ):
        self.enabled_sources = sources or ["redfin", "homeharvest", "realtor", "zillow"]
        self.google_api_key = google_api_key
        self.google_cse_id = google_cse_id
        self.max_concurrent = max_concurrent
        self.cache = ScrapeCache(db_path=cache_path, ttl_days=cache_ttl_days)
        self.enrich = enrich
        self.global_semaphore = asyncio.Semaphore(max_concurrent)
        self.progress_callback = progress_callback

        # Stats
        self._total = 0
        self._cached = 0
        self._found = 0
        self._partial = 0
        self._not_found = 0
        self._errors = 0

        # Circuit breaker state per scraper
        self._consecutive_failures: dict[str, int] = {}
        self._circuit_open: dict[str, bool] = {}
        self._circuit_breaker_threshold = 10

    async def run(self, properties: list[Property]) -> list[ScrapeResult]:
        """
        Run the full pipeline for a list of properties.

        Returns a ScrapeResult for each property (in the same order).
        """
        self._total = len(properties)
        await self.cache.initialize()

        # Check cache for already-resolved addresses
        all_addresses = [p.search_query for p in properties]
        pending_addresses = set(await self.cache.get_pending_addresses(all_addresses))

        results: list[ScrapeResult] = []
        pending_props: list[Property] = []

        for prop in properties:
            if prop.search_query not in pending_addresses:
                # Already cached
                cached_info = await self.cache.get(prop.search_query)
                if cached_info:
                    self._cached += 1
                    results.append(ScrapeResult(
                        property=prop,
                        agent_info=cached_info,
                        status=LookupStatus.CACHED,
                    ))
                else:
                    pending_props.append(prop)
                    results.append(None)  # placeholder
            else:
                pending_props.append(prop)
                results.append(None)  # placeholder

        # Fire one "cache loaded" event so the frontend fills in cached rows
        # immediately and shows the correct denominator (pending only)
        if self.progress_callback:
            self.progress_callback({
                "completed": 0,
                "total": len(pending_props),
                "cached": self._cached,
                "found": 0,
                "partial": 0,
                "not_found": 0,
                "errors": 0,
                "current_address": "",
                "current_status": "cached",
            })

        # Total now reflects only non-cached work so progress math is correct
        self._total = len(pending_props)

        if not pending_props:
            console.print(f"[green]All {self._cached} addresses found in cache.[/green]")
            return [r for r in results if r is not None]

        console.print(
            f"[blue]Processing {len(pending_props)} addresses "
            f"({self._cached} cached, {len(pending_props)} remaining)[/blue]"
        )

        # Create HTTP client and scrapers
        async with httpx.AsyncClient(
            http2=True,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        ) as client:
            scrapers = self._build_scrapers(client)

            if self.progress_callback:
                # Web mode: use callback instead of Rich progress bar
                scrape_tasks = []
                for prop in pending_props:
                    scrape_tasks.append(
                        self._process_one(prop, scrapers, client, None, None)
                    )
                scrape_results = await asyncio.gather(
                    *scrape_tasks, return_exceptions=True
                )
            else:
                # CLI mode: use Rich progress bar
                with Progress(
                    SpinnerColumn(),
                    TextColumn("[bold blue]{task.description}"),
                    BarColumn(),
                    MofNCompleteColumn(),
                    TimeRemainingColumn(),
                    console=console,
                ) as progress:
                    task_id = progress.add_task(
                        "Scraping", total=len(pending_props)
                    )

                    scrape_tasks = []
                    for prop in pending_props:
                        scrape_tasks.append(
                            self._process_one(prop, scrapers, client, progress, task_id)
                        )

                    scrape_results = await asyncio.gather(
                        *scrape_tasks, return_exceptions=True
                    )

            # Merge pending results back into the full results list
            pending_idx = 0
            for i in range(len(results)):
                if results[i] is None:
                    if pending_idx < len(scrape_results):
                        result = scrape_results[pending_idx]
                        if isinstance(result, Exception):
                            results[i] = ScrapeResult(
                                property=pending_props[pending_idx],
                                status=LookupStatus.ERROR,
                                error_message=str(result),
                            )
                            self._errors += 1
                        else:
                            results[i] = result
                        pending_idx += 1

            # Filter out any remaining None placeholders
            results = [r for r in results if r is not None]

            # ── Second-pass retry for NOT_FOUND addresses ──
            not_found_indices = [
                i for i, r in enumerate(results)
                if r is not None and r.status == LookupStatus.NOT_FOUND
            ]

            if not_found_indices:
                logger.info(
                    "Retrying %d not-found addresses with simplified queries",
                    len(not_found_indices),
                )
                if self.progress_callback:
                    self.progress_callback({
                        "completed": self._found + self._partial + self._not_found + self._errors,
                        "total": self._total,
                        "cached": self._cached,
                        "found": self._found,
                        "partial": self._partial,
                        "not_found": self._not_found,
                        "errors": self._errors,
                        "current_address": "Retrying not-found addresses...",
                        "current_status": "retrying",
                    })

                retry_tasks = []
                for idx in not_found_indices:
                    retry_tasks.append(
                        self._retry_with_variants(results[idx].property, scrapers, client)
                    )

                retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)

                recovered = 0
                for list_idx, retry_result in zip(not_found_indices, retry_results):
                    if isinstance(retry_result, Exception):
                        continue
                    if (retry_result and retry_result.agent_info
                            and retry_result.agent_info.agent_name):
                        results[list_idx] = retry_result
                        self._not_found -= 1
                        if retry_result.agent_info.has_contact_info:
                            self._found += 1
                        else:
                            self._partial += 1
                        recovered += 1

                if recovered:
                    logger.info("Recovered %d addresses on retry pass", recovered)
                    console.print(
                        f"[green]Retry pass recovered {recovered} additional addresses[/green]"
                    )

        self._print_summary()
        return results

    async def _process_one(
        self,
        prop: Property,
        scrapers: list[BaseScraper],
        client: httpx.AsyncClient,
        progress: Optional[Progress],
        task_id,
    ) -> ScrapeResult:
        """Process a single property through the merge-based scraper waterfall."""
        async with self.global_semaphore:
            sources_tried = []
            agent_info = None
            source_agents = []  # (scraper_name, agent_name) for confidence

            for scraper in scrapers:
                # Circuit breaker: skip scrapers that are consistently failing
                if self._is_circuit_open(scraper.name):
                    continue

                try:
                    sources_tried.append(scraper.name)
                    result = await scraper.search(prop)

                    if result and result.agent_name:
                        source_agents.append((scraper.name, result.agent_name))

                        if agent_info is None:
                            agent_info = result
                        else:
                            # MERGE: fill in missing fields from this source
                            agent_info = agent_info.merge(result)

                        # Early exit: complete info AND 2+ sources agree
                        if agent_info.is_complete and len(source_agents) >= 2:
                            break

                    self._record_scraper_success(scraper.name)

                except Exception as e:
                    self._record_scraper_failure(scraper.name, e)
                    logger.info(
                        "Scraper %s failed for '%s': %s: %s",
                        scraper.name, prop.raw_address, type(e).__name__, e
                    )
                    continue

            # Compute confidence based on source agreement
            confidence, verified = self._compute_confidence(source_agents)

            # Enrich contact info if we found an agent but missing details
            if agent_info and not agent_info.is_complete and self.enrich:
                try:
                    agent_info = await enrich_contact_info(agent_info, client)
                except Exception as e:
                    logger.info(
                        "Enrichment failed for '%s': %s", prop.raw_address, e
                    )

            # Determine status and cache
            if agent_info and agent_info.agent_name:
                if agent_info.has_contact_info:
                    status = LookupStatus.FOUND
                    self._found += 1
                else:
                    status = LookupStatus.PARTIAL
                    self._partial += 1
                await self.cache.put(prop.search_query, agent_info, status)
            else:
                status = LookupStatus.NOT_FOUND
                self._not_found += 1
                await self.cache.record_failure(
                    prop.search_query, sources_tried, "No agent info found"
                )

            # Update progress
            if progress is not None:
                progress.advance(task_id)

            if self.progress_callback:
                completed = self._found + self._partial + self._not_found + self._errors
                self.progress_callback({
                    "completed": completed,
                    "total": self._total,
                    "cached": self._cached,
                    "found": self._found,
                    "partial": self._partial,
                    "not_found": self._not_found,
                    "errors": self._errors,
                    "current_address": prop.raw_address,
                    "current_status": status.value,
                })

            return ScrapeResult(
                property=prop,
                agent_info=agent_info,
                status=status,
                sources_tried=sources_tried,
                confidence=confidence,
                verified=verified,
                sources_matched=[name for name, _ in source_agents],
            )

    async def _retry_with_variants(
        self,
        prop: Property,
        scrapers: list[BaseScraper],
        client: httpx.AsyncClient,
    ) -> Optional[ScrapeResult]:
        """Retry a failed property lookup with simplified address variants."""
        from .utils import address_variants

        variants = address_variants(prop)
        if not variants:
            return None

        for variant_query in variants:
            # Create a temporary Property with the variant query
            variant_prop = Property(
                raw_address=prop.raw_address,
                address_line=variant_query,
                city=prop.city,
                state=prop.state,
                zip_code=prop.zip_code,
                row_index=prop.row_index,
            )

            result = await self._process_one(
                variant_prop, scrapers, client, None, None
            )
            if result and result.agent_info and result.agent_info.agent_name:
                # Mark the source as retry
                if result.agent_info:
                    result.agent_info.source += "+retry"
                # Preserve the original property reference
                result.property = prop
                return result

        return None

    # ── Circuit breaker ──

    def _record_scraper_success(self, scraper_name: str):
        """Reset consecutive failure count on success."""
        self._consecutive_failures[scraper_name] = 0

    def _record_scraper_failure(self, scraper_name: str, error: Exception):
        """Track consecutive failures; open circuit after threshold."""
        count = self._consecutive_failures.get(scraper_name, 0) + 1
        self._consecutive_failures[scraper_name] = count
        if count >= self._circuit_breaker_threshold:
            self._circuit_open[scraper_name] = True
            logger.warning(
                "Circuit breaker OPEN for %s after %d consecutive failures",
                scraper_name, count
            )

    def _is_circuit_open(self, scraper_name: str) -> bool:
        """Check if a scraper's circuit breaker is tripped."""
        return self._circuit_open.get(scraper_name, False)

    # ── Confidence scoring ──

    def _compute_confidence(
        self, source_agents: list[tuple[str, str]]
    ) -> tuple[float, bool]:
        """
        Compute confidence score based on source agreement.

        Returns (confidence: float 0.0-1.0, verified: bool).
        """
        if not source_agents:
            return 0.0, False

        if len(source_agents) == 1:
            return 0.5, False  # Single source, unverified

        # Check if names match across sources (fuzzy)
        from .utils import names_match
        base_name = source_agents[0][1]
        matching_count = 1
        for _, name in source_agents[1:]:
            if names_match(base_name, name):
                matching_count += 1

        if matching_count >= 2:
            # 2+ sources agree
            confidence = min(0.7 + (matching_count * 0.1), 1.0)
            return confidence, True
        else:
            # Sources disagree — keep first source's data but flag low confidence
            return 0.4, False

    def _build_scrapers(self, client: httpx.AsyncClient) -> list[BaseScraper]:
        """Build the ordered list of enabled scrapers."""
        scrapers: list[BaseScraper] = []

        if "redfin" in self.enabled_sources:
            scrapers.append(RedfinScraper(client))

        if "homeharvest" in self.enabled_sources:
            scrapers.append(HomeHarvestScraper(client))

        if "realtor" in self.enabled_sources:
            scrapers.append(RealtorScraper(client))

        if "zillow" in self.enabled_sources:
            try:
                from .scrapers.zillow import ZillowScraper
                scrapers.append(ZillowScraper(client))
            except ImportError:
                logger.info("Zillow scraper not available")

        if "google" in self.enabled_sources or "google_search" in self.enabled_sources:
            gs = GoogleSearchScraper(
                client, api_key=self.google_api_key, cse_id=self.google_cse_id
            )
            if gs.is_configured:
                scrapers.append(gs)

        return scrapers

    def _print_summary(self):
        """Print a summary of pipeline results."""
        grand_total = self._cached + self._found + self._partial + self._not_found + self._errors
        console.print()
        console.print("[bold]Pipeline Summary[/bold]")
        console.print(f"  Total addresses:    {grand_total}")
        console.print(f"  [green]Found (complete):   {self._found}[/green]")
        console.print(f"  [yellow]Found (partial):    {self._partial}[/yellow]")
        console.print(f"  [blue]From cache:         {self._cached}[/blue]")
        console.print(f"  [red]Not found:          {self._not_found}[/red]")
        console.print(f"  [red]Errors:             {self._errors}[/red]")

        total_found = self._found + self._partial + self._cached
        if grand_total > 0:
            rate = (total_found / grand_total) * 100
            console.print(f"  [bold]Success rate:       {rate:.1f}%[/bold]")

        # Log circuit breaker state
        for name, is_open in self._circuit_open.items():
            if is_open:
                console.print(f"  [red]Circuit breaker tripped: {name}[/red]")
