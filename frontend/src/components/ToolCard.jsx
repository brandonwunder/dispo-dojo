import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ToolCard({ icon: Icon, label, description, to, delay = 0 }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        onClick={() => navigate(to)}
        className="group relative cursor-pointer overflow-hidden border-[rgba(212,168,83,0.12)] bg-[#0d0d1a] transition-transform transition-shadow duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,168,83,0.08)]">
            <Icon className="h-5 w-5 text-[#d4a853]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[15px] font-semibold text-[#ede9e3] tracking-wide">
              {label}
            </p>
            <p className="font-body text-[12px] text-[#8a8578] leading-relaxed line-clamp-1">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-[#d4a853] hover:text-[#f5d078] hover:bg-[rgba(212,168,83,0.08)] font-heading text-[13px] tracking-wide"
            onClick={(e) => {
              e.stopPropagation()
              navigate(to)
            }}
          >
            Open
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
