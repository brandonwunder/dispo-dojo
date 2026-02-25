import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock, TrendingUp, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import CountUp from 'react-countup'
import GlassPanel from '../components/GlassPanel'

const statConfig = [
  { icon: Users, label: 'Total Users', kanji: '\u7DCF' },
  { icon: Calendar, label: 'This Week', kanji: '\u9031' },
  { icon: Clock, label: 'Today', kanji: '\u4ECA' },
]

// ── DealForm ─────────────────────────────────────────────────────────────────
function DealForm({ initial, onClose }) {
  const blank = { address: '', city: '', state: '', dealType: 'sub-to', assignmentFee: '', beds: '', baths: '', sqft: '', arv: '', pitch: '', status: 'active' }
  const [form, setForm] = useState(initial || blank)
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const data = {
        ...form,
        assignmentFee: Number(form.assignmentFee) || 0,
        beds: Number(form.beds) || 0,
        baths: Number(form.baths) || 0,
        sqft: Number(form.sqft) || 0,
        arv: Number(form.arv) || 0,
        updatedAt: serverTimestamp(),
      }
      if (initial?.id) {
        await updateDoc(doc(db, 'liveDeals', initial.id), data)
      } else {
        await addDoc(collection(db, 'liveDeals'), { ...data, createdAt: serverTimestamp() })
      }
      onClose()
    } catch (err) {
      console.error('Failed to save deal:', err)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors'
  const labelCls = 'block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase'

  return (
    <GlassPanel className="p-5 mb-5">
      <h3 className="font-heading text-sm mb-4 tracking-wide uppercase" style={{ color: '#F6C445' }}>{initial ? 'Edit Deal' : 'New Deal'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div><label className={labelCls}>Address</label><input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St" /></div>
        <div><label className={labelCls}>City</label><input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Austin" /></div>
        <div><label className={labelCls}>State</label><input className={inputCls} value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="TX" /></div>
        <div>
          <label className={labelCls}>Deal Type</label>
          <select className={inputCls} value={form.dealType} onChange={(e) => set('dealType', e.target.value)}>
            <option value="sub-to">Sub-To</option>
            <option value="seller-finance">Seller Finance</option>
            <option value="cash">Cash</option>
            <option value="stack">Stack Method</option>
          </select>
        </div>
        <div><label className={labelCls}>Assignment Fee ($)</label><input className={inputCls} type="number" value={form.assignmentFee} onChange={(e) => set('assignmentFee', e.target.value)} placeholder="15000" /></div>
        <div><label className={labelCls}>ARV ($)</label><input className={inputCls} type="number" value={form.arv} onChange={(e) => set('arv', e.target.value)} placeholder="250000" /></div>
        <div><label className={labelCls}>Beds</label><input className={inputCls} type="number" value={form.beds} onChange={(e) => set('beds', e.target.value)} placeholder="3" /></div>
        <div><label className={labelCls}>Baths</label><input className={inputCls} type="number" value={form.baths} onChange={(e) => set('baths', e.target.value)} placeholder="2" /></div>
        <div><label className={labelCls}>Sqft</label><input className={inputCls} type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} placeholder="1400" /></div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className={labelCls}>Pitch (1-2 sentences)</label>
        <textarea className={inputCls + ' resize-none'} rows={2} value={form.pitch} onChange={(e) => set('pitch', e.target.value)} placeholder="Strong cashflow opportunity in a growing market..." />
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-sm font-heading text-xs tracking-widest uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Deal'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-sm font-heading text-xs tracking-widest uppercase text-text-dim border border-gold-dim/20 hover:text-parchment transition-colors duration-150">
          Cancel
        </button>
      </div>
    </GlassPanel>
  )
}

