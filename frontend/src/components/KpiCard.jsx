import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'

export default function KpiCard({ label, value, prefix = '', suffix = '', delta, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="relative overflow-hidden elevation-2 washi-texture border-[rgba(212,168,83,0.15)] bg-[#0d0d1a] transition-[transform,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-[rgba(212,168,83,0.3)]"
      >
        <CardContent className="p-6">
          <p className="font-body text-[13px] uppercase tracking-wider text-[#8a8578] mb-3">
            {label}
          </p>
          <p className="font-heading text-4xl font-bold text-[#ede9e3] tracking-tight">
            {prefix}
            <CountUp
              end={value}
              duration={2}
              separator=","
              preserveValue
            />
            {suffix}
          </p>
          {delta && (
            <p className={`mt-2 text-xs font-body ${delta.startsWith('+') || delta.startsWith('▲') ? 'text-[#4a7c59]' : 'text-[#a83232]'}`}>
              {delta}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
