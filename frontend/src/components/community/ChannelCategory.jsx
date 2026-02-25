import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function ChannelCategory({
  label,
  channels,
  activeChannel,
  unreadChannels = {},
  onSelectChannel,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-1">
      {/* Category header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left group"
      >
        <ChevronDown
          className="h-3 w-3 shrink-0 transition-transform duration-200"
          style={{
            color: '#8A9AAA',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.08em] select-none"
          style={{
            fontFamily: 'var(--font-body, sans-serif)',
            color: '#8A9AAA',
          }}
        >
          {label}
        </span>
      </button>

      {/* Channel list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            {channels.map((ch) => {
              const isActive = activeChannel === ch.id
              const hasUnread = unreadChannels[ch.id] && ch.id !== activeChannel
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectChannel(ch.id)}
                  className="flex w-full items-center justify-between rounded-md mx-1 mb-px group/ch transition-colors duration-150"
                  style={{
                    background: isActive ? 'rgba(0,198,255,0.10)' : 'transparent',
                    padding: '6px 10px 6px 24px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[15px] font-mono shrink-0 leading-none"
                      style={{ color: isActive ? '#F4F7FA' : hasUnread ? '#F4F7FA' : '#8A9AAA' }}
                    >
                      #
                    </span>
                    <span
                      className="text-[14px] truncate"
                      style={{
                        fontFamily: 'var(--font-heading, sans-serif)',
                        fontWeight: isActive ? 600 : hasUnread ? 600 : 500,
                        color: isActive ? '#F4F7FA' : hasUnread ? '#F4F7FA' : '#8A9AAA',
                      }}
                    >
                      {ch.name}
                    </span>
                  </div>
                  {hasUnread && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-[#F4F7FA]" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
