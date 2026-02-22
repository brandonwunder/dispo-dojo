import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Send,
  FileText,
  FileCheck,
  Handshake,
  Search,
  Home,
  ArrowRight,
  PenLine,
  ClipboardCheck,
} from 'lucide-react'
import ShojiCard from '../components/ShojiCard'
import ScrollCard from '../components/ScrollCard'

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
  {
    to: '/fsbo-finder',
    icon: Home,
    name: 'FSBO Finder',
    desc: 'Discover For Sale By Owner opportunities',
  },
]

export default function DirectAgent() {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* ---- Hero ---- */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="mb-14"
      >
        <motion.h1
          variants={fadeUp}
          className="font-display text-2xl tracking-[0.06em] brush-underline text-text-primary mb-3"
        >
          Direct Agent Wholesaling
        </motion.h1>
        <motion.p variants={fadeUp} className="text-text-dim text-lg">
          How We Close Deals With Listing Agents
        </motion.p>
      </motion.div>

      {/* ---- Steps ---- */}
      <div className="space-y-6 mb-16">
        {steps.map((step) => (
          <motion.div
            key={step.num}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
          >
            <ScrollCard title={step.title} defaultOpen collapsible={false}>
              <div className="flex items-start gap-5">
                {/* hanko-seal number circle */}
                <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full hanko-seal text-white font-display text-lg font-bold">
                  {step.num}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon size={18} className="text-gold shrink-0" />
                    <h3 className="font-heading text-lg font-semibold tracking-wide text-text-primary">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-text-dim text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            </ScrollCard>
          </motion.div>
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
          className="font-display text-2xl brush-underline tracking-[0.06em] text-text-primary mb-6"
        >
          Everything You Need, Built In
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <motion.div key={tool.to} variants={fadeUp}>
              <Link to={tool.to} className="block h-full">
                <ShojiCard className="p-5 h-full flex flex-col">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl hanko-seal mb-4">
                    <tool.icon size={18} className="text-white" />
                  </div>
                  <h4 className="font-heading text-lg font-semibold tracking-wide text-text-primary mb-1">
                    {tool.name}
                  </h4>
                  <p className="text-text-dim text-xs leading-relaxed flex-1">
                    {tool.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-gold text-xs font-heading font-medium uppercase tracking-wide mt-3 group-hover:gap-2 transition-all">
                    Use Tool <ArrowRight size={12} />
                  </span>
                </ShojiCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
