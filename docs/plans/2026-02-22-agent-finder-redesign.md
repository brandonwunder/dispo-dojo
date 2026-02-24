# Agent Finder Redesign — Glassmorphism Command Station Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign AgentFinder.jsx with a cinematic photo background and glassmorphism panels to match the login page aesthetic, while preserving all existing functionality 100%.

**Architecture:** Replace the night-sky gradient + WoodPanel layout with a 3-layer background (photo + vignette + bottom fade) and centered glass cards (max-w-[680px] for all panels, max-w-[1024px] for results table only). A local `GlassCard` component replaces all `WoodPanel` usage on this page. All state, effects, handlers, SSE logic, and subcomponents (StatusBadge, ConfidenceBar, DonutRing) are unchanged.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, inline styles for glassmorphism (pseudo-elements not possible in inline JSX)

---

### Task 1: Copy background image to public folder

**Files:**
- Create: `frontend/public/agent-finder-bg.png`

**Step 1: Copy the file**
```bash
cp "c:/Users/brand/OneDrive/Desktop/Agent Finder/Agent Finder Background.png" "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend/public/agent-finder-bg.png"
```

**Step 2: Verify**
```bash
ls "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend/public/"
```
Expected: `agent-finder-bg.png` listed alongside `logo.png`

**Step 3: Commit**
```bash
git add "frontend/public/agent-finder-bg.png"
git commit -m "chore: add Agent Finder background image to public assets"
```

---

### Task 2: Add GlassCard component + new background + hero header

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

This task rewrites the outer scaffold of the component: the background layers, the page wrapper, and the hero header. All the phase panels and job history are stubbed for Tasks 3–6.

**Step 1: Remove the WoodPanel import and starsRef**

Remove this import:
```jsx
import WoodPanel from '../components/WoodPanel'
```

