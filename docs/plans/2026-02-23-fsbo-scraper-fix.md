# FSBO Scraper Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 FSBO scrapers so that real results are returned from at least 3 sources for any US city or ZIP search.

**Architecture:** Each scraper has a distinct failure mode. The plan diagnoses each failure, then applies a targeted fix. HomeHarvest (Realtor.com) is the highest-confidence source and is fixed first. Zillow uses fragile JSON path parsing that needs to be made resilient. FSBO.com and ForSaleByOwner.com use unvalidated CSS selectors that need live-site verification and replacement. Craigslist selectors are updated to match the current Craigslist HTML structure. A debug endpoint is added first to enable fast iteration.

**Tech Stack:** Python 3.12, FastAPI, httpx, BeautifulSoup (lxml), HomeHarvest library, asyncio, SQLite (fsbo_db.py already in place)

---

## Root Cause Summary (Do Not Skip This)

Investigation of all 5 scrapers revealed:

| Scraper | Failure Mode |
|---|---|
| `realtor_fsbo.py` | HomeHarvest `scrape_property()` called with location `"Phoenix, AZ"` — HomeHarvest expects just `"Phoenix, AZ"` or a ZIP. The FSBO filter `if agent_name_raw and broker_raw` may be dropping too many rows. Also `source="realtor"` but should be `"realtor_fsbo"` to match frontend. |
| `zillow_fsbo.py` | Hardcoded JSON path `cat1.searchResults.listResults` breaks whenever Zillow restructures `__NEXT_DATA__`. Returns empty silently. Also `source="zillow"` but should be `"zillow_fsbo"`. |
| `fsbo_com.py` | Selectors `a[href*='/listing/']`, `.listing-card a` are placeholders never verified against live site. FSBO.com is a React app — static HTML scraping returns an empty shell. |
| `forsalebyowner_com.py` | Same issue — placeholder selectors on a JS-rendered site. |
| `craigslist_fsbo.py` | Selectors `li.cl-search-result` + `a.cl-app-anchor` are correct for new Craigslist but the `_resolve_area` lookup is case-sensitive and may fail for "Phoenix, AZ" → "phoenix" lookup. Also needs verification that the areas JSON has entries. |

---

## Task 1: Add a Debug Endpoint

**Why first:** This endpoint lets you test each scraper in isolation and see raw results + errors without running the full 5-source pipeline. It will confirm every fix you make in subsequent tasks.

**Files:**
- Modify: `agent_finder/app.py` (add one GET endpoint near other FSBO routes)

**Step 1: Add the endpoint**

Find the FSBO routes section in `app.py` (search for `@app.get("/api/fsbo`). Add this endpoint AFTER the existing FSBO routes:

```python
@app.get("/api/fsbo/debug-scraper")
async def debug_fsbo_scraper(source: str = "realtor_fsbo", location: str = "Phoenix, AZ"):
    """
    Run a single FSBO scraper synchronously and return raw results + logs.
    source: one of fsbo.com | forsalebyowner.com | zillow_fsbo | realtor_fsbo | craigslist
    location: e.g. "Phoenix, AZ" or "85001"
    """
    import logging
    import io

    # Capture log output
    log_stream = io.StringIO()
    handler = logging.StreamHandler(log_stream)
    handler.setLevel(logging.DEBUG)
    root_logger = logging.getLogger("agent_finder")
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.DEBUG)

    location_type = "zip" if location.strip().isdigit() else "city_state"
    from .fsbo_models import FSBOSearchCriteria
    criteria = FSBOSearchCriteria(location=location, location_type=location_type)

    results = []
    error = None
    try:
        import httpx
        async with httpx.AsyncClient(follow_redirects=True, timeout=45.0) as client:
            if source == "fsbo.com":
                from .scrapers.fsbo_com import FsboComScraper
                scraper = FsboComScraper(client)
            elif source == "forsalebyowner.com":
                from .scrapers.forsalebyowner_com import ForSaleByOwnerScraper
                scraper = ForSaleByOwnerScraper(client)
            elif source == "zillow_fsbo":
                from .scrapers.zillow_fsbo import ZillowFSBOScraper
                scraper = ZillowFSBOScraper(client)
            elif source == "realtor_fsbo":
                from .scrapers.realtor_fsbo import RealtorFSBOScraper
                scraper = RealtorFSBOScraper(client)
            elif source == "craigslist":
                from .scrapers.craigslist_fsbo import CraigslistFSBOScraper
                scraper = CraigslistFSBOScraper(client)
            else:
                return {"error": f"Unknown source: {source}"}

            listings = await scraper.search_area(criteria)
            results = [
                {
                    "address": l.address,
                    "price": l.price,
                    "beds": l.beds,
                    "baths": l.baths,
                    "phone": l.phone,
                    "email": l.email,
                    "source": l.source,
                    "listing_url": l.listing_url,
                    "contact_status": l.contact_status,
                }
                for l in listings
            ]
    except Exception as e:
        import traceback
        error = traceback.format_exc()
    finally:
        root_logger.removeHandler(handler)

    return {
        "source": source,
        "location": location,
        "result_count": len(results),
        "results": results[:10],  # First 10 only
        "logs": log_stream.getvalue(),
        "error": error,
    }
```

