import { motion } from 'framer-motion'
import { Play, Info } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import { ForgeHammerIcon } from '../components/icons/index'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const VIDEOS = [
  {
    title: 'Finding Subject-To Leads',
    desc: 'How to identify assumable-mortgage candidates on the MLS — filters, equity signals, and days-on-market patterns that reveal motivated sellers.',
    bullets: [
      'Setting up MLS filters for Sub-To candidates',
      'Reading equity stack indicators',
      'Days-on-market patterns that signal motivation',
      'How to approach the listing agent on these deals',
    ],
  },
  {
    title: 'Finding Stack Method Leads',
    desc: 'Layer equity, DOM, and price reduction criteria to surface highly motivated sellers before the competition finds them.',
    bullets: [
      'What "the stack" means and why it works',
      'Combining filters for high-conviction leads',
      'Reading market signals in your zip code',
      'Building a repeatable daily search routine',
    ],
  },
  {
    title: 'Finding Cash Leads — Deal Sauce Walkthrough',
    desc: 'A full walkthrough of the Deal Sauce platform: dashboard navigation, finding cash leads, and identifying other lead types worth pursuing.',
    bullets: [
      'Platform navigation and account setup',
      'Understanding the Deal Sauce dashboard',
      'Filtering for cash leads in your market',
      'Identifying other lead categories available',
    ],
  },
]

export default function LeadScrubbing() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto relative"
    >
      {/* Forge Fire Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 10% 50%, rgba(232, 101, 46, 0.15) 0%, transparent 50%)' }}
      />

      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-6 relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
            <ForgeHammerIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              Finding Leads
            </h1>
            <p className="text-text-dim text-base mt-1 font-body">
              Refine raw leads into razor-sharp prospects
            </p>
          </div>
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Info Banner */}
      <motion.div variants={itemVariants} className="mb-8">
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-sm border"
          style={{
            background: 'rgba(0, 198, 255, 0.05)',
            borderColor: 'rgba(0, 198, 255, 0.2)',
          }}
        >
          <Info size={18} className="text-cyan shrink-0 mt-0.5" />
          <p className="text-text-dim text-sm leading-relaxed font-body">
            These training videos focus on finding{' '}
            <span className="text-parchment font-heading">on-market properties</span> in each category.
            Once we identify a lead, we reach out directly to the listing agent to present our offer.
          </p>
        </div>
      </motion.div>

      {/* Video Cards */}
      {VIDEOS.map((video) => (
        <motion.div key={video.title} variants={itemVariants} className="mb-6">
          <WoodPanel headerBar={video.title} className="border border-gold-dim/15">
            {/* Video Placeholder */}
            <div className="aspect-video bg-bg-elevated border border-gold-dim/15 rounded-sm flex flex-col items-center justify-center gap-4 mb-6">
              <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center">
                <Play size={32} className="text-white ml-1" />
              </div>
              <p className="text-text-dim text-lg font-heading tracking-wide">Video Coming Soon</p>
            </div>

            {/* Description */}
            <p className="text-text-dim text-sm leading-relaxed font-body mb-4">{video.desc}</p>

            <div className="katana-line my-4" />

            {/* Bullets */}
            <ul className="space-y-3">
              {video.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <ForgeHammerIcon size={18} className="text-gold shrink-0 mt-0.5" />
                  <span className="text-text-dim text-sm leading-relaxed font-body">{bullet}</span>
                </li>
              ))}
            </ul>
          </WoodPanel>
        </motion.div>
      ))}
    </motion.div>
  )
}
