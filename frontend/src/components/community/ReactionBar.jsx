import { motion } from 'framer-motion'

export default function ReactionBar({ reactions, currentUid, onToggle }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {Object.entries(reactions).map(([emoji, uids]) => {
        if (!uids || uids.length === 0) return null
        const hasReacted = uids.includes(currentUid)
        return (
          <motion.button
            key={emoji}
            onClick={() => onToggle(emoji)}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
            title={`${uids.length} reaction${uids.length > 1 ? 's' : ''}`}
            style={{
              background: hasReacted
                ? 'rgba(0,198,255,0.12)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hasReacted ? 'rgba(0,198,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '999px',
              padding: '2px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'transform 150ms, background 150ms, border-color 150ms',
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: '13px',
              color: hasReacted ? '#00C6FF' : '#C8D1DA',
              lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span>{emoji}</span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{uids.length}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
