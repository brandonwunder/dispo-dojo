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
      <Card className="group relative overflow-hidden border-[rgba(212,168,83,0.12)] bg-[#0d0d1a] transition-transform transition-shadow duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        }}
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
