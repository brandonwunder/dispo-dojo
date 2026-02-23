import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LanternIcon,
  CompassIcon,
  MapIcon,
  ForgeHammerIcon,
  AbacusIcon,
  InkBrushIcon,
  SealStampIcon,
  ScrollIcon,
  HawkIcon,
  WarFanIcon,
  MonomiEyeIcon,
  ToriiIcon,
} from '../icons/index'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

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

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin, user } = useAuth()
  const location = useLocation()

  const sections = isAdmin
    ? [navSections[0], adminSection, ...navSections.slice(1)]
    : navSections

  const name = user?.name || 'Guest'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) onClose()
  }, [location.pathname])

  const sidebarContent = (
    <>
      {/* Wordmark */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="font-display text-3xl gold-shimmer-text tracking-wider">
          DOJO
        </h1>
        <div className="katana-line mt-3" />
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 py-2 text-[10px] font-heading tracking-[0.2em] uppercase text-[#C8D1DA]/40">
              {section.title}
            </div>
            <div className="mx-3 katana-line mb-2" />

            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {({ isActive }) => (
                  <motion.div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 transition-colors relative ${
                      isActive
                        ? 'bg-[rgba(0,198,255,0.08)]'
                        : 'hover:bg-[rgba(0,198,255,0.05)]'
                    }`}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {/* Active glow strip */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #00C6FF, #0E5A88, #00C6FF)',
                          boxShadow: '0 0 14px rgba(0,198,255,0.5), 0 0 28px rgba(0,198,255,0.2)',
                        }}
                      />
                    )}
                    <item.icon
                      size={20}
                      className={isActive ? 'text-[#00C6FF]' : 'text-text-dim'}
                    />
                    <span
                      className={`font-heading text-sm tracking-wide ${
                        isActive ? 'text-[#00C6FF]' : 'text-text-dim'
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

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-[rgba(0,198,255,0.1)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full hanko-seal flex items-center justify-center text-xs font-heading font-bold text-parchment">
          {initials}
        </div>
        <span className="font-heading text-sm text-text-dim tracking-wide truncate">
          {name}
        </span>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[250px] lacquer-deep lacquer-shine sidebar-shadow z-40 flex-col border-r border-[rgba(0,198,255,0.12)]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide-out drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-[280px] lacquer-deep lacquer-shine sidebar-shadow z-50 flex flex-col border-r border-[rgba(0,198,255,0.12)] lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
