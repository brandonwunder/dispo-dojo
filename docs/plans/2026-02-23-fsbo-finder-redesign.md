# FSBO Finder Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Redesign FSBOFinder to match AgentFinder's Electric Ninja aesthetic, replace free-text location with hierarchical State→City/ZIP dropdowns, add per-source result counts, and persist search history to SQLite.

**Architecture:** Frontend replaces the WoodPanel/forest theme with GlassCard glassmorphism backed by a FSBO background image and adds a reusable `SearchableSelect` component. A static `usLocations.js` data file provides all 50 US states and their major cities. The backend adds `fsbo_db.py` (SQLite persistence) and updates the FSBO endpoints to read/write from the DB. The pipeline gains per-source count in SSE events.

**Tech Stack:** React 19, Framer Motion, lucide-react, Tailwind CSS v4, Vite, FastAPI, SQLite (stdlib aiosqlite-free — uses `sqlite3` in thread executor), Python 3.x

**Design reference:** Match `frontend/src/pages/AgentFinder.jsx` exactly — GlassCard panels, cyan `#00C6FF` accents, gold `#F6C445`, dark bg `#0B0F14`, Rajdhani headings, DM Sans body.

**Source name mapping** (from `agent_finder/config.py` — these are the exact strings emitted by the pipeline as `current_source`):
- `"fsbo.com"` → FSBO.com
- `"forsalebyowner.com"` → ForSaleByOwner
- `"zillow_fsbo"` → Zillow
- `"realtor_fsbo"` → Realtor
- `"craigslist"` → Craigslist

---

### Task 1: Copy FSBO Background Image to Public

**Files:**
- Shell: copy `"FSBO Background Picture.png"` → `frontend/public/fsbo-bg.png`

**Step 1: Copy the file**

```bash
cp "c:/Users/brand/OneDrive/Desktop/Agent Finder/FSBO Background Picture.png" \
   "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend/public/fsbo-bg.png"
```

**Step 2: Verify the file exists**

```bash
ls frontend/public/fsbo-bg.png
```
Expected: file listed with non-zero size.

**Step 3: Commit**

```bash
git add frontend/public/fsbo-bg.png
git commit -m "feat: add FSBO background image to public assets"
```

---

### Task 2: Create US Locations Data File

**Files:**
- Create: `frontend/src/data/usLocations.js`

**Step 1: Create the file with complete data**

Create `frontend/src/data/usLocations.js` with the following complete content:

