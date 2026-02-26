# Under Construction Page Toggle System + Sidebar Enhancements

**Date:** 2026-02-25
**Status:** Approved

## Summary

Admin-controlled page toggle system that lets you mark any page as "Under Construction" from the admin panel. Changes propagate instantly to all users via Firestore real-time listeners. Also includes moving Live Deals to the top of the sidebar with a gold glow effect.

## Data Model

Single Firestore document at `config/pageStatus`:

```json
{
  "pages": {
    "lead-scrubbing": "construction",
    "agent-finder": "live",
    "loi-sender": "construction",
    ...
  }
}
```

- Values: `"live"` or `"construction"`
- Pages not in the map default to `"live"`

## Architecture

### New Files

1. **`frontend/src/context/PageStatusContext.jsx`**
   - React context provider
   - Subscribes to `config/pageStatus` via Firestore `onSnapshot` (real-time)
   - Exposes `pageStatuses` map and `isPageLive(slug)` helper
   - Wraps the app in `App.jsx`

2. **`frontend/src/components/UnderConstruction.jsx`**
   - Themed "dojo being prepared" full-page component
   - Ninja aesthetic: katana/shuriken icon, themed messaging
   - Electric ninja colors: dark bg, cyan/gold accents, subtle animation
   - "Go Back to Dashboard" button

### Modified Files

3. **`frontend/src/App.jsx`**
   - Wrap app with `<PageStatusProvider>`
   - Add `<PageGate slug="...">` wrapper around each toggleable route
   - PageGate renders the real page if live, UnderConstruction if not

4. **`frontend/src/components/Sidebar.jsx`**
   - Read page statuses from context
   - Construction pages: show with "Coming Soon" badge (gold/amber pill), still clickable
   - Move Live Deals to the very top of nav (below admin link)
   - Style Live Deals as gold glowing button (#F6C445 glow, pulse animation)

5. **`frontend/src/pages/AdminDashboard.jsx`**
   - New "Page Management" tab
   - Grid of cards, one per toggleable page
   - Each card: page name, status indicator (green Live / amber Construction), toggle switch
   - Toggle writes directly to Firestore `config/pageStatus` doc

## User Flow

1. **App loads** → `PageStatusProvider` subscribes to Firestore config doc
2. **User navigates** → `PageGate` checks page status
3. **If construction** → Renders themed `UnderConstruction` component (sidebar stays visible)
4. **Admin toggles** → Firestore doc updates → real-time listener fires → all users see change instantly

## Sidebar Enhancements

- **Live Deals** moved to top position with gold glow button (#F6C445)
- Construction pages shown with "Coming Soon" badge, still in navigation
- Maintains existing section groupings for all other pages

## Toggleable Pages

All 17 content pages are toggleable. Login, Dashboard, Admin, and Ninja Profile are excluded (always live).
