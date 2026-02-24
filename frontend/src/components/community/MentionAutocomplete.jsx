import { motion } from 'framer-motion'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function MentionAutocomplete({ query, users, onSelect, visible }) {
  if (!visible || !query) return null

  const filtered = users.filter((u) =>
    u.displayName?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  if (filtered.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute bottom-full left-0 mb-1 w-[200px] rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
    >
      {filtered.map((u) => (
        <button
          key={u.odId}
          onClick={() => onSelect(u.displayName)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-dim hover:bg-white/[0.06] hover:text-parchment transition-colors"
        >
          <div className="hanko-seal flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold">
            {initials(u.displayName)}
          </div>
          {u.displayName}
        </button>
      ))}
    </motion.div>
  )
}
