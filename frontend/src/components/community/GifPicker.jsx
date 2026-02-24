import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import useGifSearch from '../../hooks/useGifSearch'

export default function GifPicker({ onSelect, onClose }) {
  const { results, loading, error, searchGifs, trendingGifs, clearResults } = useGifSearch()
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    trendingGifs()
  }, [trendingGifs])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleSearch = (val) => {
    setSearchTerm(val)
    if (val.trim()) {
      searchGifs(val)
    } else {
      trendingGifs()
    }
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-12 left-0 z-50 w-[340px] overflow-hidden rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-between border-b border-[rgba(246,196,69,0.08)] px-3 py-2">
        <span className="text-xs font-heading font-semibold text-parchment">GIFs</span>
        <button onClick={onClose} className="text-text-dim/40 hover:text-parchment">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-[rgba(246,196,69,0.06)] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-text-dim/30" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="flex-1 bg-transparent text-xs text-parchment placeholder:text-text-dim/30 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => handleSearch('')} className="text-text-dim/30 hover:text-parchment">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="h-[280px] overflow-y-auto p-2">
        {loading && results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-dim/30" />
          </div>
        ) : error ? (
          <p className="text-center text-xs text-red-400/60 py-8">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-center text-xs text-text-dim/30 py-8">No GIFs found</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {results.map((gif) => (
              <button
                key={gif.id}
                onClick={() => { onSelect(gif.url, gif.title); onClose() }}
                className="overflow-hidden rounded-sm transition-opacity hover:opacity-75 active:scale-[0.98]"
              >
                <img
                  src={gif.preview || gif.url}
                  alt={gif.title}
                  className="h-[100px] w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[rgba(246,196,69,0.06)] px-3 py-1.5 text-center">
        <span className="text-[9px] text-text-dim/20">Powered by GIPHY</span>
      </div>
    </motion.div>
  )
}
