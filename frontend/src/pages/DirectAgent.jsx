import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Send,
  FileText,
  FileCheck,
  Handshake,
  Search,
  ArrowRight,
  PenLine,
  ClipboardCheck,
} from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const steps = [
  {
    num: 1,
    title: 'Send a Letter of Intent',
    icon: Send,
    body: 'Reach out to the listing agent with a professional LOI. This is your first touchpoint \u2014 make it count. Our LOI Generator creates clean, professional letters that get responses.',
  },
  {
    num: 2,
    title: 'Request the Mortgage Statement',
    icon: FileText,
    body: "Ask the agent to provide the seller's mortgage statement. This is key for Subject-To deals and helps us understand the full financial picture of the property.",
  },
  {
    num: 3,
    title: 'Submit for Underwriting',
    icon: ClipboardCheck,
    body: "Send the mortgage statement to our underwriter for analysis. You can do this yourself or submit it through our Free Underwriting tool \u2014 we'll handle the analysis at no cost to you.",
  },
  {
    num: 4,
    title: 'Pitch the Contract',
    icon: Handshake,
    body: 'Once underwriting is approved, present the contract to the agent with full underwriting backup. Having the numbers ready shows professionalism and speeds up the closing process.',
  },
]

const tools = [
  {
    to: '/loi-generator',
    icon: PenLine,
    name: 'LOI Generator',
    desc: 'Create professional Letters of Intent',
  },
  {
    to: '/contract-generator',
    icon: FileCheck,
    name: 'Contract Generator',
    desc: 'Build and sign contracts instantly',
  },
  {
    to: '/underwriting',
    icon: ClipboardCheck,
    name: 'Free Underwriting',
    desc: 'Get deals underwritten at no cost',
  },
  {
    to: '/agent-finder',
    icon: Search,
    name: 'Agent Finder',
    desc: 'Find listing agents for any property',
  },
]

/* Hawk silhouette SVG for the dawn sky */
function HawkSilhouette() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      className="absolute top-16 right-12 w-[60px] h-[60px] opacity-[0.12] pointer-events-none"
      animate={{ rotate: [0, 5, -3, 0], x: [0, 6, -4, 0], y: [0, -4, 2, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M32 18c-4 0-12 3-18 10-2 2.5-3 5-3 5s8-4 14-4c0 0-6 6-8 14 0 0 6-6 12-8 0 0-2 8-1 12 0 0 4-8 6-10 2 2 6 10 6 10 1-4-1-12-1-12 6 2 12 8 12 8-2-8-8-14-8-14 6 0 14 4 14 4s-1-2.5-3-5c-6-7-14-10-18-10z"
        fill="currentColor"
        className="text-parchment"
      />
    </motion.svg>
  )
}

export default function DirectAgent() {
  return (
    <div className="relative min-h-screen">
      {/* ---- Dawn sky background ---- */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to top, #1a1510 0%, #06060f 30%, #0a0a20 60%, #2a1a3a 80%, #c9913a33 100%)',
        }}
      />

      {/* ---- Mountain silhouettes ---- */}
      <div className="fixed bottom-0 left-0 right-0 -z-10 h-48 pointer-events-none">
        {/* Mountain 1 — large left */}
        <div
          className="absolute bottom-0 left-[5%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '160px solid transparent',
            borderRight: '160px solid transparent',
            borderBottom: '180px solid #0d0b09',
          }}
        />
        {/* Mountain 2 — tall center-left */}
        <div
          className="absolute bottom-0 left-[25%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '120px solid transparent',
            borderRight: '140px solid transparent',
            borderBottom: '200px solid #11100e',
          }}
        />
        {/* Mountain 3 — center-right */}
        <div
          className="absolute bottom-0 right-[20%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '180px solid transparent',
            borderRight: '130px solid transparent',
            borderBottom: '160px solid #0f0d0b',
          }}
        />
        {/* Mountain 4 — far right */}
        <div
          className="absolute bottom-0 right-[0%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '140px solid transparent',
            borderRight: '100px solid transparent',
            borderBottom: '140px solid #0e0c0a',
          }}
        />
      </div>

      {/* ---- Hawk silhouette ---- */}
      <HawkSilhouette />

      {/* ---- Main content ---- */}
      <div className="max-w-3xl mx-auto pb-16 relative z-10">
        {/* ---- Hero ---- */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mb-14 text-center"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl text-gold tracking-[0.06em] mb-3"
          >
            The Messenger Hawk Post
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="font-heading text-text-dim tracking-wide text-lg"
          >
            How We Close Deals With Listing Agents
          </motion.p>
        </motion.div>

        {/* ---- Process flow — 4-step journey ---- */}
        <div className="mb-16">
          {steps.map((step, index) => (
            <div key={step.num}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
              >
                <WoodPanel withBrackets>
                  <div className="flex items-start gap-5">
                    {/* Hanko-seal numbered circle */}
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full hanko-seal text-white font-display text-lg font-bold">
                      {step.num}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <step.icon size={18} className="text-gold shrink-0" />
                        <h3 className="font-heading text-parchment text-lg font-semibold tracking-wide">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-text-dim text-sm leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </WoodPanel>
              </motion.div>

              {/* Dotted gold connector between steps */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-6 border-l-2 border-dashed border-gold-dim/30" />
                    <ArrowRight
                      size={14}
                      className="text-gold-dim/40 rotate-90"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---- Katana divider ---- */}
        <div className="katana-line mb-10" />

        {/* ---- Tools callout ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.h2
            variants={fadeUp}
            className="font-display text-2xl text-gold tracking-[0.06em] mb-6 text-center"
          >
            Everything You Need, Built In
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <motion.div key={tool.to} variants={fadeUp}>
                <Link to={tool.to} className="block h-full group">
                  <WoodPanel hover className="h-full">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl hanko-seal mb-4">
                      <tool.icon size={18} className="text-white" />
                    </div>
                    <h4 className="font-heading text-lg font-semibold tracking-wide text-parchment mb-1">
                      {tool.name}
                    </h4>
                    <p className="text-text-dim text-xs leading-relaxed flex-1">
                      {tool.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-gold text-xs font-heading font-medium uppercase tracking-wide mt-3 group-hover:gap-2 transition-all">
                      Use Tool <ArrowRight size={12} />
                    </span>
                  </WoodPanel>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
