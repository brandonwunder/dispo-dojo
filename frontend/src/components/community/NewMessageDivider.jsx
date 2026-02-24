import { useEffect, useState } from 'react'

export default function NewMessageDivider({ count }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible || count <= 0) return null

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[#E53935]/30" />
      <span className="text-[10px] font-heading font-semibold text-[#E53935]/60">
        {count} new message{count !== 1 ? 's' : ''}
      </span>
      <div className="flex-1 h-px bg-[#E53935]/30" />
    </div>
  )
}
