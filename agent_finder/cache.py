"""SQLite cache for resumability and deduplication."""

import json
import hashlib
import aiosqlite
from datetime import datetime, timedelta
from typing import Optional

from .models import AgentInfo, LookupStatus


class ScrapeCache:
    """SQLite-backed cache for scrape results. Enables resume on interruption."""

    def __init__(self, db_path: str = "agent_finder_cache.db", ttl_days: int = 7):
        self.db_path = db_path
        self.ttl = timedelta(days=ttl_days)

    async def initialize(self):
        """Create tables if they don't exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS results (
                    address_hash TEXT PRIMARY KEY,
                    raw_address TEXT NOT NULL,
                    agent_name TEXT DEFAULT '',
                    brokerage TEXT DEFAULT '',
                    phone TEXT DEFAULT '',
                    email TEXT DEFAULT '',
                    source TEXT DEFAULT '',
                    listing_url TEXT DEFAULT '',
                    list_date TEXT DEFAULT '',
                    days_on_market TEXT DEFAULT '',
                    status TEXT DEFAULT 'found',
                    scraped_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS failures (
                    address_hash TEXT PRIMARY KEY,
                    raw_address TEXT NOT NULL,
                    sources_tried TEXT DEFAULT '[]',
                    error TEXT DEFAULT '',
                    attempts INTEGER DEFAULT 1,
                    last_attempt TEXT NOT NULL
                )
            """)
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_results_address ON results(raw_address)"
            )
            # Migrate existing databases: add new columns if missing
            try:
                await db.execute("ALTER TABLE results ADD COLUMN list_date TEXT DEFAULT ''")
            except Exception:
                pass  # Column already exists
            try:
                await db.execute("ALTER TABLE results ADD COLUMN days_on_market TEXT DEFAULT ''")
            except Exception:
                pass  # Column already exists
            await db.commit()

    @staticmethod
    def _hash(address: str) -> str:
        """Create a consistent hash for an address string."""
        normalized = address.upper().strip()
        return hashlib.sha256(normalized.encode()).hexdigest()

    async def get(self, address: str) -> Optional[AgentInfo]:
        """Get cached agent info for an address, if it exists and hasn't expired."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM results WHERE address_hash = ? AND expires_at > ?",
                (self._hash(address), datetime.utcnow().isoformat()),
            )
            row = await cursor.fetchone()
            if row:
                return AgentInfo(
                    agent_name=row["agent_name"],
                    brokerage=row["brokerage"],
                    phone=row["phone"],
                    email=row["email"],
                    source=row["source"],
                    listing_url=row["listing_url"],
                    list_date=row["list_date"] if "list_date" in row.keys() else "",
                    days_on_market=row["days_on_market"] if "days_on_market" in row.keys() else "",
                )
        return None

    async def put(self, address: str, agent_info: AgentInfo,
                  status: LookupStatus = LookupStatus.FOUND):
        """Cache a successful scrape result."""
        now = datetime.utcnow()
        expires = now + self.ttl
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """INSERT OR REPLACE INTO results
                   (address_hash, raw_address, agent_name, brokerage, phone, email,
                    source, listing_url, list_date, days_on_market,
                    status, scraped_at, expires_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    self._hash(address),
                    address,
                    agent_info.agent_name,
                    agent_info.brokerage,
                    agent_info.phone,
                    agent_info.email,
                    agent_info.source,
                    agent_info.listing_url,
                    agent_info.list_date,
                    agent_info.days_on_market,
                    status.value,
                    now.isoformat(),
                    expires.isoformat(),
                ),
            )
            # Remove from failures if it was there
            await db.execute(
                "DELETE FROM failures WHERE address_hash = ?",
                (self._hash(address),),
            )
            await db.commit()

    async def record_failure(self, address: str, sources_tried: list[str], error: str = ""):
        """Record a failed lookup attempt."""
        now = datetime.utcnow().isoformat()
        h = self._hash(address)
        async with aiosqlite.connect(self.db_path) as db:
            # Check if already failed before
            cursor = await db.execute(
                "SELECT attempts FROM failures WHERE address_hash = ?", (h,)
            )
            row = await cursor.fetchone()
            if row:
                await db.execute(
                    """UPDATE failures SET sources_tried = ?, error = ?,
                       attempts = attempts + 1, last_attempt = ?
                       WHERE address_hash = ?""",
                    (json.dumps(sources_tried), error, now, h),
                )
            else:
                await db.execute(
                    """INSERT INTO failures
                       (address_hash, raw_address, sources_tried, error, attempts, last_attempt)
                       VALUES (?, ?, ?, ?, 1, ?)""",
                    (h, address, json.dumps(sources_tried), error, now),
                )
            await db.commit()

    async def get_pending_addresses(self, all_addresses: list[str]) -> list[str]:
        """Return addresses not yet successfully cached (for resumability)."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT address_hash FROM results WHERE expires_at > ?",
                (datetime.utcnow().isoformat(),),
            )
            rows = await cursor.fetchall()
            cached_hashes = {row[0] for row in rows}

        return [a for a in all_addresses if self._hash(a) not in cached_hashes]

    async def get_all_results(self) -> list[dict]:
        """Get all cached results (for export)."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM results WHERE expires_at > ?",
                (datetime.utcnow().isoformat(),),
            )
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def stats(self) -> dict:
        """Return cache statistics."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT COUNT(*) FROM results WHERE expires_at > ?",
                (datetime.utcnow().isoformat(),),
            )
            cached = (await cursor.fetchone())[0]

            cursor = await db.execute("SELECT COUNT(*) FROM failures")
            failed = (await cursor.fetchone())[0]

        return {"cached_results": cached, "recorded_failures": failed}
