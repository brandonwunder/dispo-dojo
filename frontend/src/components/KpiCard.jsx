import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'

export default function KpiCard({ label, value, prefix = '', suffix = '', decimals = 0, valueColor, delta, delay = 0 }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        className="relative overflow-hidden h-full elevation-2 washi-texture border-[rgba(0,198,255,0.12)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1.5 hover:border-[rgba(0,198,255,0.35)] hover:shadow-[0_0_24px_rgba(0,198,255,0.12),0_8px_32px_rgba(0,0,0,0.5)]"
        style={{
          background: 'rgba(11,15,20,0.58)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,198,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 40px rgba(0,198,255,0.03)',
        }}
      >
        {/* Top-edge neon glow line */}
        <div
          className="absolute top-0 left-0 w-full h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, #00C6FF, transparent)',
            opacity: 0.3,
          }}
        />
        <CardContent className="px-4 py-4 text-center">
          <p className="font-body text-[12px] uppercase tracking-wider text-[#C8D1DA] mb-2">
            {label}
          </p>
          <p
            className="font-heading text-xl lg:text-2xl font-bold tracking-tight"
            style={{ color: valueColor || '#00C6FF' }}
          >
            {prefix}
            <CountUp
              end={value}
              duration={2}
              separator=","
              decimals={decimals}
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
