# The Grand Dojo - Full Site Redesign

**Date:** 2026-02-22
**Status:** Approved
**Approach:** Each page is a unique room in a feudal Japanese dojo compound

---

## Design System Overhaul

### Color Palette - High Drama

- **Base:** `#06060f` (near-black blue-purple) - never flat, always layered with animated torch-light flicker, smoke/mist particles, ink wash texture overlays
- **Surface (cards):** Real wood texture (dark weathered oak with visible grain) - not CSS approximations
- **Gold:** Full metallic gradient `linear-gradient(135deg, #f5d078, #d4a853, #a67c2e)` with animated shimmer
- **Crimson:** `#8b0000` with blood-splash texture variant for emphasis
- **Embers:** Floating orange dots drifting upward on every page
- **Torch lighting:** Every page has 2+ animated warm radial light sources
- **Bamboo green:** `#4a7c59` for success/positive states
- **Steel blue:** `#4a6fa5` for informational (moonlight)
- **Parchment:** `#ede9e3` body text, `#f5f0e6` headings
- **Ink black:** `#1a1a2e` for text on light surfaces

### Typography

- **Display:** Onari (48-64px) with ink brush stroke underline animation on page titles
- **Body:** Add "Zen Kaku Gothic" for Japanese-flavored text
- **Numbers/Stats:** Rajdhani BOLD with gold gradient fill + CountUp
- **Kanji accents:** Decorative kanji watermarks (50% opacity) behind section headers

### Cards - Wooden Shrine Panels

- Real wood texture backgrounds (embedded SVG or optimized WebP)
- Metal corner brackets (ornate gold/iron SVG fittings at all 4 corners)
- Rope binding along top edge
- Hover: panel lifts, torch glow intensifies behind, shadow deepens
- Active: gold edge illumination (fire behind panel)
- Header bars: dark lacquered wood strip with gold inlay text

### Icons - Bold Ink Brush Illustrations

- Bold thick brush-stroke SVGs with visible brush texture
- Ink splatter/spray around edges
- Hover: brush stroke "draws" itself (SVG path animation)
- 2-color: ink black + gold accent
- 48px minimum in cards, 32px in nav
- Full icon set:
  - Katana = Contracts/Documents
  - Scroll = Scripts/Text
  - Shuriken = Quick actions/Search
  - Torii gate = Navigation/Entry
  - Compass/Map = Agent Finder/FSBO
  - Forge hammer = Lead Scrubbing
  - Ink brush = LOI/Writing
  - War fan (tessen) = Strategy/Process
  - Hawk = Direct outreach
  - Banner = Team/Recruitment
  - Lantern = Dashboard/Overview
  - Abacus = Underwriting/Numbers
  - Eye/Monomi = Admin oversight

### Per-Page Logo Variants

Take the main Dispo Dojo ninja logo and create a unique variant for each page:
- **Login:** Ninja at the gates, standing before torii
- **Dashboard:** Ninja holding a lantern, surveying the hall
- **CRM:** Ninja at a war table, moving pieces
- **Agent Finder:** Ninja with a telescope/spyglass on a tower
- **FSBO Finder:** Ninja crouching in a forest, tracking
- **Lead Scrubbing:** Ninja at an anvil/forge, hammering
- **Underwriting:** Ninja reading scrolls by candlelight
- **LOI Generator:** Ninja with an ink brush, writing calligraphy
- **Contract Generator:** Ninja pressing a seal/stamp
- **Scripts:** Ninja in training stance with bokken
- **Direct Agent:** Ninja launching a hawk from raised arm
- **Dispo Process:** Ninja studying a strategy map
- **Join Team:** Ninja holding a recruitment banner
- **Website Explainer:** Ninja gesturing/guiding (tour guide)
- **Admin:** Sensei ninja on elevated platform, arms crossed

Each variant is an SVG displayed in the page header area next to the page title.

### Sidebar - Weapon Rack

- Dark wood panel background with visible planks and nail heads
- Nav items are weapons/tools on pegs with brush icon + wooden plaque label
- Active: warm torch glow behind item
- Hover: weapon shifts like being pulled from rack
- Section headers: wood-burn/pyrography effect text
- Top: large Dispo Dojo clan crest
- Collapse: shoji screen slide animation

