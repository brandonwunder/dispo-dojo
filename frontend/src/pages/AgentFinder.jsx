import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        <span className="text-gold-bright font-heading text-2xl font-bold">{successRate}%</span>
        <span className="text-text-dim text-xs font-heading tracking-wider uppercase">Success</span>
      </div>
    </div>
  )
}

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

  // ─── Render ───────────────────────────────────────────────────────────────

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
}
