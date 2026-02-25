import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MapPin, Send, Search, MessageSquare, LayoutDashboard, Monitor, Calculator, FileSignature, HandCoins, Footprints, PawPrint, House, MessageCircle, DollarSign, BarChart3, Briefcase, Target, Video, ChevronDown } from 'lucide-react'
import {
  LanternIcon,
  CompassIcon,
  ForgeHammerIcon,
  AbacusIcon,
  InkBrushIcon,
  SealStampIcon,
  ScrollIcon,
  HawkIcon,
  WarFanIcon,
  MonomiEyeIcon,
  ToriiIcon,
  ShurikenIcon,
} from '../icons/index'
import { useAuth } from '../context/AuthContext'
import { useEffect, useMemo, useRef, useState } from 'react'
import NinjaAvatar from './NinjaAvatar'
import QuickSettingsPanel from './QuickSettingsPanel'

const navSections = [
  {
    title: '',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'JV Dashboard' },
      { to: '/community', icon: MessageSquare, label: 'Message Board' },
      { to: '/live-deals', icon: Briefcase, label: 'View Active Deals' },
    ],
  },
  {
    title: 'Lead Generation',
    items: [
      { to: '/lead-scrubbing', icon: Search, label: 'Finding Leads' },
      { to: '/agent-finder', icon: CompassIcon, label: 'Find Agent Emails' },
      { to: '/loi-sender', icon: Send, label: 'LOI Sender' },
    ],
  },
  {
    title: 'Sales Tools',
    items: [
      { to: '/website-explainer', icon: Monitor, label: 'Subject-To Explainer' },
      { to: '/offer-comparison', icon: BarChart3, label: 'Offer Comparison' },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { to: '/underwriting', icon: Calculator, label: 'Free Underwriting' },
      { to: '/contract-generator', icon: FileSignature, label: 'Contract Generator' },
      { to: '/find-buyers', icon: HandCoins, label: 'Find Buyers' },
      { to: '/buy-boxes', icon: Target, label: 'Buy Boxes' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/scripts', icon: MessageCircle, label: 'Scripts & Objections' },
      { to: '/direct-agent', icon: House, label: 'DTA Process' },
      { to: '/bird-dog', icon: DollarSign, label: 'Bird Dog Network' },
      { to: '/boots-on-ground', icon: Footprints, label: 'Boots on Ground' },
      { to: '/call-recordings', icon: Video, label: 'Call Recordings' },
    ],
  },
]

const adminSection = {
  title: 'Admin',
  items: [
    { to: '/admin', icon: MonomiEyeIcon, label: 'Admin Panel' },
  ],
}

function getSectionForPath(sections, pathname) {
  for (const section of sections) {
    if (!section.title) continue
    if (section.items.some(item => item.to !== '/' && pathname.startsWith(item.to))) {
      return section.title
    }
  }
  return null
}

function NavItem({ item }) {
  return (
    <NavLink to={item.to} end={item.to === '/'}>
      {({ isActive }) => (
        <motion.div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 transition-colors relative ${
            isActive
              ? 'bg-[rgba(0,198,255,0.08)]'
              : 'hover:bg-[rgba(0,198,255,0.05)]'
          }`}
          whileHover={{ x: 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ touchAction: 'pan-y' }}
        >
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
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin, user, logout, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navRef = useRef(null)
  const sectionRefs = useRef({})

  const sections = useMemo(
    () => isAdmin ? [navSections[0], adminSection, ...navSections.slice(1)] : navSections,
    [isAdmin]
  )

  // Track which titled section is expanded (only one at a time)
  const [expandedSection, setExpandedSection] = useState(
    () => getSectionForPath(sections, location.pathname)
  )

  // Auto-expand the section containing the active route on navigation
  useEffect(() => {
    const active = getSectionForPath(sections, location.pathname)
    if (active) setExpandedSection(active)
  }, [location.pathname, sections])

  const name = user?.name || 'Guest'

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) onClose()
  }, [location.pathname])

  const toggleSection = (title) => {
    setExpandedSection(prev => {
      const next = prev === title ? null : title
      if (next) {
        // Scroll the section header into view after animation starts
        setTimeout(() => {
          sectionRefs.current[title]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 60)
      } else {
        // Scroll back to top of nav when collapsing
        setTimeout(() => {
          navRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }, 60)
      }
      return next
    })
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="pt-6 pb-2 flex justify-center">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,198,255,0.07) 0%, rgba(14,90,136,0.04) 60%, transparent 100%)',
              transform: 'scale(1.4)',
            }}
          />
          <img
            src="/dispo-dojo-logo.png"
            alt="Dispo Dojo"
            className="relative w-40 h-40 object-contain drop-shadow-lg"
            style={{ animation: 'logoFloat 6s ease-in-out infinite' }}
          />
        </div>
      </div>
      <div className="mx-6 katana-line mb-2" />

      {/* Navigation sections */}
      <nav ref={navRef} className="flex-1 min-h-0 overflow-y-auto px-3 pt-8 pb-4 flex flex-col" style={{ touchAction: 'pan-y' }}>
        {sections.map((section) => {
          const isCollapsible = !!section.title
          const isExpanded = !isCollapsible || expandedSection === section.title

          return (
            <div
              key={section.title || 'top'}
              className="mb-1 mt-3 first:mt-0"
              ref={isCollapsible ? (el) => { sectionRefs.current[section.title] = el } : undefined}
            >
              {isCollapsible && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-sm group transition-colors hover:bg-[rgba(0,198,255,0.04)]"
                >
                  <span
                    className="text-[10px] font-heading tracking-[0.2em] uppercase transition-colors"
                    style={{
                      color: '#00C6FF',
                      textShadow: isExpanded
                        ? '0 0 8px rgba(0,198,255,0.8), 0 0 20px rgba(0,198,255,0.4)'
                        : '0 0 6px rgba(0,198,255,0.4)',
                      opacity: isExpanded ? 1 : 0.7,
                    }}
                  >
                    {section.title}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <ChevronDown
                      size={13}
                      style={{ color: '#00C6FF', opacity: isExpanded ? 0.8 : 0.4 }}
                    />
                  </motion.div>
                </button>
              )}

              {isCollapsible && isExpanded && (
                <div
                  className="mx-3 katana-line"
                  style={{ marginBottom: '6px' }}
                />
              )}

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="items"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className={isCollapsible ? 'pb-2' : 'mb-4'}>
                      {section.items.map((item) => (
                        <NavItem key={item.to} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-[rgba(0,198,255,0.1)] flex items-center gap-3">
        <button
          onClick={() => setSettingsOpen(true)}
          title="Open settings"
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[rgba(246,196,69,0.15)] hover:ring-[rgba(0,198,255,0.4)] transition-all duration-200"
        >
          <NinjaAvatar config={profile?.avatarConfig} size={32} rank={profile?.rank || 'initiate'} />
        </button>
        <span className="font-heading text-sm text-text-dim tracking-wide truncate flex-1">
          {name}
        </span>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[#8a8578] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors duration-150"
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[250px] lacquer-deep sidebar-shadow z-40 flex-col border-r border-[rgba(0,198,255,0.12)]">
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
              className="fixed left-0 top-0 bottom-0 w-[280px] lacquer-deep sidebar-shadow z-50 flex flex-col border-r border-[rgba(0,198,255,0.12)] lg:hidden"
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

      <QuickSettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
