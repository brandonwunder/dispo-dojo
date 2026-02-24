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