### Backgrounds - Living Environments (Every Page)

1. Base layer: scene-specific texture (wood, stone, paper, forest, etc.)
2. Atmosphere layer: drifting smoke/mist particles
3. Light layer: 2-3 animated torch/lantern warm radial glows
4. Ember layer: floating orange particles rising upward
5. Parallax: 2+ layers of parallax scrolling elements

### Page Transitions

- Tool pages: ink wash bleed across screen, dissolves
- Navigation pages: smoke bomb explosion from center, clears
- Quick actions: katana slash diagonal wipe
- Duration: 600-800ms

---

## Page-by-Page Designs

### 1. Login - "The Dojo Gates"

**3D Hero Scene (Three.js):**
- Full-screen: massive wooden torii gate with fog rolling through
- Two stone lanterns flanking path, flickering warm light
- Cherry blossom petals drifting through scene
- Camera slowly pushes toward gate on load
- Night sky with subtle stars behind

**Logo variant:** Ninja standing before torii gates

**Login Form:**
- Floating wooden panel (shrine offering box aesthetic)
- Form carved INTO the wood
- Inputs as parchment strips inset into panel
- "Enter the Dojo" button: large gold metallic with shimmer + katana icon
- Sign up: scroll unfurling animation to reveal fields
- Logo above: Dispo Dojo crest with ink brush draw-on animation

**Ambient:** Fireflies/embers, distant torch glow

---

### 2. Dashboard - "The Main Hall (Honbu Dojo)"

**Logo variant:** Ninja holding lantern, surveying hall

**Zone 1: Hero Banner**
- 3D Three.js scene: grand dojo hall interior - wooden floor, hanging banners, weapon displays
- "Welcome back, [Name]-san" in Onari 64px
- Date in English + stylized Japanese
- Animated clan crest spinning slowly in 3D

**Zone 2: Stats - "The Honor Wall"**
- Hanging scroll banners (kakejiku) for each stat
- Vertical scroll with kanji watermark, gold number (CountUp), brush-stroke label
- Scrolls sway gently, stagger-animate on scroll

**Zone 3: Tools - "The Weapon Wall"**
- NOT uniform cards. Weapons mounted on wooden wall
- Each tool: unique large brush icon on individual wooden plaque with metal pegs
- Tool name burned into wood beneath
- Hover: lifts off wall, glow intensifies, scroll tooltip unfurls
- Staggered masonry layout (different sizes by importance)
- Quick Actions horizontal rail at top

---

### 3. CRM - "The War Room (Sakusen-shitsu)"

**Logo variant:** Ninja at war table moving pieces

**Environment:** Dark room, tactical map table center, dim torchlight from corners

**Pipeline Toggle:**
- Two battle banners (nobori flags) at top
- Click banner to switch - raises and illuminates, other dims
- Ink splash transition

**Kanban Columns:**
- Each stage: vertical wooden post/pillar with carved name
- Cards hang from pillar like wooden prayer tags (ema)
- Column gradient: torch glow at top to shadow at bottom

**Lead Cards (Ema tags):**
- Pentagonal wooden plaque shape
- Wood texture, brush font address, gold amount
- Colored wax seal status (red/green/amber)
- Drag: lifts, shadow deepens, "pulling from peg" effect

**Lead Detail:**
- Slides in as hanging scroll that unrolls
- Ink brush section dividers, parchment inputs
- Action buttons as wax seal stamps

---

### 4. Agent Finder - "The Scout Tower (Monomi-yagura)"

**Logo variant:** Ninja with telescope on tower

**Environment:** High lookout tower, night sky, distant landscape silhouette

**Upload Zone:**
- "Dispatch scroll" - large rolled parchment in center
- Drop zone: unrolled section with "Place your scroll here"
- Drag hover: parchment glows, seal stamp appears
- Progress: ink filling across parchment

**Results:**
- Scout reports pinned to wooden board
- Agent info on parchment cards with wax seal status
- Burned-in wood text column headers

