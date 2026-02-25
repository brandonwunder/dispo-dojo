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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const stepAccents = ['#00C6FF', '#F6C445', '#A855F7', '#E53935']

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
    accent: '#00C6FF',
  },
  {
    to: '/contract-generator',
    icon: FileCheck,
    name: 'Contract Generator',
    desc: 'Build and sign contracts instantly',
    accent: '#F6C445',
  },
  {
    to: '/underwriting',
    icon: ClipboardCheck,
    name: 'Free Underwriting',
    desc: 'Get deals underwritten at no cost',
    accent: '#A855F7',
  },
  {
    to: '/agent-finder',
    icon: Search,
    name: 'Agent Finder',
    desc: 'Find listing agents for any property',
    accent: '#E53935',
  },
]

export default function DirectAgent() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/direct-agent-bg.png)',
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

      {/* ---- Main content ---- */}
      <div className="max-w-3xl mx-auto px-6 py-16 relative z-10">
        {/* ---- Hero ---- */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mb-14"
        >
          <div className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <Send size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                The Messenger Hawk Post
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              How We Close Deals With Listing Agents
            </p>
          </div>
        </motion.div>

        {/* ---- Process flow — 4-step journey ---- */}
        <div className="mb-16">
          {steps.map((step, index) => (
            <div key={step.num}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={itemVariants}
              >
                <div
                  className="rounded-sm border border-gold-dim/20 overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #111B24 0%, #0E1720 100%)' }}
                >
                  {/* Colored accent line at top */}
                  <div
                    className="h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${stepAccents[index]}, transparent)` }}
                  />

                  <div className="p-5">
                    <div className="flex items-start gap-5">
                      {/* Numbered indicator */}
                      <div
                        className="shrink-0 flex items-center justify-center w-12 h-12 rounded-sm font-heading text-lg font-bold border"
                        style={{
                          color: stepAccents[index],
                          borderColor: `${stepAccents[index]}33`,
                          background: `${stepAccents[index]}0D`,
                        }}
                      >
                        {String(step.num).padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <step.icon size={18} className="shrink-0" style={{ color: stepAccents[index] }} />
                          <h3 className="font-heading text-parchment text-lg font-semibold tracking-wide">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-text-dim text-sm leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Connector between steps */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-px h-6 border-l-2 border-dashed"
                      style={{ borderColor: `${stepAccents[index]}30` }}
                    />
                    <ArrowRight
                      size={14}
                      className="rotate-90"
                      style={{ color: `${stepAccents[index]}50` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---- Divider ---- */}
        <div className="h-[1px] mb-10" style={{ background: 'linear-gradient(90deg, transparent, #00C6FF33, transparent)' }} />

        {/* ---- Tools callout ---- */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            className="font-display text-2xl text-gold tracking-[0.06em] mb-6 text-center"
          >
            Everything You Need, Built In
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <motion.div key={tool.to} variants={itemVariants}>
                <Link to={tool.to} className="block h-full group">
                  <div
                    className="rounded-sm border border-gold-dim/20 overflow-hidden h-full transition-transform duration-200 hover:-translate-y-1"
                    style={{ background: 'linear-gradient(180deg, #111B24 0%, #0E1720 100%)' }}
                  >
                    {/* Colored accent line */}
                    <div
                      className="h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${tool.accent}, transparent)` }}
                    />

                    <div className="p-5">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-sm mb-4 border"
                        style={{
                          color: tool.accent,
                          borderColor: `${tool.accent}33`,
                          background: `${tool.accent}0D`,
                        }}
                      >
                        <tool.icon size={18} />
                      </div>
                      <h4 className="font-heading text-lg font-semibold tracking-wide text-parchment mb-1">
                        {tool.name}
                      </h4>
                      <p className="text-text-dim text-xs leading-relaxed flex-1">
                        {tool.desc}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-heading font-medium uppercase tracking-wide mt-3 group-hover:gap-2 transition-[gap] duration-200"
                        style={{ color: tool.accent }}
                      >
                        Use Tool <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
