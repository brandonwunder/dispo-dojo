import { motion } from 'framer-motion'
import { Play, Video } from 'lucide-react'
import GlassPanel from '../components/GlassPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const CATEGORIES = [
  {
    title: 'Sellers in Arrears',
    desc: 'Navigating late payments and pre-foreclosure sensitivity — urgency framing without applying pressure.',
  },
  {
    title: 'VA Entitlement Questions',
    desc: "Explaining entitlement restoration and how Sub-To preserves the seller's VA eligibility for future use.",
  },
  {
    title: '"What if I want to buy again?"',
    desc: 'Handling the future purchase objection — how Sub-To affects DTI vs. the deed, and realistic refi paths.',
  },
  {
    title: 'Price Objection',
    desc: "Seller expects retail. Bridging to net proceeds reality without being confrontational.",
  },
  {
    title: '"I need to think about it"',
    desc: 'Re-engagement framing and follow-up cadence that keeps deals alive without being pushy.',
  },
  {
    title: 'Agent Pushback',
    desc: 'When listing agents resist creative offers — how to keep them engaged and on your side.',
  },
  {
    title: 'Title Company Concerns',
    desc: 'Addressing the due-on-sale clause and how experienced title companies handle Sub-To transactions.',
  },
  {
    title: 'Spouse / Family Member Involvement',
    desc: 'Navigating second decision-maker dynamics — getting everyone on the same page without losing the deal.',
  },
]

export default function CallRecordings() {
  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/call-recordings-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 30%',
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.6) 55%, rgba(11,15,20,0.88) 100%),
            linear-gradient(180deg, rgba(11,15,20,0.25) 0%, rgba(11,15,20,0.5) 40%, rgba(11,15,20,0.85) 100%)
          `,
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[900px] mx-auto relative z-10 px-6 py-16"
      >
      {/* Hero header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <Video size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              Call Recordings
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            Real calls organized by scenario — study the patterns, not just the scripts
          </p>
        </div>
      </motion.div>

      <div>
        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <GlassPanel className="p-5 h-full opacity-70">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}>
                    <Play size={15} style={{ color: '#00C6FF' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-heading text-sm text-parchment tracking-wide">{cat.title}</h3>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase"
                        style={{
                          background: 'rgba(0,198,255,0.08)',
                          border: '1px solid rgba(0,198,255,0.2)',
                          color: '#00C6FF',
                        }}
                      >
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-text-dim text-xs leading-relaxed font-body">{cat.desc}</p>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p variants={itemVariants} className="text-text-muted text-xs text-center mt-8 font-body">
          We'll be adding recordings as we collect strong examples. Check back regularly.
        </motion.p>
      </div>
    </motion.div>
    </>
  )
}