// ── BuyerListAdmin ────────────────────────────────────────────────────────────
function BuyerListAdmin() {
  const [buyers, setBuyers] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const withBuyBox = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u) => u.buyBox)
        setBuyers(withBuyBox)
      },
      (err) => {
        console.error('BuyerListAdmin snapshot error:', err)
      }
    )
    return unsub
  }, [])

  return (
    <div>
      <h2 className="font-heading text-lg tracking-wide mb-5" style={{ color: '#F6C445' }}>Buyer List</h2>
      {buyers.length === 0 ? (
        <p className="text-text-dim text-sm font-body text-center py-8">No buyers have submitted criteria yet.</p>
      ) : (
        <div className="space-y-3">
          {buyers.map((buyer) => {
            const bb = buyer.buyBox
            const isExpanded = expanded === buyer.uid
            return (
              <GlassPanel className="p-5" key={buyer.uid}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(isExpanded ? null : buyer.uid)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-heading text-sm text-parchment tracking-wide">{buyer.displayName || buyer.email}</span>
                      <span className="text-text-muted text-xs ml-2 font-body">{buyer.email}</span>
                    </div>
                    <div className="text-right text-xs text-text-dim font-body">
                      {bb.markets?.join(', ') || '—'} · ${Number(bb.minPrice || 0).toLocaleString()}–${Number(bb.maxPrice || 0).toLocaleString()}
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)] grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Deal Types</span><p className="text-parchment mt-0.5">{bb.dealTypes?.join(', ') || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Property Types</span><p className="text-parchment mt-0.5">{bb.propertyTypes?.join(', ') || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Close Timeline</span><p className="text-parchment mt-0.5">{bb.closeTimeline || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Last Updated</span><p className="text-parchment mt-0.5">{bb.updatedAt
  ? (bb.updatedAt.toDate
      ? bb.updatedAt.toDate().toLocaleDateString()
      : new Date(bb.updatedAt).toLocaleDateString())
  : '—'}</p></div>
                    {bb.notes && <div className="col-span-2"><span className="text-text-dim font-heading uppercase tracking-wider">Notes</span><p className="text-parchment mt-0.5">{bb.notes}</p></div>}
                  </div>
                )}
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── LiveDealsAdmin ────────────────────────────────────────────────────────────
function LiveDealsAdmin() {
  const [deals, setDeals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'liveDeals'), orderBy('createdAt', 'desc')), (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function handleToggleStatus(deal) {
    await updateDoc(doc(db, 'liveDeals', deal.id), {
      status: deal.status === 'active' ? 'closed' : 'active',
    })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this deal?')) return
    await deleteDoc(doc(db, 'liveDeals', id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg tracking-wide" style={{ color: '#F6C445' }}>Live Deals</h2>
        <button
          onClick={() => { setEditingDeal(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-heading text-xs tracking-widest uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200"
        >
          <Plus size={14} /> Add Deal
        </button>
      </div>

      {showForm && (
        <DealForm
          key={editingDeal?.id ?? 'new'}
          initial={editingDeal}
          onClose={() => { setShowForm(false); setEditingDeal(null) }}
        />
      )}

      <div className="space-y-3">
        {deals.map((deal) => (
          <GlassPanel className="p-5" key={deal.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading text-sm text-parchment">{deal.address}, {deal.city}, {deal.state}</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase"
                    style={{
                      background: deal.status === 'active' ? 'rgba(0,198,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: deal.status === 'active' ? '1px solid rgba(0,198,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      color: deal.status === 'active' ? '#00C6FF' : '#8a8578',
                    }}
                  >
                    {deal.status}
                  </span>
                </div>
                <p className="text-text-dim text-xs font-body">
                  {deal.dealType} · ${Number(deal.assignmentFee || 0).toLocaleString()} assignment fee
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(deal)}
                  className="text-text-dim hover:text-cyan transition-colors duration-150"
                  title={deal.status === 'active' ? 'Mark closed' : 'Mark active'}
                >
                  {deal.status === 'active' ? <ToggleRight size={18} className="text-cyan" /> : <ToggleLeft size={18} />}
                </button>
                <button
                  onClick={() => { setEditingDeal(deal); setShowForm(true) }}
                  className="text-text-dim hover:text-parchment transition-colors duration-150"
                  title="Edit"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(deal.id)}
                  className="text-text-dim hover:text-red-400 transition-colors duration-150"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </GlassPanel>
        ))}
        {deals.length === 0 && (
          <p className="text-text-dim text-sm font-body text-center py-8">No deals yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}

// ── AdminDashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { users } = useAuth()
  const [activeTab, setActiveTab] = useState('members')

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const thisWeekCount = users.filter((u) => {
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000
    return new Date(u.createdAt).getTime() > week
  }).length

  const todayCount = users.filter((u) => {
    const today = new Date().toDateString()
    return new Date(u.createdAt).toDateString() === today
  }).length

  const statValues = [users.length, thisWeekCount, todayCount]

  return (
    <>
    {/* Background Image */}
    <div
      className="fixed inset-0 -z-20 bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/admin-bg.png)',
        backgroundSize: '120%',
        backgroundPosition: 'center 30%',
      }}
    />
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.7) 55%, rgba(11,15,20,0.92) 100%),
          linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.6) 40%, rgba(11,15,20,0.9) 100%)
        `,
      }}
    />

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto relative z-10 px-6 py-16"
    >
      {/* Header */}
      <div className="text-center mb-8 max-w-[680px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
            <Shield size={36} style={{ color: '#00C6FF' }} />
          </div>
          <h1
            className="font-display text-4xl"
            style={{
              color: '#F4F7FA',
              textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
            }}
          >
            The Sensei's Quarters
          </h1>
        </div>
        <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
          Manage your platform and track partner sign-ups.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[rgba(0,198,255,0.12)]">
        {[
          { id: 'members', label: 'Members' },
          { id: 'live-deals', label: 'Live Deals' },
          { id: 'buyer-list', label: 'Buyer List' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-heading text-xs tracking-widest uppercase transition-colors duration-150 relative ${
              activeTab === tab.id ? 'text-[#00C6FF]' : 'text-text-dim hover:text-parchment'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C6FF]" />
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {statConfig.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassPanel className="p-5 relative">
                    {/* Kanji watermark */}
                    <div className="absolute top-2 right-3 font-display text-6xl text-[rgba(0,198,255,0.04)] pointer-events-none select-none z-0">
                      {stat.kanji}
                    </div>

                    {/* Cyan glow icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 relative z-10" style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}>
                      <Icon size={18} style={{ color: '#00C6FF' }} />
                    </div>

                    {/* Label */}
                    <p className="font-heading text-text-dim tracking-widest uppercase text-xs mb-1 relative z-10">
                      {stat.label}
                    </p>

                    {/* Value */}
                    <p className="font-heading text-3xl tracking-wide relative z-10" style={{ color: '#F6C445' }}>
                      <CountUp end={typeof statValues[i] === 'number' ? statValues[i] : 0} duration={1.5} separator="," />
                    </p>
                  </GlassPanel>
                </motion.div>
              )
            })}
          </div>

          {/* User table */}
          <GlassPanel className="overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Student Roster</span></div>
            {users.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users size={40} className="text-text-muted mx-auto mb-3" />
                <p className="text-text-dim text-sm font-heading">
                  No students have entered the dojo yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(0,198,255,0.06)' }}>
                      <th className="text-left px-6 py-3 font-heading tracking-widest uppercase text-xs" style={{ color: '#00C6FF' }}>
                        Name
                      </th>
                      <th className="text-left px-6 py-3 font-heading tracking-widest uppercase text-xs" style={{ color: '#00C6FF' }}>
                        Username
                      </th>
                      <th className="text-left px-6 py-3 font-heading tracking-widest uppercase text-xs" style={{ color: '#00C6FF' }}>
                        Email
                      </th>
                      <th className="text-left px-6 py-3 font-heading tracking-widest uppercase text-xs" style={{ color: '#00C6FF' }}>
                        Phone
                      </th>
                      <th className="text-left px-6 py-3 font-heading tracking-widest uppercase text-xs" style={{ color: '#00C6FF' }}>
                        Signed Up
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...users].reverse().map((u, i) => (
                      <motion.tr
                        key={u.email}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-[rgba(255,255,255,0.05)] hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-bg text-xs font-bold shrink-0">
                              {u.name
                                .split(/\s/)
                                .slice(0, 2)
                                .map((w) => w[0]?.toUpperCase())
                                .join('')}
                            </div>
                            <span className="text-sm text-parchment font-medium">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-dim">
                            <AtSign size={14} className="text-text-muted shrink-0" />
                            {u.username}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-dim">
                            <Mail size={14} className="text-text-muted shrink-0" />
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-dim">
                            <Phone size={14} className="text-text-muted shrink-0" />
                            {u.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-dim font-mono">
                          {formatDate(u.createdAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassPanel>

          {/* ── Upgrade Roadmap ── */}
          <div className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}>
                <TrendingUp size={16} style={{ color: '#00C6FF' }} />
              </div>
              <div>
                <h2 className="font-heading text-lg tracking-wide" style={{ color: '#F6C445' }}>Upgrade Roadmap</h2>
                <p className="text-text-dim text-xs">Paid improvements to unlock as the platform grows</p>
              </div>
            </div>
            <div className="mb-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  priority: 'HIGH',
                  title: 'Rental Comps API — Rentcast Pro or AirDNA',
                  description:
                    'Replace formula-derived STR/MTR estimates and HomeHarvest scraping with verified market data. Rentcast provides real LTR comps; AirDNA provides actual Airbnb occupancy and nightly rates.',
                  cost: '~$29–$99/mo',
                  impact: 'Comp accuracy improves significantly. STR figures become market-validated.',
                },
                {
                  priority: 'HIGH',
                  title: 'HUD API Token — Free, Requires Sign-Up',
                  description:
                    'Register at huduser.gov for a free API token to unlock exact HUD Fair Market Rent by ZIP/county. Currently using a 90%-of-market fallback estimate.',
                  cost: 'Free (one-time registration)',
                  impact: 'Section 8 FMR data becomes exact per ZIP and bedroom count.',
                },
                {
                  priority: 'MEDIUM',
                  title: 'Saved Reports — Firestore Storage',
                  description:
                    'Allow users to save underwriting reports to their profile, access history, and share with partners.',
                  cost: '~$0.06/GB Firestore',
                  impact: 'Repeat use increases, users retain and share reports.',
                },
                {
                  priority: 'LOW',
                  title: 'Interactive Comp Map — Mapbox or Google Maps',
                  description:
                    'Display rental comps pinned on a neighborhood map to visualize distance and road boundaries, replacing the current text-based distance display.',
                  cost: 'Mapbox free tier or ~$7/mo',
                  impact: 'Visual neighborhood comparison boosts user confidence.',
                },
              ].map((item) => (
                <GlassPanel className="p-5 relative" key={item.title}>
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="shrink-0 px-2 py-0.5 rounded-sm text-[10px] font-heading font-bold tracking-widest"
                      style={{
                        background:
                          item.priority === 'HIGH'
                            ? 'rgba(229,57,53,0.18)'
                            : item.priority === 'MEDIUM'
                            ? 'rgba(246,196,69,0.14)'
                            : 'rgba(0,198,255,0.1)',
                        color:
                          item.priority === 'HIGH'
                            ? '#E53935'
                            : item.priority === 'MEDIUM'
                            ? '#F6C445'
                            : '#00C6FF',
                      }}
                    >
                      {item.priority}
                    </div>
                  </div>
                  <h3 className="font-heading text-sm text-parchment mb-2 leading-snug">{item.title}</h3>
                  <p className="text-text-dim text-xs font-body mb-3 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-gold-dim font-heading">
                      Cost: <span className="text-gold">{item.cost}</span>
                    </span>
                  </div>
                  <p className="text-text-dim text-xs font-body mt-1">
                    <span className="text-gold-dim font-heading">Impact: </span>{item.impact}
                  </p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Live Deals tab */}
      {activeTab === 'live-deals' && (
        <LiveDealsAdmin />
      )}

      {/* Buyer List tab */}
      {activeTab === 'buyer-list' && <BuyerListAdmin />}
    </motion.div>
    </>
  )
}