Remove the `starsRef` declaration (lines ~359–365):
```jsx
// ── Stars (memoized positions) ──
const starsRef = useRef(
  Array.from({ length: 30 }, () => ({
    top: `${Math.random() * 50}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
  }))
)
```

**Step 2: Add the GlassCard helper component above AgentFinder (line ~119)**

Insert this before `export default function AgentFinder()`:

```jsx
// ─── Glass Card ──────────────────────────────────────────────────────────────
function GlassCard({ children, maxWidth = '680px' }) {
  return (
    <div
      style={{
        maxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '24px',
        background: 'rgba(11, 15, 20, 0.82)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        border: '1px solid rgba(0, 198, 255, 0.12)',
        borderRadius: '16px',
        boxShadow:
          '0 24px 48px -12px rgba(0,0,0,0.7), ' +
          '0 0 0 1px rgba(0,198,255,0.06), ' +
          'inset 0 1px 0 rgba(255,255,255,0.04), ' +
          'inset 0 0 40px rgba(0,198,255,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.5), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}
```

**Step 3: Rewrite the return statement outer scaffold**

Replace everything from `return (` to the end of the component with this scaffold (phases will be filled in Tasks 3–6):

```jsx
return (
  <div className="relative min-h-screen">
    {/* Progress bar shimmer keyframe */}
    <style>{`
      @keyframes progressShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>

    {/* ── Background layers ───────────────────────────────────────── */}
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Layer 0: Photo */}
      <img
        src="/agent-finder-bg.png"
        alt=""
        className="w-full h-full object-cover object-center"
        style={{ transform: 'scale(1.05)' }}
      />
      {/* Layer 1: Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 60% 40%, transparent 30%, rgba(11,15,20,0.68) 100%)',
        }}
      />
      {/* Layer 2: Bottom fade to page bg */}
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{ background: 'linear-gradient(to bottom, transparent, #0B0F14)' }}
      />
    </div>

    {/* ── Page content ────────────────────────────────────────────── */}
    <motion.div
      className="relative z-10 px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Hero header — floating over background, no panel */}
      <div className="text-center mb-8 max-w-[680px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
            <CompassIcon size={36} style={{ color: '#00C6FF' }} />
          </div>
          <h1
            className="font-display text-4xl"
            style={{
              color: '#F4F7FA',
              textShadow:
                '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
            }}
          >
            Agent Finder
          </h1>
        </div>
        <p
          className="font-heading text-xs uppercase"
          style={{
            color: '#00C6FF',
            letterSpacing: '0.14em',
            textShadow: '0 0 20px rgba(0,198,255,0.4)',
          }}
        >
          Scout Tower — Agent Dispatch
        </p>
        <p className="text-sm mt-2" style={{ color: '#C8D1DA' }}>
          Upload a property list and find listing agents for every address.
        </p>
      </div>

      {/* Phase panels */}
      <AnimatePresence mode="wait">
        {/* UPLOAD — Task 3 */}
        {/* PROCESSING — Task 4 */}
        {/* COMPLETE — Task 5 */}
        {/* ERROR — Task 6 */}
      </AnimatePresence>

      {/* JOB HISTORY — Task 6 */}
    </motion.div>
  </div>
)
```

**Step 4: Start dev server and verify**
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npm run dev
```
Navigate to http://localhost:5173/agent-finder
Expected: Background photo fills the page, hero header floats over it (no WoodPanel), page is otherwise blank (phases not rendered yet — that's expected)

---

### Task 3: Upload phase glass card

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` — replace the upload phase comment stub

**Step 1: Replace `{/* UPLOAD — Task 3 */}` with:**

```jsx
{phase === 'upload' && (
  <motion.div
    key="upload"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <GlassCard>
      <h2
        className="font-heading text-xs uppercase mb-5"
        style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
      >
        Upload Property List
      </h2>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative cursor-pointer rounded-xl flex flex-col items-center justify-center py-10 px-6 transition-all duration-300"
        style={{
          border: `2px dashed ${
            dragOver ? '#00C6FF' :
            file ? 'rgba(74, 124, 89, 0.5)' :
            'rgba(0, 198, 255, 0.25)'
          }`,
          background: dragOver
            ? 'rgba(0, 198, 255, 0.05)'
            : file
            ? 'rgba(74, 124, 89, 0.04)'
            : 'rgba(0, 198, 255, 0.02)',
          boxShadow: dragOver ? '0 0 30px rgba(0,198,255,0.12)' : 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(74,124,89,0.2)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="font-heading text-lg" style={{ color: '#F4F7FA' }}>{file.name}</p>
            <p className="text-sm mt-1" style={{ color: '#C8D1DA' }}>{formatBytes(file.size)}</p>
            <p className="text-xs mt-2" style={{ color: '#C49A20' }}>Click or drop to change file</p>
          </div>
        ) : (
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(0,198,255,0.08)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={{ color: '#C8D1DA' }}>
              <span className="font-heading" style={{ color: '#00C6FF' }}>Drop your file here</span>
              {' '}or click to browse
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(200,209,218,0.45)' }}>
              Accepts .csv, .xlsx, .xls
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm mt-3" style={{ color: '#EF5350' }}>{error}</p>
      )}

      {/* Upload button row */}
      <div className="mt-5 flex items-center gap-3">
        <motion.button
          onClick={handleUpload}
          disabled={!file || uploading}
          whileTap={file && !uploading ? { scale: 0.97 } : undefined}
          className={`
            group relative flex-1 inline-flex items-center justify-center
            font-heading tracking-widest uppercase font-semibold
            rounded-xl px-8 py-3 text-sm transition-all duration-300
            ${file && !uploading
              ? 'gold-shimmer text-bg shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)] hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]'
              : 'cursor-not-allowed'
            }
          `}
          style={!file || uploading ? { background: 'rgba(255,255,255,0.06)', color: '#8A9AAA' } : {}}
        >
          {file && !uploading && (
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {uploading ? (
              <><ShurikenLoader size={18} /> Uploading...</>
            ) : (
              <><CompassIcon size={18} /> Find Agents</>
            )}
          </span>
        </motion.button>

        {file && !uploading && (
          <button
            onClick={() => { setFile(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
            className="font-heading tracking-wider uppercase text-sm transition-colors"
            style={{ color: '#8A9AAA' }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF5350'}
            onMouseLeave={e => e.currentTarget.style.color = '#8A9AAA'}
          >
            Clear
          </button>
        )}
      </div>
    </GlassCard>
  </motion.div>
)}
```

**Step 2: Verify in browser**
Navigate to /agent-finder — confirm:
- Glass card visible with cyan accent line at top
- Drop zone has cyan dashed border
- "Find Agents" button is gold shimmer, full width

---

### Task 4: Processing phase glass card

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` — replace `{/* PROCESSING — Task 4 */}`

**Step 1: Replace processing stub with:**

```jsx
{phase === 'processing' && (
  <motion.div
    key="processing"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-heading text-xs uppercase"
          style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
        >
          Processing Addresses
        </h2>
        <span className="font-mono text-sm" style={{ color: '#8A9AAA' }}>
          {progress.completed} / {progress.total}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-5 rounded-full overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(246,196,69,0.1)',
        }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background:
              'linear-gradient(110deg, #a67c2e 0%, #d4a853 20%, #fce8a8 40%, #d4a853 60%, #a67c2e 100%)',
            backgroundSize: '200% 100%',
            animation: 'progressShimmer 2s linear infinite',
            boxShadow: '0 0 12px rgba(246,196,69,0.3)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xs font-heading font-bold tracking-wider"
            style={{
              color: progressPct > 50 ? '#0B0F14' : '#d4a853',
              textShadow: progressPct > 50 ? 'none' : '0 0 4px rgba(0,0,0,0.5)',
            }}
          >
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Stat chips — 3 columns */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Found', value: progress.found, color: '#4a7c59' },
          { label: 'Partial', value: progress.partial, color: '#d4a853' },
          { label: 'Cached', value: progress.cached, color: '#4a6fa5' },
          { label: 'Not Found', value: progress.not_found, color: '#EF5350' },
          { label: 'Total', value: progress.total, color: '#F4F7FA' },
          { label: 'Remaining', value: remaining, color: '#8A9AAA' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(0,198,255,0.04)',
              border: '1px solid rgba(0,198,255,0.08)',
            }}
          >
            <p
              className="font-heading text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p
              className="text-xs font-heading uppercase mt-1"
              style={{ color: '#8A9AAA', letterSpacing: '0.1em' }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Current address + ETA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        {progress.current_address && (
          <div className="flex items-center gap-2 min-w-0">
            <ShurikenLoader size={16} />
            <span className="text-sm truncate" style={{ color: '#C8D1DA' }}>
              <span style={{ color: '#C49A20' }}>Scanning:</span>{' '}
              {progress.current_address}
            </span>
          </div>
        )}
        {eta !== null && (
          <span className="text-sm font-mono whitespace-nowrap" style={{ color: '#8A9AAA' }}>
            ETA: {formatETA(eta)}
          </span>
        )}
      </div>

      {/* Cancel button */}
      <motion.button
        onClick={handleCancel}
        whileTap={{ scale: 0.97 }}
        className="w-full inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl py-2.5 text-sm transition-all"
        style={{
          background: 'rgba(229,57,53,0.12)',
          border: '1px solid rgba(229,57,53,0.28)',
          color: '#EF5350',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,57,53,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,57,53,0.12)'}
      >
        Cancel
      </motion.button>
    </GlassCard>
  </motion.div>
)}
```

**Step 2: Verify in browser**
You can simulate processing by temporarily setting `phase` to `'processing'` in the useState default, check that the card and stat chips render correctly, then revert.

---

### Task 5: Complete phase — summary card + results table

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` — replace `{/* COMPLETE — Task 5 */}`

**Step 1: Replace complete stub with:**

```jsx
{phase === 'complete' && (
  <motion.div
    key="complete"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {/* Summary card — 680px */}
    <GlassCard>
      <h2
        className="font-heading text-xs uppercase mb-5"
        style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
      >
        Results Summary
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <DonutRing
          found={resultFound}
          partial={resultPartial}
          cached={resultCached}
          notFound={resultNotFound}
          total={resultTotal}
        />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
          {[
            { label: 'Found', value: resultFound, color: '#4a7c59' },
            { label: 'Partial', value: resultPartial, color: '#d4a853' },
            { label: 'Cached', value: resultCached, color: '#4a6fa5' },
            { label: 'Not Found', value: resultNotFound, color: '#EF5350' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div>
                <span className="font-heading text-lg font-bold" style={{ color: '#F4F7FA' }}>{s.value}</span>
                <span className="text-sm ml-2" style={{ color: '#C8D1DA' }}>{s.label}</span>
              </div>
            </div>
          ))}
          <div className="col-span-2 pt-2" style={{ borderTop: '1px solid rgba(246,196,69,0.1)' }}>
            <span className="font-heading text-lg font-bold" style={{ color: '#F4F7FA' }}>{resultTotal}</span>
            <span className="text-sm ml-2" style={{ color: '#C8D1DA' }}>Total Addresses</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6">
        {jobId && (
          <motion.a
            href={`${API_BASE}/api/download/${jobId}`}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl px-8 py-3 text-sm gold-shimmer text-bg shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)] hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)] transition-all duration-300"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
            <span className="relative z-10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download ZIP
            </span>
          </motion.a>
        )}
        <motion.button
          onClick={handleReset}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl px-6 py-3 text-sm transition-all"
          style={{
            background: 'rgba(0,198,255,0.06)',
            border: '1px solid rgba(0,198,255,0.15)',
            color: '#00C6FF',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,198,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,198,255,0.06)'}
        >
          Process Another File
        </motion.button>
      </div>
    </GlassCard>

    {/* Results table — wider at 1024px */}
    {resultRows.length > 0 && (
      <GlassCard maxWidth="1024px">
        <h2
          className="font-heading text-xs uppercase mb-5"
          style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
        >
          Results ({resultRows.length} addresses)
        </h2>

        <div className="overflow-x-auto" style={{ margin: '0 -24px' }}>
          <table className="w-full min-w-[900px]" style={{ padding: '0 24px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,198,255,0.06)' }}>
                {['Address','Agent','Brokerage','Phone','Email','Status','List Date','DOM','Confidence'].map(col => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap"
                    style={{ color: '#F6C445', letterSpacing: '0.1em' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultRows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(246,196,69,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#F4F7FA' }}>{row.address || '--'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#F4F7FA' }}>{row.agent || row.agent_name || '--'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#C8D1DA' }}>{row.brokerage || row.office || '--'}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: '#C8D1DA' }}>{row.phone || '--'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#C8D1DA' }}>{row.email || '--'}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={row.status || 'not_found'} /></td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#C8D1DA' }}>{row.list_date || '--'}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: '#C8D1DA' }}>{row.dom ?? row.days_on_market ?? '--'}</td>
                  <td className="px-4 py-3"><ConfidenceBar value={row.confidence} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    )}
  </motion.div>
)}
```

---

### Task 6: Error phase + job history glass cards

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` — replace error and job history stubs

**Step 1: Replace `{/* ERROR — Task 6 */}` with:**

```jsx
{phase === 'error' && (
  <motion.div
    key="error"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <GlassCard>
      <div className="text-center py-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(229,57,53,0.14)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h3
          className="font-heading text-lg tracking-wider uppercase mb-2"
          style={{ color: '#EF5350' }}
        >
          {error?.includes('backend') || error?.includes('connection') || error?.includes('Failed to fetch')
            ? 'Backend Unavailable'
            : 'Something Went Wrong'}
        </h3>

        <p className="text-sm max-w-md mx-auto mb-2" style={{ color: '#C8D1DA' }}>{error}</p>

        {(error?.includes('backend') || error?.includes('connection') || error?.includes('Failed to fetch')) && (
          <div
            className="rounded-xl p-4 max-w-md mx-auto mt-4 text-left"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,198,255,0.08)',
            }}
          >
            <p
              className="text-xs font-heading tracking-wider uppercase mb-2"
              style={{ color: '#C49A20' }}
            >
              To start the backend:
            </p>
            <div className="rounded p-3 font-mono text-xs" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <p style={{ color: '#F6C445' }}>cd backend</p>
              <p style={{ color: '#F6C445' }}>python main.py</p>
              <p className="mt-1" style={{ color: 'rgba(200,209,218,0.4)' }}># Runs on localhost:9000</p>
            </div>
          </div>
        )}

        <motion.button
          onClick={handleReset}
          whileTap={{ scale: 0.97 }}
          className="mt-6 inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl px-6 py-2.5 text-sm transition-all"
          style={{
            background: 'rgba(0,198,255,0.06)',
            border: '1px solid rgba(0,198,255,0.15)',
            color: '#00C6FF',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,198,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,198,255,0.06)'}
        >
          Try Again
        </motion.button>
      </div>
    </GlassCard>
  </motion.div>
)}
```

**Step 2: Replace `{/* JOB HISTORY — Task 6 */}` with:**

```jsx
{jobs.length > 0 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
  >
    <GlassCard>
      <h2
        className="font-heading text-xs uppercase mb-5"
        style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
      >
        Job History
      </h2>

      <div className="space-y-2">
        {jobs.map((job) => (
          <div
            key={job.job_id || job.id}
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              background: 'rgba(0,198,255,0.03)',
              border: '1px solid rgba(0,198,255,0.08)',
            }}
          >
            <div className="min-w-0">
              <p className="font-heading text-sm truncate" style={{ color: '#F4F7FA' }}>
                {job.filename || job.file_name || 'Unknown file'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="text-xs" style={{ color: '#8A9AAA' }}>
                  {formatDate(job.created_at || job.date)}
                </span>
                <span className="text-xs" style={{ color: '#8A9AAA' }}>
                  {job.total || job.address_count || '?'} addresses
                </span>
                {(job.found != null || job.status_counts) && (
                  <span className="text-xs">
                    <span style={{ color: '#4a7c59' }}>
                      {job.found ?? job.status_counts?.found ?? 0} found
                    </span>
                    {' / '}
                    <span style={{ color: '#EF5350' }}>
                      {job.not_found ?? job.status_counts?.not_found ?? 0} missed
                    </span>
                  </span>
                )}
                {job.status && (
                  <span
                    className="text-xs font-heading tracking-wider uppercase"
                    style={{
                      color:
                        job.status === 'complete' ? '#4a7c59' :
                        job.status === 'processing' ? '#d4a853' :
                        job.status === 'cancelled' ? '#8A9AAA' :
                        '#EF5350',
                    }}
                  >
                    {job.status}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(job.status === 'complete' || job.status === 'completed') && (
                <a
                  href={`${API_BASE}/api/download/${job.job_id || job.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg font-heading tracking-wider uppercase text-xs font-semibold px-3 py-1.5 gold-shimmer text-bg hover:shadow-[0_2px_10px_-2px_rgba(212,168,83,0.4)] transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
              )}
              <button
                onClick={() => handleDelete(job.job_id || job.id)}
                className="inline-flex items-center gap-1.5 rounded-lg font-heading tracking-wider uppercase text-xs px-3 py-1.5 transition-all"
                style={{ color: '#8A9AAA', border: '1px solid transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#EF5350'
                  e.currentTarget.style.background = 'rgba(229,57,53,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(229,57,53,0.2)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#8A9AAA'
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  </motion.div>
)}
```

---

### Task 7: Final cleanup, build, and deploy

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` — verify WoodPanel import is removed

**Step 1: Confirm no WoodPanel references remain**
```bash
grep -n "WoodPanel\|starsRef\|twinkle\|night-sky\|Tower railing" "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend/src/pages/AgentFinder.jsx"
```
Expected: no output (all removed)

**Step 2: Build to catch any compile errors**
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npm run build
```
Expected: Build succeeded, no errors or warnings

**Step 3: Visual verification in browser**
Navigate to http://localhost:5173/agent-finder and confirm:
- [ ] Background photo fills the screen
- [ ] Hero header ("Agent Finder" + "Scout Tower") floats over the image, no panel behind it
- [ ] Upload card is centered, ~680px, glass style with cyan top accent
- [ ] Drop zone has cyan dashed border
- [ ] "Find Agents" button is gold shimmer, full width
- [ ] Job history rows are glass sub-cards with download/delete working

**Step 4: Commit and deploy**
```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: redesign Agent Finder with glassmorphism command station aesthetic

- Replace WoodPanel layout with centered glass cards (max-w-680px)
- Cinematic photo background with vignette + bottom fade
- Floating hero header with cyan glow over background
- Cyan accent (#00C6FF) as discovery-theme primary
- Results table widens to max-w-1024px for 9 columns
- All SSE / API / state logic unchanged

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npx vercel --prod
```

---

## Verification Checklist

1. Background photo visible (not night sky gradient)
2. Hero header floats over photo with no WoodPanel behind it
3. Upload card: centered, glass, max ~680px, cyan top-accent line
4. Drop zone: cyan dashed border; glows on drag-over
5. "Find Agents" gold shimmer button, full width when file selected
6. Processing card: gold shimmer progress bar (20px), 6 glass stat chips, cancel button
7. Complete phase: summary card (680px) + results table (1024px) below
8. Job history: glass sub-card rows, download + delete functional
9. Error phase: glass card with red icon and restart button
10. `npm run build` succeeds with no errors
11. No `WoodPanel` import or class references remain in AgentFinder.jsx
