import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  CompassIcon,
  MapIcon,
  ForgeHammerIcon,
  KatanaIcon,
  AbacusIcon,
  InkBrushIcon,
  SealStampIcon,
  ScrollIcon,
  HawkIcon,
  WarFanIcon,
  BannerIcon,
  ToriiIcon,
} from '../components/icons/index'
import DojoHallScene from '../components/three/DojoHallScene'
import WoodPanel from '../components/WoodPanel'
import CountUp from 'react-countup'

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
    label: 'CRM',
    icon: AbacusIcon,
    description: 'Track your full deal pipeline from lead to close',
    to: '/crm',
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
  { kanji: '金', label: 'Pipeline Value', value: 2450000, prefix: '$', suffix: '' },
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
      <style>{`@keyframes sway { 0%,100% { transform: rotate(-0.5deg); } 50% { transform: rotate(0.5deg); } }`}</style>

      {/* Zone 1: Hero Banner */}
      <div className="relative h-[280px] rounded-sm overflow-hidden mb-8 border border-gold-dim/20">
        <DojoHallScene />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent z-10" />
        <div className="absolute bottom-8 left-8 z-20">
          <motion.h1
            className="font-display text-5xl gold-shimmer-text mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome back, {firstName}-san
          </motion.h1>
          <p className="font-heading text-text-dim tracking-wide text-lg">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Zone 2: Honor Wall (stats) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {honorStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="scroll-card wood-panel p-6 text-center relative rounded-sm border border-gold-dim/20 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            style={{ animation: `sway 4s ease-in-out ${i * 0.5}s infinite` }}
          >
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl font-display text-gold/[0.08] pointer-events-none">
              {stat.kanji}
            </span>
            <div className="relative z-10">
              <div className="font-heading text-3xl font-bold gold-shimmer-text">
                {stat.prefix}
                <CountUp end={stat.value} duration={2} separator="," />
                {stat.suffix}
              </div>
              <div className="font-heading text-sm text-text-dim tracking-widest uppercase mt-1">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Zone 3: Weapon Wall (tools) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTools.map((tool, i) => (
          <Link to={tool.to} key={tool.to}>
            <WoodPanel hover className="h-full">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-sm bg-gold/10">
                  <tool.icon size={36} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-parchment tracking-wide">
                    {tool.label}
                  </h3>
                  <p className="text-text-dim text-sm mt-1">{tool.description}</p>
                </div>
              </div>
            </WoodPanel>
          </Link>
        ))}
      </div>
    </div>
  )
}
