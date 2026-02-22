import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import WoodPanel from '../components/WoodPanel'
import ShurikenLoader from '../components/ShurikenLoader'

export default function AgentFinder() {
  const legacyRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/legacy-agent-finder')
      .then((res) => res.text())
      .then((html) => {
        if (!legacyRef.current) return

        // Extract <body> content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
        const bodyContent = bodyMatch ? bodyMatch[1] : html

        // Extract and inject <style> tags
        const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []
        styleMatches.forEach((styleHtml) => {
          const temp = document.createElement('div')
          temp.innerHTML = styleHtml
          if (temp.firstChild) document.head.appendChild(temp.firstChild)
        })

        // Extract and inject <link stylesheet> tags
        const linkMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []
        linkMatches.forEach((link) => {
          const hrefMatch = link.match(/href=["']([^"']+)["']/)
          if (hrefMatch) {
            const linkEl = document.createElement('link')
            linkEl.rel = 'stylesheet'
            linkEl.href = hrefMatch[1]
            document.head.appendChild(linkEl)
          }
        })

        // Inject body content
        legacyRef.current.innerHTML = bodyContent
        setLoading(false)

        // Re-execute scripts so the tool works
        legacyRef.current.querySelectorAll('script').forEach((oldScript) => {
          const newScript = document.createElement('script')
          if (oldScript.src) {
            newScript.src = oldScript.src
          } else {
            newScript.textContent = oldScript.textContent
          }
          oldScript.parentNode.replaceChild(newScript, oldScript)
        })
      })
      .catch(() => {
        setLoading(false)
        setError('Failed to load Agent Finder. Please refresh.')
      })
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-120px)]">
      {/* Twinkle keyframe */}
      <style>{`@keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }`}</style>

      {/* Night sky background */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, #0a0a20 0%, #06060f 60%, #1a1510 100%)'
      }}>
        {/* Stars */}
        {Array.from({length: 30}).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/30" style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animation: 'twinkle 3s ease-in-out infinite alternate'
          }} />
        ))}
      </div>

      {/* Tower railing at bottom edge */}
      <div className="fixed bottom-0 left-[250px] right-0 h-16 z-[5] pointer-events-none wood-panel-dark border-t-2 border-gold-dim/20" />

      {/* Content wrapper — dispatch scroll frame */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <WoodPanel withRope headerBar="Scout Tower — Agent Dispatch" className="mb-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <ShurikenLoader size={48} />
              <p className="mt-4 font-heading text-gold tracking-wide">Scanning the horizon...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <p className="text-crimson-bright font-heading">{error}</p>
            </div>
          )}

          {/* Legacy content container */}
          <div ref={legacyRef} className="agent-finder-legacy" />
        </WoodPanel>
      </motion.div>

      {/* CSS overrides for legacy HTML */}
      <style>{`
        .agent-finder-legacy input,
        .agent-finder-legacy select {
          background: #1a1510 !important;
          border: 1px solid rgba(166, 124, 46, 0.2) !important;
          color: #ede9e3 !important;
          padding: 0.75rem 1rem !important;
          border-radius: 2px !important;
          font-family: 'DM Sans', sans-serif !important;
        }
        .agent-finder-legacy input:focus,
        .agent-finder-legacy select:focus {
          border-color: rgba(212, 168, 83, 0.5) !important;
          outline: none !important;
        }
        .agent-finder-legacy button,
        .agent-finder-legacy input[type="submit"] {
          background: linear-gradient(135deg, #f5d078, #d4a853, #a67c2e) !important;
          color: #1a1a2e !important;
          font-family: 'Rajdhani', sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          padding: 0.75rem 1.5rem !important;
          border: none !important;
          border-radius: 2px !important;
          cursor: pointer !important;
        }
        .agent-finder-legacy table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .agent-finder-legacy th {
          background: linear-gradient(180deg, #1a1510 0%, #0f0c08 50%, #1a1510 100%) !important;
          color: #d4a853 !important;
          font-family: 'Rajdhani', sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 0.75rem !important;
          border-bottom: 1px solid rgba(212, 168, 83, 0.2) !important;
        }
        .agent-finder-legacy td {
          padding: 0.75rem !important;
          border-bottom: 1px solid rgba(26, 21, 16, 0.5) !important;
          color: #ede9e3 !important;
        }
        .agent-finder-legacy tr:hover td {
          background: rgba(212, 168, 83, 0.05) !important;
        }
        .agent-finder-legacy h1,
        .agent-finder-legacy h2,
        .agent-finder-legacy h3 {
          font-family: 'Onari', serif !important;
          color: #f5f0e6 !important;
        }
        .agent-finder-legacy label {
          color: #8a8578 !important;
          font-family: 'Rajdhani', sans-serif !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </div>
  )
}
