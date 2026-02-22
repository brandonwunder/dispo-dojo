import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import { ForgeHammerIcon } from '../components/icons/index'

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

const forgeStages = [
  { num: 1, name: 'Raw Ore', desc: 'Start with raw lead lists from your sources', kanji: '\u9271' },
  { num: 2, name: 'Smelting', desc: 'Run leads through Deal Sauce to identify potential', kanji: '\u6EB6' },
  { num: 3, name: 'Hammering', desc: 'Clean and verify contact data for accuracy', kanji: '\u935B' },
  { num: 4, name: 'Tempering', desc: 'Score and prioritize leads by motivation', kanji: '\u713C' },
  { num: 5, name: 'Finished Blade', desc: 'Export ready-to-call qualified leads', kanji: '\u5203' },
]

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
      className="max-w-[900px] mx-auto relative"
    >
      {/* ── Forge Fire Glow Background ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 10% 50%, rgba(232, 101, 46, 0.15) 0%, transparent 50%)',
        }}
      />

      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-8 relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
            <ForgeHammerIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              The Forge
            </h1>
            <p className="text-text-dim text-base mt-1 font-body">
              Refine raw leads into razor-sharp prospects
            </p>
          </div>
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      {/* ── Forge Stages ── */}
      <motion.div variants={itemVariants} className="mb-10">
        <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mb-6">
          The Forging Process
        </p>

        <div className="flex flex-col items-center">
          {forgeStages.map((stage, idx) => (
            <div key={stage.num} className="w-full flex flex-col items-center">
              <motion.div
                variants={itemVariants}
                className="w-full"
              >
                <WoodPanel hover className="relative overflow-hidden">
                  {/* Kanji watermark */}
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none"
                    style={{
                      fontSize: '5rem',
                      lineHeight: 1,
                      opacity: 0.06,
                      fontWeight: 900,
                      color: '#d4a853',
                    }}
                  >
                    {stage.kanji}
                  </div>

                  <div className="relative flex items-center gap-5">
                    {/* Stage number in hanko seal circle */}
                    <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white font-heading font-bold text-lg">
                        {stage.num}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-display text-xl text-parchment tracking-wide mb-1">
                        {stage.name}
                      </h3>
                      <p className="text-text-dim font-body text-sm leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                </WoodPanel>
              </motion.div>

              {/* Connecting gold line between stages */}
              {idx < forgeStages.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div
                    className="w-px"
                    style={{
                      height: 40,
                      background: 'linear-gradient(to bottom, rgba(212,168,83,0.5), rgba(212,168,83,0.15))',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Video Section ── */}
      <motion.div variants={itemVariants}>
        <WoodPanel
          headerBar="Training Footage"
          className="mb-8 border-2 border-gold-dim/15"
          style={{ borderColor: 'rgba(60,50,40,0.4)' }}
        >
          <div className="aspect-video bg-bg-elevated border border-gold-dim/15 rounded-sm flex flex-col items-center justify-center gap-4">
            <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center">
              <Play size={32} className="text-white ml-1" />
            </div>
            <p className="text-text-dim text-lg font-heading tracking-wide">Video Coming Soon</p>
          </div>
        </WoodPanel>
      </motion.div>

      {/* ── Training Guide ── */}
      <motion.div variants={itemVariants}>
        <WoodPanel headerBar="Training Guide" className="mb-6">
          <h2 className="font-display text-xl tracking-[0.06em] text-parchment mb-5">
            What You'll Learn
          </h2>

          <div className="katana-line my-4" />

          <ul className="space-y-4 mb-6">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <ForgeHammerIcon size={20} className="text-gold shrink-0 mt-0.5" />
                <span className="text-text-dim leading-relaxed font-body">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-text-muted text-sm font-body">
            Need help? Reach out to your team lead for a walkthrough.
          </p>
        </WoodPanel>
      </motion.div>
    </motion.div>
  )
}
