import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import KpiCard from '../components/KpiCard'
import ToolCard from '../components/ToolCard'
import { ScanSearch, Users, Sparkles, TrendingUp, Send, FileCheck2, Crosshair } from 'lucide-react'

/* ── Seed data ─────────────────────────────────── */

const kpis = [
  { label: 'Deals in Underwriting', value: 4 },
  { label: 'Contracts in Dispo', value: 2 },
  { label: 'Pipeline Value', value: 24837.98, prefix: '$', decimals: 2 },
  { label: 'Deals Closed', value: 9, valueColor: '#00E676' },
  { label: 'Total Assignments Earned', value: 32827.09, prefix: '$', decimals: 2, valueColor: '#00E676' },
]

const tools = [
  {
    label: 'Agent Finder',
    icon: ScanSearch,
    description: 'Upload property lists and find listing agents instantly',
    to: '/agent-finder',
  },
  {
    label: 'Find Buyers',
    icon: Users,
    description: 'Access our nationwide buyer network for your deals',
    to: '/find-buyers',
  },
  {
    label: 'Lead Scrubbing',
    icon: Sparkles,
    description: 'Deal Sauce walkthrough for finding and scrubbing leads',
    to: '/lead-scrubbing',
  },
  {
    label: 'Free Underwriting',
    icon: TrendingUp,
    description: 'Submit properties for free underwriting on cash or Sub2 deals',
    to: '/underwriting',
  },
  {
    label: 'LOI Generator',
    icon: Send,
    description: 'Generate and send Letters of Intent in bulk',
    to: '/loi-generator',
  },
  {
    label: 'Contract Generator',
    icon: FileCheck2,
    description: 'Build, sign, and send contracts in minutes',
    to: '/contract-generator',
  },
  {
    label: 'Direct Agent Process',
    icon: Crosshair,
    description: 'Learn our direct-to-agent outreach process',
    to: '/direct-agent',
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
    <div className="relative min-h-screen flex flex-col justify-center">
      {/* ── Dojo Background ──────────────────────── */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/dojo-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 30%',
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 25%, rgba(6,6,15,0.45) 0%, rgba(6,6,15,0.65) 50%, rgba(6,6,15,0.85) 100%),
            linear-gradient(180deg, rgba(6,6,15,0.35) 0%, rgba(6,6,15,0.55) 40%, rgba(6,6,15,0.82) 100%)
          `,
        }}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-5">

      {/* ── Welcome Header ──────────────────────── */}
      <motion.section
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl neon-shimmer-text mb-1">
          Welcome Back<span style={{ fontFamily: 'Rajdhani, sans-serif' }}>,</span> {firstName}
        </h1>
        <p className="font-body text-sm text-[#C8D1DA] mb-4">{today}</p>
        <div className="flex gap-3 justify-center">
          <Button
            className="font-heading tracking-wide text-white shadow-[0_0_16px_rgba(229,57,53,0.3)] hover:shadow-[0_0_24px_rgba(229,57,53,0.5)] transition-shadow duration-200"
            style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)' }}
          >
            Submit a Deal
          </Button>
          <Button
            variant="outline"
            className="font-heading tracking-wide border-[rgba(0,198,255,0.3)] text-[#00C6FF] hover:bg-[rgba(0,198,255,0.08)] hover:text-[#FFD97A] hover:border-[rgba(0,198,255,0.5)] hover:shadow-[0_0_16px_rgba(0,198,255,0.15)] transition-shadow duration-200"
          >
            View Dispo Pipeline
          </Button>
        </div>
      </motion.section>

      {/* ── KPI Row ─────────────────────────────── */}
      <section className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              prefix={kpi.prefix || ''}
              decimals={kpi.decimals || 0}
              valueColor={kpi.valueColor}
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
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,198,255,0.04) 0%, transparent 70%)',
          }}
        />
        <div className="flex items-center gap-4 mb-5">
          <div className="katana-line flex-1" style={{ opacity: 0.7 }} />
          <h2 className="font-display text-lg text-[rgba(0,198,255,0.8)] tracking-widest whitespace-nowrap">
            Tools to Crush Wholesaling
          </h2>
          <div className="katana-line flex-1" style={{ opacity: 0.7 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    </div>
  )
}
