import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  CompassIcon,
  MapIcon,
  ForgeHammerIcon,
  KatanaIcon,
  ScrollIcon,
  InkBrushIcon,
  HawkIcon,
  BannerIcon,
} from '../components/icons/index'
import InkLandscape from '../components/InkLandscape'
import HangingScroll from '../components/HangingScroll'
import ShojiPanel from '../components/ShojiPanel'

const allTools = [
  {
    label: 'Agent Finder',
    icon: CompassIcon,
    description: 'Upload property lists and find listing agents instantly',
    to: '/agent-finder',
  },
  {
    label: 'FSBO Finder',
    icon: MapIcon,
    description: 'Find For Sale By Owner listings in any city',
    to: '/fsbo-finder',
  },
  {
    label: 'Lead Scrubbing',
    icon: HawkIcon,
    description: 'Deal Sauce walkthrough for finding and scrubbing leads',
    to: '/lead-scrubbing',
  },
  {
    label: 'Free Underwriting',
    icon: ForgeHammerIcon,
    description: 'Submit properties for free underwriting on cash or Sub2 deals',
    to: '/underwriting',
  },
  {
    label: 'LOI Generator',
    icon: ScrollIcon,
    description: 'Generate and send Letters of Intent in bulk',
    to: '/loi-generator',
  },
  {
    label: 'Contract Generator',
    icon: InkBrushIcon,
    description: 'Build, sign, and send contracts in minutes',
    to: '/contract-generator',
  },
  {
    label: 'Direct Agent Process',
    icon: KatanaIcon,
    description: 'Learn our direct-to-agent outreach process',
    to: '/direct-agent',
  },
  {
    label: 'Join Our Team',
    icon: BannerIcon,
    description: 'Cold calling opportunity for experienced closers',
    to: '/join-team',
  },
]

const honorStats = [
  { kanji: '刀', label: 'Active Deals', value: 12 },
  { kanji: '金', label: 'Pipeline Value', value: 2450000, prefix: '$' },
  { kanji: '人', label: 'Agents Found', value: 347 },
  { kanji: '勝', label: 'Deals Closed', value: 8 },
]

export default function Dashboard() {
  const { user } = useAuth()

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'there'

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Zone 1: Ink Landscape Hero */}
      <InkLandscape>
        <motion.h1
          className="font-display text-5xl gold-shimmer-text mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome back, {firstName}-san
        </motion.h1>
        <motion.p
          className="font-heading text-text-dim tracking-wide text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </motion.p>
      </InkLandscape>

      {/* Zone 2: Honor Wall — Hanging Scrolls */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="katana-line flex-1" />
          <h2 className="font-display text-lg text-gold/60 tracking-widest">
            Honor Wall
          </h2>
          <div className="katana-line flex-1" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {honorStats.map((stat, i) => (
            <HangingScroll
              key={stat.label}
              kanji={stat.kanji}
              label={stat.label}
              value={stat.value}
              prefix={stat.prefix || ''}
              suffix={stat.suffix || ''}
              delay={i * 0.15}
            />
          ))}
        </div>
      </div>

      {/* Zone 3: Training Grounds — Shoji Panels */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="katana-line flex-1" />
          <h2 className="font-display text-lg text-gold/60 tracking-widest">
            Training Grounds
          </h2>
          <div className="katana-line flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allTools.map((tool, i) => (
            <ShojiPanel
              key={tool.to}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              to={tool.to}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
