import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

const fmtTime = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function highlightMatch(text, query) {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-[rgba(0,198,255,0.2)]">{part}</span>
    ) : (
      part
    )
  )
}

export default function SearchBar({ onSearch, onClear, results, query, onSelectResult }) {
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  // Close on outside click
  useEffect(() => {
    if (!expanded) return
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [expanded])

  const handleClose = () => {
    setExpanded(false)
    onClear?.()
  }

  const handleChange = (e) => {
    onSearch?.(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const showResults = results && results.length > 0 && query
  const showEmpty = query && (!results || results.length === 0)

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setExpanded(true)}
            className="text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ width: 32, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/20 px-2 py-1.5"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-text-dim/40" />
            <input
              ref={inputRef}
              type="text"
              value={query || ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="min-w-0 flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="shrink-0 text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results dropdown */}
      <AnimatePresence>
        {expanded && (showResults || showEmpty) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-sm border border-[rgba(246,196,69,0.12)] bg-[#111B24] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            {showResults ? (
              <div className="max-h-[300px] overflow-y-auto">
                {results.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => onSelectResult?.(msg.id)}
                    className="block w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline-none"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-heading text-xs font-semibold text-parchment">
                        {msg.authorName}
                      </span>
                      <span className="shrink-0 text-[9px] text-text-dim/30">
                        {fmtTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-text-dim">
                      {highlightMatch(
                        msg.body?.length > 80 ? msg.body.slice(0, 80) + '...' : msg.body,
                        query
                      )}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-3 text-center text-xs text-text-dim/40">
                No messages found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
