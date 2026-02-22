import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Plus,
  MessageSquare,
  ArrowRight,
  FileText,
  FilePen,
  FileCheck,
  Upload,
  Download,
  File,
  Clock,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  UserPlus,
  Lock,
} from 'lucide-react'
import { ACQUISITION_STAGES, DISPOSITION_STAGES } from './mockData'

// ========== Shared Utilities ==========

const INPUT_CLASS =
  'input-calligraphy focus:outline-none bg-bg-card border border-gold-dim/20 rounded-sm px-4 py-3 text-parchment placeholder:text-text-muted transition-colors w-full text-sm focus:border-gold/50'

const SECTION_HEADER_CLASS =
  'font-heading text-gold tracking-widest uppercase text-xs font-semibold'

const SOURCE_LABELS = {
  agent_finder: { label: 'Agent Finder', color: 'var(--color-steel)' },
  fsbo: { label: 'FSBO', color: 'var(--color-bamboo)' },
  manual: { label: 'Manual', color: 'var(--color-gold-dim)' },
}

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ========== Tab Components ==========

function OverviewTab({ lead, onUpdate }) {
  const allStages = [...ACQUISITION_STAGES, ...DISPOSITION_STAGES]
  const pipelineStages = lead.pipeline === 'acquisitions' ? ACQUISITION_STAGES : DISPOSITION_STAGES

  return (
    <div className="space-y-5">
      {/* Status */}
      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Status</label>
        <select
          value={lead.status}
          onChange={(e) => onUpdate({ ...lead, status: e.target.value })}
          className={INPUT_CLASS}
        >
          {pipelineStages.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Motivation */}
      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Motivation</label>
        <div className="flex gap-2">
          {[
            { value: 'hot', label: 'Hot', color: 'var(--color-crimson)', ring: 'ring-error', border: 'border-error/40', activeBg: 'bg-error/10' },
            { value: 'warm', label: 'Warm', color: 'var(--color-gold)', ring: 'ring-warning', border: 'border-warning/40', activeBg: 'bg-warning/10' },
            { value: 'cold', label: 'Cold', color: 'var(--color-steel)', ring: 'ring-info', border: 'border-info/40', activeBg: 'bg-info/10' },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => onUpdate({ ...lead, motivation: m.value })}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-heading font-medium tracking-wide
                transition-all duration-200
                ${lead.motivation === m.value
                  ? `${m.activeBg} ${m.border} text-parchment`
                  : 'border-gold-dim/20 bg-bg-card text-text-muted hover:border-gold-dim/30'
                }
              `}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${lead.motivation === m.value ? `ring-2 ${m.ring}/30` : ''}`}
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${m.color}, color-mix(in srgb, ${m.color} 60%, black))`,
                }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source & Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Lead Source</label>
          <div className={`${INPUT_CLASS} flex items-center gap-2 cursor-default`}>
            {SOURCE_LABELS[lead.source] && (
              <span
                className="text-[10px] px-2.5 py-0.5 rounded-full font-medium text-parchment/90"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${SOURCE_LABELS[lead.source].color}, color-mix(in srgb, ${SOURCE_LABELS[lead.source].color} 70%, black))`,
                  boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                {SOURCE_LABELS[lead.source].label}
              </span>
            )}
          </div>
        </div>
        <div>
          <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Date Acquired</label>
          <div className={`${INPUT_CLASS} cursor-default text-text-dim font-mono`}>
            {formatDate(lead.createdAt)}
          </div>
        </div>
      </div>

      {/* Next Action */}
      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Next Action</label>
        <input
          type="text"
          value={lead.nextAction || ''}
          onChange={(e) => onUpdate({ ...lead, nextAction: e.target.value })}
          placeholder="What's the next step?"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Due Date</label>
        <input
          type="date"
          value={lead.nextActionDue || ''}
          onChange={(e) => onUpdate({ ...lead, nextActionDue: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      {/* Quick Notes */}
      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>Quick Notes</label>
        <textarea
          rows={3}
          placeholder="Add a quick note..."
          className={`${INPUT_CLASS} resize-none`}
          defaultValue=""
        />
      </div>
    </div>
  )
}

function ContactTab({ lead, onUpdate }) {
  const seller = lead.seller || {}
  const agent = lead.agent || {}

  function updateSeller(field, value) {
    onUpdate({ ...lead, seller: { ...lead.seller, [field]: value } })
  }

  function updateAgent(field, value) {
    onUpdate({ ...lead, agent: { ...(lead.agent || {}), [field]: value } })
  }

  return (
    <div className="space-y-6">
      {/* Seller */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-gold), var(--color-gold-dim))' }}
          />
          Seller Information
        </h4>
        <div className="space-y-3">
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Name</label>
            <input type="text" value={seller.name || ''} onChange={(e) => updateSeller('name', e.target.value)} className={INPUT_CLASS} placeholder="Seller name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Phone</label>
              <input type="text" value={seller.phone || ''} onChange={(e) => updateSeller('phone', e.target.value)} className={INPUT_CLASS} placeholder="(xxx) xxx-xxxx" />
            </div>
            <div>
              <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Email</label>
              <input type="email" value={seller.email || ''} onChange={(e) => updateSeller('email', e.target.value)} className={INPUT_CLASS} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Mailing Address</label>
            <input type="text" defaultValue="" className={INPUT_CLASS} placeholder="Enter mailing address" />
          </div>
        </div>
      </div>

      {/* Agent */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-steel), color-mix(in srgb, var(--color-steel) 60%, black))' }}
          />
          Agent Information
        </h4>
        {lead.agent ? (
          <div className="space-y-3">
            <div>
              <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Name</label>
              <input type="text" value={agent.name || ''} onChange={(e) => updateAgent('name', e.target.value)} className={INPUT_CLASS} placeholder="Agent name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Phone</label>
                <input type="text" value={agent.phone || ''} onChange={(e) => updateAgent('phone', e.target.value)} className={INPUT_CLASS} placeholder="(xxx) xxx-xxxx" />
              </div>
              <div>
                <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Email</label>
                <input type="email" value={agent.email || ''} onChange={(e) => updateAgent('email', e.target.value)} className={INPUT_CLASS} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Brokerage</label>
              <input type="text" value={agent.brokerage || ''} onChange={(e) => updateAgent('brokerage', e.target.value)} className={INPUT_CLASS} placeholder="Brokerage name" />
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-gold-dim/20 rounded-lg p-4 text-center">
            <p className="text-sm text-text-muted">No agent associated</p>
            <button className="text-xs text-gold hover:text-gold-bright mt-1 font-heading tracking-widest uppercase transition-colors">+ Add Agent</button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <Tag size={14} className="text-gold" />
          Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-bg-card border border-gold-dim/20 text-text-dim font-heading tracking-wide">
            Wholesale
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-bg-card border border-gold-dim/20 text-text-dim font-heading tracking-wide">
            Single Family
          </span>
          <button className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-gold/30 text-gold hover:bg-gold/5 font-heading tracking-wide transition-colors">
            + Add Tag
          </button>
        </div>
      </div>
    </div>
  )
}

function PropertyTab({ lead, onUpdate }) {
  const prop = lead.property || {}

  return (
    <div className="space-y-6">
      {/* Property Details */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-gold), var(--color-gold-dim))' }}
          />
          Property Details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Type</label>
            <select className={INPUT_CLASS} defaultValue={prop.type || ''}>
              <option value="Single Family">Single Family</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Land">Land</option>
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Year Built</label>
            <input type="number" defaultValue={prop.yearBuilt || ''} className={INPUT_CLASS} placeholder="Year" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Beds</label>
            <input type="number" defaultValue={prop.beds || ''} className={INPUT_CLASS} placeholder="0" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Baths</label>
            <input type="number" defaultValue={prop.baths || ''} className={INPUT_CLASS} placeholder="0" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Sq Ft</label>
            <input type="number" defaultValue={prop.sqft || ''} className={INPUT_CLASS} placeholder="0" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Lot Size</label>
            <input type="text" defaultValue="" className={INPUT_CLASS} placeholder="e.g. 0.25 acres" />
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-gold), var(--color-gold-dim))' }}
          />
          Condition
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Foundation', key: 'foundation' },
            { label: 'Roof', key: 'roof' },
            { label: 'AC', key: 'ac' },
            { label: 'Electrical', key: 'electric' },
            { label: 'Plumbing', key: 'plumbing' },
            { label: 'Overall', key: 'overall' },
          ].map((item) => (
            <div key={item.key}>
              <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>{item.label}</label>
              <select className={INPUT_CLASS} defaultValue={item.key === 'overall' ? (prop.condition || '') : ''}>
                <option value="">Select...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Needs Replacement">Needs Replacement</option>
              </select>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Roof Age (years)</label>
            <input type="number" defaultValue="" className={INPUT_CLASS} placeholder="0" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>AC Age (years)</label>
            <input type="number" defaultValue="" className={INPUT_CLASS} placeholder="0" />
          </div>
        </div>
      </div>

      {/* Occupancy */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-steel), color-mix(in srgb, var(--color-steel) 60%, black))' }}
          />
          Occupancy
        </h4>
        <div className="flex gap-2">
          {['Owner-Occupied', 'Tenant', 'Vacant'].map((occ) => (
            <button
              key={occ}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gold-dim/20 bg-bg-card text-sm font-heading text-text-dim tracking-wide hover:border-gold hover:text-gold transition-colors"
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      {/* Mortgage (Sub2) */}
      <div>
        <h4 className={`${SECTION_HEADER_CLASS} text-sm mb-3 flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-bamboo), color-mix(in srgb, var(--color-bamboo) 60%, black))' }}
          />
          Mortgage Info (Sub2)
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Balance</label>
            <input type="text" defaultValue="" className={INPUT_CLASS} placeholder="$0" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Lender</label>
            <input type="text" defaultValue="" className={INPUT_CLASS} placeholder="Lender name" />
          </div>
          <div>
            <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Rate</label>
            <input type="text" defaultValue="" className={INPUT_CLASS} placeholder="0.00%" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DealTab({ lead, onUpdate }) {
  const deal = lead.deal || {}

  const [arv, setArv] = useState(deal.arv || 0)
  const [repairs, setRepairs] = useState({
    roof: 0,
    hvac: 0,
    kitchen: 0,
    bathroom: 0,
    foundation: 0,
    electrical: 0,
    plumbing: 0,
    cosmetic: deal.repairs || 0,
  })
  const [wholesaleFee, setWholesaleFee] = useState(deal.wholesaleFee || 0)
  const [askingPrice, setAskingPrice] = useState(deal.askingPrice || 0)
  const [offerAmount, setOfferAmount] = useState(deal.offerAmount || 0)

  const totalRepairs = Object.values(repairs).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const mao = arv * 0.70 - totalRepairs - wholesaleFee
  const profit = (offerAmount || 0) > 0 ? arv - (offerAmount || 0) - totalRepairs - wholesaleFee : 0

  let trafficLight = 'red'
  let trafficLabel = 'No Margin'
  let trafficGlow = 'shadow-[0_0_40px_-10px_rgba(240,112,112,0.5)]'
  let trafficBorder = 'border-error/40'
  let trafficBg = 'bg-error/5'
  let trafficIcon = <TrendingDown size={20} className="text-error" />

  if (profit > 15000) {
    trafficLight = 'green'
    trafficLabel = 'Good Deal'
    trafficGlow = 'shadow-[0_0_40px_-10px_rgba(110,231,160,0.5)]'
    trafficBorder = 'border-success/40'
    trafficBg = 'bg-success/5'
    trafficIcon = <TrendingUp size={20} className="text-success" />
  } else if (profit >= 5000) {
    trafficLight = 'yellow'
    trafficLabel = 'Tight Margins'
    trafficGlow = 'shadow-[0_0_40px_-10px_rgba(240,192,96,0.5)]'
    trafficBorder = 'border-warning/40'
    trafficBg = 'bg-warning/5'
    trafficIcon = <Minus size={20} className="text-warning" />
  }

  const repairItems = [
    { key: 'roof', label: 'Roof' },
    { key: 'hvac', label: 'HVAC' },
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'bathroom', label: 'Bathroom' },
    { key: 'foundation', label: 'Foundation' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'plumbing', label: 'Plumbing' },
    { key: 'cosmetic', label: 'Cosmetic' },
  ]

  return (
    <div className="space-y-6">
      {/* ARV */}
      <div>
        <label className={`block mb-1.5 ${SECTION_HEADER_CLASS}`}>After Repair Value (ARV)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-semibold text-lg">$</span>
          <input
            type="number"
            value={arv || ''}
            onChange={(e) => setArv(Number(e.target.value) || 0)}
            className={`${INPUT_CLASS} pl-9 text-lg font-mono font-semibold text-gold`}
            placeholder="0"
          />
        </div>
      </div>

      {/* Itemized Repairs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={SECTION_HEADER_CLASS}>Itemized Repair Estimates</label>
          <span className="text-xs font-mono font-semibold text-warning">
            Total: {formatCurrency(totalRepairs)}
          </span>
        </div>
        <div className="space-y-2">
          {repairItems.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span className={`text-xs w-20 shrink-0 ${SECTION_HEADER_CLASS}`}>{item.label}</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">$</span>
                <input
                  type="number"
                  value={repairs[item.key] || ''}
                  onChange={(e) => setRepairs((prev) => ({ ...prev, [item.key]: Number(e.target.value) || 0 }))}
                  className={`${INPUT_CLASS} pl-7 py-2 text-xs font-mono`}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAO Formula */}
      <div className="wood-panel rounded-xl border border-gold/20 p-4">
        <div className={`mb-2 ${SECTION_HEADER_CLASS}`}>Maximum Allowable Offer (MAO)</div>
        <div className="flex items-center gap-2 text-xs text-text-muted mb-3 flex-wrap">
          <span className="font-mono bg-bg/60 px-2 py-1 rounded text-text-dim">{formatCurrency(arv)}</span>
          <span className="text-gold">&times;</span>
          <span className="font-mono bg-bg/60 px-2 py-1 rounded text-text-dim">70%</span>
          <span className="text-gold">&minus;</span>
          <span className="font-mono bg-bg/60 px-2 py-1 rounded text-text-dim">{formatCurrency(totalRepairs)}</span>
          <span className="text-gold">&minus;</span>
          <span className="font-mono bg-bg/60 px-2 py-1 rounded text-text-dim">{formatCurrency(wholesaleFee)}</span>
        </div>
        <div className="text-2xl font-display font-bold gold-shimmer-text">
          {formatCurrency(mao)}
        </div>
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Asking Price</label>
          <input
            type="number"
            value={askingPrice || ''}
            onChange={(e) => setAskingPrice(Number(e.target.value) || 0)}
            className={`${INPUT_CLASS} font-mono`}
            placeholder="$0"
          />
        </div>
        <div>
          <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Your Offer</label>
          <input
            type="number"
            value={offerAmount || ''}
            onChange={(e) => setOfferAmount(Number(e.target.value) || 0)}
            className={`${INPUT_CLASS} font-mono`}
            placeholder="$0"
          />
        </div>
        <div>
          <label className={`block mb-1 ${SECTION_HEADER_CLASS}`}>Wholesale Fee</label>
          <input
            type="number"
            value={wholesaleFee || ''}
            onChange={(e) => setWholesaleFee(Number(e.target.value) || 0)}
            className={`${INPUT_CLASS} font-mono`}
            placeholder="$0"
          />
        </div>
      </div>

      {/* Traffic Light - Profit Indicator */}
      <div className={`wood-panel rounded-xl border p-4 ${trafficBorder} ${trafficGlow} transition-all duration-500`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {trafficIcon}
            <div>
              <div className={`text-sm font-heading font-semibold tracking-wide ${
                trafficLight === 'green' ? 'text-success' :
                trafficLight === 'yellow' ? 'text-warning' : 'text-error'
              }`}>
                {trafficLabel}
              </div>
              <div className={`text-xs font-heading tracking-widest uppercase text-text-muted`}>Expected Profit</div>
            </div>
          </div>
          <div className={`text-2xl font-display font-bold ${
            trafficLight === 'green' ? 'text-success' :
            trafficLight === 'yellow' ? 'text-warning' : 'text-error'
          }`}>
            {formatCurrency(profit)}
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ lead }) {
  const docs = lead.documents || []

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gold/20 rounded-xl wood-panel p-8 text-center hover:border-gold/40 hover:bg-gold/5 transition-all duration-300 cursor-pointer group">
        <Upload size={32} className="mx-auto text-text-muted group-hover:text-gold transition-colors" />
        <p className="text-sm text-text-dim mt-2 font-heading tracking-widest uppercase">Drag & drop files here</p>
        <p className="text-xs text-text-muted mt-1">or click to browse</p>
        <p className={`text-[10px] mt-3 ${SECTION_HEADER_CLASS} text-text-muted`}>
          Mortgage statements, disclosures, LOIs, contracts, other
        </p>
      </div>

      {/* Document List */}
      {docs.length > 0 ? (
        <div className="space-y-2">
          <h4 className={`mb-2 ${SECTION_HEADER_CLASS}`}>Documents ({docs.length})</h4>
          {docs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-bg-card border border-gold-dim/20 rounded-sm px-4 py-3 hover:border-gold-dim/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <File size={16} className="text-gold shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-parchment truncate font-heading tracking-wide">{doc.name}</p>
                  <p className="text-[11px] text-text-muted font-mono">{formatDate(doc.date)}</p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-colors shrink-0">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-text-muted font-heading tracking-widest uppercase">No documents uploaded yet</p>
        </div>
      )}
    </div>
  )
}

function ActivityTab({ lead }) {
  const activities = [...(lead.activities || [])].reverse()
  const [noteText, setNoteText] = useState('')

  const ACTIVITY_ICONS = {
    created: { icon: Plus, color: 'text-info', bg: 'bg-info/10' },
    note: { icon: MessageSquare, color: 'text-gold', bg: 'bg-gold/10' },
    stage_change: { icon: ArrowRight, color: 'text-warning', bg: 'bg-warning/10' },
    loi_sent: { icon: FileText, color: 'text-info', bg: 'bg-info/10' },
    contract: { icon: FilePen, color: 'text-success', bg: 'bg-success/10' },
    underwriting: { icon: FileCheck, color: 'text-gold', bg: 'bg-gold/10' },
  }

  return (
    <div className="space-y-5">
      {/* Add Note Form */}
      <div className="space-y-2">
        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          className={`${INPUT_CLASS} resize-none`}
        />
        <div className="flex justify-end">
          <button
            className="gold-shimmer px-4 py-1.5 rounded-lg text-sm font-heading font-medium tracking-widest uppercase text-bg hover:shadow-[0_4px_20px_-4px_rgba(201,169,110,0.4)] transition-all"
          >
            Add Note
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {activities.map((activity, i) => {
          const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.note
          const Icon = config.icon
          return (
            <div key={i} className="flex gap-3 py-2.5">
              <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={14} className={config.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-parchment">{activity.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock size={10} className="text-text-muted" />
                  <span className="text-[11px] text-text-muted font-mono">{formatDate(activity.date)}</span>
                </div>
              </div>
            </div>
          )
        })}

        {activities.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-text-muted font-heading tracking-widest uppercase">No activity yet</p>
          </div>
        )}
      </div>

      {/* Notes History */}
      {lead.notes && lead.notes.length > 0 && (
        <div>
          <h4 className={`mb-3 ${SECTION_HEADER_CLASS}`}>Notes</h4>
          <div className="space-y-2">
            {lead.notes.map((note, i) => (
              <div key={i} className="bg-bg-card border border-gold-dim/20 rounded-sm p-3">
                <p className="text-sm text-parchment">{note.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-gold font-heading tracking-wide">{note.author}</span>
                  <span className="text-[11px] text-text-muted font-mono">{formatDate(note.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DispoTab({ lead }) {
  const isLockedUp = lead.pipeline === 'disposition' || lead.status === 'under_contract' || lead.status === 'closing' || lead.status === 'closed'

  if (!isLockedUp) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full hanko-seal flex items-center justify-center mb-4">
          <Lock size={24} className="text-white" />
        </div>
        <h4 className="font-heading text-lg font-semibold tracking-widest uppercase text-parchment mb-2">Disposition Not Available</h4>
        <p className="text-sm text-text-muted max-w-[280px]">
          Move this deal to "Under Contract" or later to start the disposition process and manage buyers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className={`${SECTION_HEADER_CLASS} text-sm flex items-center gap-2`}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'radial-gradient(circle at 35% 35%, var(--color-gold), var(--color-gold-dim))' }}
          />
          Buyer Management
        </h4>
        <button className="gold-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-medium tracking-widest uppercase text-bg hover:shadow-[0_4px_20px_-4px_rgba(201,169,110,0.4)] transition-all">
          <UserPlus size={12} />
          Add Buyer
        </button>
      </div>

      <div className="border border-dashed border-gold-dim/20 rounded-xl wood-panel p-8 text-center">
        <UserPlus size={28} className="mx-auto text-text-muted mb-2" />
        <p className="text-sm text-text-muted font-heading tracking-widest uppercase">No buyers added yet</p>
        <p className="text-xs text-text-muted mt-1">Add interested buyers to track the disposition process</p>
      </div>
    </div>
  )
}

// ========== Main LeadDetail Component ==========

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'contact', label: 'Contact' },
  { id: 'property', label: 'Property' },
  { id: 'deal', label: 'Deal' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
  { id: 'dispo', label: 'Dispo' },
]

export default function LeadDetail({ lead, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview')
  const allStages = [...ACQUISITION_STAGES, ...DISPOSITION_STAGES]
  const currentStage = allStages.find((s) => s.id === lead.status)
  const source = SOURCE_LABELS[lead.source]

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function renderTab() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab lead={lead} onUpdate={onUpdate} />
      case 'contact':
        return <ContactTab lead={lead} onUpdate={onUpdate} />
      case 'property':
        return <PropertyTab lead={lead} onUpdate={onUpdate} />
      case 'deal':
        return <DealTab lead={lead} onUpdate={onUpdate} />
      case 'documents':
        return <DocumentsTab lead={lead} />
      case 'activity':
        return <ActivityTab lead={lead} />
      case 'dispo':
        return <DispoTab lead={lead} />
      default:
        return null
    }
  }

  // Map stage color to a CSS variable for the wax seal
  const stageColorVar = currentStage
    ? currentStage.color.includes('info') ? 'var(--color-steel)'
      : currentStage.color.includes('success') ? 'var(--color-bamboo)'
      : currentStage.color.includes('warning') ? 'var(--color-gold)'
      : currentStage.color.includes('error') ? 'var(--color-crimson)'
      : 'var(--color-gold)'
    : 'var(--color-gold)'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-bg/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel - Hanging scroll styled detail panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[580px] max-w-[90vw] z-50 flex flex-col wood-panel rope-top border-l border-gold-dim/20 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="lacquer-bar px-6 pt-6 pb-4 border-b border-gold-dim/20 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl text-parchment leading-tight truncate tracking-[0.04em]">
                {lead.address}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {currentStage && (
                  <span
                    className="text-[11px] px-2.5 py-0.5 rounded-full font-heading font-medium tracking-widest uppercase text-parchment/90"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${stageColorVar}, color-mix(in srgb, ${stageColorVar} 70%, black))`,
                      boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {currentStage.label}
                  </span>
                )}
                {source && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-heading font-medium tracking-widest uppercase text-parchment/90"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${source.color}, color-mix(in srgb, ${source.color} 70%, black))`,
                      boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {source.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg text-text-muted hover:text-parchment transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Bar - wooden plaques */}
        <div className="px-6 border-b border-gold-dim/20 shrink-0 overflow-x-auto wood-panel-dark">
          <div className="flex gap-0 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-xs font-heading font-medium tracking-widest uppercase transition-all duration-200 border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-gold/10 text-gold border-gold'
                    : 'text-text-dim border-transparent hover:text-parchment hover:border-gold-dim/20'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderTab()}
        </div>
      </motion.div>
    </>
  )
}
