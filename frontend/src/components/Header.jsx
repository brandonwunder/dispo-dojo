import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronDown } from 'lucide-react'
import {
  NinjaLantern,
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

const routeTitles = {
  '/': 'Dashboard',
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

const routeLogos = {
  '/': NinjaLantern,
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

const routeKanji = {
  '/': '道場',
  '/agent-finder': '探',
  '/fsbo-finder': '狩',
  '/lead-scrubbing': '鍛',
  '/underwriting': '巻',
  '/loi-generator': '筆',
  '/contract-generator': '印',
  '/scripts': '修',
  '/direct-agent': '鷹',
  '/dispo-process': '略',
  '/join-team': '募',
  '/website-explainer': '案',
  '/admin': '師',
}

const routeSections = {
  '/agent-finder': 'Lead Generation',
  '/fsbo-finder': 'Lead Generation',
  '/lead-scrubbing': 'Lead Generation',
  '/underwriting': 'Deal Management',
  '/loi-generator': 'Deal Management',
  '/contract-generator': 'Deal Management',
  '/scripts': 'Resources',
  '/direct-agent': 'Resources',
  '/dispo-process': 'Resources',
  '/join-team': 'Resources',
  '/website-explainer': 'Resources',
  '/admin': 'Admin',
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname
  const title = routeTitles[path] || 'Dispo Dojo'
  const NinjaLogo = routeLogos[path]
  const kanji = routeKanji[path]
  const section = routeSections[path]
  const name = user?.name || 'Guest'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="lacquer-bar px-6 py-3 flex items-center justify-between relative overflow-hidden lacquer-shine">
      {/* Kanji watermark behind title */}
      {kanji && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-display text-gold/[0.04] pointer-events-none select-none">
          {kanji}
        </span>
      )}

      {/* Left: breadcrumb */}
      <div className="relative z-10 min-w-[120px]">
        {section && (
          <span className="font-heading text-xs text-text-dim/60 tracking-wider">
            {section}
          </span>
        )}
      </div>

      {/* Center: Ninja logo + Page title */}
      <div className="flex items-center gap-3 relative z-10">
        {NinjaLogo && <NinjaLogo size={44} />}
        <h1 className="font-display text-2xl text-parchment brush-underline">
          {title}
        </h1>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-3 relative z-10 min-w-[120px] justify-end">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-heading font-bold text-parchment"
          style={{
            background: 'linear-gradient(135deg, #6b1a1a 0%, #8b0000 40%, #a83232 100%)',
            border: '1.5px solid rgba(196, 58, 79, 0.4)',
            boxShadow: '0 0 10px -3px rgba(139, 34, 50, 0.5)',
            borderRadius: '48% 52% 50% 50% / 50% 48% 52% 50%',
          }}
        >
          {initials}
        </div>
        <span className="font-heading text-sm text-text-dim tracking-wide hidden md:block">
          {name}
        </span>
        <ChevronDown size={14} className="text-text-dim" />
      </div>

      {/* Bottom divider — thinner gold shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-shimmer opacity-70" />
    </header>
  )
}
