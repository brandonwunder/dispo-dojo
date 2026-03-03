"""Async token-bucket rate limiter for controlling request rates."""

import asyncio
import time


class TokenBucketLimiter:
    """Rate limiter using token bucket algorithm.

    Example: TokenBucketLimiter(rate=0.5, burst=1)
    Allows 1 request every 2 seconds, with burst capacity of 1.
    """

    def __init__(self, rate: float, burst: int = 1):
        self.rate = rate        # tokens per second
        self.burst = burst
        self.tokens = float(burst)
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
            self.last_refill = now

            if self.tokens < 1.0:
                wait = (1.0 - self.tokens) / self.rate
                await asyncio.sleep(wait)
                self.tokens = 0.0
            else:
                self.tokens -= 1.0