```js
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' },
]

export const CITIES_BY_STATE = {
  AL: ['Birmingham','Montgomery','Huntsville','Mobile','Tuscaloosa','Hoover','Dothan','Auburn','Decatur','Madison','Florence','Phenix City','Gadsden','Vestavia Hills','Prattville'],
  AK: ['Anchorage','Fairbanks','Juneau','Sitka','Ketchikan','Wasilla','Kenai','Kodiak','Bethel','Palmer'],
  AZ: ['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Glendale','Gilbert','Tempe','Peoria','Surprise','Yuma','Avondale','Goodyear','Flagstaff','Buckeye','Lake Havasu City','Casa Grande','Sierra Vista','Maricopa','Oro Valley'],
  AR: ['Little Rock','Fort Smith','Fayetteville','Springdale','Jonesboro','Conway','Rogers','Bentonville','Pine Bluff','Hot Springs','Benton','Texarkana','Sherwood','Jacksonville','North Little Rock'],
  CA: ['Los Angeles','San Diego','San Jose','San Francisco','Fresno','Sacramento','Long Beach','Oakland','Bakersfield','Anaheim','Santa Ana','Riverside','Stockton','Irvine','Chula Vista','Fremont','San Bernardino','Modesto','Fontana','Moreno Valley','Glendale','Huntington Beach','Santa Clarita','Garden Grove','Oceanside','Rancho Cucamonga','Santa Rosa','Ontario','Elk Grove','Corona','Lancaster','Salinas','Palmdale','Hayward','Pomona','Escondido','Torrance','Sunnyvale','Pasadena','Fullerton','Visalia','Orange','Roseville','Concord','Thousand Oaks','Simi Valley','Santa Clara','Vallejo','Berkeley','Downey'],
  CO: ['Denver','Colorado Springs','Aurora','Fort Collins','Lakewood','Thornton','Arvada','Westminster','Pueblo','Centennial','Boulder','Highlands Ranch','Greeley','Longmont','Loveland','Broomfield','Castle Rock','Commerce City','Parker','Northglenn','Brighton','Littleton','Englewood','Steamboat Springs','Durango'],
  CT: ['Bridgeport','New Haven','Hartford','Stamford','Waterbury','Norwalk','Danbury','New Britain','West Hartford','Greenwich','Hamden','Bristol','Meriden','Middletown','New London'],
  DE: ['Wilmington','Dover','Newark','Middletown','Smyrna','Milford','Seaford','Georgetown','Elsmere','New Castle'],
  FL: ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Port St. Lucie','Cape Coral','Pembroke Pines','Hollywood','Miramar','Gainesville','Coral Springs','Clearwater','Brandon','Lakeland','Pompano Beach','West Palm Beach','Davie','Boca Raton','Deltona','Palm Bay','Sunrise','Plantation','Deerfield Beach','Fort Myers','Melbourne','Palm Coast','Largo','Kissimmee','Boynton Beach','Daytona Beach','Miami Gardens','Ocala','Naples','Sarasota','Pensacola','Spring Hill'],
  GA: ['Atlanta','Augusta','Columbus','Macon','Savannah','Athens','Sandy Springs','Roswell','Albany','Johns Creek','Warner Robins','Alpharetta','Marietta','Valdosta','Smyrna','Dunwoody','Rome','East Point','Gainesville','Peachtree City','Kennesaw','South Fulton','Brookhaven','Stonecrest'],
  HI: ['Honolulu','Hilo','Kailua','Pearl City','Waipahu','Kaneohe','Mililani','Kahului','Kihei','Kapolei'],
  ID: ['Boise','Nampa','Meridian','Idaho Falls','Caldwell','Pocatello','Coeur d\'Alene','Twin Falls','Lewiston','Post Falls','Rexburg','Moscow'],
  IL: ['Chicago','Aurora','Joliet','Rockford','Springfield','Peoria','Elgin','Waukegan','Cicero','Champaign','Bloomington','Decatur','Evanston','Naperville','Schaumburg','Bolingbrook','Palatine','Skokie','Des Plaines','Orland Park'],
  IN: ['Indianapolis','Fort Wayne','Evansville','South Bend','Carmel','Fishers','Bloomington','Hammond','Gary','Lafayette','Muncie','Terre Haute','Greenwood','Anderson','Noblesville','Elkhart','Mishawaka','Lawrence','Jeffersonville','Columbus'],
  IA: ['Des Moines','Cedar Rapids','Davenport','Sioux City','Iowa City','Waterloo','Council Bluffs','Dubuque','Ames','West Des Moines','Ankeny','Urbandale','Cedar Falls','Marion','Bettendorf'],
  KS: ['Wichita','Overland Park','Kansas City','Olathe','Topeka','Lawrence','Shawnee','Manhattan','Lenexa','Salina','Hutchinson','Leawood','Dodge City','Garden City','Emporia'],
  KY: ['Louisville','Lexington','Bowling Green','Owensboro','Covington','Richmond','Georgetown','Florence','Hopkinsville','Nicholasville','Elizabethtown','Henderson','Frankfort','Independence','Jeffersontown'],
  LA: ['New Orleans','Baton Rouge','Shreveport','Metairie','Lafayette','Lake Charles','Kenner','Bossier City','Monroe','Alexandria','Houma','Marrero','New Iberia','Laplace','Slidell'],
  ME: ['Portland','Lewiston','Bangor','South Portland','Auburn','Biddeford','Augusta','Saco','Westbrook','Waterville'],
  MD: ['Baltimore','Frederick','Rockville','Gaithersburg','Bowie','Hagerstown','Annapolis','College Park','Salisbury','Waldorf','Columbia','Germantown','Silver Spring','Ellicott City','Glen Burnie'],
  MA: ['Boston','Worcester','Springfield','Lowell','Cambridge','New Bedford','Brockton','Quincy','Lynn','Fall River','Newton','Lawrence','Somerville','Framingham','Haverhill','Waltham','Malden','Brookline','Plymouth','Medford'],
  MI: ['Detroit','Grand Rapids','Warren','Sterling Heights','Ann Arbor','Lansing','Flint','Dearborn','Livonia','Westland','Troy','Southfield','Kalamazoo','Wyoming','Farmington Hills','Clinton Township','Novi','Dearborn Heights','Royal Oak','Taylor'],
  MN: ['Minneapolis','Saint Paul','Rochester','Duluth','Bloomington','Brooklyn Park','Plymouth','Maple Grove','Woodbury','St. Cloud','Eagan','Eden Prairie','Coon Rapids','Burnsville','Blaine'],
  MS: ['Jackson','Gulfport','Southaven','Biloxi','Hattiesburg','Olive Branch','Tupelo','Meridian','Greenville','Horn Lake','Pearl','Madison','Starkville','Clinton','Ridgeland'],
  MO: ['Kansas City','St. Louis','Springfield','Independence','Columbia','Lee\'s Summit','O\'Fallon','St. Joseph','St. Charles','Blue Springs','Joplin','Florissant','Chesterfield','Jefferson City','Cape Girardeau'],
  MT: ['Billings','Missoula','Great Falls','Bozeman','Butte','Helena','Kalispell','Havre','Anaconda','Miles City'],
  NE: ['Omaha','Lincoln','Bellevue','Grand Island','Kearney','Fremont','Norfolk','North Platte','Hastings','Columbus'],
  NV: ['Las Vegas','Henderson','Reno','North Las Vegas','Sparks','Carson City','Fernley','Elko','Mesquite','Boulder City'],
  NH: ['Manchester','Nashua','Concord','Derry','Dover','Rochester','Salem','Merrimack','Hudson','Londonderry'],
  NJ: ['Newark','Jersey City','Paterson','Elizabeth','Edison','Woodbridge','Lakewood','Toms River','Hamilton','Trenton','Clifton','Camden','Brick','Cherry Hill','Passaic','Union City','Bayonne','East Orange','Vineland','New Brunswick'],
  NM: ['Albuquerque','Las Cruces','Rio Rancho','Santa Fe','Roswell','Farmington','South Valley','Clovis','Hobbs','Alamogordo'],
  NY: ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','White Plains','Hempstead','Troy','Niagara Falls','Binghamton','Brooklyn','Queens','Bronx','Staten Island','Manhattan','Long Island','Poughkeepsie','Freeport','Valley Stream'],
  NC: ['Charlotte','Raleigh','Greensboro','Durham','Winston-Salem','Fayetteville','Cary','Wilmington','High Point','Concord','Greenville','Asheville','Gastonia','Rocky Mount','Huntersville','Chapel Hill','Burlington','Wilson','Kannapolis','Indian Trail'],
  ND: ['Fargo','Bismarck','Grand Forks','Minot','West Fargo','Williston','Dickinson','Mandan','Jamestown','Wahpeton'],
  OH: ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Parma','Canton','Youngstown','Lorain','Hamilton','Springfield','Kettering','Elyria','Lakewood','Cuyahoga Falls','Euclid','Middletown','Newark','Mansfield'],
  OK: ['Oklahoma City','Tulsa','Norman','Broken Arrow','Edmond','Lawton','Moore','Midwest City','Enid','Stillwater','Muskogee','Bartlesville','Owasso','Shawnee','Bixby'],
  OR: ['Portland','Salem','Eugene','Gresham','Hillsboro','Beaverton','Bend','Medford','Springfield','Corvallis','Albany','Lake Oswego','Tigard','Keizer','Grants Pass'],
  PA: ['Philadelphia','Pittsburgh','Allentown','Erie','Reading','Scranton','Bethlehem','Lancaster','Harrisburg','Altoona','York','Wilkes-Barre','Chester','Easton','State College'],
  RI: ['Providence','Warwick','Cranston','Pawtucket','East Providence','Woonsocket','North Providence','Cumberland','Coventry','Central Falls'],
  SC: ['Columbia','Charleston','North Charleston','Mount Pleasant','Rock Hill','Greenville','Summerville','Sumter','Hilton Head Island','Florence','Spartanburg','Goose Creek','Aiken','Myrtle Beach','Anderson'],
  SD: ['Sioux Falls','Rapid City','Aberdeen','Brookings','Watertown','Mitchell','Yankton','Pierre','Huron','Vermillion'],
  TN: ['Nashville','Memphis','Knoxville','Chattanooga','Clarksville','Murfreesboro','Jackson','Franklin','Johnson City','Bartlett','Hendersonville','Kingsport','Collierville','Smyrna','Cleveland'],
  TX: ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Laredo','Lubbock','Irving','Garland','Frisco','McKinney','Amarillo','Grand Prairie','Brownsville','Pasadena','Killeen','Mesquite','McAllen','Carrollton','Midland','Denton','Waco','Abilene','Odessa','Beaumont','Round Rock','Richardson','Tyler','Pearland','San Angelo','College Station','Lewisville','League City','Wichita Falls','Allen','Sugar Land','Edinburg','Cary','Longview','Mission'],
  UT: ['Salt Lake City','West Valley City','Provo','West Jordan','Orem','Sandy','Ogden','St. George','Layton','South Jordan','Millcreek','Taylorsville','Murray','Lehi','Herriman'],
  VT: ['Burlington','South Burlington','Rutland','Barre','Montpelier','St. Albans','Winooski','Newport','St. Johnsbury'],
  VA: ['Virginia Beach','Norfolk','Chesapeake','Richmond','Newport News','Alexandria','Hampton','Roanoke','Portsmouth','Suffolk','Lynchburg','Harrisonburg','Leesburg','Charlottesville','Blacksburg'],
  WA: ['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kent','Everett','Renton','Spokane Valley','Kirkland','Bellingham','Kennewick','Yakima','Federal Way','Redmond','Marysville','Pasco','Shoreline','Richland','South Hill'],
  WV: ['Charleston','Huntington','Parkersburg','Morgantown','Wheeling','Martinsburg','Fairmont','Beckley','Clarksburg','South Charleston'],
  WI: ['Milwaukee','Madison','Green Bay','Kenosha','Racine','Appleton','Waukesha','Oshkosh','Eau Claire','Janesville','West Allis','La Crosse','Sheboygan','Wauwatosa','Fond du Lac'],
  WY: ['Cheyenne','Casper','Laramie','Gillette','Rock Springs','Sheridan','Green River','Evanston','Riverton'],
  DC: ['Washington'],
}
```

