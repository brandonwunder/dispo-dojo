"""HomeHarvest library wrapper - Secondary source using Realtor.com backend."""

import asyncio
import logging
import re
from typing import Optional

import httpx

from ..config import HOMEHARVEST
from ..models import AgentInfo, Property
from ..utils import clean_name, clean_phone, clean_email, normalize_address, compute_days_on_market
from .base import BaseScraper

logger = logging.getLogger("agent_finder.scrapers.homeharvest")


class HomeHarvestScraper(BaseScraper):
    """
    Wraps the homeharvest library to search Realtor.com for agent info.

    HomeHarvest is synchronous, so we run it in a thread executor
    to avoid blocking the async event loop.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(HOMEHARVEST, client)

    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """Search using HomeHarvest library (runs sync code in executor)."""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, self._sync_search, prop
            )
            if result:
                self._success_count += 1
            return result
        except Exception as e:
            logger.info("HomeHarvest executor failed for '%s': %s: %s",
                        prop.raw_address, type(e).__name__, e)
            return None

    def _sync_search(self, prop: Property) -> Optional[AgentInfo]:
        """Synchronous HomeHarvest search with listing type fallbacks."""
        try:
            from homeharvest import scrape_property
        except ImportError:
            logger.info("HomeHarvest library not installed")
            return None

        self._request_count += 1
        location = prop.search_query

        # Try multiple listing types — active listings may be categorized differently
        for listing_type in ["for_sale", "sold", "pending"]:
            try:
                df = scrape_property(
                    location=location,
                    listing_type=listing_type,
                )

                if df is None or df.empty:
                    continue

                row = self._find_best_match(df, prop)
                if row is None:
                    continue

                agent_info = self._extract_agent_from_row(row)
                if agent_info:
                    return agent_info

            except Exception as e:
                logger.info(
                    "HomeHarvest %s search failed for '%s': %s: %s",
                    listing_type, location, type(e).__name__, e
                )
                continue

        return None

    def _extract_agent_from_row(self, row) -> Optional[AgentInfo]:
        """Extract AgentInfo from a HomeHarvest result row."""
        import pandas as pd

        def _safe_str(val) -> str:
            """Convert a pandas value to string, treating NA/NaN as empty."""
            if val is None or pd.isna(val):
                return ""
            s = str(val).strip()
            if s.lower() in ("", "nan", "none", "<na>", "na"):
                return ""
            return s

        agent_name = ""
        agent_phone = ""
        agent_email = ""

        # HomeHarvest column names vary by version
        for col in ["agent_name", "agent", "list_agent_name"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    agent_name = val
                    break

        for col in ["agent_phone", "agent_phones", "list_agent_phone"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    agent_phone = val
                    break

        for col in ["agent_email", "list_agent_email"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    agent_email = val
                    break

        broker = ""
        for col in ["broker_name", "broker", "brokerage", "office_name"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    broker = val
                    break

        if not agent_name:
            return None

        listing_url = ""
        for col in ["property_url", "url", "detail_url"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    listing_url = val
                    break

        list_date = ""
        for col in ["list_date", "listed_date", "date_listed"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    list_date = val
                    break

        days_on_market = ""
        for col in ["days_on_market", "dom", "days_on_mls"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    days_on_market = val
                    break

        if not days_on_market and list_date:
            days_on_market = compute_days_on_market(list_date)

        listing_price = ""
        for col in ["list_price", "price", "listing_price", "sale_price", "sold_price"]:
            if col in row.index:
                val = _safe_str(row.get(col))
                if val:
                    try:
                        listing_price = f"${int(float(val)):,}"
                    except (ValueError, TypeError):
                        listing_price = val
                    break

        return AgentInfo(
            agent_name=clean_name(agent_name),
            brokerage=broker.strip(),
            phone=clean_phone(agent_phone),
            email=clean_email(agent_email),
            source="homeharvest",
            listing_url=listing_url,
            list_date=list_date,
            days_on_market=days_on_market,
            listing_price=listing_price,
        )

    def _find_best_match(self, df, prop: Property):
        """Find the row that best matches the target address using normalized comparison."""
        import pandas as pd

        target = normalize_address(prop.address_line or prop.raw_address)
        if not target:
            target = normalize_address(prop.raw_address)

        # Look for an address column
        addr_col = None
        for col in ["full_street_line", "street_address", "address", "address_line"]:
            if col in df.columns:
                addr_col = col
                break

        if addr_col is None:
            # Just return the first row if we can't match
            return df.iloc[0] if len(df) > 0 else None

        # Normalized comparison
        for idx, row in df.iterrows():
            row_addr = normalize_address(str(row.get(addr_col, "")))
            if not row_addr:
                continue
            if target in row_addr or row_addr in target:
                return row

        # Fallback: compare just the street number
        target_num = re.match(r"^\d+", target)
        if target_num:
            num = target_num.group()
            for idx, row in df.iterrows():
                row_addr = str(row.get(addr_col, "")).strip()
                if row_addr.startswith(num):
                    return row

        # Fall back to first result if only one result
        if len(df) == 1:
            return df.iloc[0]

        return None
