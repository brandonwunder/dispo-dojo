"""SQLite persistence for FSBO search history and results."""

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

DB_PATH = Path(__file__).parent / "data" / "fsbo.db"


def init_db() -> None:
    """Create tables if they don't exist. Safe to call multiple times."""
    with _connect() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS fsbo_searches (
                search_id   TEXT PRIMARY KEY,
                state       TEXT,
                city_zip    TEXT,
                location    TEXT,
                location_type TEXT,
                created_at  TEXT,
                status      TEXT DEFAULT 'running',
                total_listings INTEGER DEFAULT 0,
                criteria_json  TEXT
            );

            CREATE TABLE IF NOT EXISTS fsbo_listings (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id       TEXT NOT NULL,
                address         TEXT,
                city            TEXT,
                state           TEXT,
                zip_code        TEXT,
                price           INTEGER,
                beds            INTEGER,
                baths           REAL,
                days_on_market  INTEGER,
                phone           TEXT,
                email           TEXT,
                owner_name      TEXT,
                listing_url     TEXT,
                source          TEXT,
                contact_status  TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_listings_search_id
                ON fsbo_listings(search_id);
        """)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def save_search(
    search_id: str,
    state: str,
    city_zip: str,
    location: str,
    location_type: str,
    created_at: str,
    criteria: dict,
) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO fsbo_searches "
            "(search_id, state, city_zip, location, location_type, created_at, status, criteria_json) "
            "VALUES (?, ?, ?, ?, ?, ?, 'running', ?)",
            (search_id, state, city_zip, location, location_type, created_at, json.dumps(criteria)),
        )
        conn.commit()


def update_search_complete(search_id: str, total_listings: int) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE fsbo_searches SET status='complete', total_listings=? WHERE search_id=?",
            (total_listings, search_id),
        )
        conn.commit()


def save_listings(search_id: str, listings: List[Dict[str, Any]]) -> None:
    rows = [
        (
            search_id,
            l.get("address"), l.get("city"), l.get("state"), l.get("zip_code"),
            l.get("price"), l.get("beds"), l.get("baths"), l.get("days_on_market"),
            l.get("phone"), l.get("email"), l.get("owner_name"),
            l.get("listing_url"), l.get("source"), l.get("contact_status"),
        )
        for l in listings
    ]
    with _connect() as conn:
        conn.executemany(
            "INSERT INTO fsbo_listings "
            "(search_id, address, city, state, zip_code, price, beds, baths, days_on_market, "
            "phone, email, owner_name, listing_url, source, contact_status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rows,
        )
        conn.commit()


def get_searches() -> List[Dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM fsbo_searches ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_listings(search_id: str) -> List[Dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM fsbo_listings WHERE search_id=? ORDER BY id",
            (search_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_search(search_id: str) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM fsbo_listings WHERE search_id=?", (search_id,))
        conn.execute("DELETE FROM fsbo_searches WHERE search_id=?", (search_id,))
        conn.commit()


# Initialize tables on import
init_db()
