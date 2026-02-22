import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import ShojiCard from '../components/ShojiCard'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const bullets = [
  'How to use Deal Sauce for lead generation',
  'Setting up your lead scrubbing workflow',
  'Filtering and qualifying leads efficiently',
  'Exporting clean lead lists for outreach',
]

export default function LeadScrubbing() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="font-display text-2xl tracking-[0.06em] text-text-primary brush-underline mb-3">
          Lead Scrubbing
        </h1>
        <p className="text-text-dim text-base mt-3">
          Deal Sauce walkthrough for finding and scrubbing leads
        </p>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Video Embed Area */}
      <motion.div variants={itemVariants}>
        <ShojiCard hover={false} className="p-4 mb-8">
          <div className="aspect-video bg-bg-elevated border border-gold-dim/[0.15] rounded-xl flex flex-col items-center justify-center gap-4">
            <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center">
              <Play size={32} className="text-white ml-1" />
            </div>
            <p className="text-text-dim text-lg font-heading tracking-wide">Video Coming Soon</p>
          </div>
        </ShojiCard>
      </motion.div>

      {/* Description / What You'll Learn */}
      <motion.div variants={itemVariants}>
        <ShojiCard hover={false} className="p-6 md:p-8">
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mb-3">
            Training Guide
          </p>
          <h2 className="font-display text-xl tracking-[0.06em] text-text-primary mb-5">
            What You'll Learn
          </h2>

          <div className="katana-line my-4" />

          <ul className="space-y-3 mb-6">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5" />
                <span className="text-text-dim leading-relaxed font-body">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-text-muted text-sm font-body">
            Need help? Reach out to your team lead for a walkthrough.
          </p>
        </ShojiCard>
      </motion.div>
    </motion.div>
  )
}