**Step 2: Test it**

Start the server: `cd "c:\Users\brand\OneDrive\Desktop\Agent Finder" && python -m uvicorn agent_finder.app:app --port 9000`

Then test each source:
```
http://localhost:9000/api/fsbo/debug-scraper?source=realtor_fsbo&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=zillow_fsbo&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=craigslist&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=fsbo.com&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=forsalebyowner.com&location=Phoenix, AZ
```

Expected at this point: all return 0 results. The `logs` field will tell you WHY.

**Step 3: Commit**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
git add agent_finder/app.py
git commit -m "feat: add /api/fsbo/debug-scraper endpoint for per-source testing"
```

---

## Task 2: Fix the Realtor/HomeHarvest Scraper

**Why high priority:** HomeHarvest wraps the Realtor.com API directly and is already used in the main agent-finder pipeline. It is the most likely source to return real data quickly.

**Files:**
- Modify: `agent_finder/scrapers/realtor_fsbo.py`

**Step 1: Fix source name and filter logic**

Replace the entire `_row_to_listing` method and the `_sync_search` method:

```python
def _sync_search(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
    try:
        from homeharvest import scrape_property
    except ImportError:
        logger.warning("homeharvest library not installed, skipping realtor_fsbo")
        return []

    location = criteria.location
    if criteria.location_type == "zip":
        location = criteria.location.split(",")[0].strip()

    logger.debug("realtor_fsbo: searching location=%r", location)
    results = []
    try:
        df = scrape_property(location=location, listing_type="for_sale", past_days=60)
        if df is None or df.empty:
            logger.info("realtor_fsbo: homeharvest returned empty DataFrame for %r", location)
            return []
        logger.info("realtor_fsbo: homeharvest returned %d rows before FSBO filter", len(df))

        for _, row in df.iterrows():
            listing = self._row_to_listing(row, criteria)
            if listing:
                results.append(listing)

        logger.info("realtor_fsbo: %d listings after FSBO filter", len(results))
    except Exception as e:
        logger.warning("homeharvest search failed for %r: %s", location, e)

    return results

def _row_to_listing(self, row, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
    import pandas as pd

    def safe(val) -> str:
        if val is None:
            return ""
        try:
            if pd.isna(val):
                return ""
        except (TypeError, ValueError):
            pass
        s = str(val).strip()
        return "" if s.lower() in ("nan", "none", "<na>", "na", "nat") else s

    # FSBO filter: keep listings where NO listing agent AND NO broker
    # (or where agent_name == broker_name suggesting the owner listed themselves)
    agent_name_raw = safe(row.get("agent_name") or row.get("list_agent_name", ""))
    broker_raw = safe(row.get("broker_name") or row.get("brokerage", ""))
    agent_email = safe(row.get("agent_email") or row.get("list_agent_email", ""))
    agent_mls_id = safe(row.get("agent_mls_id", ""))

    # Definite MLS listing: has both a named agent with MLS ID and a brokerage
    is_mls_listing = (
        len(agent_name_raw) > 3
        and len(broker_raw) > 3
        and len(agent_mls_id) > 0
    )
    if is_mls_listing:
        return None  # Skip agent-listed properties

    address = safe(row.get("full_street_line") or row.get("street_address", ""))
    if not address:
        return None

    city = safe(row.get("city", ""))
    state = safe(row.get("state", ""))
    zip_code = safe(row.get("zip_code") or row.get("postal_code", ""))

    price_raw = safe(row.get("list_price") or row.get("price", ""))
    price = None
    if price_raw:
        try:
            price = int(float(price_raw))
        except (ValueError, TypeError):
            pass

    if criteria.min_price is not None and price is not None and price < criteria.min_price:
        return None
    if criteria.max_price is not None and price is not None and price > criteria.max_price:
        return None

    beds_raw = safe(row.get("beds") or row.get("bedrooms", ""))
    baths_raw = safe(row.get("baths") or row.get("bathrooms", ""))
    beds = int(float(beds_raw)) if beds_raw else None
    baths = float(baths_raw) if baths_raw else None

    if criteria.min_beds is not None and beds is not None and beds < criteria.min_beds:
        return None
    if criteria.min_baths is not None and baths is not None and baths < criteria.min_baths:
        return None

    dom_raw = safe(row.get("days_on_market") or row.get("dom", ""))
    dom = int(float(dom_raw)) if dom_raw else None
    if criteria.max_days_on_market is not None and dom is not None and dom > criteria.max_days_on_market:
        return None

    phone = clean_phone(safe(row.get("agent_phone") or row.get("list_agent_phone", "")))
    email = clean_email(safe(agent_email))
    owner_name = clean_name(agent_name_raw) if agent_name_raw else None
    listing_url = safe(row.get("property_url") or row.get("url", ""))

    full_address = f"{address}, {city}, {state} {zip_code}".strip().strip(",")

    listing = FSBOListing(
        address=full_address,
        city=city, state=state, zip_code=zip_code,
        price=price, beds=beds, baths=baths,
        sqft=None, property_type=None, days_on_market=dom,
        owner_name=owner_name, phone=phone or None, email=email or None,
        listing_url=listing_url,
        source="realtor_fsbo",  # FIX: was "realtor", must match frontend key
        contact_status="none",
    )
    listing.contact_status = listing.compute_contact_status()
    return listing
```

**Key changes:**
- Added `past_days=60` to `scrape_property()` call for fresh listings
- Added `logger.debug` calls to see what HomeHarvest returns
- Changed FSBO filter: now requires `agent_mls_id` to be present (not just agent name + broker) before filtering out — much more permissive
- Fixed `source="realtor_fsbo"` (was `"realtor"`)

**Step 2: Test**

```
http://localhost:9000/api/fsbo/debug-scraper?source=realtor_fsbo&location=Phoenix, AZ
```

Expected: `result_count` > 0 and `logs` shows "homeharvest returned N rows before FSBO filter"

**Step 3: Commit**

```bash
git add agent_finder/scrapers/realtor_fsbo.py
git commit -m "fix: loosen FSBO filter in realtor_fsbo scraper, fix source name, add debug logging"
```

---

## Task 3: Fix the Zillow FSBO Scraper

**Files:**
- Modify: `agent_finder/scrapers/zillow_fsbo.py`

**Step 1: Replace `_parse_search_results` with a resilient version**

The hardcoded path `cat1.searchResults.listResults` breaks whenever Zillow restructures their Next.js data. Replace with a function that searches the JSON tree:

```python
def _find_list_results(self, data: dict) -> list:
    """
    Recursively search the __NEXT_DATA__ JSON for a list of property results.
    Zillow restructures this frequently — search for known keys rather than
    using a hardcoded path.
    """
    # Known key names for the listing array in Zillow's data
    LIST_KEYS = {"listResults", "list_results", "searchResults"}

    def _search(node, depth=0):
        if depth > 8:
            return []
        if isinstance(node, list):
            # Check if this looks like a list of property objects
            if node and isinstance(node[0], dict) and (
                "zpid" in node[0] or "address" in node[0] or "detailUrl" in node[0]
            ):
                return node
            for item in node:
                found = _search(item, depth + 1)
                if found:
                    return found
        elif isinstance(node, dict):
            for key, val in node.items():
                if key in LIST_KEYS and isinstance(val, list) and val:
                    logger.debug("zillow_fsbo: found listing array at key=%r len=%d", key, len(val))
                    return val
                found = _search(val, depth + 1)
                if found:
                    return found
        return []

    return _search(data)

def _parse_search_results(self, html: str, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
    soup = BeautifulSoup(html, "lxml")
    results = []

    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        logger.info("zillow_fsbo: no __NEXT_DATA__ script found in response")
        logger.debug("zillow_fsbo: response HTML length=%d", len(html))
        return results

    try:
        data = json.loads(script.string)
        list_results = self._find_list_results(data)
        logger.info("zillow_fsbo: found %d raw items in listing array", len(list_results))

        for item in list_results:
            listing = self._item_to_listing(item, criteria)
            if listing:
                results.append(listing)

        if not list_results:
            logger.info("zillow_fsbo: listing array was empty — Zillow may be blocking or restructured")

    except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
        logger.warning("zillow_fsbo parse failed: %s", e)

    return results
```

Also fix the `_item_to_listing` method — change `source="zillow"` to `source="zillow_fsbo"`:

```python
# In _item_to_listing, change the FSBOListing creation:
listing = FSBOListing(
    ...
    source="zillow_fsbo",  # FIX: was "zillow"
    ...
)
```

Also relax the listing type filter — remove it or make it optional:

```python
def _item_to_listing(self, item: dict, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
    # Don't filter by listingType — the /fsbo/ URL already ensures FSBO results
    # listingType filtering was dropping valid results
    address = item.get("address", "") or item.get("streetAddress", "")
    if not address:
        return None
    # ... rest of method unchanged ...
```

**Step 2: Test**

```
http://localhost:9000/api/fsbo/debug-scraper?source=zillow_fsbo&location=Phoenix, AZ
```

Check the `logs` field. If Zillow is blocking, you'll see "no __NEXT_DATA__ script found" or "listing array was empty". This is expected — Zillow heavily blocks scrapers. The scraper will return 0 from Zillow in that case, but at least we have diagnostic info.

**Step 3: Commit**

```bash
git add agent_finder/scrapers/zillow_fsbo.py
git commit -m "fix: resilient JSON tree search in zillow_fsbo, fix source name, remove listing type filter"
```

---

## Task 4: Fix the Craigslist Scraper

**Files:**
- Modify: `agent_finder/scrapers/craigslist_fsbo.py`

**Step 1: Verify area resolution**

The `_resolve_area` function does `location.lower().strip()` then splits on comma. For input `"Phoenix, AZ"`:
- Full lookup: `"phoenix, az"` → likely not in dict
- City-only lookup: `"phoenix"` → should be in dict if craigslist_areas.json has an entry

Check the areas JSON first:

```bash
python -c "
import json
from pathlib import Path
data = json.loads(Path('agent_finder/data/craigslist_areas.json').read_text())
print('Total entries:', len(data))
print('Phoenix entry:', data.get('phoenix', 'NOT FOUND'))
print('Sample keys:', list(data.keys())[:10])
"
```

If `phoenix` is missing, this is why Craigslist returns nothing. Add it.

**Step 2: Update `_resolve_area` to be more robust**

Replace the method with a version that handles more input formats:

```python
def _resolve_area(self, criteria: FSBOSearchCriteria) -> Optional[str]:
    """Map location to a Craigslist subdomain."""
    location = criteria.location.lower().strip()

    # Strip state suffix: "phoenix, az" → "phoenix"
    city = location.split(",")[0].strip()

    # Strip state suffix if it's just 2 letters: "phoenix az" → "phoenix"
    city = re.sub(r'\s+[a-z]{2}$', '', city).strip()

    # Try direct lookups
    for candidate in [location, city]:
        if candidate in CRAIGSLIST_AREAS:
            logger.debug("craigslist: resolved %r → %s", candidate, CRAIGSLIST_AREAS[candidate])
            return CRAIGSLIST_AREAS[candidate]

    # Partial match — city is a substring of a key or vice versa
    for key, val in CRAIGSLIST_AREAS.items():
        if city == key or (len(city) > 4 and (key.startswith(city) or city.startswith(key))):
            logger.debug("craigslist: partial match %r → %s via key %r", city, val, key)
            return val

    logger.info("craigslist: no area found for location=%r city=%r", location, city)
    return None
```

**Step 3: Update post link selectors for current Craigslist**

Current Craigslist (2024+) search results page uses a gallery/list format. Update `_get_post_links`:

```python
def _get_post_links(self, soup: BeautifulSoup, base: str) -> List[tuple]:
    """Extract post links and dates from search results page."""
    links = []

    # Try all known Craigslist result structures (new to old)
    items = (
        soup.select("li.cl-search-result")      # 2023+ new layout
        or soup.select("li.result-row")          # classic layout
        or soup.select(".cl-search-view-mode-gallery .cl-gallery-card")  # gallery view
    )

    if not items:
        logger.info("craigslist: no result items found — checking for empty results vs blocked")
        logger.debug("craigslist: page HTML length=%d", len(str(soup)))
        # Check if the page is actually a search results page
        if soup.select_one(".cl-search-empty"):
            logger.info("craigslist: search returned empty results (0 listings in area)")
        return []

    logger.debug("craigslist: found %d result items", len(items))

    for item in items:
        # Try multiple anchor patterns
        a = (
            item.select_one("a.cl-app-anchor")
            or item.select_one("a.result-title")
            or item.select_one("a[href*='/d/']")
            or item.select_one("a[href*='craigslist.org']")
            or item.select_one("a")
        )
        if not a:
            continue
        href = a.get("href", "")
        if not href:
            continue
        full = href if href.startswith("http") else urljoin(base, href)

        # Parse post date
        date_el = item.select_one("time") or item.select_one(".result-date") or item.select_one(".cl-app-anchor time")
        post_date = None
        if date_el:
            dt_str = date_el.get("datetime", "") or date_el.get("title", "")
            try:
                post_date = datetime.fromisoformat(dt_str[:19]) if dt_str else None
            except ValueError:
                pass
        links.append((full, post_date))

    return links
```

**Step 4: Test**

```
http://localhost:9000/api/fsbo/debug-scraper?source=craigslist&location=Phoenix, AZ
```

Check `logs` for: "resolved", "found N result items", or error messages.

**Step 5: Commit**

```bash
git add agent_finder/scrapers/craigslist_fsbo.py
git commit -m "fix: craigslist area resolution and updated post selectors for current layout"
```

---

## Task 5: Fix the FSBO.com Scraper

**Files:**
- Modify: `agent_finder/scrapers/fsbo_com.py`

**Step 1: Diagnose whether FSBO.com is JS-rendered**

Run the debug endpoint and check the `logs`:
```
http://localhost:9000/api/fsbo/debug-scraper?source=fsbo.com&location=Phoenix, AZ
```

In `_scrape_search_page`, add a log to see what HTML comes back:

```python
async def _scrape_search_page(self, criteria: FSBOSearchCriteria, page: int) -> List[str]:
    params = self._build_search_params(criteria, page)
    try:
        resp = await self._get(f"{BASE_URL}/search", params=params)
        logger.debug("fsbo.com search page %d: status=%d len=%d",
                     page, resp.status_code, len(resp.text))
        if resp.status_code != 200:
            logger.info("fsbo.com: non-200 response: %d", resp.status_code)
            return []

        soup = BeautifulSoup(resp.text, "lxml")

        # Log first 2000 chars of page for diagnosis
        logger.debug("fsbo.com HTML preview: %s", resp.text[:2000])

        # Try multiple selector strategies
        links = (
            soup.select("a[href*='/listing/']")
            or soup.select("a[href*='/property/']")
            or soup.select(".listing-card a")
            or soup.select(".property-card a")
            or soup.select("h2 a[href*='fsbo.com']")
            or soup.select("[class*='listing'] a")
            or soup.select("[class*='property'] a")
        )

        if not links:
            logger.info("fsbo.com: no listing links found on page %d — site may be JS-rendered or selectors outdated", page)
            # Check if it looks like an empty Next.js shell
            if soup.select_one("#__NEXT_DATA__"):
                logger.info("fsbo.com: Next.js detected — trying to parse __NEXT_DATA__")
                return self._parse_nextdata_for_urls(soup)
            return []

        # ... rest of existing code ...
```

**Step 2: Add `__NEXT_DATA__` fallback for FSBO.com**

Many real estate sites use Next.js. If FSBO.com is Next.js-rendered, we can still get data from the embedded JSON. Add this method:

```python
def _parse_nextdata_for_urls(self, soup: BeautifulSoup) -> List[str]:
    """Try to extract listing URLs from Next.js __NEXT_DATA__ if HTML is empty."""
    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        return []
    try:
        data = json.loads(script.string)
        # Search for any URLs containing '/listing/' in the data tree
        urls = []
        self._extract_listing_urls_from_json(data, urls, BASE_URL)
        logger.info("fsbo.com: found %d listing URLs in __NEXT_DATA__", len(urls))
        return urls[:50]  # Cap at 50
    except Exception as e:
        logger.debug("fsbo.com __NEXT_DATA__ parse failed: %s", e)
        return []

def _extract_listing_urls_from_json(self, node, urls: list, base: str, depth: int = 0):
    """Recursively search JSON for listing URLs."""
    if depth > 8:
        return
    if isinstance(node, str):
        if "/listing/" in node or "/property/" in node:
            full = node if node.startswith("http") else urljoin(base, node)
            if full not in urls:
                urls.append(full)
    elif isinstance(node, list):
        for item in node:
            self._extract_listing_urls_from_json(item, urls, base, depth + 1)
    elif isinstance(node, dict):
        for val in node.values():
            self._extract_listing_urls_from_json(val, urls, base, depth + 1)
```

You also need to add `import json` at the top of `fsbo_com.py` if not already present.

**Step 3: Test and verify**

```
http://localhost:9000/api/fsbo/debug-scraper?source=fsbo.com&location=Phoenix, AZ
```

Read the `logs` field. Based on what you see:
- If "Next.js detected": the `__NEXT_DATA__` path will try to extract URLs
- If HTML has listing links: the updated selectors will catch them
- If blocked (403): the circuit breaker will trip

**Step 4: Commit**

```bash
git add agent_finder/scrapers/fsbo_com.py
git commit -m "fix: add Next.js __NEXT_DATA__ fallback and diagnostic logging to fsbo.com scraper"
```

---

## Task 6: Fix the ForSaleByOwner.com Scraper

**Files:**
- Modify: `agent_finder/scrapers/forsalebyowner_com.py`

**Step 1: Add diagnostics and Next.js fallback (same pattern as Task 5)**

Apply the same strategy as Task 5 to ForSaleByOwner.com. Add import json if missing, add diagnostic logging, and add a `__NEXT_DATA__` extraction path.

Replace `_scrape_search_page` with:

```python
async def _scrape_search_page(self, criteria: FSBOSearchCriteria, page: int) -> List[str]:
    search_url = self._build_search_url(criteria, page)
    try:
        resp = await self._get(search_url)
        logger.debug("forsalebyowner.com page %d: status=%d url=%s len=%d",
                     page, resp.status_code, search_url, len(resp.text))
        if resp.status_code != 200:
            return []

        soup = BeautifulSoup(resp.text, "lxml")

        links = (
            soup.select("a[href*='/homes/']")
            or soup.select("a[href*='/listing/']")
            or soup.select(".property-card a")
            or soup.select(".listing-card a")
            or soup.select("[class*='property'] a[href]")
            or soup.select("[class*='listing'] a[href]")
            or soup.select("h2 a")
            or soup.select("h3 a")
        )

        if not links:
            logger.info("forsalebyowner.com: no links found on page %d", page)
            if soup.select_one("script#__NEXT_DATA__") or soup.select_one("[id='__NEXT_DATA__']"):
                logger.info("forsalebyowner.com: Next.js detected — trying JSON extraction")
                return self._parse_nextdata_for_urls(soup)
            return []

        seen = set()
        result = []
        for a in links:
            href = a.get("href", "")
            if href and href not in seen:
                full = href if href.startswith("http") else urljoin(BASE_URL, href)
                seen.add(href)
                result.append(full)
        logger.debug("forsalebyowner.com: found %d listing links on page %d", len(result), page)
        return result
    except Exception as e:
        logger.debug("forsalebyowner.com page %d failed: %s", page, e)
        return []

def _parse_nextdata_for_urls(self, soup: BeautifulSoup) -> List[str]:
    """Extract listing URLs from Next.js __NEXT_DATA__ JSON."""
    import json
    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        return []
    try:
        data = json.loads(script.string)
        urls = []
        self._extract_urls_from_json(data, urls, 0)
        logger.info("forsalebyowner.com: extracted %d URLs from __NEXT_DATA__", len(urls))
        return urls[:50]
    except Exception as e:
        logger.debug("forsalebyowner.com __NEXT_DATA__ parse failed: %s", e)
        return []

def _extract_urls_from_json(self, node, urls: list, depth: int):
    if depth > 8:
        return
    if isinstance(node, str) and "/homes/" in node and node.startswith("/"):
        full = urljoin(BASE_URL, node)
        if full not in urls:
            urls.append(full)
    elif isinstance(node, list):
        for item in node:
            self._extract_urls_from_json(item, urls, depth + 1)
    elif isinstance(node, dict):
        for val in node.values():
            self._extract_urls_from_json(val, urls, depth + 1)
```

**Step 2: Test**

```
http://localhost:9000/api/fsbo/debug-scraper?source=forsalebyowner.com&location=Phoenix, AZ
```

**Step 3: Commit**

```bash
git add agent_finder/scrapers/forsalebyowner_com.py
git commit -m "fix: add Next.js fallback, expanded selectors, and logging to forsalebyowner.com scraper"
```

---

## Task 7: Fix Source Names in FSBOListing for Frontend Consistency

**Files:**
- Modify: `agent_finder/scrapers/zillow_fsbo.py` (already done in Task 3 — verify)
- Modify: `agent_finder/scrapers/realtor_fsbo.py` (already done in Task 2 — verify)

The frontend SOURCES constant uses keys: `fsbo.com`, `forsalebyowner.com`, `zillow_fsbo`, `realtor_fsbo`, `craigslist`.

Run this check to verify all source names are correct:

```bash
python -c "
import ast, pathlib
for f in pathlib.Path('agent_finder/scrapers').glob('fsbo_*.py'):
    src = f.read_text()
    for line in src.splitlines():
        if 'source=' in line and ('fsbo' in line.lower() or 'zillow' in line.lower() or 'realtor' in line.lower() or 'craigslist' in line.lower()):
            print(f.name, ':', line.strip())
"
```

Expected output: all `source=` assignments should use `"realtor_fsbo"`, `"zillow_fsbo"`, `"fsbo.com"`, `"forsalebyowner.com"`, `"craigslist"`.

Fix any that don't match. Commit if any changed:

```bash
git add agent_finder/scrapers/
git commit -m "fix: normalize all FSBOListing source names to match frontend keys"
```

---

## Task 8: End-to-End Test and Deploy

**Step 1: Start the server**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
python -m uvicorn agent_finder.app:app --port 9000
```

**Step 2: Run all debug endpoints and confirm results**

```
http://localhost:9000/api/fsbo/debug-scraper?source=realtor_fsbo&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=zillow_fsbo&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=craigslist&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=fsbo.com&location=Phoenix, AZ
http://localhost:9000/api/fsbo/debug-scraper?source=forsalebyowner.com&location=Phoenix, AZ
```

Expected: At least 2 of the 5 sources return `result_count > 0`.

**Step 3: Run a full FSBO search from the browser**

Visit `http://localhost:9000/fsbo-finder`

Select Arizona → Phoenix → click Search.

Expected: Progress chips update, at least some listings appear.

**Step 4: Build frontend**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder\frontend" && npm run build
```

**Step 5: Push and deploy**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
git push origin master
cd frontend
npx vercel --prod
```

---

## Quick Reference: What Each Task Fixes

| Task | File | Fix |
|---|---|---|
| 1 | `app.py` | Debug endpoint to test scrapers individually |
| 2 | `realtor_fsbo.py` | Loosen FSBO filter (require MLS ID for exclusion), fix source name, add logging |
| 3 | `zillow_fsbo.py` | Resilient JSON tree search instead of hardcoded path, fix source name |
| 4 | `craigslist_fsbo.py` | Robust area resolution, updated selectors |
| 5 | `fsbo_com.py` | Next.js `__NEXT_DATA__` fallback, expanded selectors, diagnostic logging |
| 6 | `forsalebyowner_com.py` | Same as Task 5 |
| 7 | All scrapers | Verify source names match frontend keys |
| 8 | — | End-to-end test + deploy |
