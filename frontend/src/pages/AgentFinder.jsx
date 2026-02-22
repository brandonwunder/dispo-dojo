import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WoodPanel from '../components/WoodPanel'
import ShurikenLoader from '../components/ShurikenLoader'
import { CompassIcon } from '../components/icons/index'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatETA(seconds) {
  if (!seconds || seconds <= 0) return '--'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.ceil(seconds % 60)
  return `${m}m ${s}s`
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const STATUS_COLORS = {
  found: { bg: 'bg-bamboo/20', text: 'text-bamboo', border: 'border-bamboo/30', label: 'Found' },
  partial: { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold/30', label: 'Partial' },
  cached: { bg: 'bg-steel/20', text: 'text-steel', border: 'border-steel/30', label: 'Cached' },
  not_found: { bg: 'bg-crimson/20', text: 'text-crimson-bright', border: 'border-crimson/30', label: 'Not Found' },
}

const API_BASE = import.meta.env.VITE_API_URL || ''

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.not_found
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-heading tracking-wider uppercase border ${colors.bg} ${colors.text} ${colors.border}`}>
      {colors.label}
    </span>
  )
}

// ─── Confidence Bar ─────────────────────────────────────────────────────────

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100)
  const color = pct >= 80 ? 'bg-bamboo' : pct >= 50 ? 'bg-gold' : 'bg-crimson-bright'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-dim font-mono">{pct}%</span>
    </div>
  )
}

// ─── Donut Ring ─────────────────────────────────────────────────────────────

function DonutRing({ found, partial, cached, notFound, total }) {
  const size = 120
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeTotal = total || 1

  const segments = [
    { value: found, color: '#4a7c59' },
    { value: partial, color: '#d4a853' },
    { value: cached, color: '#4a6fa5' },
    { value: notFound, color: '#a83232' },
  ]

  let offset = 0
  const successRate = total > 0 ? Math.round(((found + partial + cached) / total) * 100) : 0

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const segLen = (seg.value / safeTotal) * circumference
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          )
          offset += segLen
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="gold-shimmer-text font-heading text-2xl font-bold">{successRate}%</span>
        <span className="text-text-dim text-xs font-heading tracking-wider uppercase">Success</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AgentFinder() {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('upload') // 'upload' | 'processing' | 'complete' | 'error'
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    found: 0,
    partial: 0,
    cached: 0,
    not_found: 0,
    current_address: '',
  })
  const [results, setResults] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)
  const sseRef = useRef(null)
  const startTimeRef = useRef(null)
  const [eta, setEta] = useState(null)

  // ── Load job history on mount ──
  useEffect(() => {
    loadJobs()
  }, [])

  // ── Cleanup SSE on unmount ──
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [])

  // ── Calculate ETA when progress updates ──
  useEffect(() => {
    if (phase !== 'processing' || !startTimeRef.current) return
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const remaining = progress.total - progress.completed
    if (progress.completed > 0) {
      const perItem = elapsed / progress.completed
      setEta(perItem * remaining)
    }
  }, [progress.completed, progress.total, phase])

  // ── API calls ──

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`)
      if (res.ok) {
        const data = await res.json()
        setJobs(Array.isArray(data) ? data : data.jobs || [])
      }
    } catch {
      // Backend may not be running — silently fail
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || `Upload failed (${res.status})`)
      }

      const data = await res.json()
      setJobId(data.job_id)
      setProgress(prev => ({ ...prev, total: data.total, completed: 0, found: 0, partial: 0, cached: 0, not_found: 0, current_address: '' }))
      setPhase('processing')
      startTimeRef.current = Date.now()
      connectSSE(data.job_id)
    } catch (err) {
      setError(err.message || 'Failed to upload file. Make sure the backend is running on localhost:9000.')
      setPhase('error')
    } finally {
      setUploading(false)
    }
  }

  const connectSSE = useCallback((id) => {
    if (sseRef.current) {
      sseRef.current.close()
    }

    const source = new EventSource(`${API_BASE}/api/progress/${id}`)
    sseRef.current = source

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        if (data.type === 'progress') {
          setProgress({
            completed: data.completed || 0,
            total: data.total || 0,
            found: data.found || 0,
            partial: data.partial || 0,
            cached: data.cached || 0,
            not_found: data.not_found || 0,
            current_address: data.current_address || '',
          })
        } else if (data.type === 'complete') {
          setResults(data)
          setPhase('complete')
          source.close()
          sseRef.current = null
          loadJobs()
        } else if (data.type === 'error') {
          setError(data.message || 'An error occurred during processing.')
          setPhase('error')
          source.close()
          sseRef.current = null
        }
      } catch {
        // Malformed SSE data — ignore
      }
    }

    source.onerror = () => {
      source.close()
      sseRef.current = null
      // Only set error if we're still in processing phase
      setPhase((prev) => {
        if (prev === 'processing') {
          setError('Lost connection to the server. The job may still be running — check job history.')
          return 'error'
        }
        return prev
      })
    }
  }, [])

  const handleCancel = async () => {
    if (!jobId) return
    try {
      await fetch(`${API_BASE}/api/jobs/${jobId}/cancel`, { method: 'POST' })
    } catch {
      // Best effort
    }
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    setPhase('upload')
    setJobId(null)
    setProgress({ completed: 0, total: 0, found: 0, partial: 0, cached: 0, not_found: 0, current_address: '' })
    setFile(null)
    loadJobs()
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/api/jobs/${id}`, { method: 'DELETE' })
      loadJobs()
    } catch {
      // Best effort
    }
  }

  const handleReset = () => {
    setFile(null)
    setPhase('upload')
    setJobId(null)
    setProgress({ completed: 0, total: 0, found: 0, partial: 0, cached: 0, not_found: 0, current_address: '' })
    setResults(null)
    setError(null)
    setEta(null)
    startTimeRef.current = null
  }

  // ── Drag & drop handlers ──

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && isValidFile(dropped)) {
      setFile(dropped)
      setError(null)
    } else {
      setError('Please drop a .csv, .xlsx, or .xls file.')
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  const isValidFile = (f) => {
    const validExts = ['.csv', '.xlsx', '.xls']
    const name = f.name.toLowerCase()
    return validExts.some(ext => name.endsWith(ext))
  }

  // ── Computed values ──

  const progressPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
  const remaining = progress.total - progress.completed

  const resultRows = results?.results || results?.rows || []
  const resultFound = results?.found ?? progress.found
  const resultPartial = results?.partial ?? progress.partial
  const resultCached = results?.cached ?? progress.cached
  const resultNotFound = results?.not_found ?? progress.not_found
  const resultTotal = results?.total ?? progress.total

  // ── Stars (memoized positions) ──
  const starsRef = useRef(
    Array.from({ length: 30 }, () => ({
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
    }))
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[calc(100vh-120px)]">
      {/* Twinkle keyframe */}
      <style>{`
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(212, 168, 83, 0.2); }
          50% { box-shadow: 0 0 20px rgba(212, 168, 83, 0.4); }
        }
      `}</style>

      {/* Night sky background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, #0a0a20 0%, #06060f 60%, #1a1510 100%)'
      }}>
        {starsRef.current.map((star, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/30" style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            animation: 'twinkle 3s ease-in-out infinite alternate',
          }} />
        ))}
      </div>

      {/* Tower railing at bottom edge */}
      <div className="fixed bottom-0 left-[250px] right-0 h-16 z-[5] pointer-events-none wood-panel-dark border-t-2 border-gold-dim/20" />

      {/* Content wrapper */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Main header panel */}
        <WoodPanel withRope headerBar="Scout Tower — Agent Dispatch" className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <CompassIcon size={32} className="text-gold" />
            <div>
              <h1 className="font-display text-2xl text-parchment leading-none">Agent Finder</h1>
              <p className="text-text-dim text-sm mt-1">Upload a property list and find listing agents for every address.</p>
            </div>
          </div>
        </WoodPanel>

        {/* ═══ UPLOAD PHASE ══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WoodPanel className="mb-4">
                <h2 className="font-heading text-gold text-sm tracking-widest uppercase mb-4">Upload Property List</h2>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer rounded-sm
                    border-2 border-dashed transition-all duration-300
                    flex flex-col items-center justify-center py-12 px-6
                    ${dragOver
                      ? 'border-gold bg-gold/5 shadow-[0_0_30px_rgba(212,168,83,0.15)]'
                      : file
                        ? 'border-bamboo/40 bg-bamboo/5'
                        : 'border-gold-dim/30 hover:border-gold-dim/50 hover:bg-white/[0.02]'
                    }
                  `}
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
                      <div className="w-12 h-12 rounded-full bg-bamboo/20 flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bamboo">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <p className="text-parchment font-heading text-lg">{file.name}</p>
                      <p className="text-text-dim text-sm mt-1">{formatBytes(file.size)}</p>
                      <p className="text-gold-dim text-xs mt-2">Click or drop to change file</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="text-text-dim">
                        <span className="text-gold font-heading">Drop your file here</span> or click to browse
                      </p>
                      <p className="text-text-dim/60 text-xs mt-2">Accepts .csv, .xlsx, .xls</p>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="mt-4 flex items-center gap-3">
                  <motion.button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    whileTap={file && !uploading ? { scale: 0.95 } : undefined}
                    className={`
                      group relative inline-flex items-center justify-center
                      rounded-xl font-heading tracking-widest uppercase font-semibold
                      px-8 py-3 text-sm transition-all duration-300
                      ${file && !uploading
                        ? 'gold-shimmer text-bg shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)] hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]'
                        : 'bg-white/5 text-text-dim cursor-not-allowed'
                      }
                    `}
                  >
                    {file && !uploading && (
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {uploading ? (
                        <>
                          <ShurikenLoader size={18} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CompassIcon size={18} />
                          Find Agents
                        </>
                      )}
                    </span>
                  </motion.button>

                  {file && !uploading && (
                    <button
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-text-dim hover:text-crimson-bright text-sm font-heading tracking-wider uppercase transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </WoodPanel>
            </motion.div>
          )}

          {/* ═══ PROCESSING PHASE ══════════════════════════════════════════ */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WoodPanel className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-gold text-sm tracking-widest uppercase">Processing Addresses</h2>
                  <span className="font-mono text-text-dim text-sm">{progress.completed} / {progress.total}</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-4 rounded-full bg-white/5 overflow-hidden mb-6 border border-gold-dim/10">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(110deg, #a67c2e 0%, #d4a853 20%, #fce8a8 40%, #d4a853 60%, #a67c2e 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'progressShimmer 2s linear infinite',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-heading font-bold tracking-wider" style={{
                      color: progressPct > 50 ? '#06060f' : '#d4a853',
                      textShadow: progressPct > 50 ? 'none' : '0 0 4px rgba(0,0,0,0.5)',
                    }}>
                      {progressPct}%
                    </span>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {[
                    { label: 'Found', value: progress.found, color: 'text-bamboo' },
                    { label: 'Partial', value: progress.partial, color: 'text-gold' },
                    { label: 'Cached', value: progress.cached, color: 'text-steel' },
                    { label: 'Not Found', value: progress.not_found, color: 'text-crimson-bright' },
                    { label: 'Total', value: progress.total, color: 'text-parchment' },
                    { label: 'Remaining', value: remaining, color: 'text-text-dim' },
                  ].map((stat) => (
                    <div key={stat.label} className="wood-panel-light rounded-sm border border-gold-dim/10 p-3 text-center">
                      <p className={`font-heading text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-text-dim text-xs font-heading tracking-wider uppercase mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Current address & ETA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  {progress.current_address && (
                    <div className="flex items-center gap-2 min-w-0">
                      <ShurikenLoader size={16} />
                      <span className="text-text-dim text-sm truncate">
                        <span className="text-gold-dim">Scanning:</span> {progress.current_address}
                      </span>
                    </div>
                  )}
                  {eta !== null && (
                    <span className="text-text-dim text-sm font-mono whitespace-nowrap">
                      ETA: {formatETA(eta)}
                    </span>
                  )}
                </div>

                {/* Cancel button */}
                <motion.button
                  onClick={handleCancel}
                  whileTap={{ scale: 0.95 }}
                  className="
                    inline-flex items-center justify-center
                    rounded-xl font-heading tracking-widest uppercase font-semibold
                    px-6 py-2.5 text-sm
                    bg-crimson/80 text-parchment
                    hover:bg-crimson-bright transition-colors
                  "
                >
                  Cancel
                </motion.button>
              </WoodPanel>
            </motion.div>
          )}

          {/* ═══ COMPLETE PHASE ════════════════════════════════════════════ */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary */}
              <WoodPanel className="mb-4">
                <h2 className="font-heading text-gold text-sm tracking-widest uppercase mb-4">Results Summary</h2>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Donut chart */}
                  <DonutRing
                    found={resultFound}
                    partial={resultPartial}
                    cached={resultCached}
                    notFound={resultNotFound}
                    total={resultTotal}
                  />

                  {/* Stats breakdown */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
                    {[
                      { label: 'Found', value: resultFound, color: '#4a7c59' },
                      { label: 'Partial', value: resultPartial, color: '#d4a853' },
                      { label: 'Cached', value: resultCached, color: '#4a6fa5' },
                      { label: 'Not Found', value: resultNotFound, color: '#a83232' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <div>
                          <span className="text-parchment font-heading text-lg font-bold">{s.value}</span>
                          <span className="text-text-dim text-sm ml-2">{s.label}</span>
                        </div>
                      </div>
                    ))}
                    <div className="col-span-2 pt-2 border-t border-gold-dim/10">
                      <span className="text-parchment font-heading text-lg font-bold">{resultTotal}</span>
                      <span className="text-text-dim text-sm ml-2">Total Addresses</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-6">
                  {jobId && (
                    <motion.a
                      href={`${API_BASE}/api/download/${jobId}`}
                      whileTap={{ scale: 0.95 }}
                      className="
                        group relative inline-flex items-center justify-center
                        rounded-xl font-heading tracking-widest uppercase font-semibold
                        px-8 py-3 text-sm gold-shimmer text-bg
                        shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)]
                        hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]
                        transition-all duration-300
                      "
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
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
                    whileTap={{ scale: 0.95 }}
                    className="
                      inline-flex items-center justify-center
                      rounded-xl font-heading tracking-widest uppercase font-semibold
                      px-6 py-3 text-sm
                      wood-panel border border-gold-dim/20 text-gold
                      hover:bg-gold/10 transition-colors
                    "
                  >
                    Process Another File
                  </motion.button>
                </div>
              </WoodPanel>

              {/* Results table */}
              {resultRows.length > 0 && (
                <WoodPanel className="mb-4">
                  <h2 className="font-heading text-gold text-sm tracking-widest uppercase mb-4">
                    Results ({resultRows.length} addresses)
                  </h2>

                  <div className="overflow-x-auto -mx-5">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="lacquer-bar">
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">Address</th>
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">Agent</th>
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">Brokerage</th>
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">Phone</th>
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">Email</th>
                          <th className="px-4 py-3 text-center font-heading text-gold text-xs tracking-widest uppercase">Status</th>
                          <th className="px-4 py-3 text-left font-heading text-gold text-xs tracking-widest uppercase">List Date</th>
                          <th className="px-4 py-3 text-right font-heading text-gold text-xs tracking-widest uppercase">DOM</th>
                          <th className="px-4 py-3 text-center font-heading text-gold text-xs tracking-widest uppercase">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultRows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-white/5 hover:bg-gold/[0.03] transition-colors"
                          >
                            <td className="px-4 py-3 text-parchment text-sm max-w-[200px] truncate">{row.address || '--'}</td>
                            <td className="px-4 py-3 text-parchment text-sm">{row.agent || row.agent_name || '--'}</td>
                            <td className="px-4 py-3 text-text-dim text-sm">{row.brokerage || row.office || '--'}</td>
                            <td className="px-4 py-3 text-text-dim text-sm font-mono">{row.phone || '--'}</td>
                            <td className="px-4 py-3 text-text-dim text-sm">{row.email || '--'}</td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={row.status || 'not_found'} />
                            </td>
                            <td className="px-4 py-3 text-text-dim text-sm">{row.list_date || '--'}</td>
                            <td className="px-4 py-3 text-text-dim text-sm text-right font-mono">{row.dom ?? row.days_on_market ?? '--'}</td>
                            <td className="px-4 py-3">
                              <ConfidenceBar value={row.confidence} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </WoodPanel>
              )}
            </motion.div>
          )}

          {/* ═══ ERROR PHASE ═══════════════════════════════════════════════ */}
          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WoodPanel className="mb-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-crimson/20 flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crimson-bright">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>

                  <h3 className="font-heading text-crimson-bright text-lg tracking-wider uppercase mb-2">
                    {error?.includes('backend') || error?.includes('connection') || error?.includes('Failed to fetch')
                      ? 'Backend Unavailable'
                      : 'Something Went Wrong'}
                  </h3>

                  <p className="text-text-dim text-sm max-w-md mx-auto mb-2">{error}</p>

                  {(error?.includes('backend') || error?.includes('connection') || error?.includes('Failed to fetch')) && (
                    <div className="wood-panel-light rounded-sm border border-gold-dim/10 p-4 max-w-md mx-auto mt-4 text-left">
                      <p className="text-gold-dim text-xs font-heading tracking-wider uppercase mb-2">To start the backend:</p>
                      <div className="bg-black/30 rounded p-3 font-mono text-xs text-text-dim">
                        <p className="text-gold">cd backend</p>
                        <p className="text-gold">python main.py</p>
                        <p className="text-text-dim/50 mt-1"># Runs on localhost:9000</p>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.95 }}
                    className="
                      mt-6 inline-flex items-center justify-center
                      rounded-xl font-heading tracking-widest uppercase font-semibold
                      px-6 py-2.5 text-sm
                      wood-panel border border-gold-dim/20 text-gold
                      hover:bg-gold/10 transition-colors
                    "
                  >
                    Try Again
                  </motion.button>
                </div>
              </WoodPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ JOB HISTORY ═════════════════════════════════════════════════ */}
        {jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <WoodPanel className="mb-4">
              <h2 className="font-heading text-gold text-sm tracking-widest uppercase mb-4">Job History</h2>

              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.job_id || job.id}
                    className="wood-panel-light rounded-sm border border-gold-dim/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-parchment font-heading text-sm truncate">
                        {job.filename || job.file_name || 'Unknown file'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="text-text-dim text-xs">{formatDate(job.created_at || job.date)}</span>
                        <span className="text-text-dim text-xs">{job.total || job.address_count || '?'} addresses</span>
                        {(job.found != null || job.status_counts) && (
                          <span className="text-xs">
                            <span className="text-bamboo">{job.found ?? job.status_counts?.found ?? 0} found</span>
                            {' / '}
                            <span className="text-crimson-bright">{job.not_found ?? job.status_counts?.not_found ?? 0} missed</span>
                          </span>
                        )}
                        {job.status && (
                          <span className={`text-xs font-heading tracking-wider uppercase ${
                            job.status === 'complete' ? 'text-bamboo' :
                            job.status === 'processing' ? 'text-gold' :
                            job.status === 'cancelled' ? 'text-text-dim' :
                            'text-crimson-bright'
                          }`}>
                            {job.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(job.status === 'complete' || job.status === 'completed') && (
                        <a
                          href={`${API_BASE}/api/download/${job.job_id || job.id}`}
                          className="
                            inline-flex items-center gap-1.5
                            rounded-lg font-heading tracking-wider uppercase text-xs font-semibold
                            px-3 py-1.5
                            gold-shimmer text-bg
                            hover:shadow-[0_2px_10px_-2px_rgba(212,168,83,0.4)]
                            transition-all
                          "
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
                        className="
                          inline-flex items-center gap-1.5
                          rounded-lg font-heading tracking-wider uppercase text-xs
                          px-3 py-1.5
                          text-text-dim hover:text-crimson-bright hover:bg-crimson/10
                          border border-transparent hover:border-crimson/20
                          transition-all
                        "
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
            </WoodPanel>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
