import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react'
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

const COLUMN_DEFS = [
  { key: 'address',    label: 'Address',    defaultVisible: true },
  { key: 'agent',      label: 'Agent',      defaultVisible: true },
  { key: 'brokerage',  label: 'Brokerage',  defaultVisible: true },
  { key: 'phone',      label: 'Phone',      defaultVisible: true },
  { key: 'email',      label: 'Email',      defaultVisible: true },
  { key: 'status',     label: 'Status',     defaultVisible: true },
  { key: 'list_date',  label: 'List Date',  defaultVisible: false },
  { key: 'dom',        label: 'DOM',        defaultVisible: false },
  { key: 'confidence', label: 'Confidence', defaultVisible: true },
]
const DEFAULT_VISIBLE = new Set(COLUMN_DEFS.filter(c => c.defaultVisible).map(c => c.key))

function getFoundRate(job) {
  const total = job.total || job.address_count || 0
  if (!total) return null
  const found = (job.found || 0) + (job.partial || 0) + (job.cached || 0)
  return Math.round(found / total * 100)
}

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

// ─── CSV Preview Helper ──────────────────────────────────────────────────────

async function parseCSVPreview(file) {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      // For .xlsx/.xls we can't parse client-side without a library — skip
      resolve({ rowCount: null, detectedColumn: null, allColumns: [] })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length === 0) { resolve(null); return }
        const rawHeaders = lines[0].split(',')
        const headers = rawHeaders.map(h =>
          h.trim().replace(/^["']|["']$/g, '').toLowerCase()
        )
        const rowCount = lines.length - 1
        const addressKeywords = ['address', 'property_address', 'prop_address', 'street', 'location', 'addr']
        const detectedColumn = headers.find(h =>
          addressKeywords.some(kw => h === kw || h.includes(kw))
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
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [tableSearch, setTableSearch] = useState('')
  const [sortConfig, setSortConfig] = useState(null) // { column: string, direction: 'asc'|'desc' }
  const [copiedCell, setCopiedCell] = useState(null) // "rowIndex-field"
  const [hoveredCell, setHoveredCell] = useState(null)
  const [groupByAgent, setGroupByAgent] = useState(false)
  const [expandedAgents, setExpandedAgents] = useState(new Set())
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [bulkCopyToast, setBulkCopyToast] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('agentfinder_columns')
      return saved ? new Set(JSON.parse(saved)) : new Set(DEFAULT_VISIBLE)
    } catch {
      return new Set(DEFAULT_VISIBLE)
    }
  })
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState(new Set())
  const [jobResults, setJobResults] = useState({}) // jobId -> rows array
  const [jobResultsLoading, setJobResultsLoading] = useState(new Set())
  const fileInputRef = useRef(null)
  const sseRef = useRef(null)
  const startTimeRef = useRef(null)
  const prevProgressRef = useRef({ found: 0, partial: 0, cached: 0, not_found: 0 })
  const prevAddressRef = useRef('')
  const tickerRef = useRef(null) // DOM ref for auto-scroll
  const tickerIdRef = useRef(0)  // monotonic counter for ticker entry keys
  const [eta, setEta] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null) // { rowCount, detectedColumn, allColumns }
  const [columnMap, setColumnMap] = useState(null)   // user-selected column override
  const [tickerLog, setTickerLog] = useState([])     // rolling last-8 resolved addresses
  const [processingSpeed, setProcessingSpeed] = useState(null) // addr/min

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
      // Speed metric — only show after 10+ seconds to avoid wild early estimates
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
      setColumnMap(null)
      return
    }
    parseCSVPreview(file).then(preview => {
      setCsvPreview(preview)
      setColumnMap(null) // reset any prior manual selection
    })
  }, [file])

  // ── Auto-scroll ticker to bottom on new entries ──
  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = tickerRef.current.scrollHeight
    }
  }, [tickerLog])

  // ── Close export menu on outside click ──
  useEffect(() => {
    if (!exportMenuOpen) return
    const close = () => setExportMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportMenuOpen])

  // ── Close column menu on outside click ──
  useEffect(() => {
    if (!colMenuOpen) return
    const close = () => setColMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [colMenuOpen])

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
    setProcessingSpeed(null)

    await requestNotificationPermission()

    const formData = new FormData()
    formData.append('file', file)
    if (columnMap) {
      formData.append('address_column', columnMap)
    }

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
          const prev = prevProgressRef.current
          const prevAddr = prevAddressRef.current

          // Determine the status of the address that just finished
          let finishedStatus = null
          if (prevAddr) {
            // Note: if multiple counters jump in one event (batch flush), only the first
            // matching status is captured. The remaining addresses are not shown in the
            // ticker — this is an inherent limitation of delta-based status inference.
            if ((data.found || 0) > prev.found) finishedStatus = 'found'
            else if ((data.partial || 0) > prev.partial) finishedStatus = 'partial'
            else if ((data.cached || 0) > prev.cached) finishedStatus = 'cached'
            else if ((data.not_found || 0) > prev.not_found) finishedStatus = 'not_found'
          }

          if (finishedStatus && prevAddr) {
            setTickerLog(current => [
              ...current,
              { address: prevAddr, status: finishedStatus, id: ++tickerIdRef.current }
            ].slice(-8))
          }

          prevProgressRef.current = {
            found: data.found || 0,
            partial: data.partial || 0,
            cached: data.cached || 0,
            not_found: data.not_found || 0,
          }
          prevAddressRef.current = data.current_address || ''

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
    setTickerLog([])
    setProcessingSpeed(null)
    prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
    prevAddressRef.current = ''
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

  async function expandJob(jobId) {
    let willExpand
    setExpandedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) { next.delete(jobId); willExpand = false }
      else { next.add(jobId); willExpand = true }
      return next
    })

    if (!willExpand || jobResults[jobId] !== undefined) return // collapse or already loaded

    setJobResultsLoading(prev => new Set([...prev, jobId]))
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/results`)
      if (!res.ok) throw new Error('Not available')
      const data = await res.json()
      setJobResults(prev => ({ ...prev, [jobId]: data.results || data.rows || [] }))
    } catch {
      setJobResults(prev => ({ ...prev, [jobId]: null })) // null = error state
    } finally {
      setJobResultsLoading(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  function resumeMonitoring(job) {
    const id = job.job_id || job.id
    const total = job.total || job.address_count || 0

    // Close any existing SSE connection
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }

    // Reset ticker and speed refs
    prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
    prevAddressRef.current = ''
    setTickerLog([])
    setProcessingSpeed(null)

    // Set state to processing phase for this job
    setJobId(id)
    setProgress({
      completed: 0,
      total,
      found: 0,
      partial: 0,
      cached: 0,
      not_found: 0,
      current_address: '',
    })
    startTimeRef.current = Date.now()
    setPhase('processing')
    connectSSE(id)
  }

  function copyToClipboard(value, key) {
    if (!value || value === '--') return
    navigator.clipboard.writeText(value).then(() => {
      setCopiedCell(key)
      setTimeout(() => setCopiedCell(null), 1500)
    }).catch(() => {})
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
    const total = data.total || 0
    const found = (data.found || 0) + (data.partial || 0) + (data.cached || 0)
    const pct = total > 0 ? Math.round(found / total * 100) : 0
    try {
      new Notification('Agent Finder — Run Complete', {
        body: `${total.toLocaleString()} addresses processed · ${found.toLocaleString()} agents found (${pct}%)`,
        icon: '/favicon.ico',
      })
    } catch {}
  }

  function toggleColumn(key) {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      try { localStorage.setItem('agentfinder_columns', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function downloadFilteredCSV(statusFilter) {
    const rows = statusFilter === 'all'
      ? resultRows
      : statusFilter === 'view'
      ? filteredRows
      : resultRows.filter(r => (r.status || 'not_found') === statusFilter)

    const COLS = [
      { header: 'Address',    get: r => r.address || '' },
      { header: 'Agent',      get: r => r.agent || r.agent_name || '' },
      { header: 'Brokerage',  get: r => r.brokerage || r.office || '' },
      { header: 'Phone',      get: r => r.phone || '' },
      { header: 'Email',      get: r => r.email || '' },
      { header: 'Status',     get: r => r.status || '' },
      { header: 'List Date',  get: r => r.list_date || '' },
      { header: 'DOM',        get: r => r.dom || r.days_on_market || '' },
      { header: 'Confidence', get: r => r.confidence != null ? (r.confidence > 1 ? r.confidence : Math.round(r.confidence * 100)) + '%' : '' },
    ]
    const escape = v => `"${String(v).replace(/"/g, '""')}"`
    const header = COLS.map(c => c.header).join(',')
    const body = rows.map(r => COLS.map(c => escape(c.get(r))).join(',')).join('\n')
    const csv = header + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-finder-${statusFilter}-${jobId || 'results'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportMenuOpen(false)
  }

  function bulkCopyEmails() {
    const emails = filteredRows.map(r => r.email).filter(e => e && e !== '--')
    if (emails.length === 0) return
    navigator.clipboard.writeText(emails.join('\n')).then(() => {
      setBulkCopyToast(`${emails.length} email${emails.length !== 1 ? 's' : ''} copied`)
      setTimeout(() => setBulkCopyToast(null), 2500)
    }).catch(() => {})
  }

  function bulkCopyPhones() {
    const phones = filteredRows.map(r => r.phone).filter(p => p && p !== '--')
    if (phones.length === 0) return
    navigator.clipboard.writeText(phones.join('\n')).then(() => {
      setBulkCopyToast(`${phones.length} phone${phones.length !== 1 ? 's' : ''} copied`)
      setTimeout(() => setBulkCopyToast(null), 2500)
    }).catch(() => {})
  }

  function toggleSort(column) {
    setSortConfig(prev => {
      if (!prev || prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return null // third click resets
    })
  }

  const handleReset = () => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
    setFile(null)
    setPhase('upload')
    setJobId(null)
    setProgress({ completed: 0, total: 0, found: 0, partial: 0, cached: 0, not_found: 0, current_address: '' })
    setResults(null)
    setError(null)
    setEta(null)
    setCsvPreview(null)
    setColumnMap(null)
    setTickerLog([])
    setProcessingSpeed(null)
    setActiveStatusFilter('all')
    setTableSearch('')
    setSortConfig(null)
    setGroupByAgent(false)
    setExpandedAgents(new Set())
    setExportMenuOpen(false)
    setBulkCopyToast(null)
    setColMenuOpen(false)
    prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
    prevAddressRef.current = ''
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

  const resultRows = useMemo(
    () => results?.results || results?.rows || [],
    [results]
  )
  const resultFound = results?.found ?? progress.found
  const resultPartial = results?.partial ?? progress.partial
  const resultCached = results?.cached ?? progress.cached
  const resultNotFound = results?.not_found ?? progress.not_found
  const resultTotal = results?.total ?? progress.total

  const filteredRows = useMemo(() => {
    let rows = resultRows

    if (activeStatusFilter !== 'all') {
      rows = rows.filter(r => (r.status || 'not_found') === activeStatusFilter)
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase()
      rows = rows.filter(r => {
        const agent = (r.agent || r.agent_name || '').toLowerCase()
        const brokerage = (r.brokerage || r.office || '').toLowerCase()
        return agent.includes(q) || brokerage.includes(q)
      })
    }

    if (sortConfig) {
      rows = [...rows].sort((a, b) => {
        let aVal, bVal
        switch (sortConfig.column) {
          case 'agent':
            aVal = (a.agent || a.agent_name || '').toLowerCase()
            bVal = (b.agent || b.agent_name || '').toLowerCase()
            break
          case 'brokerage':
            aVal = (a.brokerage || a.office || '').toLowerCase()
            bVal = (b.brokerage || b.office || '').toLowerCase()
            break
          case 'status': {
            const order = { found: 0, partial: 1, cached: 2, not_found: 3 }
            aVal = order[a.status || 'not_found'] ?? 3
            bVal = order[b.status || 'not_found'] ?? 3
            break
          }
          case 'confidence':
            aVal = a.confidence ?? -1
            bVal = b.confidence ?? -1
            break
          case 'dom':
            aVal = parseFloat(a.dom || a.days_on_market || 0) || 0
            bVal = parseFloat(b.dom || b.days_on_market || 0) || 0
            break
          default:
            return 0
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return rows
  }, [resultRows, activeStatusFilter, tableSearch, sortConfig])

  const groupedRows = useMemo(() => {
    if (!groupByAgent) return null
    const agentMap = new Map()
    filteredRows.forEach(row => {
      const key = (row.agent || row.agent_name || '').trim() || 'Unknown Agent'
      if (!agentMap.has(key)) {
        agentMap.set(key, {
          agentKey: key,
          brokerage: row.brokerage || row.office || '--',
          phone: row.phone || '--',
          email: row.email || '--',
          confidence: row.confidence,
          properties: [],
        })
      }
      agentMap.get(key).properties.push(row)
    })
    return Array.from(agentMap.values())
      .sort((a, b) => b.properties.length - a.properties.length)
  }, [filteredRows, groupByAgent])

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
      `}</style>

      {/* ── Background layers ───────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Layer 0: Photo — div-based for precise backgroundPosition control */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/agent-finder-bg.png)',
            backgroundSize: '120%',
            backgroundPosition: '82% 30%',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Layer 1: Dashboard-style atmospheric fade — moderate, not heavy */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 65% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.62) 55%, rgba(11,15,20,0.88) 100%),
              linear-gradient(180deg, rgba(11,15,20,0.28) 0%, rgba(11,15,20,0.52) 40%, rgba(11,15,20,0.85) 100%)
            `,
          }}
        />
        {/* Layer 2: Subtle left darkening for card readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(11,15,20,0.5) 0%, rgba(11,15,20,0.18) 40%, transparent 68%)',
          }}
        />
        {/* Layer 3: Bottom fade to page bg */}
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

      {/* CSV Preview Panel */}
      {file && csvPreview && (csvPreview.rowCount != null || csvPreview.allColumns.length > 0) && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: 'rgba(0,198,255,0.05)',
          border: '1px solid rgba(0,198,255,0.15)',
          borderRadius: '10px',
        }}>
          {/* Row count */}
          {csvPreview.rowCount != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {csvPreview.rowCount.toLocaleString()} addresses detected
              </span>
              {csvPreview.rowCount > 1000 && (
                <span style={{ color: '#F6C445', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
                  · est. {Math.round(csvPreview.rowCount / 100)} min
                </span>
              )}
            </div>
          )}
          {/* Column detection */}
          {csvPreview.detectedColumn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4a7c59', fontFamily: 'DM Sans, sans-serif' }}>
              <span>✓</span>
              <span>Address column: <strong>{csvPreview.detectedColumn}</strong></span>
            </div>
          ) : csvPreview.allColumns.length > 0 ? (
            <div style={{ fontSize: '12px', color: '#F6C445', fontFamily: 'DM Sans, sans-serif' }}>
              <span>⚠ No address column detected — pick one:</span>
              <select
                value={columnMap || ''}
                onChange={e => setColumnMap(e.target.value || null)}
                style={{
                  marginLeft: '8px',
                  background: 'rgba(11,15,20,0.8)',
                  border: '1px solid rgba(0,198,255,0.3)',
                  borderRadius: '6px',
                  color: '#F4F7FA',
                  fontSize: '12px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select column...</option>
                {csvPreview.allColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      )}

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

      {/* Live Address Ticker */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#00C6FF', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Live Feed
          </span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#C8D1DA', fontFamily: 'DM Sans, sans-serif' }}>
            {processingSpeed != null && (
              <span>{processingSpeed} addr/min</span>
            )}
            {eta != null && (
              <span>ETA {formatETA(eta)}</span>
            )}
          </div>
        </div>

        {/* Scrolling log */}
        <div
          ref={tickerRef}
          style={{
            height: '160px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(0,198,255,0.08)',
            borderRadius: '8px',
            padding: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,198,255,0.2) transparent',
          }}
        >
          {tickerLog.map(entry => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 4px',
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif',
                color: '#C8D1DA',
                opacity: 0.85,
              }}
            >
              <StatusBadge status={entry.status} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.address}
              </span>
            </div>
          ))}
          {/* Active address row */}
          {progress.current_address && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 4px',
              fontSize: '12px',
              fontFamily: 'DM Sans, sans-serif',
              color: '#F4F7FA',
            }}>
              <ShurikenLoader size={14} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {progress.current_address}
              </span>
            </div>
          )}
        </div>

        {/* Cache savings */}
        {progress.cached > 0 && (
          <p style={{ marginTop: '6px', fontSize: '11px', color: '#C8D1DA', textAlign: 'right', fontFamily: 'DM Sans, sans-serif' }}>
            {progress.cached.toLocaleString()} from cache
            {processingSpeed && processingSpeed > 0
              ? ` — saved ~${formatETA(progress.cached / processingSpeed * 60)}`
              : ''}
          </p>
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
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex' }}>
              <a href={`${API_BASE}/api/download/${jobId}`} download
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                  background: 'linear-gradient(135deg, #F6C445, #C49A20)', color: '#0B0F14',
                  borderRadius: '10px 0 0 10px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(246,196,69,0.3)' }}>
                ↓ Download All
              </a>
              <button onClick={() => setExportMenuOpen(v => !v)}
                style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #C49A20, #9A7A10)',
                  color: '#0B0F14', border: 'none', borderLeft: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: '12px' }}>
                ▾
              </button>
            </div>
            {exportMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 50,
                minWidth: '200px', background: 'rgba(17,27,36,0.98)',
                border: '1px solid rgba(0,198,255,0.2)', borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                {[
                  { label: 'Download Found Only', filter: 'found' },
                  { label: 'Download Partial Only', filter: 'partial' },
                  { label: 'Download Cached Only', filter: 'cached' },
                  { label: 'Download Not Found Only', filter: 'not_found' },
                  { label: 'Download Current View', filter: 'view' },
                ].map(opt => (
                  <button key={opt.filter} onClick={() => downloadFilteredCSV(opt.filter)}
                    style={{ display: 'block', width: '100%', padding: '10px 16px',
                      background: 'transparent', border: 'none', textAlign: 'left',
                      cursor: 'pointer', color: '#F4F7FA', fontSize: '13px',
                      fontFamily: 'DM Sans, sans-serif',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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

        {/* Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All', count: resultRows.length },
              { key: 'found', label: 'Found', count: resultRows.filter(r => r.status === 'found').length },
              { key: 'partial', label: 'Partial', count: resultRows.filter(r => r.status === 'partial').length },
              { key: 'cached', label: 'Cached', count: resultRows.filter(r => r.status === 'cached').length },
              { key: 'not_found', label: 'Not Found', count: resultRows.filter(r => (r.status || 'not_found') === 'not_found').length },
            ].map(pill => (
              <button
                key={pill.key}
                onClick={() => setActiveStatusFilter(pill.key)}
                style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  border: activeStatusFilter === pill.key ? '1px solid rgba(0,198,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: activeStatusFilter === pill.key ? 'rgba(0,198,255,0.15)' : 'transparent',
                  color: activeStatusFilter === pill.key ? '#00C6FF' : '#C8D1DA',
                  boxShadow: activeStatusFilter === pill.key ? '0 0 8px rgba(0,198,255,0.2)' : 'none',
                }}
              >
                {pill.label} <span style={{ opacity: 0.7 }}>({pill.count})</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search agent or brokerage..."
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', padding: '6px 12px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: '#F4F7FA', fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,198,255,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Table toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
          {bulkCopyToast && (
            <span style={{ fontSize: '12px', color: '#00C6FF', fontFamily: 'DM Sans, sans-serif', marginRight: 'auto' }}>
              ✓ {bulkCopyToast}
            </span>
          )}
          <button onClick={bulkCopyEmails} title="Copy all visible emails"
            style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#C8D1DA', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,198,255,0.4)'; e.currentTarget.style.color = '#00C6FF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#C8D1DA' }}>
            Copy Emails
          </button>
          <button onClick={bulkCopyPhones} title="Copy all visible phones"
            style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#C8D1DA', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,198,255,0.4)'; e.currentTarget.style.color = '#00C6FF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#C8D1DA' }}>
            Copy Phones
          </button>
          <button
            onClick={() => { setGroupByAgent(v => !v); setExpandedAgents(new Set()) }}
            style={{
              padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer',
              border: groupByAgent ? '1px solid rgba(246,196,69,0.6)' : '1px solid rgba(255,255,255,0.15)',
              background: groupByAgent ? 'rgba(246,196,69,0.12)' : 'transparent',
              color: groupByAgent ? '#F6C445' : '#C8D1DA', transition: 'all 0.15s ease',
            }}
          >
            {groupByAgent ? '⊞ View by Property' : '⊟ View by Agent'}
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setColMenuOpen(v => !v)} title="Show/hide columns"
              style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '14px',
                cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)',
                background: colMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: '#C8D1DA', transition: 'all 0.15s' }}>
              ⚙
            </button>
            {colMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 50,
                background: 'rgba(17,27,36,0.98)', border: '1px solid rgba(0,198,255,0.2)',
                borderRadius: '10px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', minWidth: '160px' }}>
                <p style={{ fontSize: '10px', color: '#C8D1DA', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>Columns</p>
                {COLUMN_DEFS.map(col => (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', cursor: 'pointer', borderRadius: '6px' }}>
                    <input type="checkbox" checked={visibleColumns.has(col.key)} onChange={() => toggleColumn(col.key)}
                      style={{ accentColor: '#00C6FF', cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', color: '#F4F7FA', fontFamily: 'DM Sans, sans-serif' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {groupByAgent && groupedRows ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(246,196,69,0.2)', background: 'rgba(246,196,69,0.05)' }}>
                  {['Agent','Brokerage','Phone','Email','Listings',''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map(group => (
                  <Fragment key={group.agentKey}>
                    <tr
                      onClick={() => setExpandedAgents(prev => { const n = new Set(prev); n.has(group.agentKey) ? n.delete(group.agentKey) : n.add(group.agentKey); return n })}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: expandedAgents.has(group.agentKey) ? 'rgba(246,196,69,0.05)' : 'transparent', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#F4F7FA' }}>{group.agentKey}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA' }}>{group.brokerage}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#F4F7FA', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); copyToClipboard(group.phone, `group-${group.agentKey}-phone`) }}>
                        {copiedCell === `group-${group.agentKey}-phone` ? <span style={{ color: '#00C6FF' }}>✓ Copied</span> : group.phone}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); copyToClipboard(group.email, `group-${group.agentKey}-email`) }}>
                        {copiedCell === `group-${group.agentKey}-email` ? <span style={{ color: '#00C6FF' }}>✓ Copied</span> : group.email}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '12px', background: 'rgba(0,198,255,0.12)', border: '1px solid rgba(0,198,255,0.25)', color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{group.properties.length}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#C8D1DA', fontSize: '12px' }}>
                        {expandedAgents.has(group.agentKey) ? '▼' : '▶'}
                      </td>
                    </tr>
                    {expandedAgents.has(group.agentKey) && group.properties.map((prop, pi) => (
                      <tr key={`${group.agentKey}-${pi}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
                        <td colSpan={2} style={{ padding: '8px 12px 8px 28px', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA' }}>↳ {prop.address || '--'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '12px' }}><StatusBadge status={prop.status} /></td>
                        <td style={{ padding: '8px 12px', fontSize: '12px', color: '#C8D1DA', fontFamily: 'DM Sans, sans-serif' }}>{prop.list_date || '--'}</td>
                        <td colSpan={2} style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#C8D1DA', textAlign: 'right' }}>DOM: {prop.dom || prop.days_on_market || '--'}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="overflow-x-auto" style={{ margin: '0 -24px' }}>
          <table className="w-full min-w-[900px]" style={{ padding: '0 24px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,198,255,0.06)' }}>
                {visibleColumns.has('address') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>Address</th>}
                {visibleColumns.has('agent') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>
                  <button onClick={() => toggleSort('agent')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    Agent <span style={{ opacity: 0.5, fontSize: '10px' }}>{sortConfig?.column === 'agent' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </button>
                </th>}
                {visibleColumns.has('brokerage') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>
                  <button onClick={() => toggleSort('brokerage')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    Brokerage <span style={{ opacity: 0.5, fontSize: '10px' }}>{sortConfig?.column === 'brokerage' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </button>
                </th>}
                {visibleColumns.has('phone') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>Phone</th>}
                {visibleColumns.has('email') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>Email</th>}
                {visibleColumns.has('status') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>
                  <button onClick={() => toggleSort('status')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    Status <span style={{ opacity: 0.5, fontSize: '10px' }}>{sortConfig?.column === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </button>
                </th>}
                {visibleColumns.has('list_date') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>List Date</th>}
                {visibleColumns.has('dom') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>
                  <button onClick={() => toggleSort('dom')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    DOM <span style={{ opacity: 0.5, fontSize: '10px' }}>{sortConfig?.column === 'dom' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </button>
                </th>}
                {visibleColumns.has('confidence') && <th className="px-4 py-3 text-left font-heading text-xs uppercase whitespace-nowrap" style={{ color: '#F6C445', letterSpacing: '0.1em' }}>
                  <button onClick={() => toggleSort('confidence')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    Confidence <span style={{ opacity: 0.5, fontSize: '10px' }}>{sortConfig?.column === 'confidence' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </button>
                </th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(246,196,69,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {visibleColumns.has('address') && <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#F4F7FA' }}>{row.address || '--'}</td>}
                  {visibleColumns.has('agent') && <td className="px-4 py-3 text-sm" style={{ color: '#F4F7FA' }}>{row.agent || row.agent_name || '--'}</td>}
                  {visibleColumns.has('brokerage') && <td className="px-4 py-3 text-sm" style={{ color: '#C8D1DA' }}>{row.brokerage || row.office || '--'}</td>}
                  {visibleColumns.has('phone') && <td
                    style={{ padding: '10px 12px', position: 'relative', cursor: (row.phone && row.phone !== '--') ? 'pointer' : 'default', fontFamily: 'monospace', fontSize: '13px', color: '#F4F7FA' }}
                    onMouseEnter={() => setHoveredCell(`${i}-phone`)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => copyToClipboard(row.phone, `${i}-phone`)}
                  >
                    <span style={{ transition: 'color 0.2s', color: copiedCell === `${i}-phone` ? '#00C6FF' : 'inherit' }}>
                      {copiedCell === `${i}-phone` ? '✓ Copied' : (row.phone || '--')}
                    </span>
                    {hoveredCell === `${i}-phone` && row.phone && row.phone !== '--' && copiedCell !== `${i}-phone` && (
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>⧉</span>
                    )}
                  </td>}
                  {visibleColumns.has('email') && <td
                    style={{ padding: '10px 12px', position: 'relative', cursor: (row.email && row.email !== '--') ? 'pointer' : 'default', fontSize: '13px', color: '#C8D1DA' }}
                    onMouseEnter={() => setHoveredCell(`${i}-email`)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => copyToClipboard(row.email, `${i}-email`)}
                  >
                    <span style={{ transition: 'color 0.2s', color: copiedCell === `${i}-email` ? '#00C6FF' : 'inherit' }}>
                      {copiedCell === `${i}-email` ? '✓ Copied' : (row.email || '--')}
                    </span>
                    {hoveredCell === `${i}-email` && row.email && row.email !== '--' && copiedCell !== `${i}-email` && (
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>⧉</span>
                    )}
                  </td>}
                  {visibleColumns.has('status') && <td className="px-4 py-3 text-center"><StatusBadge status={row.status || 'not_found'} /></td>}
                  {visibleColumns.has('list_date') && <td className="px-4 py-3 text-sm" style={{ color: '#C8D1DA' }}>{row.list_date || '--'}</td>}
                  {visibleColumns.has('dom') && <td className="px-4 py-3 text-sm text-right font-mono" style={{ color: '#C8D1DA' }}>{row.dom ?? row.days_on_market ?? '--'}</td>}
                  {visibleColumns.has('confidence') && <td className="px-4 py-3"><ConfidenceBar value={row.confidence} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {filteredRows.length === 0 && resultRows.length > 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#C8D1DA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            No results match the current filter.{' '}
            <button onClick={() => { setActiveStatusFilter('all'); setTableSearch('') }}
              style={{ color: '#00C6FF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
              Clear filters
            </button>
          </div>
        )}
      </GlassCard>
    )}
  </motion.div>
)}
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
        </AnimatePresence>

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
          <div key={job.job_id || job.id}>
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              background: 'rgba(0,198,255,0.03)',
              border: '1px solid rgba(0,198,255,0.08)',
            }}
          >
            <div className="min-w-0">
              <p className="font-heading text-sm truncate" style={{ color: '#F4F7FA' }}>
                {job.filename || job.file_name || 'Unknown file'}
                {(() => {
                  const rate = getFoundRate(job)
                  return rate != null ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: '10px', marginLeft: '8px',
                      fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                      background: rate >= 70 ? 'rgba(74,124,89,0.2)' : rate >= 40 ? 'rgba(212,168,83,0.2)' : 'rgba(163,50,50,0.2)',
                      border: rate >= 70 ? '1px solid rgba(74,124,89,0.4)' : rate >= 40 ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(163,50,50,0.4)',
                      color: rate >= 70 ? '#4a7c59' : rate >= 40 ? '#d4a853' : '#a83232',
                    }}>
                      {rate}% found
                    </span>
                  ) : null
                })()}
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
              {/* Resume monitoring for in-progress jobs */}
              {(job.status === 'processing' || job.status === 'running') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Pulsing live badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '2px 8px', borderRadius: '10px',
                    background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)',
                    color: '#00C6FF', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C6FF', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    Live
                  </span>
                  {/* Monitor button */}
                  <button
                    onClick={() => resumeMonitoring(job)}
                    style={{
                      padding: '3px 10px', borderRadius: '6px',
                      background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)',
                      color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.1)' }}
                  >
                    Monitor
                  </button>
                </div>
              )}
              {/* Expand chevron button */}
              <button
                onClick={() => expandJob(job.job_id || job.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: expandedJobs.has(job.job_id || job.id) ? '#00C6FF' : '#C8D1DA',
                  fontSize: '13px', padding: '4px 8px', transition: 'color 0.15s',
                }}
                title="Preview results"
              >
                {expandedJobs.has(job.job_id || job.id) ? '▼' : '▶'}
              </button>
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
          {/* Inline result preview panel */}
          {expandedJobs.has(job.job_id || job.id) && (
            <div style={{
              margin: '0 0 8px 0',
              padding: '12px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(0,198,255,0.08)',
              borderRadius: '8px',
            }}>
              {jobResultsLoading.has(job.job_id || job.id) ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#C8D1DA', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShurikenLoader size={16} /> Loading...
                </div>
              ) : jobResults[job.job_id || job.id] === null ? (
                <p style={{ color: '#C8D1DA', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
                  Preview not available for this job.
                </p>
              ) : jobResults[job.job_id || job.id]?.length === 0 ? (
                <p style={{ color: '#C8D1DA', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
                  No results found.
                </p>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Address', 'Agent', 'Phone', 'Email', 'Status'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#C8D1DA', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '10px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(jobResults[job.job_id || job.id] || []).slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: '#C8D1DA', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address || '--'}</td>
                          <td style={{ padding: '6px 10px', color: '#F4F7FA' }}>{row.agent || row.agent_name || '--'}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#F4F7FA' }}>{row.phone || '--'}</td>
                          <td style={{ padding: '6px 10px', color: '#C8D1DA' }}>{row.email || '--'}</td>
                          <td style={{ padding: '6px 10px' }}><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(jobResults[job.job_id || job.id] || []).length > 10 && (
                    <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#C8D1DA' }}>
                      +{(jobResults[job.job_id || job.id] || []).length - 10} more rows — download to see all
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          </div>
        ))}
      </div>
    </GlassCard>
  </motion.div>
)}
      </motion.div>
    </div>
  )
}
