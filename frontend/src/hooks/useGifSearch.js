import { useState, useCallback, useRef } from 'react'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || ''
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'

export default function useGifSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)
  const callCount = useRef(0)
  const callResetRef = useRef(null)

  const trackCall = () => {
    callCount.current += 1
    if (!callResetRef.current) {
      callResetRef.current = setTimeout(() => {
        callCount.current = 0
        callResetRef.current = null
      }, 3600000)
    }
  }

  const fetchGifs = async (url) => {
    if (!GIPHY_API_KEY) {
      setError('GIF search not configured (missing API key)')
      return
    }
    if (callCount.current >= 95) {
      setError('GIF search rate limit nearly reached. Try again later.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      trackCall()
      const res = await fetch(url)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setError(errData?.meta?.msg || `Giphy API error (${res.status})`)
        setLoading(false)
        return
      }
      const data = await res.json()
      setResults(
        (data.data || []).map((g) => ({
          id: g.id,
          title: g.title,
          url: g.images.fixed_height.url,
          preview: g.images.fixed_height_small?.url || g.images.fixed_height.url,
          width: parseInt(g.images.fixed_height.width, 10),
          height: parseInt(g.images.fixed_height.height, 10),
        }))
      )
    } catch (err) {
      setError('Failed to load GIFs')
      console.error('Giphy error:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = useCallback((searchTerm) => {
    clearTimeout(debounceRef.current)
    if (!searchTerm.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => {
      fetchGifs(
        `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=r`
      )
    }, 400)
  }, [])

  const trendingGifs = useCallback(() => {
    fetchGifs(
      `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=r`
    )
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, searchGifs, trendingGifs, clearResults, callsRemaining: 100 - callCount.current }
}
