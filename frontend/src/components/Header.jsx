import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronDown } from 'lucide-react'
import {
  NinjaLantern,
  NinjaWarTable,
  NinjaTelescope,
  NinjaTracker,
  NinjaForge,
  NinjaScroll,
  NinjaCalligraphy,
  NinjaSeal,
  NinjaTraining,
  NinjaHawk,
  NinjaStrategy,
  NinjaBanner,
  NinjaGuide,
  NinjaSensei,
} from './icons/NinjaLogos'

// Route → page title mapping
const routeTitles = {
  '/': 'Dashboard',
  '/crm': 'Deal Pipeline',
  '/agent-finder': 'Agent Finder',
  '/fsbo-finder': 'FSBO Finder',
  '/lead-scrubbing': 'Lead Scrubbing',
  '/underwriting': 'Underwriting',
  '/loi-generator': 'LOI Generator',
  '/contract-generator': 'Contract Generator',
  '/scripts': 'Scripts & Objections',
  '/direct-agent': 'Direct to Agent',
  '/dispo-process': 'Dispo Process',
  '/join-team': 'Join the Team',
  '/website-explainer': 'Website Explainer',
  '/admin': 'Admin Dashboard',
}

// Route → ninja logo component mapping
const routeLogos = {
  '/': NinjaLantern,
  '/crm': NinjaWarTable,
  '/agent-finder': NinjaTelescope,
  '/fsbo-finder': NinjaTracker,
  '/lead-scrubbing': NinjaForge,
  '/underwriting': NinjaScroll,
  '/loi-generator': NinjaCalligraphy,
  '/contract-generator': NinjaSeal,
  '/scripts': NinjaTraining,
  '/direct-agent': NinjaHawk,
  '/dispo-process': NinjaStrategy,
  '/join-team': NinjaBanner,
  '/website-explainer': NinjaGuide,
  '/admin': NinjaSensei,
}

// Optional kanji watermarks for flavor (one per page)
const routeKanji = {
  '/': '道場',      // Dojo
  '/crm': '戦',     // Battle
  '/agent-finder': '探', // Search
  '/fsbo-finder': '狩', // Hunt
  '/lead-scrubbing': '鍛', // Forge
  '/underwriting': '巻', // Scroll
  '/loi-generator': '筆', // Brush
  '/contract-generator': '印', // Seal
  '/scripts': '修', // Training
  '/direct-agent': '鷹', // Hawk
  '/dispo-process': '略', // Strategy
  '/join-team': '募', // Recruit
  '/website-explainer': '案', // Guide
  '/admin': '師',   // Master
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname
  const title = routeTitles[path] || 'Dispo Dojo'
  const NinjaLogo = routeLogos[path]
  const kanji = routeKanji[path]
  const name = user?.name || 'Guest'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="lacquer-bar px-6 py-3 flex items-center justify-between relative overflow-hidden">
      {/* Kanji watermark behind title */}
      {kanji && (
        <span className="absolute left-16 top-1/2 -translate-y-1/2 text-[80px] font-display text-gold/[0.05] pointer-events-none select-none">
          {kanji}
        </span>
      )}

      {/* Left: Ninja logo + Page title */}
      <div className="flex items-center gap-4 relative z-10">
        {NinjaLogo && <NinjaLogo size={52} />}
        <h1 className="font-display text-3xl text-parchment brush-underline">
          {title}
        </h1>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-full border-2 border-gold/40 hanko-seal flex items-center justify-center text-sm font-heading font-bold text-parchment">
          {initials}
        </div>
        <span className="font-heading text-sm text-text-dim tracking-wide hidden md:block">
          {name}
        </span>
        <ChevronDown size={14} className="text-text-dim" />
      </div>

      {/* Bottom divider — enhanced katana line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] gold-shimmer" />
    </header>
  )
}
