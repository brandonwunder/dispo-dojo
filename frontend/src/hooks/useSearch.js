import { useState, useCallback } from 'react'

export default function useSearch(messages) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = useCallback((term) => {
    setQuery(term)
    if (!term.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    const lower = term.toLowerCase()
    const matched = (messages || []).filter(
      (m) => !m.isDeleted && m.body?.toLowerCase().includes(lower)
    )
    setResults(matched)
    setSearching(false)
  }, [messages])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setSearching(false)
  }, [])

  return { query, results, searching, search, clearSearch }
}
