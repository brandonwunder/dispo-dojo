"""JSON-file-backed cache for agent contact results.

Stores found contacts keyed by normalized (name + brokerage) hash.
Avoids re-searching agents across jobs. TTL: 14 days.
"""

import json
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path

from .models import AgentRow, ContactResult, ContactStatus

logger = logging.getLogger("agent_finder.cache")

TTL_DAYS = 14
MAX_ENTRIES = 50_000


class FileCache:
    def __init__(self, path: Path):
        self.path = path
        self._data: dict[str, dict] = {}
        self._dirty = False
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                raw = self.path.read_text(encoding="utf-8")
                self._data = json.loads(raw) if raw.strip() else {}
                logger.info("Cache loaded: %d entries", len(self._data))
            except (json.JSONDecodeError, OSError):
                self._data = {}

    @staticmethod
    def _key(name: str, brokerage: str) -> str:
        normalized = f"{name.strip().lower()}|{brokerage.strip().lower()}"
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    def get(self, agent: AgentRow) -> ContactResult | None:
        key = self._key(agent.name, agent.brokerage)
        entry = self._data.get(key)
        if not entry:
            return None
        cached_at = datetime.fromisoformat(entry["cached_at"])
        if datetime.now() - cached_at > timedelta(days=TTL_DAYS):
            del self._data[key]
            self._dirty = True
            return None
        return ContactResult(
            agent=agent,
            phone=entry.get("phone", ""),
            email=entry.get("email", ""),
            source="cache",
            status=ContactStatus.FOUND,
        )

    def put(self, result: ContactResult):
        if not result.has_contact:
            return
        key = self._key(result.agent.name, result.agent.brokerage)
        self._data[key] = {
            "phone": result.phone,
            "email": result.email,
            "source": result.source,
            "cached_at": datetime.now().isoformat(),
        }
        self._dirty = True
        if len(self._data) > MAX_ENTRIES:
            oldest_key = min(self._data, key=lambda k: self._data[k]["cached_at"])
            del self._data[oldest_key]

    def save(self):
        if self._dirty:
            try:
                self.path.write_text(json.dumps(self._data), encoding="utf-8")
                self._dirty = False
                logger.info("Cache saved: %d entries", len(self._data))
            except OSError as e:
                logger.warning("Failed to save cache: %s", e)

    def __len__(self):
        return len(self._data)
