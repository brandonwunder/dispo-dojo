import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Compass,
  Map,
  Bird,
  Hammer,
  ScrollText,
  PenTool,
  Sword,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import KpiCard from '../components/KpiCard'
import ToolCard from '../components/ToolCard'

/* ── Seed data ─────────────────────────────────── */

const kpis = [
  { label: 'Active Deals', value: 27, delta: '▲ 5 this week' },
  { label: 'Pipeline Value', value: 3250000, prefix: '$', delta: '+$500k this week' },
  { label: 'Deals Closed', value: 9, delta: '▲ 3 this week' },
]

const tools = [
  {
    label: 'Agent Finder',
    icon: Compass,
    description: 'Upload property lists and find listing agents instantly',
    to: '/agent-finder',
  },
  {
    label: 'FSBO Finder',
    icon: Map,
    description: 'Find For Sale By Owner listings in any city',
    to: '/fsbo-finder',
  },
  {
    label: 'Lead Scrubbing',
    icon: Bird,
    description: 'Deal Sauce walkthrough for finding and scrubbing leads',
    to: '/lead-scrubbing',
  },
  {
    label: 'Free Underwriting',
    icon: Hammer,
    description: 'Submit properties for free underwriting on cash or Sub2 deals',
    to: '/underwriting',
  },
  {
    label: 'LOI Generator',
    icon: ScrollText,
    description: 'Generate and send Letters of Intent in bulk',
    to: '/loi-generator',
  },
  {
    label: 'Contact Generator',
    icon: PenTool,
    description: 'Build, sign, and send contracts in minutes',
    to: '/contract-generator',
  },
  {
    label: 'Direct Agent Process',
    icon: Sword,
    description: 'Learn our direct-to-agent outreach process',
    to: '/direct-agent',
  },
  {
    label: 'Join Our Team',
    icon: Users,
    description: 'Cold calling opportunity for experienced closers',
    to: '/join-team',
  },
]

/* ── Component ─────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth()

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Guest'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">

      {/* ── Welcome Header ──────────────────────── */}
      <motion.section
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl gold-shimmer-text mb-1">
          Welcome back<span style={{ fontFamily: 'Rajdhani, sans-serif' }}>,</span> {firstName}-san
        </h1>
        <p className="font-body text-sm text-[#8a8578] mb-6">{today}</p>
        <div className="flex gap-3 justify-center">
          <Button
            className="font-heading tracking-wide bg-[#d4a853] text-[#06060f] hover:bg-[#f5d078] shadow-[0_0_16px_rgba(212,168,83,0.25)] hover:shadow-[0_0_24px_rgba(212,168,83,0.4)] transition-shadow duration-200"
          >
            Submit a Deal
          </Button>
          <Button
            variant="outline"
            className="font-heading tracking-wide border-[rgba(212,168,83,0.25)] text-[#d4a853] hover:bg-[rgba(212,168,83,0.08)] hover:text-[#f5d078]"
          >
            View Dispo Pipeline
          </Button>
        </div>
      </motion.section>

      {/* ── KPI Row ─────────────────────────────── */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              prefix={kpi.prefix || ''}
              delta={kpi.delta}
              delay={i * 0.1}
            />
          ))}
        </div>
      </section>

      {/* ── Tools to Succeed ────────────────────── */}
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,168,83,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="flex items-center gap-4 mb-8">
          <div className="katana-line flex-1" style={{ opacity: 0.7 }} />
          <h2 className="font-display text-lg text-[rgba(212,168,83,0.8)] tracking-widest whitespace-nowrap">
            Tools to Succeed
          </h2>
          <div className="katana-line flex-1" style={{ opacity: 0.7 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool, i) => (
            <ToolCard
              key={tool.to}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              to={tool.to}
              delay={i * 0.06}
              index={i}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
