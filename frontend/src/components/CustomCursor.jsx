import { useEffect, useRef, useState, createContext, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const CursorContext = createContext({ setCursorVariant: () => {} })
export const useCursor = () => useContext(CursorContext)

export function CursorProvider({ children }) {
  const [cursorVariant, setCursorVariant] = useState('default')

  return (
    <CursorContext.Provider value={{ setCursorVariant }}>
      {children}
      <CustomCursor variant={cursorVariant} />
    </CursorContext.Provider>
  )
}

function CustomCursor({ variant }) {
  const cursorRef = useRef(null)
  const trailRef = useRef(null)
  const [clicks, setClicks] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    document.body.style.cursor = 'none'
    const allEls = document.querySelectorAll('*')
    allEls.forEach(el => { el.style.cursor = 'none' })

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            node.style.cursor = 'none'
            node.querySelectorAll?.('*').forEach(child => { child.style.cursor = 'none' })
          }
        })
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) rotate(-45deg)`
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
      setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    const handleClick = (e) => {
      const id = Date.now() + Math.random()
      setClicks((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== id))
      }, 400)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('click', handleClick)

    return () => {
      document.body.style.cursor = ''
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Trailing glow */}
      <div
        ref={trailRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full transition-transform duration-75 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.12) 0%, transparent 70%)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Blade cursor */}
      <div
        ref={cursorRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 0 L12 8 L10 18 L8 8 Z"
            fill="url(#blade-grad)"
            stroke="rgba(212,168,83,0.6)"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="blade-grad" x1="10" y1="0" x2="10" y2="18">
              <stop offset="0%" stopColor="#e8c36b" />
              <stop offset="100%" stopColor="#8b7340" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Click slash effects */}
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 0.8, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: click.x, top: click.y }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30">
              <line x1="5" y1="5" x2="25" y2="25" stroke="#d4a853" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <line x1="25" y1="5" x2="5" y2="25" stroke="#d4a853" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default CustomCursor