**Progress:**
- Hawk flying across distance bar (SVG animated)
- Scroll/telegram style status messages

---

### 5. FSBO Finder - "The Hunting Grounds"

**Logo variant:** Ninja crouching in forest, tracking

**Environment:** Nighttime forest. Trees silhouetted, moonlight filtering, fireflies.

**Background:** Deep forest gradient (dark greens/blacks), parallax tree layers, moon upper corner, fireflies

**Search:**
- Tracking map on parchment with compass rose
- Filters: wooden toggle switches on leather strap
- "Hunt" button: bold with hawk icon

**Results:**
- Trail markers/camp markers on forest path
- Wooden signpost cards with property info carved in
- Status: animal track icons (fresh = new, old = stale)

---

### 6. Lead Scrubbing - "The Forge (Kajiba)"

**Logo variant:** Ninja at anvil/forge, hammering

**Environment:** Blacksmith forge. Glowing furnace, anvil, sparks, dark iron and fire.

**Background:** Dark + intense orange/red forge glow, animated sparks, metal texture

**Process Steps (forging stages):**
1. "Raw Ore" - initial input (rock icons)
2. "Smelting" - processing (furnace glow animation)
3. "Hammering" - scrubbing (anvil strike animations)
4. "Tempering" - quality check (water splash)
5. "Finished Blade" - clean output (gleaming katana)

**Progress:** Blade being forged, filling hilt to tip

**Content:** Instructions on dark iron panels with rivets, links as glowing hot metal ingots

---

### 7. Underwriting - "The Scroll Library (Toshokan)"

**Logo variant:** Ninja reading scrolls by candlelight

**Environment:** Ancient library. Floor-to-ceiling shelves, rolled scrolls, desk with candle.

**Background:** Warm amber (candlelight). Bookshelves at edges, dust motes in candlelight beam.

**Form:**
- Desk workspace: parchment on wooden desk
- Form sections as different documents on desk
- Inputs: ink-on-parchment (warm cream backgrounds)
- Section headers: red wax seal with number
- Deal type selector (Cash/Sub2): two scroll tubes, click to unroll

**Submission:**
- Submit: red wax seal stamp animation
- Progress: candle burns down
- Success: scroll rolls up with gold ribbon

---

### 8. LOI Generator - "The Calligraphy Room"

**Logo variant:** Ninja with ink brush, writing

**Environment:** Serene calligraphy room. Paper, ink stone, brush rack, bamboo water feature.

**Background:** Lighter than other pages (cream/warm parchment base). Bamboo shadows, ink pot corner.

**Form (left):**
- Brush-stroke bordered inputs on cream parchment
- Calligraphy style labels
- Ink brush stroke section dividers

**Preview (right):**
- Live preview on scroll with aged paper texture
- Text with ink-writing animation (characters draw themselves)
- Wooden rollers at top and bottom

**Bulk Generation:**
- Stacked scrolls, each unfurls on click
- Export: roll up + wax stamp animation

---

### 9. Contract Generator - "The Seal Chamber"

**Logo variant:** Ninja pressing seal/stamp

**Environment:** Official chamber. Dark stone walls, gold trim, banners, central podium/desk, overhead lantern.

**Contract Builder:**
- Stepper: seal stamps in a row, each stamped on complete
- Form on heavy parchment on stone desk
- Gold-bordered field sections
- Dropdowns: scroll unfurls

**Signing:**
- Signature pad on silk texture
- Ink brush cursor while signing
- Post-sign: red seal stamp SLAMS down with gold sparks/particles

**Export:**
- Contract rolls into scroll with wax seal
- Download buttons as gold-embossed metal plates

---

### 10. Scripts - "The Training Dojo (Keikojo)"

**Logo variant:** Ninja in training stance with bokken

**Environment:** Training dojo floor. Practice dummies, padded mats, wall scrolls.

**Background:** Clean wooden floor, training equipment silhouettes, overhead lanterns

