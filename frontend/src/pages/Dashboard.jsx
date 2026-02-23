import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Compass,
  Map,
  Hammer,
  ScrollText,
  PenTool,
  Sword,
  Users,
} from 'lucide-react'

function SauceBottle({ className, style, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Nozzle tip */}
      <path d="M11.5 1.5 L12 3.5 L12.5 1.5" />
      {/* Cap */}
      <rect x="10.5" y="3.5" width="3" height="2.5" rx="0.5" />
      {/* Neck ring */}
      <path d="M9.5 6h5" />
      {/* Body */}
      <path d="M9.5 6 L8 9 L8 19.5 a2 2 0 0 0 2 2 h4 a2 2 0 0 0 2-2 L16 9 L14.5 6" />
      {/* Label area */}
      <rect x="9" y="12" width="6" height="5" rx="0.5" />
      {/* Sauce drip */}
      <path d="M12 3.5 Q14 4.5 13.5 6" strokeWidth={1.25} />
    </svg>
  )
}
import { Button } from '@/components/ui/button'
import KpiCard from '../components/KpiCard'
import ToolCard from '../components/ToolCard'

/* ── Seed data ─────────────────────────────────── */

const kpis = [
  { label: 'Deals in Underwriting', value: 4 },
  { label: 'Contracts with Dispo', value: 2 },
  { label: 'Pipeline Value', value: 24837.98, prefix: '$', decimals: 2 },
  { label: 'Deals Closed', value: 9, valueColor: '#7da87b' },
  { label: 'Total Assignments Earned', value: 32827.09, prefix: '$', decimals: 2, valueColor: '#7da87b' },
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
    icon: SauceBottle,
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
    <div className="relative min-h-screen">
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

      <div className="mx-auto max-w-[1200px] px-6 py-8">

      {/* ── Welcome Header ──────────────────────── */}
      <motion.section
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl gold-shimmer-text mb-1">
          Welcome back<span style={{ fontFamily: 'Rajdhani, sans-serif' }}>,</span> {firstName}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
    </div>
  )
}
