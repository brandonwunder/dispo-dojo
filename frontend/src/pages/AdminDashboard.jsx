import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock, TrendingUp, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import CountUp from 'react-countup'
import WoodPanel from '../components/WoodPanel'

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
    setSaving(false)
    onClose()
  }

  const inputCls = 'w-full px-3 py-2 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors'
  const labelCls = 'block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase'

  return (
    <WoodPanel className="mb-5 border border-cyan/20">
      <h3 className="font-heading text-sm text-gold mb-4 tracking-wide uppercase">{initial ? 'Edit Deal' : 'New Deal'}</h3>
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
    </WoodPanel>
  )
}

// ── LiveDealsAdmin ────────────────────────────────────────────────────────────
function LiveDealsAdmin() {
  const [deals, setDeals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'liveDeals'), (snap) => {
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
        <h2 className="font-heading text-lg text-gold tracking-wide">Live Deals</h2>
        <button
          onClick={() => { setEditingDeal(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-heading text-xs tracking-widest uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200"
        >
          <Plus size={14} /> Add Deal
        </button>
      </div>

      {showForm && (
        <DealForm
          initial={editingDeal}
          onClose={() => { setShowForm(false); setEditingDeal(null) }}
        />
      )}

      <div className="space-y-3">
        {deals.map((deal) => (
          <WoodPanel key={deal.id}>
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
          </WoodPanel>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-gold">
            The Sensei's Quarters
          </h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl mt-3">
          Manage your platform and track partner sign-ups.
        </p>
      </div>

      <div className="katana-line my-4" />

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
          {/* Stats row — WoodPanel with scroll-card styling */}
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
                  <WoodPanel hover={false} className="scroll-card relative">
                    {/* Kanji watermark */}
                    <div className="absolute top-2 right-3 font-display text-6xl text-gold/[0.06] pointer-events-none select-none z-0">
                      {stat.kanji}
                    </div>

                    {/* Hanko seal icon */}
                    <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center mb-3 relative z-10">
                      <Icon size={18} className="text-white" />
                    </div>

                    {/* Label */}
                    <p className="font-heading text-text-dim tracking-widest uppercase text-xs mb-1 relative z-10">
                      {stat.label}
                    </p>

                    {/* Value */}
                    <p className="font-heading text-3xl text-gold-bright tracking-wide relative z-10">
                      <CountUp end={typeof statValues[i] === 'number' ? statValues[i] : 0} duration={1.5} separator="," />
                    </p>
                  </WoodPanel>
                </motion.div>
              )
            })}
          </div>

          {/* User table */}
          <WoodPanel hover={false} headerBar="Student Roster" className="!p-0">
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
                    <tr className="lacquer-bar">
                      <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                        Username
                      </th>
                      <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                        Phone
                      </th>
                      <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
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
                        className="border-b border-gold-dim/[0.08] hover:bg-gold/5 transition-colors duration-200"
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
          </WoodPanel>

          {/* ── Upgrade Roadmap ── */}
          <div className="mt-10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="hanko-seal w-9 h-9 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading text-lg text-gold tracking-wide">Upgrade Roadmap</h2>
                <p className="text-text-dim text-xs">Paid improvements to unlock as the platform grows</p>
              </div>
            </div>
            <div className="katana-line mb-5" />
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
                    'Register at huduser.gov for a free API token to unlock exact HUD Fair Market Rent by ZIP/county. Currently using a 90%-of-market fallback estimate on the Rent Comps page.',
                  cost: 'Free (one-time registration)',
                  impact: 'Section 8 FMR data becomes exact per ZIP and bedroom count.',
                },
                {
                  priority: 'MEDIUM',
                  title: 'Saved Reports — Firestore Storage',
                  description:
                    'Allow users to save rent comp and underwriting reports to their profile, access history, and share with partners.',
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
                <WoodPanel key={item.title} hover={false} className="relative">
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
                </WoodPanel>
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
      {activeTab === 'buyer-list' && (
        <div className="text-center py-12 text-text-dim font-body text-sm">
          Buyer List — coming in next task
        </div>
      )}
    </motion.div>
  )
}
