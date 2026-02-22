"""Abstract base scraper class."""

import asyncio
from abc import ABC, abstractmethod
from typing import Optional

import httpx
from aiolimiter import AsyncLimiter
from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type,
)

from ..config import SourceConfig
from ..models import AgentInfo, Property
from ..utils import get_rotating_headers, detect_captcha


class BaseScraper(ABC):
    """Abstract base for all listing agent scrapers."""

    def __init__(self, config: SourceConfig, client: httpx.AsyncClient):
        self.config = config
        self.client = client
        self.rate_limiter = AsyncLimiter(config.requests_per_second, 1.0)
        self.semaphore = asyncio.Semaphore(config.max_concurrent)
        self._request_count = 0
        self._success_count = 0
        self._block_count = 0

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def stats(self) -> dict:
        return {
            "requests": self._request_count,
            "successes": self._success_count,
            "blocks": self._block_count,
        }

    @abstractmethod
    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """
        Search for listing agent info for a given property.
        Returns AgentInfo if found, None if not found.
        """
        ...

    async def _get(self, url: str, headers: Optional[dict] = None,
                   params: Optional[dict] = None) -> httpx.Response:
        """Rate-limited, retried GET request."""
        async with self.semaphore:
            await self.rate_limiter.acquire()
            self._request_count += 1

            req_headers = headers or get_rotating_headers()
            response = await self._fetch_with_retry(url, req_headers, params)

            # Check for blocks/captchas
            if response.status_code == 403:
                self._block_count += 1
                raise httpx.HTTPStatusError(
                    "Blocked (403)", request=response.request, response=response
                )
            if response.status_code == 429:
                self._block_count += 1
                raise httpx.HTTPStatusError(
                    "Rate limited (429)", request=response.request, response=response
                )
            if detect_captcha(response.text):
                self._block_count += 1
                raise httpx.HTTPStatusError(
                    "CAPTCHA detected", request=response.request, response=response
                )

            return response

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=15),
        reraise=True,
    )
    async def _fetch_with_retry(self, url: str, headers: dict,
                                 params: Optional[dict] = None) -> httpx.Response:
        """Fetch with automatic retry on transient errors."""
        return await self.client.get(
            url,
            headers=headers,
            params=params,
            timeout=self.config.timeout_seconds,
        )
