import { motion, AnimatePresence } from 'framer-motion'

export default function TypingIndicator({ typingUsers, currentUid }) {
  const others = typingUsers.filter((u) => u.odId !== currentUid)
  if (others.length === 0) return null

  const typingText =
    others.length === 1
      ? `${others[0].displayName} is typing`
      : others.length === 2
        ? `${others[0].displayName} and ${others[1].displayName} are typing`
        : `${others[0].displayName} and ${others.length - 1} others are typing`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-5 py-1"
      >
        <div
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-body, sans-serif)', fontStyle: 'italic', color: '#8A9AAA', fontSize: '12px' }}
        >
          {/* Animated 3-dot pulse */}
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[#8A9AAA] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
          {/* Typing text */}
          <span>{typingText}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
