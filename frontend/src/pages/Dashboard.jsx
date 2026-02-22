import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Home,
  Filter,
  Users,
  FileCheck,
  FileText,
  FilePen,
  BookOpen,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ShojiCard from '../components/ShojiCard'

const sections = [
  {
    header: 'Lead Generation',
    tools: [
      {
        name: 'Agent Finder',
        icon: Search,
        description: 'Upload property lists and find listing agents instantly',
        route: '/agent-finder',
      },
      {
        name: 'FSBO Finder',
        icon: Home,
        description: 'Find For Sale By Owner listings in any city',
        route: '/fsbo-finder',
      },
      {
        name: 'Lead Scrubbing',
        icon: Filter,
        description: 'Deal Sauce walkthrough for finding and scrubbing leads',
        route: '/lead-scrubbing',
      },
    ],
  },
  {
    header: 'Deal Management',
    tools: [
      {
        name: 'CRM',
        icon: Users,
        description: 'Track your full deal pipeline from lead to close',
        route: '/crm',
      },
      {
        name: 'Free Underwriting',
        icon: FileCheck,
        description: 'Submit properties for free underwriting on cash or Sub2 deals',
        route: '/underwriting',
      },
      {
        name: 'LOI Generator',
        icon: FileText,
        description: 'Generate and send Letters of Intent in bulk',
        route: '/loi-generator',
      },
      {
        name: 'Contract Generator',
        icon: FilePen,
        description: 'Build, sign, and send contracts in minutes',
        route: '/contract-generator',
      },
    ],
  },
  {
    header: 'Resources',
    tools: [
      {
        name: 'Direct Agent Process',
        icon: BookOpen,
        description: 'Learn our direct-to-agent outreach process',
        route: '/direct-agent',
      },
      {
        name: 'Join Our Team',
        icon: UserPlus,
        description: 'Cold calling opportunity for experienced closers',
        route: '/join-team',
      },
    ],
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function Dashboard() {
  const { user } = useAuth()

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'there'

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-10"
      >
        <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2 tracking-[0.06em]">
          Welcome back, <span className="text-gold brush-underline">{firstName}</span>
        </h1>
        <p className="text-text-dim text-base">
          Your deal-closing arsenal — every weapon you need.
        </p>
      </motion.div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <div key={section.header} className="mb-10">
          {/* Section header */}
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: sIdx * 0.1 }}
            className="mb-5"
          >
            <span className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim">
              {section.header}
            </span>
            <div className="mt-2 katana-line" />
          </motion.div>

          {/* Tool cards grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {section.tools.map((tool) => {
              const Icon = tool.icon
              return (
                <motion.div key={tool.name} variants={cardVariants}>
                  <Link to={tool.route} className="block h-full no-underline">
                    <ShojiCard className="p-6 h-full flex flex-col justify-between min-h-[170px] group">
                      <div>
                        {/* Hanko seal icon */}
                        <div className="hanko-seal w-9 h-9 rounded-full flex items-center justify-center mb-3">
                          <Icon size={16} className="text-white" />
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-text-primary mb-1.5 tracking-wide">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-text-dim leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="flex justify-end mt-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gold-dim group-hover:text-gold transition-colors duration-300">
                          Enter
                          <ArrowRight
                            size={15}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </ShojiCard>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      ))}
    </div>
  )
}
