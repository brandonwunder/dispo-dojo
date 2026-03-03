"""Abstract base class for franchise-specific brokerage scrapers.

Each franchise scraper inherits from this and implements the `search`
method to look up a single agent in that franchise's directory.
"""

import asyncio
import logging
from abc import ABC, abstractmethod

import httpx

from ..models import AgentRow, ContactResult, ContactStatus
from ..searchers.helpers import get_headers

logger = logging.getLogger("agent_finder.brokerages")


class BaseBrokerageScraper(ABC):
    name: str = ""
    base_url: str = ""
    rate_limit: float = 2.0       # seconds between requests
    max_concurrent: int = 3
    timeout: float = 15.0

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self._semaphore = asyncio.Semaphore(self.max_concurrent)

    async def search_batch(
        self,
        agents: list[AgentRow],
        on_result=None,
    ) -> list[ContactResult]:
        """Search for all agents in this franchise's directory."""
        results: list[ContactResult] = []

        for batch_start in range(0, len(agents), self.max_concurrent):
            batch = agents[batch_start : batch_start + self.max_concurrent]
            tasks = [self._search_safe(a) for a in batch]
            batch_results = await asyncio.gather(*tasks)

            for r in batch_results:
                results.append(r)
                if on_result:
                    on_result(r)

            if batch_start + self.max_concurrent < len(agents):
                await asyncio.sleep(self.rate_limit)

        return results

    async def _search_safe(self, agent: AgentRow) -> ContactResult:
        async with self._semaphore:
            try:
                return await asyncio.wait_for(
                    self.search(agent), timeout=self.timeout
                )
            except asyncio.TimeoutError:
                logger.warning("%s: timeout for %s", self.name, agent.name)
                return ContactResult(
                    agent=agent,
                    status=ContactStatus.NOT_FOUND,
                    source=self.name,
                    error_message="timeout",
                )
            except Exception as e:
                logger.warning("%s: error for %s: %s", self.name, agent.name, e)
                return ContactResult(
                    agent=agent,
                    status=ContactStatus.NOT_FOUND,
                    source=self.name,
                    error_message=str(e),
                )

    @abstractmethod
    async def search(self, agent: AgentRow) -> ContactResult:
        """Search for a single agent in this franchise's directory."""
        ...

    def _make_result(self, agent: AgentRow, phone: str = "", email: str = "") -> ContactResult:
        has = bool(phone or email)
        return ContactResult(
            agent=agent,
            phone=phone,
            email=email,
            source=self.name,
            status=ContactStatus.FOUND if has else ContactStatus.NOT_FOUND,
        )
