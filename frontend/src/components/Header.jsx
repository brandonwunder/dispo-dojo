import { useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const routeTitles = {
  '/': 'Dashboard',
  '/admin': 'Admin Dashboard',
  '/agent-finder': 'Agent Finder',
  '/fsbo-finder': 'FSBO Finder',
  '/lead-scrubbing': 'Lead Scrubbing',
  '/underwriting': 'Free Underwriting',
  '/loi-generator': 'LOI Generator',
  '/contract-generator': 'Contract Generator',
  '/direct-agent': 'Direct Agent Process',
  '/scripts': 'Scripts & Objections',
  '/website-explainer': 'Website Explainer',
  '/dispo-process': 'Dispo Process',
  '/join-team': 'Join Our Team',
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()

  const title = routeTitles[location.pathname] || 'Dispo Dojo'

  const initials = user?.name
    ? user.name
        .split(/[\s._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : '?'

  return (
    <header className="h-[64px] flex items-center justify-between px-8 bg-bg/80 backdrop-blur-xl shrink-0 relative">
      {/* Left: Page title */}
      <h1 className="font-display text-lg text-text-primary tracking-[0.08em] brush-underline">
        {title}
      </h1>

      {/* Right: User info */}
      <div className="flex items-center gap-3 group">
        <div className="hanko-seal w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm text-text-dim group-hover:text-text-primary transition-colors duration-200">
          {user?.name || 'User'}
        </span>
        <ChevronDown
          size={14}
          className="text-text-muted group-hover:text-text-dim transition-colors duration-200"
        />
      </div>

      {/* Bottom katana line */}
      <div className="absolute bottom-0 left-0 right-0 katana-line" />
    </header>
  )
}