**Scripts:**
- Each script: hanging wall scroll (kakemono), click to unroll
- Objection handling as "defensive techniques":
  - Objection (attack): red card charging from left
  - Response (defense): gold card blocking from right
  - Animated clash effect

**Navigation:**
- Categories as training stations
- Tab nav: wooden plaques on wall

---

### 11. Direct Agent - "The Messenger Hawk Post"

**Logo variant:** Ninja launching hawk from raised arm

**Environment:** High tower, dawn sky, mountain backdrop, hawk perches, message scrolls.

**Background:** Dawn gradient (purple to amber), mountain silhouettes, circling hawk silhouette, wind particles

**Process Flow (message dispatch):**
1. Write message (scroll preparation)
2. Select target (map/compass)
3. Send hawk (launch animation)
4. Await response (hawk returning)
- Horizontal journey with hawk flying between stations

**Content:**
- Templates on small rolled parchments
- Tips in feather-bordered callouts
- Contact methods: different hawk breeds (playful theming)

---

### 12. Dispo Process - "The Strategy Board (Gunryaku)"

**Logo variant:** Ninja studying strategy map

**Environment:** War strategy room. Table with map, figurines, battle plans.

**Background:** Overhead strategy table, parchment map, candles at corners, war figurine silhouettes

**Process Flow:**
- Battle strategy map layout
- Steps as territories connected by dotted paths
- Ninja figurine silhouettes mark current position
- Click step: zooms into territory, reveals tactics scroll
- Progress: ink filling path between completed steps

**Content:**
- Tactical briefing format
- Metrics as army strength counters
- Tips as "intelligence reports" in sealed envelope cards

---

### 13. Join Team - "The Recruitment Hall (Boshuu-jo)"

**Logo variant:** Ninja holding recruitment banner

**Environment:** Grand hall. Clan banners from rafters, registration desk, honor board.

**Background:** Large hall, vertical nobori flags from ceiling, torch glow, wood and stone

**Job Description:**
- Official clan recruitment poster (large brush text)
- Ornate frame with clan crests
- Benefits as "training privileges" on wooden tokens

**Application:**
- Clan registration document on parchment with seals
- "Pledge Your Blade" submit button with sword-raise animation

**Team Info:**
- Members as warrior portrait frames (silhouettes + rank badges)
- Testimonials in scroll format

---

### 14. Website Explainer - "The Grand Tour (Annai)"

**Logo variant:** Ninja gesturing/guiding

**Environment:** Walking through dojo compound. Each section = a stop on the tour.

**Background:** Transitions between environments on scroll - gate > hall > rooms. Full scroll-driven animation.

**Layout:**
- Vertical scroll journey, each section a new room
- Parallax between sections
- Guide character: small ninja silhouette walks alongside on scroll
- Each tool section: miniature of that tool's page environment
- Section transitions: shoji doors sliding open

**CTAs:** "Try This Tool" as wooden directional signs pointing right

---

### 15. Admin Dashboard - "The Sensei's Quarters (Shihan no Ma)"

**Logo variant:** Sensei ninja on elevated platform, arms crossed

**Environment:** Elevated chamber overlooking dojo. Authority, oversight.

**Background:** Elevated platform view. Paper screens with shadows. Premium ink and gold.

**Stats:**
- Metrics on horizontal makimono scroll
- Brush-stroke styled charts
- Key numbers in extra-large gold calligraphy

**User Management:**
- "Student roster" vertical scroll with name stamps
- User rows: wooden plaque with avatar silhouette, username, activity
- Detail: student profile scroll unrolls on click
- Actions: seal/stamp styled buttons

**Activity Feed:**
- Incoming message scrolls from different dojo rooms
- Each entry: room icon + brief report

---

## Technical Notes

- Three.js 3D scenes on: Login, Dashboard hero, and CRM background
- All other pages: 2.5D parallax + GSAP/Framer Motion animations
- Wood textures: optimized WebP with SVG fallbacks
- Custom SVG icon set: 13+ brush-stroke icons with draw-on animations
- 15 ninja logo variants: SVG, displayed in page headers
- Respect prefers-reduced-motion for accessibility
- Lazy-load 3D scenes and heavy assets per page
