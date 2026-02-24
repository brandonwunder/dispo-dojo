import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const CATEGORIES = {
  'Smileys': ['\u{1F600}','\u{1F602}','\u{1F923}','\u{1F60A}','\u{1F60D}','\u{1F970}','\u{1F60E}','\u{1F929}','\u{1F624}','\u{1F631}','\u{1F92F}','\u{1F62D}','\u{1F97A}','\u{1F608}','\u{1F917}','\u{1FAE1}'],
  'Hands': ['\u{1F44D}','\u{1F44E}','\u{1F44A}','\u270A','\u{1F91D}','\u{1F44F}','\u{1F64C}','\u{1F4AA}','\u{1F91E}','\u270C\uFE0F','\u{1F919}','\u{1F44B}','\u{1FAF6}','\u{1F918}','\u{1F446}','\u{1F447}'],
  'Fire': ['\u{1F525}','\u26A1','\u{1F4AF}','\u{1F4B0}','\u{1F3E0}','\u{1F4C8}','\u{1F3AF}','\u{1F3C6}','\u{1F48E}','\u{1F680}','\u{1F4A5}','\u2705','\u274C','\u2B50','\u{1F389}','\u{1F38A}'],
  'Objects': ['\u{1F4CA}','\u{1F4CB}','\u{1F511}','\u{1F4BC}','\u{1F4F1}','\u{1F4BB}','\u{1F4DD}','\u{1F4CC}','\u{1F514}','\u{1F4A1}','\u23F0','\u{1F4CD}','\u{1F3F7}\uFE0F','\u{1F4CE}','\u{1F5C2}\uFE0F','\u{1F4C2}'],
}

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-8 right-0 z-50 w-[260px] rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex gap-1 border-b border-[rgba(246,196,69,0.08)] px-2 py-1.5">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-sm px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[rgba(0,198,255,0.1)] text-[#00C6FF]'
                : 'text-text-dim/40 hover:text-text-dim/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-0.5 p-2">
        {CATEGORIES[activeCategory].map((em) => (
          <button
            key={em}
            onClick={() => { onSelect(em); onClose() }}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-base transition-transform duration-100 hover:scale-125 hover:bg-white/[0.06] active:scale-95"
          >
            {em}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
