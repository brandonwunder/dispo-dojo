import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import ShojiCard from '../components/ShojiCard'
import ShurikenLoader from '../components/ShurikenLoader'

export default function AgentFinder() {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/legacy-agent-finder')
      .then((res) => res.text())
      .then((html) => {
        if (!containerRef.current) return

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
        containerRef.current.innerHTML = bodyContent
        setLoading(false)

        // Re-execute scripts so the tool works
        containerRef.current.querySelectorAll('script').forEach((oldScript) => {
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
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="text-align:center;padding:40px;color:#8a8790;">Failed to load Agent Finder. Please refresh.</div>'
        }
      })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1400px] mx-auto"
    >
      <ShojiCard hover={false} className="p-0 overflow-hidden">
        <div
          ref={containerRef}
          className="rounded-xl overflow-hidden"
          style={{ minHeight: 'calc(100vh - 120px)' }}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <ShurikenLoader size={48} />
              <span className="font-heading text-sm text-text-dim tracking-[0.08em] uppercase">
                Loading Agent Finder...
              </span>
            </div>
          )}
        </div>
      </ShojiCard>
    </motion.div>
  )
}
