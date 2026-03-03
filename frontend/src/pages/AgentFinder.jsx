import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ShurikenLoader from '../components/ShurikenLoader'
import { CompassIcon } from '../components/icons/index'
import GlassPanel from '../components/GlassPanel'

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
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const PHASE_LABELS = {
  google: 'Google Search',
  realtor: 'Realtor.com',
  email_guess: 'Email Guess',
}

const API_BASE = import.meta.env.VITE_API_URL || ''

// ─── Glass Card ──────────────────────────────────────────────────────────────

function GlassCard({ children, maxWidth = '680px' }) {
  return (
    <GlassPanel className="mx-auto mb-6 p-6" style={{ maxWidth }}>
      {children}
    </GlassPanel>
  )
}

// ─── CSV Preview Helper ──────────────────────────────────────────────────────

async function parseCSVPreview(file) {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({ rowCount: null, detectedColumn: null, allColumns: [] })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter((l) => l.trim())
        if (lines.length === 0) {
          resolve(null)
          return
        }
        const rawHeaders = lines[0].split(',')
        const headers = rawHeaders.map((h) =>
          h.trim().replace(/^["']|["']$/g, '').toLowerCase()
        )
        const rowCount = lines.length - 1
        const nameKeywords = [
          'name',
          'agent_name',
          'agent name',
          'listing_agent',
          'listing agent',
          'contact_name',
          'contact name',
          'full_name',
          'full name',
        ]
        const detectedColumn =
          headers.find((h) =>
            nameKeywords.some((kw) => h === kw || h.includes(kw))
          ) || null
        resolve({ rowCount, detectedColumn, allColumns: headers })
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AgentFinder() {
  // ── State ──
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('upload') // 'upload' | 'processing' | 'complete' | 'error'
  const [jobId, setJobId] = useState(null)
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    found: 0,
    not_found: 0,
    current_agent: '',
    phase: '',
  })
  const [results, setResults] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [sortConfig, setSortConfig] = useState(null)
  const [copiedCell, setCopiedCell] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)
  const [tickerLog, setTickerLog] = useState([])
  const [eta, setEta] = useState(null)
  const [processingSpeed, setProcessingSpeed] = useState(null)
  const [bulkCopyToast, setBulkCopyToast] = useState(null)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null)

  // ── Refs ──
  const fileInputRef = useRef(null)
  const sseRef = useRef(null)
  const startTimeRef = useRef(null)
  const prevProgressRef = useRef({ found: 0, not_found: 0 })
  const prevAgentRef = useRef('')
  const tickerRef = useRef(null)
  const tickerIdRef = useRef(0)

  // ── Load job history on mount, auto-resume active jobs ──
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs`)
        if (res.ok) {
          const data = await res.json()
          const jobList = Array.isArray(data) ? data : data.jobs || []
          setJobs(jobList)
          const activeJob = jobList.find(
            (j) => j.status === 'running' || j.status === 'queued'
          )
          if (activeJob) {
            resumeMonitoring(activeJob)
          }
        }
      } catch {
        // Backend may not be running
      }
    }
    init()
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
      const elapsedMin = elapsed / 60
      if (elapsed > 10) {
        setProcessingSpeed(Math.round(progress.completed / elapsedMin))
      }
    }
  }, [progress.completed, progress.total, phase])

  // ── Parse CSV preview when file is selected ──
  useEffect(() => {
    if (!file) {
      setCsvPreview(null)
      return
    }
    parseCSVPreview(file).then((preview) => {
      setCsvPreview(preview)
    })
  }, [file])

  // ── Auto-scroll ticker ──
  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = tickerRef.current.scrollHeight
    }
  }, [tickerLog])

  // ── API calls ──

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`)
      if (res.ok) {
        const data = await res.json()
        setJobs(Array.isArray(data) ? data : data.jobs || [])
      }
    } catch {
      // silently fail
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setProcessingSpeed(null)

    await requestNotificationPermission()

    // Wake up the backend (Render free tier sleeps after inactivity)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const ping = await fetch(`${API_BASE}/api/jobs`, {
          signal: AbortSignal.timeout(30000),
        })
        if (ping.ok) break
      } catch {
        if (attempt === 2) {
          setError(
            'Backend is waking up and taking too long. Please wait 30 seconds and try again.'
          )
          setPhase('error')
          setUploading(false)
          return
        }
        await new Promise((r) => setTimeout(r, 5000))
      }
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.detail || errData.error || `Upload failed (${res.status})`
        )
      }

      const data = await res.json()
      setJobId(data.job_id)
      setProgress((prev) => ({
        ...prev,
        total: data.total,
        completed: 0,
        found: 0,
        not_found: 0,
        current_agent: '',
        phase: '',
      }))
      setPhase('processing')
      startTimeRef.current = Date.now()
      connectSSE(data.job_id)
    } catch (err) {
      setError(
        err.message ||
          'Failed to upload file. The backend may be starting up — wait 30s and try again.'
      )
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
          const prev = prevProgressRef.current
          const prevAgent = prevAgentRef.current

          // Determine the status of the agent that just finished
          let finishedStatus = null
          if (prevAgent) {
            if ((data.found || 0) > prev.found) finishedStatus = 'found'
            else if ((data.not_found || 0) > prev.not_found)
              finishedStatus = 'not_found'
          }

          if (finishedStatus && prevAgent) {
            setTickerLog((current) =>
              [
                ...current,
                {
                  agent: prevAgent,
                  status: finishedStatus,
                  id: ++tickerIdRef.current,
                },
              ].slice(-12)
            )
          }

          prevProgressRef.current = {
            found: data.found || 0,
            not_found: data.not_found || 0,
          }
          prevAgentRef.current = data.current_agent || ''

          setProgress({
            completed: data.completed || 0,
            total: data.total || 0,
            found: data.found || 0,
            not_found: data.not_found || 0,
            current_agent: data.current_agent || '',
            phase: data.phase || '',
          })
        } else if (data.type === 'complete') {
          setResults(data)
          fireCompletionNotification(data)
          setPhase('complete')
          source.close()
          sseRef.current = null
          loadJobs()
        } else if (data.type === 'error') {
          setError(data.message || 'An error occurred during processing.')
          setPhase('error')
          source.close()
          sseRef.current = null
        } else if (data.type === 'cancelled') {
          setPhase('upload')
          source.close()
          sseRef.current = null
          loadJobs()
        }
        // heartbeat — no action needed
      } catch {
        // Malformed SSE data — ignore
      }
    }

    let sseRetries = 0
    source.onerror = () => {
      source.close()
      sseRef.current = null
      if (sseRetries < 3) {
        sseRetries++
        setTimeout(() => connectSSE(id), 2000)
        return
      }
      setPhase((prev) => {
        if (prev === 'processing') {
          setError(
            'Lost connection to the server. The job may still be running — check job history.'
          )
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
    setProgress({
      completed: 0,
      total: 0,
      found: 0,
      not_found: 0,
      current_agent: '',
      phase: '',
    })
    setTickerLog([])
    setProcessingSpeed(null)
    prevProgressRef.current = { found: 0, not_found: 0 }
    prevAgentRef.current = ''
    tickerIdRef.current = 0
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

  function resumeMonitoring(job) {
    const id = job.job_id || job.id
    const total = job.total || job.agent_count || 0

    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }

    prevProgressRef.current = { found: 0, not_found: 0 }
    prevAgentRef.current = ''
    setTickerLog([])
    setProcessingSpeed(null)

    setJobId(id)
    setProgress({
      completed: 0,
      total,
      found: 0,
      not_found: 0,
      current_agent: '',
      phase: '',
    })
    startTimeRef.current = Date.now()
    setPhase('processing')
    connectSSE(id)
  }

  function copyToClipboard(value, key) {
    if (!value || value === '--') return
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedCell(key)
        setTimeout(() => setCopiedCell(null), 1500)
      })
      .catch(() => {})
  }

  async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return
    await Notification.requestPermission()
  }

  function fireCompletionNotification(data) {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState !== 'hidden') return
    const summary = data.summary || {}
    const total = summary.total || 0
    const found = summary.found || 0
    const hitRate = summary.hit_rate
      ? `${Math.round(summary.hit_rate * 100)}%`
      : `${total > 0 ? Math.round((found / total) * 100) : 0}%`
    try {
      new Notification('Agent Finder -- Run Complete', {
        body: `${total.toLocaleString()} agents processed -- ${found.toLocaleString()} found (${hitRate})`,
        icon: '/favicon.ico',
      })
    } catch {}
  }

  function toggleSort(column) {
    setSortConfig((prev) => {
      if (!prev || prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return null
    })
  }

  function bulkCopyEmails() {
    const emails = filteredRows
      .map((r) => r.email)
      .filter((e) => e && e !== '--')
    if (emails.length === 0) return
    navigator.clipboard
      .writeText(emails.join('\n'))
      .then(() => {
        setBulkCopyToast(
          `${emails.length} email${emails.length !== 1 ? 's' : ''} copied`
        )
        setTimeout(() => setBulkCopyToast(null), 2500)
      })
      .catch(() => {})
  }

  function bulkCopyPhones() {
    const phones = filteredRows
      .map((r) => r.phone)
      .filter((p) => p && p !== '--')
    if (phones.length === 0) return
    navigator.clipboard
      .writeText(phones.join('\n'))
      .then(() => {
        setBulkCopyToast(
          `${phones.length} phone${phones.length !== 1 ? 's' : ''} copied`
        )
        setTimeout(() => setBulkCopyToast(null), 2500)
      })
      .catch(() => {})
  }

  function handleDownloadCSV() {
    if (!jobId) return
    const a = document.createElement('a')
    a.href = `${API_BASE}/api/download/${jobId}`
    a.download = `agent-finder-${jobId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleReset = () => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    setFile(null)
    setPhase('upload')
    setJobId(null)
    setProgress({
      completed: 0,
      total: 0,
      found: 0,
      not_found: 0,
      current_agent: '',
      phase: '',
    })
    setResults(null)
    setError(null)
    setEta(null)
    setCsvPreview(null)
    setTickerLog([])
    setProcessingSpeed(null)
    setTableSearch('')
    setSortConfig(null)
    setBulkCopyToast(null)
    prevProgressRef.current = { found: 0, not_found: 0 }
    prevAgentRef.current = ''
    tickerIdRef.current = 0
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
      setError('Please drop a .csv file.')
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
    return f.name.toLowerCase().endsWith('.csv')
  }

  // ── Computed values ──

  const progressPct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.completed / progress.total) * 100))
      : 0
  const remaining = Math.max(0, progress.total - progress.completed)

  const resultRows = useMemo(
    () => results?.preview_rows || [],
    [results]
  )

  const summary = useMemo(
    () => results?.summary || {},
    [results]
  )

  const filteredRows = useMemo(() => {
    let rows = resultRows

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase()
      rows = rows.filter((r) => {
        const name = (r.name || '').toLowerCase()
        const brokerage = (r.brokerage || '').toLowerCase()
        const email = (r.email || '').toLowerCase()
        return name.includes(q) || brokerage.includes(q) || email.includes(q)
      })
    }

    if (sortConfig) {
      rows = [...rows].sort((a, b) => {
        let aVal, bVal
        switch (sortConfig.column) {
          case 'name':
            aVal = (a.name || '').toLowerCase()
            bVal = (b.name || '').toLowerCase()
            break
          case 'brokerage':
            aVal = (a.brokerage || '').toLowerCase()
            bVal = (b.brokerage || '').toLowerCase()
            break
          case 'status': {
            const order = { found: 0, not_found: 1 }
            aVal = order[a.status || 'not_found'] ?? 1
            bVal = order[b.status || 'not_found'] ?? 1
            break
          }
          default:
            return 0
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return rows
  }, [resultRows, tableSearch, sortConfig])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      {/* Progress bar shimmer keyframe */}
      <style>{`
        @keyframes progressShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes phasePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Background layers ───────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/agent-finder-bg.png)',
            backgroundSize: '120%',
            backgroundPosition: '82% 30%',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 65% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.62) 55%, rgba(11,15,20,0.88) 100%),
              linear-gradient(180deg, rgba(11,15,20,0.28) 0%, rgba(11,15,20,0.52) 40%, rgba(11,15,20,0.85) 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(11,15,20,0.5) 0%, rgba(11,15,20,0.18) 40%, transparent 68%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            background: 'linear-gradient(to bottom, transparent, #0B0F14)',
          }}
        />
      </div>

      {/* ── Page content ────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 px-6 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Hero header */}
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              style={{
                filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))',
              }}
            >
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
              Agent Contact Finder
            </h1>
          </div>
          <p
            className="text-sm mt-2"
            style={{
              color: '#C8D1DA',
              maxWidth: '480px',
              lineHeight: 1.6,
              textAlign: 'center',
              margin: '8px auto 0',
            }}
          >
            Upload a list of agent names to find their phone numbers and email
            addresses. The tool searches Google, Realtor.com, and email pattern
            databases to build a complete contact sheet.
          </p>
          <button
            onClick={() => setHowItWorksOpen(true)}
            style={{
              marginTop: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(0,198,255,0.08)',
              border: '1px solid rgba(0,198,255,0.25)',
              color: '#00C6FF',
              cursor: 'pointer',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,198,255,0.16)'
              e.currentTarget.style.borderColor = 'rgba(0,198,255,0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,198,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(0,198,255,0.25)'
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            How This Tool Works
          </button>
        </div>

        {/* ── How This Tool Works Modal ── */}
        <AnimatePresence>
          {howItWorksOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'rgba(5,8,12,0.82)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
              }}
              onClick={() => setHowItWorksOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{
                  duration: 0.22,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: 'rgba(11,15,20,0.97)',
                  border: '1px solid rgba(0,198,255,0.18)',
                  borderRadius: '18px',
                  boxShadow:
                    '0 32px 64px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,198,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                {/* Modal header */}
                <div
                  style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid rgba(0,198,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background:
                      'linear-gradient(90deg, transparent, rgba(0,198,255,0.03), transparent)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <CompassIcon size={20} style={{ color: '#00C6FF' }} />
                    <h2
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        fontSize: '16px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#F4F7FA',
                        margin: 0,
                      }}
                    >
                      How This Tool Works
                    </h2>
                  </div>
                  <button
                    onClick={() => setHowItWorksOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#8A9AAA',
                      fontSize: '20px',
                      lineHeight: 1,
                      padding: '2px 6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F4F7FA'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#8A9AAA'
                    }}
                  >
                    x
                  </button>
                </div>

                {/* Modal body */}
                <div
                  style={{
                    padding: '24px',
                    overflowY: 'auto',
                    maxHeight: '70vh',
                  }}
                >
                  {[
                    {
                      step: '1',
                      color: '#00C6FF',
                      title: 'Prepare Your Agent List',
                      body: 'Create a CSV file with one agent name per row. The file just needs a column with agent names -- the tool auto-detects it. You can export names from your CRM, deal pipeline, or any list.',
                    },
                    {
                      step: '2',
                      color: '#F6C445',
                      title: 'Pass 1: Google Search',
                      body: 'For each agent name, the tool searches Google to find the agent\'s public listing page on real estate sites. This identifies the agent\'s brokerage and often their direct phone number.',
                    },
                    {
                      step: '3',
                      color: '#22C55E',
                      title: 'Pass 2: Realtor.com Lookup',
                      body: 'Using the Google results, the tool visits Realtor.com to cross-reference and fill in any missing brokerage info, phone number, or profile details.',
                    },
                    {
                      step: '4',
                      color: '#7F00FF',
                      title: 'Pass 3: Email Pattern Matching',
                      body: 'Using the agent name and brokerage, the tool generates likely email addresses based on common brokerage email patterns (firstname@brokerage.com, first.last@, etc.) and verifies them.',
                    },
                    {
                      step: '5',
                      color: '#C8D1DA',
                      title: 'Download Your Results',
                      body: 'Once complete, download a CSV with all the contact data: agent name, brokerage, phone, and email. Filter and sort results before downloading to get exactly what you need.',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: i < 4 ? '20px' : 0,
                        paddingBottom: i < 4 ? '20px' : 0,
                        borderBottom:
                          i < 4
                            ? '1px solid rgba(255,255,255,0.05)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: `rgba(${
                            item.color === '#00C6FF'
                              ? '0,198,255'
                              : item.color === '#F6C445'
                                ? '246,196,69'
                                : item.color === '#22C55E'
                                  ? '34,197,94'
                                  : item.color === '#7F00FF'
                                    ? '127,0,255'
                                    : '200,209,218'
                          },0.15)`,
                          border: `1px solid ${item.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: item.color,
                          marginTop: '1px',
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'Rajdhani, sans-serif',
                            fontWeight: 700,
                            fontSize: '14px',
                            letterSpacing: '0.06em',
                            color: '#F4F7FA',
                            marginBottom: '6px',
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '13px',
                            color: '#C8D1DA',
                            lineHeight: 1.65,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {item.body}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal footer */}
                <div
                  style={{
                    padding: '14px 24px',
                    borderTop: '1px solid rgba(0,198,255,0.08)',
                    background: 'rgba(0,198,255,0.02)',
                    textAlign: 'center',
                  }}
                >
                  <button
                    onClick={() => setHowItWorksOpen(false)}
                    style={{
                      padding: '8px 28px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      background: 'linear-gradient(135deg, #0E5A88, #00C6FF)',
                      color: '#0B0F14',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Got It
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Confirm Delete Modal ── */}
        <AnimatePresence>
          {deleteConfirmJob && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'rgba(5,8,12,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
              }}
              onClick={() => setDeleteConfirmJob(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 10 }}
                transition={{
                  duration: 0.18,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(11,15,20,0.97)',
                  border: '1px solid rgba(229,57,53,0.3)',
                  borderRadius: '16px',
                  padding: '32px 36px',
                  maxWidth: '400px',
                  width: '100%',
                  boxShadow:
                    '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(229,57,53,0.1)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(229,57,53,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#EF5350"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    fontSize: '18px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#F4F7FA',
                    marginBottom: '10px',
                  }}
                >
                  Delete This Run?
                </h3>
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    color: '#C8D1DA',
                    lineHeight: 1.6,
                    marginBottom: '28px',
                  }}
                >
                  This will permanently remove the run record and its results.
                  This cannot be undone.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    onClick={() => setDeleteConfirmJob(null)}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#C8D1DA',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '13px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.06)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(deleteConfirmJob)
                      setDeleteConfirmJob(null)
                    }}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #E53935, #B3261E)',
                      border: 'none',
                      color: '#fff',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,
                      fontSize: '13px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 0 16px rgba(229,57,53,0.35)',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 0 24px rgba(229,57,53,0.6)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 0 16px rgba(229,57,53,0.35)'
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase panels ── */}
        <AnimatePresence mode="wait">
          {/* ════════════════════════════════════════════════════════════
              UPLOAD PHASE
              ════════════════════════════════════════════════════════════ */}
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
                  Upload Agent List
                </h2>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer rounded-xl flex flex-col items-center justify-center py-10 px-6"
                  style={{
                    border: `2px dashed ${
                      dragOver
                        ? '#00C6FF'
                        : file
                          ? 'rgba(74, 124, 89, 0.5)'
                          : 'rgba(0, 198, 255, 0.25)'
                    }`,
                    background: dragOver
                      ? 'rgba(0, 198, 255, 0.05)'
                      : file
                        ? 'rgba(74, 124, 89, 0.04)'
                        : 'rgba(0, 198, 255, 0.02)',
                    boxShadow: dragOver
                      ? '0 0 30px rgba(0,198,255,0.12)'
                      : 'none',
                    transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {file ? (
                    <div className="text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(74,124,89,0.2)' }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#4a7c59"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <p
                        className="font-heading text-lg"
                        style={{ color: '#F4F7FA' }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: '#C8D1DA' }}
                      >
                        {formatBytes(file.size)}
                      </p>
                      <p
                        className="text-xs mt-2"
                        style={{ color: '#C49A20' }}
                      >
                        Click or drop to change file
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(0,198,255,0.08)' }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#00C6FF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p style={{ color: '#C8D1DA' }}>
                        <span
                          className="font-heading"
                          style={{ color: '#00C6FF' }}
                        >
                          Drop your file here
                        </span>{' '}
                        or click to browse
                      </p>
                      <p
                        className="text-xs mt-2"
                        style={{ color: 'rgba(200,209,218,0.45)' }}
                      >
                        Accepts .csv files
                      </p>
                    </div>
                  )}
                </div>

                {/* CSV Preview Panel */}
                {file &&
                  csvPreview &&
                  (csvPreview.rowCount != null ||
                    csvPreview.allColumns.length > 0) && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        background: 'rgba(0,198,255,0.05)',
                        border: '1px solid rgba(0,198,255,0.15)',
                        borderRadius: '10px',
                      }}
                    >
                      {csvPreview.rowCount != null && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                          }}
                        >
                          <span
                            style={{
                              color: '#00C6FF',
                              fontSize: '12px',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 600,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {csvPreview.rowCount.toLocaleString()} agents
                            detected
                          </span>
                          {csvPreview.rowCount > 500 && (
                            <span
                              style={{
                                color: '#F6C445',
                                fontSize: '11px',
                                fontFamily: 'DM Sans, sans-serif',
                              }}
                            >
                              -- est.{' '}
                              {Math.round(csvPreview.rowCount / 60)}{' '}
                              min
                            </span>
                          )}
                        </div>
                      )}
                      {csvPreview.detectedColumn ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: '#4a7c59',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          <span
                            style={{
                              color: '#4a7c59',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 700,
                            }}
                          >
                            OK
                          </span>
                          <span>
                            Name column:{' '}
                            <strong>{csvPreview.detectedColumn}</strong>
                          </span>
                        </div>
                      ) : csvPreview.allColumns.length > 0 ? (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#F6C445',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          No name column auto-detected -- the backend will
                          attempt to find it automatically.
                        </div>
                      ) : null}
                    </div>
                  )}

                {/* Error message */}
                {error && (
                  <p
                    className="text-sm mt-3"
                    style={{ color: '#EF5350' }}
                  >
                    {error}
                  </p>
                )}

                {/* Upload button row */}
                <div className="mt-5 flex items-center gap-3">
                  <motion.button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    whileTap={
                      file && !uploading ? { scale: 0.97 } : undefined
                    }
                    className={`
                      group relative flex-1 inline-flex items-center justify-center
                      font-heading tracking-widest uppercase font-semibold
                      rounded-xl px-8 py-3 text-sm
                      ${
                        file && !uploading
                          ? 'gold-shimmer text-bg shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)] hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]'
                          : 'cursor-not-allowed'
                      }
                    `}
                    style={
                      !file || uploading
                        ? {
                            background: 'rgba(255,255,255,0.06)',
                            color: '#8A9AAA',
                            transition: 'box-shadow 0.3s',
                          }
                        : { transition: 'box-shadow 0.3s' }
                    }
                  >
                    {file && !uploading && (
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {uploading ? (
                        <>
                          <ShurikenLoader size={18} /> Uploading...
                        </>
                      ) : (
                        <>
                          <CompassIcon size={18} /> Find Contacts
                        </>
                      )}
                    </span>
                  </motion.button>

                  {file && !uploading && (
                    <button
                      onClick={() => {
                        setFile(null)
                        setError(null)
                        if (fileInputRef.current)
                          fileInputRef.current.value = ''
                      }}
                      className="font-heading tracking-wider uppercase text-sm"
                      style={{
                        color: '#8A9AAA',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = '#EF5350')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = '#8A9AAA')
                      }
                    >
                      Clear
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              PROCESSING PHASE
              ════════════════════════════════════════════════════════════ */}
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
                    Finding Agent Contacts
                  </h2>
                  <span
                    className="font-mono text-sm"
                    style={{ color: '#8A9AAA' }}
                  >
                    {progress.completed} / {progress.total}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="relative h-5 rounded-full overflow-hidden mb-4"
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
                        color:
                          progressPct > 50 ? '#0B0F14' : '#d4a853',
                        textShadow:
                          progressPct > 50
                            ? 'none'
                            : '0 0 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {progressPct}%
                    </span>
                  </div>
                </div>

                {/* Phase indicator */}
                {progress.phase && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
                      padding: '8px 14px',
                      background: 'rgba(0,198,255,0.04)',
                      border: '1px solid rgba(0,198,255,0.1)',
                      borderRadius: '10px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background:
                          progress.phase === 'google'
                            ? '#00C6FF'
                            : progress.phase === 'realtor'
                              ? '#F6C445'
                              : '#7F00FF',
                        display: 'inline-block',
                        animation: 'phasePulse 1.5s ease-in-out infinite',
                        boxShadow: `0 0 8px ${
                          progress.phase === 'google'
                            ? 'rgba(0,198,255,0.5)'
                            : progress.phase === 'realtor'
                              ? 'rgba(246,196,69,0.5)'
                              : 'rgba(127,0,255,0.5)'
                        }`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 600,
                        fontSize: '12px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color:
                          progress.phase === 'google'
                            ? '#00C6FF'
                            : progress.phase === 'realtor'
                              ? '#F6C445'
                              : '#7F00FF',
                      }}
                    >
                      {PHASE_LABELS[progress.phase] || progress.phase}
                    </span>
                  </div>
                )}

                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    {
                      label: 'Found',
                      value: progress.found,
                      color: '#4a7c59',
                    },
                    {
                      label: 'Not Found',
                      value: progress.not_found,
                      color: '#EF5350',
                    },
                    {
                      label: 'Remaining',
                      value: remaining,
                      color: '#8A9AAA',
                    },
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
                        style={{
                          color: '#8A9AAA',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Live Agent Ticker */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: '#00C6FF',
                        fontSize: '11px',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Live Feed
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '11px',
                        color: '#C8D1DA',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {processingSpeed != null && (
                        <span>{processingSpeed} agents/min</span>
                      )}
                      {eta != null && <span>ETA {formatETA(eta)}</span>}
                    </div>
                  </div>

                  {/* Scrolling log */}
                  <div
                    ref={tickerRef}
                    style={{
                      height: '180px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,198,255,0.08)',
                      borderRadius: '8px',
                      padding: '8px',
                      scrollbarWidth: 'thin',
                      scrollbarColor:
                        'rgba(0,198,255,0.2) transparent',
                    }}
                  >
                    {tickerLog.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 6px',
                          fontSize: '12px',
                          fontFamily: 'DM Sans, sans-serif',
                          color: '#C8D1DA',
                          opacity: 0.85,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontFamily: 'Rajdhani, sans-serif',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                            background:
                              entry.status === 'found'
                                ? 'rgba(74,124,89,0.2)'
                                : 'rgba(239,83,80,0.15)',
                            color:
                              entry.status === 'found'
                                ? '#4a7c59'
                                : '#EF5350',
                            border: `1px solid ${
                              entry.status === 'found'
                                ? 'rgba(74,124,89,0.35)'
                                : 'rgba(239,83,80,0.25)'
                            }`,
                          }}
                        >
                          {entry.status === 'found'
                            ? 'Found'
                            : 'Not Found'}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.agent}
                        </span>
                      </div>
                    ))}
                    {/* Active agent row */}
                    {progress.current_agent && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 6px',
                          fontSize: '12px',
                          fontFamily: 'DM Sans, sans-serif',
                          color: '#F4F7FA',
                        }}
                      >
                        <ShurikenLoader size={14} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {progress.current_agent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancel button */}
                <motion.button
                  onClick={handleCancel}
                  whileTap={{ scale: 0.97 }}
                  className="w-full inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl py-2.5 text-sm"
                  style={{
                    background: 'rgba(229,57,53,0.12)',
                    border: '1px solid rgba(229,57,53,0.28)',
                    color: '#EF5350',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(229,57,53,0.22)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(229,57,53,0.12)')
                  }
                >
                  Cancel
                </motion.button>
              </GlassCard>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              COMPLETE PHASE
              ════════════════════════════════════════════════════════════ */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary card */}
              <GlassCard>
                <h2
                  className="font-heading text-xs uppercase mb-5"
                  style={{ color: '#00C6FF', letterSpacing: '0.14em' }}
                >
                  Results Summary
                </h2>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      label: 'Total',
                      value: summary.total || 0,
                      color: '#F4F7FA',
                    },
                    {
                      label: 'Found',
                      value: summary.found || 0,
                      color: '#4a7c59',
                    },
                    {
                      label: 'With Phone',
                      value: summary.with_phone || 0,
                      color: '#00C6FF',
                    },
                    {
                      label: 'With Email',
                      value: summary.with_email || 0,
                      color: '#F6C445',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-4 text-center"
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
                        style={{
                          color: '#8A9AAA',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Hit rate summary line */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '10px 16px',
                    background: 'rgba(74,124,89,0.08)',
                    border: '1px solid rgba(74,124,89,0.15)',
                    borderRadius: '10px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      color: '#C8D1DA',
                    }}
                  >
                    <span
                      style={{ color: '#4a7c59', fontWeight: 700 }}
                    >
                      {summary.found || 0}
                    </span>{' '}
                    agents found
                    {(summary.with_phone || 0) > 0 && (
                      <>
                        {' '}
                        (
                        <span
                          style={{
                            color: '#00C6FF',
                            fontWeight: 600,
                          }}
                        >
                          {summary.with_phone}
                        </span>{' '}
                        with phone,{' '}
                        <span
                          style={{
                            color: '#F6C445',
                            fontWeight: 600,
                          }}
                        >
                          {summary.with_email || 0}
                        </span>{' '}
                        with email)
                      </>
                    )}
                    {summary.hit_rate != null && (
                      <>
                        {' -- '}
                        <span
                          style={{
                            color: '#d4a853',
                            fontWeight: 700,
                          }}
                        >
                          {Math.round(summary.hit_rate * 100)}% hit rate
                        </span>
                      </>
                    )}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  {jobId && (
                    <button
                      onClick={handleDownloadCSV}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        background:
                          'linear-gradient(135deg, #F6C445, #C49A20)',
                        color: '#0B0F14',
                        borderRadius: '10px',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow:
                          '0 0 16px rgba(246,196,69,0.3)',
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 0 24px rgba(246,196,69,0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          '0 0 16px rgba(246,196,69,0.3)'
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download CSV
                    </button>
                  )}
                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl px-6 py-3 text-sm"
                    style={{
                      background: 'rgba(0,198,255,0.06)',
                      border: '1px solid rgba(0,198,255,0.15)',
                      color: '#00C6FF',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(0,198,255,0.12)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(0,198,255,0.06)')
                    }
                  >
                    New Search
                  </motion.button>
                </div>
              </GlassCard>

              {/* Results table */}
              {resultRows.length > 0 && (
                <GlassCard maxWidth="1024px">
                  <h2
                    className="font-heading text-xs uppercase mb-5"
                    style={{
                      color: '#00C6FF',
                      letterSpacing: '0.14em',
                    }}
                  >
                    Results ({resultRows.length} agents)
                  </h2>

                  {/* Search + bulk actions bar */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search name, brokerage, email..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '6px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#F4F7FA',
                        fontSize: '13px',
                        fontFamily: 'DM Sans, sans-serif',
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor =
                          'rgba(0,198,255,0.4)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          'rgba(255,255,255,0.1)'
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      {bulkCopyToast && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#00C6FF',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          {bulkCopyToast}
                        </span>
                      )}
                      <button
                        onClick={bulkCopyEmails}
                        title="Copy all visible emails"
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: 'transparent',
                          color: '#C8D1DA',
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            'rgba(0,198,255,0.4)'
                          e.currentTarget.style.color = '#00C6FF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            'rgba(255,255,255,0.15)'
                          e.currentTarget.style.color = '#C8D1DA'
                        }}
                      >
                        Copy Emails
                      </button>
                      <button
                        onClick={bulkCopyPhones}
                        title="Copy all visible phones"
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: 'transparent',
                          color: '#C8D1DA',
                          transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            'rgba(0,198,255,0.4)'
                          e.currentTarget.style.color = '#00C6FF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            'rgba(255,255,255,0.15)'
                          e.currentTarget.style.color = '#C8D1DA'
                        }}
                      >
                        Copy Phones
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div
                    className="overflow-x-auto"
                    style={{ margin: '0 -24px' }}
                  >
                    <table
                      className="w-full min-w-[700px]"
                      style={{ padding: '0 24px' }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: 'rgba(0,198,255,0.06)',
                          }}
                        >
                          <th
                            className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap"
                            style={{
                              color: '#F6C445',
                              letterSpacing: '0.1em',
                            }}
                          >
                            <button
                              onClick={() => toggleSort('name')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                letterSpacing: 'inherit',
                                textTransform: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                              }}
                            >
                              Name{' '}
                              <span
                                style={{
                                  opacity: 0.5,
                                  fontSize: '10px',
                                }}
                              >
                                {sortConfig?.column === 'name'
                                  ? sortConfig.direction === 'asc'
                                    ? '^'
                                    : 'v'
                                  : '~'}
                              </span>
                            </button>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap"
                            style={{
                              color: '#F6C445',
                              letterSpacing: '0.1em',
                            }}
                          >
                            <button
                              onClick={() => toggleSort('brokerage')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                letterSpacing: 'inherit',
                                textTransform: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                              }}
                            >
                              Brokerage{' '}
                              <span
                                style={{
                                  opacity: 0.5,
                                  fontSize: '10px',
                                }}
                              >
                                {sortConfig?.column === 'brokerage'
                                  ? sortConfig.direction === 'asc'
                                    ? '^'
                                    : 'v'
                                  : '~'}
                              </span>
                            </button>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap"
                            style={{
                              color: '#F6C445',
                              letterSpacing: '0.1em',
                            }}
                          >
                            Phone
                          </th>
                          <th
                            className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap"
                            style={{
                              color: '#F6C445',
                              letterSpacing: '0.1em',
                            }}
                          >
                            Email
                          </th>
                          <th
                            className="px-4 py-3 text-center font-heading text-xs uppercase whitespace-nowrap"
                            style={{
                              color: '#F6C445',
                              letterSpacing: '0.1em',
                            }}
                          >
                            <button
                              onClick={() => toggleSort('status')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                letterSpacing: 'inherit',
                                textTransform: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                              }}
                            >
                              Status{' '}
                              <span
                                style={{
                                  opacity: 0.5,
                                  fontSize: '10px',
                                }}
                              >
                                {sortConfig?.column === 'status'
                                  ? sortConfig.direction === 'asc'
                                    ? '^'
                                    : 'v'
                                  : '~'}
                              </span>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom:
                                '1px solid rgba(255,255,255,0.04)',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'rgba(246,196,69,0.02)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                'transparent')
                            }
                          >
                            {/* Name */}
                            <td
                              className="px-4 py-3 text-sm"
                              style={{
                                color: '#F4F7FA',
                                fontWeight: 600,
                              }}
                            >
                              {row.name || '--'}
                            </td>
                            {/* Brokerage */}
                            <td
                              className="px-4 py-3 text-sm"
                              style={{ color: '#C8D1DA' }}
                            >
                              {row.brokerage || '--'}
                            </td>
                            {/* Phone */}
                            <td
                              style={{
                                padding: '10px 12px',
                                position: 'relative',
                                cursor:
                                  row.phone && row.phone !== '--'
                                    ? 'pointer'
                                    : 'default',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                color: '#F4F7FA',
                              }}
                              onMouseEnter={() =>
                                setHoveredCell(`${i}-phone`)
                              }
                              onMouseLeave={() =>
                                setHoveredCell(null)
                              }
                              onClick={() =>
                                copyToClipboard(
                                  row.phone,
                                  `${i}-phone`
                                )
                              }
                            >
                              <span
                                style={{
                                  transition: 'color 0.2s',
                                  color:
                                    copiedCell === `${i}-phone`
                                      ? '#00C6FF'
                                      : 'inherit',
                                }}
                              >
                                {copiedCell === `${i}-phone`
                                  ? 'Copied'
                                  : row.phone || '--'}
                              </span>
                              {hoveredCell === `${i}-phone` &&
                                row.phone &&
                                row.phone !== '--' &&
                                copiedCell !== `${i}-phone` && (
                                  <span
                                    style={{
                                      position: 'absolute',
                                      right: '8px',
                                      top: '50%',
                                      transform:
                                        'translateY(-50%)',
                                      opacity: 0.5,
                                      fontSize: '12px',
                                    }}
                                  >
                                    copy
                                  </span>
                                )}
                            </td>
                            {/* Email */}
                            <td
                              style={{
                                padding: '10px 12px',
                                position: 'relative',
                                cursor:
                                  row.email && row.email !== '--'
                                    ? 'pointer'
                                    : 'default',
                                fontSize: '13px',
                                color: '#C8D1DA',
                              }}
                              onMouseEnter={() =>
                                setHoveredCell(`${i}-email`)
                              }
                              onMouseLeave={() =>
                                setHoveredCell(null)
                              }
                              onClick={() =>
                                copyToClipboard(
                                  row.email,
                                  `${i}-email`
                                )
                              }
                            >
                              <span
                                style={{
                                  transition: 'color 0.2s',
                                  color:
                                    copiedCell === `${i}-email`
                                      ? '#00C6FF'
                                      : 'inherit',
                                }}
                              >
                                {copiedCell === `${i}-email`
                                  ? 'Copied'
                                  : row.email || '--'}
                              </span>
                              {hoveredCell === `${i}-email` &&
                                row.email &&
                                row.email !== '--' &&
                                copiedCell !== `${i}-email` && (
                                  <span
                                    style={{
                                      position: 'absolute',
                                      right: '8px',
                                      top: '50%',
                                      transform:
                                        'translateY(-50%)',
                                      opacity: 0.5,
                                      fontSize: '12px',
                                    }}
                                  >
                                    copy
                                  </span>
                                )}
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3 text-center">
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontFamily:
                                    'Rajdhani, sans-serif',
                                  fontWeight: 700,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  background:
                                    row.status === 'found'
                                      ? 'rgba(74,124,89,0.2)'
                                      : 'rgba(239,83,80,0.12)',
                                  color:
                                    row.status === 'found'
                                      ? '#4a7c59'
                                      : '#EF5350',
                                  border: `1px solid ${
                                    row.status === 'found'
                                      ? 'rgba(74,124,89,0.35)'
                                      : 'rgba(239,83,80,0.2)'
                                  }`,
                                }}
                              >
                                {row.status === 'found'
                                  ? 'Found'
                                  : 'Not Found'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty filtered state */}
                  {filteredRows.length === 0 &&
                    resultRows.length > 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '32px',
                          color: '#C8D1DA',
                          fontSize: '14px',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        No results match your search.{' '}
                        <button
                          onClick={() => setTableSearch('')}
                          style={{
                            color: '#00C6FF',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textDecoration: 'underline',
                          }}
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              ERROR PHASE
              ════════════════════════════════════════════════════════════ */}
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
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#EF5350"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>

                  <h3
                    className="font-heading text-lg tracking-wider uppercase mb-2"
                    style={{ color: '#EF5350' }}
                  >
                    {error?.includes('backend') ||
                    error?.includes('connection') ||
                    error?.includes('Failed to fetch')
                      ? 'Backend Unavailable'
                      : 'Something Went Wrong'}
                  </h3>

                  <p
                    className="text-sm max-w-md mx-auto mb-2"
                    style={{ color: '#C8D1DA' }}
                  >
                    {error}
                  </p>

                  {(error?.includes('backend') ||
                    error?.includes('connection') ||
                    error?.includes('Failed to fetch') ||
                    error?.includes('waking up')) && (
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
                        The backend may be waking up
                      </p>
                      <div
                        className="rounded p-3 font-mono text-xs"
                        style={{ background: 'rgba(0,0,0,0.4)' }}
                      >
                        <p style={{ color: '#F6C445' }}>
                          The server sleeps after inactivity.
                        </p>
                        <p style={{ color: '#F6C445' }}>
                          Wait 30 seconds, then hit "Try Again".
                        </p>
                        <p
                          className="mt-1"
                          style={{
                            color: 'rgba(200,209,218,0.4)',
                          }}
                        >
                          # First request wakes it up automatically
                        </p>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.97 }}
                    className="mt-6 inline-flex items-center justify-center font-heading tracking-widest uppercase font-semibold rounded-xl px-6 py-2.5 text-sm"
                    style={{
                      background: 'rgba(0,198,255,0.06)',
                      border: '1px solid rgba(0,198,255,0.15)',
                      color: '#00C6FF',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(0,198,255,0.12)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(0,198,255,0.06)')
                    }
                  >
                    Try Again
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Job History Panel ── */}
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
              Past Runs
            </h2>

            {jobs.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#8A9AAA',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(0,198,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8A9AAA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    color: '#C8D1DA',
                    marginBottom: '4px',
                  }}
                >
                  No runs yet
                </div>
                Upload an agent list above to get started.
              </div>
            )}

            <div className="space-y-2">
              {jobs.map((job) => {
                const jid = job.job_id || job.id
                const total = job.total || job.agent_count || 0
                const found = job.found || 0
                const rate =
                  total > 0 ? Math.round((found / total) * 100) : null

                return (
                  <div
                    key={jid}
                    className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style={{
                      background: 'rgba(0,198,255,0.03)',
                      border: '1px solid rgba(0,198,255,0.08)',
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="font-heading text-sm truncate"
                        style={{ color: '#F4F7FA' }}
                      >
                        {job.filename || job.file_name || 'Unknown file'}
                        {rate != null && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              marginLeft: '8px',
                              fontSize: '11px',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 700,
                              background:
                                rate >= 70
                                  ? 'rgba(74,124,89,0.2)'
                                  : rate >= 40
                                    ? 'rgba(212,168,83,0.2)'
                                    : 'rgba(163,50,50,0.2)',
                              border:
                                rate >= 70
                                  ? '1px solid rgba(74,124,89,0.4)'
                                  : rate >= 40
                                    ? '1px solid rgba(212,168,83,0.4)'
                                    : '1px solid rgba(163,50,50,0.4)',
                              color:
                                rate >= 70
                                  ? '#4a7c59'
                                  : rate >= 40
                                    ? '#d4a853'
                                    : '#a83232',
                            }}
                          >
                            {rate}% found
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span
                          className="text-xs"
                          style={{ color: '#8A9AAA' }}
                        >
                          {formatDate(job.created_at || job.date)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: '#8A9AAA' }}
                        >
                          {total} agents
                        </span>
                        {job.found != null && (
                          <span className="text-xs">
                            <span style={{ color: '#4a7c59' }}>
                              {job.found} found
                            </span>
                            {' / '}
                            <span style={{ color: '#EF5350' }}>
                              {job.not_found || 0} missed
                            </span>
                          </span>
                        )}
                        {job.status && (
                          <span
                            className="text-xs font-heading tracking-wider uppercase"
                            style={{
                              color:
                                job.status === 'complete'
                                  ? '#22C55E'
                                  : job.status === 'processing' ||
                                      job.status === 'running'
                                    ? '#d4a853'
                                    : job.status === 'cancelled'
                                      ? '#8A9AAA'
                                      : '#EF5350',
                            }}
                          >
                            {job.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Resume monitoring for in-progress jobs */}
                      {(job.status === 'processing' ||
                        job.status === 'running') && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(0,198,255,0.1)',
                              border:
                                '1px solid rgba(0,198,255,0.3)',
                              color: '#00C6FF',
                              fontSize: '11px',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#00C6FF',
                                display: 'inline-block',
                                animation:
                                  'pulse 1.5s ease-in-out infinite',
                              }}
                            />
                            Live
                          </span>
                          <button
                            onClick={() => resumeMonitoring(job)}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              background: 'rgba(0,198,255,0.1)',
                              border:
                                '1px solid rgba(0,198,255,0.3)',
                              color: '#00C6FF',
                              fontSize: '12px',
                              fontFamily: 'Rajdhani, sans-serif',
                              fontWeight: 600,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'rgba(0,198,255,0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                'rgba(0,198,255,0.1)'
                            }}
                          >
                            Monitor
                          </button>
                        </div>
                      )}

                      {/* Download button for completed jobs */}
                      {(job.status === 'complete' ||
                        job.status === 'completed') && (
                        <a
                          href={`${API_BASE}/api/download/${jid}`}
                          download
                          className="inline-flex items-center gap-1.5 rounded-lg font-heading tracking-wider uppercase text-xs font-semibold px-3 py-1.5 gold-shimmer text-bg hover:shadow-[0_2px_10px_-2px_rgba(212,168,83,0.4)]"
                          style={{
                            textDecoration: 'none',
                            transition: 'box-shadow 0.15s',
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line
                              x1="12"
                              y1="15"
                              x2="12"
                              y2="3"
                            />
                          </svg>
                          CSV
                        </a>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteConfirmJob(jid)}
                        className="inline-flex items-center gap-1.5 rounded-lg font-heading tracking-wider uppercase text-xs px-3 py-1.5"
                        style={{
                          color: '#8A9AAA',
                          border: '1px solid transparent',
                          background: 'none',
                          cursor: 'pointer',
                          transition:
                            'color 0.15s, background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF5350'
                          e.currentTarget.style.background =
                            'rgba(229,57,53,0.08)'
                          e.currentTarget.style.borderColor =
                            'rgba(229,57,53,0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#8A9AAA'
                          e.currentTarget.style.background =
                            'transparent'
                          e.currentTarget.style.borderColor =
                            'transparent'
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
