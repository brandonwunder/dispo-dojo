import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LanternIcon,
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
  MonomiEyeIcon,
  ToriiIcon,
} from '../icons/index'
import { useAuth } from '../context/AuthContext'

const navSections = [
  {
    title: 'Dashboard',
    items: [
      { to: '/', icon: LanternIcon, label: 'Dashboard' },
    ],
  },
  {
    title: 'Lead Generation',
    items: [
      { to: '/agent-finder', icon: CompassIcon, label: 'Agent Finder' },
      { to: '/fsbo-finder', icon: MapIcon, label: 'FSBO Finder' },
      { to: '/lead-scrubbing', icon: ForgeHammerIcon, label: 'Lead Scrubbing' },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { to: '/crm', icon: KatanaIcon, label: 'CRM' },
      { to: '/underwriting', icon: AbacusIcon, label: 'Free Underwriting' },
      { to: '/loi-generator', icon: InkBrushIcon, label: 'LOI Generator' },
      { to: '/contract-generator', icon: SealStampIcon, label: 'Contract Generator' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/scripts', icon: ScrollIcon, label: 'Scripts & Objections' },
      { to: '/direct-agent', icon: HawkIcon, label: 'Direct Agent Process' },
      { to: '/dispo-process', icon: WarFanIcon, label: 'Dispo Process' },
      { to: '/join-team', icon: BannerIcon, label: 'Join Our Team' },
      { to: '/website-explainer', icon: ToriiIcon, label: 'Website Explainer' },
    ],
  },
]

const adminSection = {
  title: 'Admin',
  items: [
    { to: '/admin', icon: MonomiEyeIcon, label: 'Admin Panel' },
  ],
}

export default function Sidebar() {
  const { isAdmin } = useAuth()

  const sections = isAdmin
    ? [navSections[0], adminSection, ...navSections.slice(1)]
    : navSections

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[250px] wood-panel-dark z-40 flex flex-col border-r border-gold-dim/20">

      {/* Clan Crest / Logo */}
      <div className="p-6 flex justify-center">
        <div
          className="w-20 h-20 rounded-full border-2 border-gold/40 overflow-hidden shadow-[0_0_20px_rgba(212,168,83,0.15)]"
          style={{ animation: 'logoFloat 6s ease-in-out infinite' }}
        >
          <img src="/logo.png" alt="Dispo Dojo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            {/* Section header — pyrography style */}
            <div className="px-3 py-2 text-[10px] font-heading tracking-[0.2em] uppercase text-gold-dim/60">
              {section.title}
            </div>
            {/* Rope divider */}
            <div
              className="mx-3 h-[2px] mb-2"
              style={{
                background: 'repeating-linear-gradient(90deg, #8b7355 0px, #6b5a42 4px, #a08968 8px)',
                opacity: 0.3,
              }}
            />

            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {({ isActive }) => (
                  <motion.div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-gold/10 shadow-[0_0_15px_rgba(212,168,83,0.1)] border-l-2 border-gold'
                        : 'hover:bg-gold/5 border-l-2 border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <item.icon
                      size={22}
                      className={isActive ? 'text-gold' : 'text-text-dim'}
                    />
                    <span
                      className={`font-heading text-sm tracking-wide ${
                        isActive ? 'text-gold' : 'text-text-dim'
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom mist fade */}
      <div className="h-12 bg-gradient-to-t from-[#0a0806] to-transparent pointer-events-none" />
    </aside>
  )
}
