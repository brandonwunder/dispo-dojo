// frontend/src/components/community/ChannelHero.jsx

const CHANNEL_CONFIGS = {
  general: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(14,90,136,0.30) 0%, transparent 70%)',
    description: 'The main hub — news, updates, and open conversation',
  },
  wins: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(246,196,69,0.22) 0%, transparent 70%)',
    description: 'Share your closed deals and celebrate victories',
  },
  'deal-talk': {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(127,0,255,0.22) 0%, transparent 70%)',
    description: 'Analyze deals, ask for feedback, and collaborate',
  },
  questions: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(0,198,255,0.18) 0%, transparent 70%)',
    description: 'No question is too basic — the dojo teaches all',
  },
  resources: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(34,197,94,0.18) 0%, transparent 70%)',
    description: 'Scripts, templates, tools, and educational links',
  },
};

const DEFAULT_CONFIG = {
  gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(14,90,136,0.20) 0%, transparent 70%)',
  description: '',
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255,255,255';
}

function StatChip({ value, label, color }) {
  return (
    <span
      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
      style={{
        background: `rgba(${hexToRgb(color)}, 0.08)`,
        border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
        color: color,
        fontFamily: 'var(--font-heading, sans-serif)',
        fontWeight: 600,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {typeof value === 'number' ? value.toLocaleString() : value} {label}
    </span>
  );
}

function HeroActionButton({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors duration-150"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#C8D1DA',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(0,198,255,0.3)';
        e.currentTarget.style.color = '#00C6FF';
        e.currentTarget.style.background = 'rgba(0,198,255,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = '#C8D1DA';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function ChannelHero({ channelId, messageCount = 0, memberCount = 0, pinnedCount = 0, onPinnedClick, onMembersClick }) {
  const config = CHANNEL_CONFIGS[channelId] || DEFAULT_CONFIG;

  return (
    <div className="relative flex-shrink-0 overflow-hidden" style={{ minHeight: '140px' }}>
      {/* Channel gradient background */}
      <div className="absolute inset-0" style={{ background: config.gradient }} />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(11,15,20,0.6))' }}
      />
      {/* Content */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-5 pb-4">
        {/* Left: Channel identity */}
        <div>
          <h1
            className="text-[28px] font-bold leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              color: '#F4F7FA',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ color: '#00C6FF' }}>#</span>{channelId}
          </h1>
          <p
            className="text-sm mb-3"
            style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA', lineHeight: 1.5 }}
          >
            {config.description}
          </p>
          {/* Stat chips */}
          <div className="flex items-center gap-2">
            <StatChip value={messageCount} label="messages" color="#00C6FF" />
            <StatChip value={memberCount} label="members" color="#F6C445" />
          </div>
        </div>
        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {pinnedCount > 0 && (
            <HeroActionButton onClick={onPinnedClick} icon="📌" label={`Pinned (${pinnedCount})`} />
          )}
          <HeroActionButton onClick={onMembersClick} icon="👥" label="Members" />
        </div>
      </div>
      {/* Bottom separator */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)',
      }} />
    </div>
  );
}
