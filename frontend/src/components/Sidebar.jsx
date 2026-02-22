import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Home,
  Filter,
  FileCheck,
  FileText,
  FilePen,
  BookOpen,
  UserPlus,
  Shield,
  ScrollText,
  Globe,
  Rocket,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navSections = [
  {
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    header: 'LEAD GEN',
    items: [
      { to: '/agent-finder', icon: Search, label: 'Agent Finder' },
      { to: '/fsbo-finder', icon: Home, label: 'FSBO Finder' },
      { to: '/lead-scrubbing', icon: Filter, label: 'Lead Scrubbing' },
    ],
  },
  {
    header: 'DEAL MGMT',
    items: [
      { to: '/underwriting', icon: FileCheck, label: 'Free Underwriting' },
      { to: '/loi-generator', icon: FileText, label: 'LOI Generator' },
      { to: '/contract-generator', icon: FilePen, label: 'Contract Generator' },
    ],
  },
  {
    header: 'RESOURCES',
    items: [
      { to: '/direct-agent', icon: BookOpen, label: 'Direct Agent Process' },
      { to: '/scripts', icon: ScrollText, label: 'Scripts & Objections' },
      { to: '/website-explainer', icon: Globe, label: 'Website Explainer' },
      { to: '/dispo-process', icon: Rocket, label: 'Dispo Process' },
      { to: '/join-team', icon: UserPlus, label: 'Join Our Team' },
    ],
  },
]

const adminSection = {
  header: 'ADMIN',
  items: [
    { to: '/admin', icon: Shield, label: 'Admin Panel' },
  ],
}

export default function Sidebar() {
  const { isAdmin } = useAuth()

  const sections = isAdmin
    ? [navSections[0], adminSection, ...navSections.slice(1)]
    : navSections

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[250px] z-40 flex flex-col bg-bg/90 backdrop-blur-xl border-r border-gold-dim/[0.08]">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 pt-6 pb-4">
        <img
          src="/logo.png"
          alt="Dispo Dojo"
          className="w-[120px] animate-[logoFloat_4s_ease-in-out_infinite]"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.header && (
              <>
                <h3 className="px-3 pt-5 pb-1.5 font-heading text-[10px] font-semibold tracking-[0.15em] text-gold-dim uppercase">
                  {section.header}
                </h3>
                <div className="mx-3 mb-2 katana-line" />
              </>
            )}

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gold/[0.05] text-gold border-l-[3px] border-gold shadow-[inset_0_0_20px_-10px_rgba(212,168,83,0.15)] pl-2.5'
                      : 'text-text-dim hover:bg-gold/[0.04] hover:text-gold-dim border-l-[3px] border-transparent'
                  }`
                }
              >
                <item.icon
                  size={18}
                  className="shrink-0 transition-colors duration-200"
                />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom mist */}
      <div className="h-16 bg-gradient-to-t from-bg-elevated/80 to-transparent pointer-events-none" />
    </aside>
  )
}