**Step 2: Verify the file parses**

```bash
node -e "import('./frontend/src/data/usLocations.js').then(m => console.log('States:', m.US_STATES.length, 'Keys:', Object.keys(m.CITIES_BY_STATE).length))"
```
Expected: `States: 51 Keys: 51`

**Step 3: Commit**

```bash
git add frontend/src/data/usLocations.js
git commit -m "feat: add US states and cities data for FSBO location search"
```

---

### Task 3: Create SearchableSelect Component

**Files:**
- Create: `frontend/src/components/SearchableSelect.jsx`

**Step 1: Create the component**

```jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

/**
 * Searchable dropdown select.
 * Props:
 *   value: string — currently selected value
 *   onChange: (value: string) => void
 *   options: Array<{ value: string, label: string }>
 *   placeholder: string
 *   disabled?: boolean
 *   zipMode?: boolean — if true, typing 5 digits injects a "Use ZIP: XXXXX" option at top
 */
export default function SearchableSelect({ value, onChange, options = [], placeholder = 'Select...', disabled = false, zipMode = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Auto-focus search input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const isZipQuery = zipMode && /^\d{5}$/.test(query)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )
  const displayOptions = isZipQuery
    ? [{ value: query, label: `Use ZIP: ${query}`, isZip: true }, ...filtered]
    : filtered

  const selectedLabel = options.find(o => o.value === value)?.label || ''

  function handleSelect(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.35)',
          border: open ? '1px solid rgba(0,198,255,0.55)' : '1px solid rgba(0,198,255,0.18)',
          borderRadius: '8px',
          color: value ? '#F4F7FA' : '#8A9BB0',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          transition: 'border-color 0.15s',
          boxShadow: open ? '0 0 0 2px rgba(0,198,255,0.08)' : 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{
            color: '#8A9BB0',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'rgba(10,14,20,0.98)',
            border: '1px solid rgba(0,198,255,0.22)',
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,198,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(0,198,255,0.1)' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#8A9BB0' }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={zipMode ? 'Search or type a ZIP...' : 'Search...'}
                style={{
                  width: '100%',
                  padding: '7px 8px 7px 28px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: '#F4F7FA',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,198,255,0.2) transparent' }}>
            {displayOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', color: '#8A9BB0', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                No results
              </div>
            ) : displayOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  background: value === opt.value ? 'rgba(0,198,255,0.1)' : 'transparent',
                  color: opt.isZip ? '#00C6FF' : value === opt.value ? '#00C6FF' : '#F4F7FA',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'DM Sans, sans-serif',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.025)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,198,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'rgba(0,198,255,0.1)' : 'transparent'}
              >
                {value === opt.value && <Check size={12} style={{ color: '#00C6FF', flexShrink: 0 }} />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify no import errors**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npm run build 2>&1 | head -30
```
Expected: build succeeds (or no new errors introduced by this file — if it was already broken that's pre-existing).

**Step 3: Commit**

```bash
git add frontend/src/components/SearchableSelect.jsx
git commit -m "feat: add SearchableSelect reusable searchable dropdown component"
```

---

### Task 4: Add Per-Source Count to FSBOPipeline Progress Events

**Files:**
- Modify: `agent_finder/fsbo_pipeline.py`

The pipeline's `_emit` function currently does not include per-source listing counts. We need to add `source_count` to the emitted event so the frontend can show "N listings found" per source chip.

**Step 1: Read the current `_run_scraper` and `_emit` functions**

Read `agent_finder/fsbo_pipeline.py` and find the `_emit` function and `_run_scraper` inner function.

**Step 2: Modify `_emit` to accept and pass through `source_count`**

In `agent_finder/fsbo_pipeline.py`, find the `_emit` function definition. It currently looks like:

```python
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
            "status": "complete" if scrapers_done == self.SCRAPERS_TOTAL else "running",
        })
```

Change it to:

```python
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
```

(The only change is adding `"source_count": new_count` to the dict.)

**Step 3: Verify the app still loads**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder" && python -c "from agent_finder.app import app; print('App loaded OK')"
```
Expected: `App loaded OK`

**Step 4: Commit**

```bash
git add agent_finder/fsbo_pipeline.py
git commit -m "feat: emit per-source listing count in FSBO pipeline progress events"
```

---

### Task 5: Create SQLite Persistence Module

**Files:**
- Create: `agent_finder/fsbo_db.py`
- Note: The data directory `agent_finder/data/` already exists (it has `web_cache.db` and `craigslist_areas.json`)

**Step 1: Write the module**

Create `agent_finder/fsbo_db.py`:

```python
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
```

**Step 2: Write a quick smoke test**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder" && python -c "
from agent_finder.fsbo_db import save_search, save_listings, get_searches, get_listings, delete_search
from datetime import datetime

sid = 'test_001'
save_search(sid, 'AZ', 'Phoenix', 'Phoenix, AZ', 'city_state', datetime.now().isoformat(), {})
save_listings(sid, [{'address': '123 Main St', 'city': 'Phoenix', 'state': 'AZ', 'price': 300000, 'source': 'zillow', 'contact_status': 'none'}])
searches = get_searches()
listings = get_listings(sid)
assert len(searches) >= 1, 'no searches'
assert len(listings) == 1, 'no listings'
delete_search(sid)
assert not any(s['search_id'] == sid for s in get_searches()), 'not deleted'
print('fsbo_db OK')
"
```
Expected: `fsbo_db OK`

**Step 3: Commit**

```bash
git add agent_finder/fsbo_db.py
git commit -m "feat: add SQLite persistence module for FSBO search history"
```

---

### Task 6: Update app.py — FSBO Endpoints Use SQLite

**Files:**
- Modify: `agent_finder/app.py`

Read the full FSBO section of `agent_finder/app.py` first. You need to make four changes:

**Change 1: Import fsbo_db at top of file**

Find the existing FSBO imports (near the `from .fsbo_models import FSBOSearchCriteria` line). Add:

```python
from . import fsbo_db as fsbo_db
```

(Or if the existing imports are structured differently, add it alongside the other relative imports.)

**Change 2: Add `state` and `city_zip` fields to `FSBOSearchRequest`**

Find `class FSBOSearchRequest(BaseModel):` and add two optional fields:

```python
class FSBOSearchRequest(BaseModel):
    location: str
    location_type: str = "zip"
    radius_miles: int = 25
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    property_type: Optional[str] = None
    max_days_on_market: Optional[int] = None
    state: Optional[str] = None      # e.g. "AZ" — for display in search history
    city_zip: Optional[str] = None   # e.g. "Phoenix" or "85001" — for display
```

**Change 3: Update `POST /api/fsbo/search` to also persist to SQLite**

In the `fsbo_search` endpoint function, after creating `fsbo_searches[search_id] = { ... }`, add:

```python
    fsbo_db.save_search(
        search_id=search_id,
        state=req.state or "",
        city_zip=req.city_zip or req.location,
        location=req.location,
        location_type=req.location_type,
        created_at=fsbo_searches[search_id]["created_at"],
        criteria=req.dict(),
    )
```

**Change 4: Update `_run_fsbo_pipeline` to persist results to SQLite on completion**

In `_run_fsbo_pipeline`, find the line `search["status"] = "complete"` and add two lines before it:

```python
        fsbo_db.save_listings(search_id, results)
        fsbo_db.update_search_complete(search_id, len(results))
        search["status"] = "complete"
```

**Change 5: Update `GET /api/fsbo/searches` to read from SQLite**

Find the `fsbo_list_searches` endpoint. Replace its body to read from SQLite (so history survives restarts), merging with any in-progress searches from memory:

```python
@api.get("/fsbo/searches")
async def fsbo_list_searches():
    """List all FSBO searches (from SQLite, includes history)."""
    db_searches = fsbo_db.get_searches()
    # Overlay in-memory status for any currently-running searches
    for s in db_searches:
        mem = fsbo_searches.get(s["search_id"])
        if mem and mem["status"] in ("running", "error", "cancelled"):
            s["status"] = mem["status"]
            s["total_listings"] = mem.get("total_listings", 0)
    return db_searches
```

**Change 6: Update `GET /api/fsbo/results/{search_id}` to fall back to SQLite**

Find the `fsbo_results` endpoint. Update it to check memory first, then SQLite:

```python
@api.get("/fsbo/results/{search_id}")
async def fsbo_results(search_id: str, page: int = 1, per_page: int = 20):
    """Return paginated results. Checks memory first, then SQLite."""
    # In-memory (in-progress or just completed this session)
    search = fsbo_searches.get(search_id)
    if search:
        results = search.get("results") or []
    else:
        # Load from SQLite (persisted from previous sessions)
        results = fsbo_db.get_listings(search_id)
    if not search and not results:
        raise HTTPException(404, "Search not found.")
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "search_id": search_id,
        "total": len(results),
        "page": page,
        "per_page": per_page,
        "results": results[start:end],
    }
```

**Change 7: Update `DELETE /api/fsbo/searches/{search_id}` to also delete from SQLite**

Find the `fsbo_delete_search` endpoint. Add `fsbo_db.delete_search(search_id)` before the return:

```python
@api.delete("/fsbo/searches/{search_id}")
async def fsbo_delete_search(search_id: str):
    """Cancel and delete a FSBO search."""
    in_memory = search_id in fsbo_searches
    in_db = any(s["search_id"] == search_id for s in fsbo_db.get_searches())
    if not in_memory and not in_db:
        raise HTTPException(404, "Search not found.")
    task = _fsbo_tasks.get(search_id)
    if task and not task.done():
        task.cancel()
    fsbo_searches.pop(search_id, None)
    _fsbo_tasks.pop(search_id, None)
    fsbo_db.delete_search(search_id)
    return {"ok": True}
```

**Step after all changes: Verify the app loads**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder" && python -c "from agent_finder.app import app; print('App loaded OK')"
```
Expected: `App loaded OK`

**Commit**

```bash
git add agent_finder/app.py
git commit -m "feat: persist FSBO searches and results to SQLite; update endpoints to read from DB"
```

---

### Task 7: Rewrite FSBOFinder.jsx

**Files:**
- Modify: `frontend/src/pages/FSBOFinder.jsx` (complete rewrite)

Read the current `frontend/src/pages/FSBOFinder.jsx` first to understand the current structure, then replace it entirely with the new design below.

The new component uses:
- GlassCard inline style (no WoodPanel, no forest theme)
- `FSBO Background Picture.png` as `/fsbo-bg.png` with 4 gradient overlays
- `SearchableSelect` from `../components/SearchableSelect`
- `US_STATES`, `CITIES_BY_STATE` from `../data/usLocations`
- State → City/ZIP hierarchical search
- Per-source progress chips (5 sources)
- Filter pills (All / Has Phone / Has Email / Has Contact)
- Past searches section (from SQLite via API)

**Complete new `FSBOFinder.jsx`:**

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Search, Download, ChevronDown, ChevronUp,
  Trash2, Phone, Mail, ExternalLink, SlidersHorizontal,
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import { US_STATES, CITIES_BY_STATE } from '../data/usLocations'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES = [
  { key: 'fsbo.com',           label: 'FSBO.com',        color: '#F6C445' },
  { key: 'forsalebyowner.com', label: 'ForSaleByOwner',  color: '#22C55E' },
  { key: 'zillow_fsbo',        label: 'Zillow',          color: '#00C6FF' },
  { key: 'realtor_fsbo',       label: 'Realtor',         color: '#E53935' },
  { key: 'craigslist',         label: 'Craigslist',      color: '#A78BFA' },
]

const CONTACT_LABEL = {
  full: 'Full Contact', partial: 'Phone + Name', phone_only: 'Phone Only',
  email_only: 'Email Only', none: 'No Contact', anonymous: 'Anonymous',
}
const CONTACT_COLOR = {
  full: '#22C55E', partial: '#F6C445', phone_only: '#F6C445',
  email_only: '#F6C445', none: '#8A9BB0', anonymous: '#8A9BB0',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GC = {
  background: 'rgba(11,15,20,0.82)',
  backdropFilter: 'blur(20px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid rgba(0,198,255,0.12)',
  borderRadius: '16px',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}

function CyanLine() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.5), transparent)',
    }} />
  )
}

function formatPrice(p) {
  if (p == null) return '—'
  return '$' + p.toLocaleString()
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FSBOFinder() {
  // Search form
  const [selectedState, setSelectedState] = useState('')
  const [selectedCityZip, setSelectedCityZip] = useState('')
  const [isZipSearch, setIsZipSearch] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [minBeds, setMinBeds] = useState('Any')
  const [minBaths, setMinBaths] = useState('Any')
  const [propertyType, setPropertyType] = useState('All')
  const [maxDom, setMaxDom] = useState('')

  // Search state
  const [phase, setPhase] = useState('idle') // 'idle' | 'loading' | 'complete'
  const [searchId, setSearchId] = useState(null)
  const [searchLabel, setSearchLabel] = useState('')
  const [scrapersStatus, setScrapersStatus] = useState({}) // key → { done, count }
  const [liveCount, setLiveCount] = useState(0)
  const [results, setResults] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')

  // Past searches
  const [pastSearches, setPastSearches] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [expandedResults, setExpandedResults] = useState({}) // id → listings[]

  const esRef = useRef(null)

  // Load past searches on mount
  useEffect(() => { loadPastSearches() }, [])

  async function loadPastSearches() {
    try {
      const r = await fetch('/api/fsbo/searches')
      if (r.ok) {
        const data = await r.json()
        // Only show completed searches in history; running ones show in the progress panel
        setPastSearches(data.filter(s => s.status === 'complete'))
      }
    } catch {}
  }

  // ── Location helpers ──────────────────────────────────────────────────────

  function handleStateChange(code) {
    setSelectedState(code)
    setSelectedCityZip('')
    setIsZipSearch(false)
  }

  function handleCityZipChange(val) {
    setSelectedCityZip(val)
    setIsZipSearch(/^\d{5}$/.test(val))
  }

  const stateOptions = US_STATES.map(s => ({ value: s.code, label: s.name }))
  const cityOptions = selectedState
    ? (CITIES_BY_STATE[selectedState] || []).map(c => ({ value: c, label: c }))
    : []

  const selectedStateName = US_STATES.find(s => s.code === selectedState)?.name || ''
  const canSearch = Boolean(selectedState && selectedCityZip)

  // ── Search ────────────────────────────────────────────────────────────────

  async function handleSearch() {
    if (!canSearch) return
    if (esRef.current) { esRef.current.close(); esRef.current = null }

    const location = isZipSearch ? selectedCityZip : `${selectedCityZip}, ${selectedState}`
    const location_type = isZipSearch ? 'zip' : 'city_state'
    const label = isZipSearch ? `ZIP ${selectedCityZip}, ${selectedStateName}` : `${selectedCityZip}, ${selectedStateName}`

    setPhase('loading')
    setScrapersStatus({})
    setLiveCount(0)
    setResults([])
    setSearchLabel(label)
    setActiveFilter('all')

    const body = {
      location, location_type,
      state: selectedState,
      city_zip: selectedCityZip,
      min_price: priceMin ? parseInt(priceMin) : null,
      max_price: priceMax ? parseInt(priceMax) : null,
      min_beds: minBeds !== 'Any' ? parseInt(minBeds) : null,
      min_baths: minBaths !== 'Any' ? parseFloat(minBaths) : null,
      property_type: propertyType !== 'All' ? propertyType.toLowerCase().replace(/\s+/g, '_') : null,
      max_days_on_market: maxDom ? parseInt(maxDom) : null,
    }

    try {
      const r = await fetch('/api/fsbo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { search_id } = await r.json()
      setSearchId(search_id)

      const es = new EventSource(`/api/fsbo/progress/${search_id}`)
      esRef.current = es

      es.onmessage = async (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'complete' || data.status === 'complete') {
          es.close()
          esRef.current = null
          try {
            const res = await fetch(`/api/fsbo/results/${search_id}?per_page=200`)
            const resData = await res.json()
            setResults(resData.results || [])
          } catch {}
          setPhase('complete')
          loadPastSearches()
        } else {
          if (data.current_source) {
            setScrapersStatus(prev => ({
              ...prev,
              [data.current_source]: { done: true, count: data.source_count ?? 0 },
            }))
          }
          setLiveCount(data.listings_found ?? 0)
        }
      }
      es.onerror = () => {
        es.close()
        esRef.current = null
        setPhase('complete')
        loadPastSearches()
      }
    } catch {
      setPhase('idle')
    }
  }

  // ── Past search expansion ─────────────────────────────────────────────────

  async function toggleExpand(sid) {
    if (expandedId === sid) { setExpandedId(null); return }
    setExpandedId(sid)
    if (!expandedResults[sid]) {
      try {
        const r = await fetch(`/api/fsbo/results/${sid}?per_page=200`)
        const data = await r.json()
        setExpandedResults(prev => ({ ...prev, [sid]: data.results || [] }))
      } catch {
        setExpandedResults(prev => ({ ...prev, [sid]: [] }))
      }
    }
  }

  async function deleteSearch(sid) {
    try {
      await fetch(`/api/fsbo/searches/${sid}`, { method: 'DELETE' })
      setPastSearches(prev => prev.filter(s => s.search_id !== sid))
      if (expandedId === sid) setExpandedId(null)
    } catch {}
  }

  // ── Results filtering ─────────────────────────────────────────────────────

  function applyFilter(list) {
    if (activeFilter === 'phone') return list.filter(r => r.phone)
    if (activeFilter === 'email') return list.filter(r => r.email)
    if (activeFilter === 'contact') return list.filter(r => r.phone || r.email)
    return list
  }

  const filteredResults = applyFilter(results)

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* ── Background layers ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* Layer 0: FSBO background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/fsbo-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: '82% 30%',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Layer 1: radial darkening */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 65% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.88) 100%)',
        }} />
        {/* Layer 2: linear + radial combined */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,15,20,0.55) 0%, rgba(11,15,20,0.25) 40%, rgba(11,15,20,0.7) 100%)',
        }} />
        {/* Layer 3: left-edge darkening */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(11,15,20,0.75) 0%, transparent 50%)',
        }} />
        {/* Layer 4: bottom fade to page bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
          background: 'linear-gradient(to bottom, transparent, #0B0F14)',
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Hero header ── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(0,198,255,0.1)',
              border: '1px solid rgba(0,198,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,198,255,0.2)',
            }}>
              <MapPin
                size={26}
                style={{ color: '#00C6FF', filter: 'drop-shadow(0 0 8px rgba(0,198,255,0.7))' }}
              />
            </div>
          </div>
          <h1 style={{
            fontFamily: 'Onari, serif',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 400,
            color: '#F4F7FA',
            margin: '0 0 12px',
            textShadow: '0 2px 20px rgba(0,198,255,0.15)',
            letterSpacing: '0.02em',
          }}>
            FSBO Lead Finder
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C8D1DA',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '480px',
            marginInline: 'auto',
          }}>
            Search For Sale By Owner listings across the US — powered by multiple free data sources.
          </p>
        </div>

        {/* ── Search form ── */}
        <motion.div style={GC} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <CyanLine />

          {/* State + City row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                State
              </label>
              <SearchableSelect
                value={selectedState}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Select a state..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                City or ZIP
              </label>
              <SearchableSelect
                value={selectedCityZip}
                onChange={handleCityZipChange}
                options={cityOptions}
                placeholder={selectedState ? 'Select city or enter ZIP...' : 'Select state first'}
                disabled={!selectedState}
                zipMode={true}
              />
            </div>
          </div>

          {/* Filters toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8A9BB0',
              fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
              cursor: 'pointer', padding: '4px 0', marginBottom: filtersOpen ? '12px' : '16px',
            }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Filters panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(0,198,255,0.08)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}>
                  {[
                    { label: 'Min Price', value: priceMin, set: setPriceMin, type: 'number', placeholder: '200000' },
                    { label: 'Max Price', value: priceMax, set: setPriceMax, type: 'number', placeholder: '600000' },
                    { label: 'Max Days Listed', value: maxDom, set: setMaxDom, type: 'number', placeholder: '90' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%', padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,198,255,0.15)',
                          borderRadius: '7px',
                          color: '#F4F7FA',
                          fontSize: '13px',
                          fontFamily: 'DM Sans, sans-serif',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  {[
                    { label: 'Min Beds', value: minBeds, set: setMinBeds, opts: ['Any','1','2','3','4','5+'] },
                    { label: 'Min Baths', value: minBaths, set: setMinBaths, opts: ['Any','1','2','3','4+'] },
                    { label: 'Property Type', value: propertyType, set: setPropertyType, opts: ['All','Single Family','Multi-Family','Condo','Townhouse','Land'] },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                        {f.label}
                      </label>
                      <select
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,198,255,0.15)',
                          borderRadius: '7px',
                          color: '#F4F7FA',
                          fontSize: '13px',
                          fontFamily: 'DM Sans, sans-serif',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch || phase === 'loading'}
            className="gold-shimmer"
            style={{
              width: '100%', padding: '12px',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '15px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none', borderRadius: '8px',
              cursor: canSearch && phase !== 'loading' ? 'pointer' : 'not-allowed',
              opacity: canSearch && phase !== 'loading' ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Search size={15} />
            {phase === 'loading' ? 'Searching...' : 'Search'}
          </button>
        </motion.div>

        {/* ── Loading / progress panel ── */}
        <AnimatePresence>
          {phase === 'loading' && (
            <motion.div
              style={{ ...GC, marginTop: '20px' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CyanLine />
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#8A9BB0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
                Searching {searchLabel} across 5 sources...
              </p>

              {/* Shimmer progress bar */}
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((Object.keys(scrapersStatus).length / 5) * 100)}%`,
                  background: 'linear-gradient(110deg, #a67c2e 0%, #d4a853 20%, #fce8a8 40%, #d4a853 60%, #a67c2e 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'progressShimmer 1.4s linear infinite',
                  transition: 'width 0.5s ease',
                  borderRadius: '3px',
                }} />
              </div>

              {/* Live count */}
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C8D1DA', marginBottom: '16px', marginTop: 0 }}>
                <span style={{ color: '#F6C445', fontWeight: 600 }}>{liveCount}</span> listings found so far...
              </p>

              {/* Per-source chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                {SOURCES.map(s => {
                  const st = scrapersStatus[s.key]
                  return (
                    <div key={s.key} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${st?.done ? s.color + '40' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '8px',
                      transition: 'border-color 0.3s',
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: st?.done ? s.color : 'rgba(255,255,255,0.2)',
                        boxShadow: st?.done ? `0 0 6px ${s.color}` : 'none',
                        flexShrink: 0,
                        animation: !st?.done ? 'pulse 1.5s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', fontWeight: 600, color: '#C8D1DA' }}>{s.label}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: st?.done ? s.color : '#8A9BB0' }}>
                        {st?.done ? `${st.count}` : '…'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div style={{ marginTop: '20px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: '#F4F7FA', letterSpacing: '0.03em' }}>
                    {results.length} FSBO Listings
                  </span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#8A9BB0', marginLeft: '8px' }}>
                    — {searchLabel}
                  </span>
                </div>
                {searchId && (
                  <a
                    href={`/api/fsbo/download/${searchId}?fmt=csv`}
                    download
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px',
                      background: 'rgba(0,198,255,0.08)',
                      border: '1px solid rgba(0,198,255,0.25)',
                      borderRadius: '8px',
                      color: '#00C6FF',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    <Download size={13} />
                    Export CSV
                  </a>
                )}
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'phone', label: 'Has Phone' },
                  { key: 'email', label: 'Has Email' },
                  { key: 'contact', label: 'Has Contact' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: activeFilter === f.key ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.1)',
                      background: activeFilter === f.key ? 'rgba(0,198,255,0.15)' : 'rgba(0,0,0,0.2)',
                      color: activeFilter === f.key ? '#00C6FF' : '#C8D1DA',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: activeFilter === f.key ? '0 0 8px rgba(0,198,255,0.2)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                    {f.key === 'all' && ` (${results.length})`}
                  </button>
                ))}
              </div>

              {/* Results grid */}
              {filteredResults.length === 0 ? (
                <div style={{ ...GC, textAlign: 'center', padding: '48px 24px' }}>
                  <CyanLine />
                  <p style={{ color: '#8A9BB0', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', margin: 0 }}>
                    No listings found for this search — try a nearby city or different state.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {filteredResults.map((row, i) => (
                    <ResultCard key={i} row={row} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Past Searches ── */}
        {pastSearches.length > 0 && (
          <motion.div style={{ ...GC, marginTop: '32px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CyanLine />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', fontWeight: 700, color: '#F4F7FA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Past Searches
                <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.2)', borderRadius: '12px', color: '#00C6FF', fontSize: '11px' }}>
                  {pastSearches.length}
                </span>
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastSearches.map(s => {
                const hasResults = s.total_listings > 0
                const isExpanded = expandedId === s.search_id
                const expRes = expandedResults[s.search_id] || []
                const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                return (
                  <div key={s.search_id} style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${isExpanded ? 'rgba(0,198,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    {/* Row header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.search_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        {isExpanded
                          ? <ChevronUp size={14} style={{ color: '#00C6FF', flexShrink: 0 }} />
                          : <ChevronDown size={14} style={{ color: '#8A9BB0', flexShrink: 0 }} />
                        }
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F4F7FA' }}>
                          {s.city_zip || s.location}{s.state ? `, ${s.state}` : ''}
                        </span>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A9BB0' }}>{dateStr}</span>
                        <span style={{
                          marginLeft: 'auto',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                          background: hasResults ? 'rgba(74,124,89,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${hasResults ? 'rgba(74,124,89,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: hasResults ? '#4ade80' : '#8A9BB0',
                        }}>
                          {s.total_listings} {s.total_listings === 1 ? 'listing' : 'listings'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSearch(s.search_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A9BB0', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Expanded results */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {expRes.length === 0 ? (
                              <p style={{ color: '#8A9BB0', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginTop: '12px' }}>No listings stored for this search.</p>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '12px' }}>
                                {expRes.map((row, i) => <ResultCard key={i} row={row} compact />)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* progressShimmer keyframe */}
      <style>{`
        @keyframes progressShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ row, compact = false }) {
  const source = SOURCES.find(s => s.key === row.source) || { label: row.source, color: '#8A9BB0' }
  const contactColor = CONTACT_COLOR[row.contact_status] || '#8A9BB0'
  const contactLabel = CONTACT_LABEL[row.contact_status] || row.contact_status || 'Unknown'

  return (
    <div style={{
      background: 'rgba(11,15,20,0.7)',
      border: '1px solid rgba(0,198,255,0.1)',
      borderRadius: '12px',
      padding: compact ? '12px' : '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Address + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: compact ? '12px' : '13px', color: '#F4F7FA', fontWeight: 600, lineHeight: 1.4 }}>
          {row.address}
        </span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: compact ? '14px' : '16px', fontWeight: 700, color: '#F6C445', flexShrink: 0 }}>
          {formatPrice(row.price)}
        </span>
      </div>

      {/* Beds / Baths / DOM */}
      {(row.beds != null || row.baths != null || row.days_on_market != null) && (
        <div style={{ display: 'flex', gap: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A9BB0' }}>
          {row.beds != null && <span>{row.beds} bd</span>}
          {row.baths != null && <span>{row.baths} ba</span>}
          {row.days_on_market != null && <span>{row.days_on_market}d listed</span>}
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: source.color + '1A', border: `1px solid ${source.color}40`, color: source.color,
        }}>{source.label}</span>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: contactColor + '1A', border: `1px solid ${contactColor}40`, color: contactColor,
        }}>{contactLabel}</span>
      </div>

      {/* Contact info */}
      {(row.phone || row.email) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {row.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C8D1DA' }}>
              <Phone size={11} style={{ color: '#F6C445' }} />
              {row.phone}
            </div>
          )}
          {row.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C8D1DA' }}>
              <Mail size={11} style={{ color: '#00C6FF' }} />
              {row.email}
            </div>
          )}
        </div>
      )}

      {/* View listing link */}
      {row.listing_url && (
        <a
          href={row.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#00C6FF',
            textDecoration: 'none', marginTop: '2px',
          }}
        >
          <ExternalLink size={11} />
          View Listing
        </a>
      )}
    </div>
  )
}
```

**Step 2: Build the frontend**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npm run build 2>&1 | tail -10
```
Expected: `✓ built in X.XXs` with no errors.

**Step 3: Commit**

```bash
git add frontend/src/pages/FSBOFinder.jsx
git commit -m "feat: redesign FSBOFinder with Electric Ninja theme, state/city dropdowns, per-source counts, and past searches"
```

---

### Task 8: Verify End-to-End

**Step 1: Confirm backend is running on port 9000**

```bash
curl -s http://localhost:9000/api/fsbo/searches | python -m json.tool | head -5
```
If not running, start it:
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder" && python -m uvicorn agent_finder.app:app --port 9000 &
```

**Step 2: Verify all API endpoints respond**

```bash
# List searches (should return array, possibly empty)
curl -s http://localhost:9000/api/fsbo/searches

# Run a test search
curl -s -X POST http://localhost:9000/api/fsbo/search \
  -H "Content-Type: application/json" \
  -d '{"location":"Phoenix, AZ","location_type":"city_state","state":"AZ","city_zip":"Phoenix"}' | python -m json.tool
```

**Step 3: Visit the page in browser**

Open `http://localhost:9000/fsbo-finder`

Check:
- [ ] FSBO background image visible with gradient fade (matches AgentFinder style)
- [ ] "FSBO Lead Finder" title with MapPin icon and cyan glow
- [ ] State dropdown — searchable, shows all 50 states
- [ ] Select "Arizona" → City/ZIP dropdown activates with AZ cities
- [ ] Type "85001" in city/zip dropdown → "Use ZIP: 85001" appears at top
- [ ] Filters section expands/collapses
- [ ] "Search" button disabled until both state + city/zip selected
- [ ] After search: progress bar + 5 source chips update in real-time
- [ ] Results display with source badges, contact badges, phone/email, View Listing links
- [ ] Filter pills work (Has Phone, Has Email, Has Contact)
- [ ] Export CSV button present
- [ ] Refresh page → Past Searches section shows previous search with listing count
- [ ] Expand a past search → result cards appear
- [ ] Delete a past search → removed from list

**Step 4: Final commit and deploy**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
git push origin master
cd frontend && npx vercel --prod
```
