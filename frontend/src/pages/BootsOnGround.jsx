import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Eye, Lock, MapPin, User, FileText,
  Pencil, Navigation2, ChevronLeft, ChevronRight, CheckCircle,
} from 'lucide-react'
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { incrementStat } from '../lib/userProfile'
import GlassShell from '../components/GlassShell'
import GlassPanel from '../components/GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'photos',     label: 'Property Photos', icon: Camera },
  { id: 'walkthrough',label: 'Walkthroughs',    icon: Eye },
  { id: 'lockbox',    label: 'Lockbox Access',  icon: Lock },
  { id: 'sign',       label: 'Sign Placement',  icon: MapPin },
  { id: 'occupant',   label: 'Occupant Check',  icon: User },
  { id: 'hoa',        label: 'HOA Docs',        icon: FileText },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const RADIUS_OPTIONS = [10, 25, 50, 100]

const BADGE_COLORS = {
  photos:      '#00C6FF',
  walkthrough: '#A855F7',
  lockbox:     '#F6C445',
  sign:        '#10b981',
  occupant:    '#f97316',
  hoa:         '#84cc16',
}

const STATUS = {
  accepted:     { label: 'Accepted',    color: '#F6C445' },
  'in-progress':{ label: 'In Progress', color: '#A855F7' },
  submitted:    { label: 'Submitted',   color: '#00C6FF' },
  complete:     { label: 'Complete',    color: '#10b981' },
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

const cardItem = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDue(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TypeBadge({ type }) {
  const color = BADGE_COLORS[type] || '#C8D1DA'
  const label = TASK_TYPES.find((t) => t.id === type)?.label || type
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-heading tracking-widest uppercase"
      style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  )
}

function StatusPill({ status }) {
  const s = STATUS[status] || { label: status, color: '#C8D1DA' }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-heading tracking-widest uppercase"
      style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  )
}

// ─── Onboarding Wizard ───────────────────────────────────────────────────────

function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [market, setMarket] = useState('')
  const [radius, setRadius] = useState(25)
  const [taskTypes, setTaskTypes] = useState([])
  const [availability, setAvailability] = useState([])

  const totalSteps = 3

  function toggleTaskType(id) {
    setTaskTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  function toggleDay(day) {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function canAdvance() {
    if (step === 1) return market.trim().length > 0
    if (step === 2) return taskTypes.length > 0
    if (step === 3) return availability.length > 0
    return false
  }

  function handleComplete() {
    onComplete({ market: market.trim(), radius, taskTypes, availability })
  }

  const inputCls =
    'w-full rounded-sm px-4 py-3 text-parchment text-sm font-body placeholder:text-text-muted bg-black/30 border border-[rgba(255,255,255,0.07)] focus:outline-none focus:border-cyan/40 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative z-10">
      <motion.div
        className="relative w-full max-w-lg"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <GlassShell orbColors="purple" maxWidth="max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-colors duration-300"
                  style={{
                    background: n < step ? '#10b981' : n === step ? '#00C6FF' : 'rgba(200,209,218,0.1)',
                    color: n <= step ? '#0B0F14' : '#C8D1DA',
                    border: n > step ? '1px solid rgba(200,209,218,0.2)' : 'none',
                  }}
                >
                  {n < step ? <CheckCircle size={14} /> : n}
                </div>
                {n < 3 && (
                  <div
                    className="w-10 h-px transition-colors duration-300"
                    style={{ background: n < step ? '#10b981' : 'rgba(200,209,218,0.15)' }}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs font-heading tracking-widest uppercase text-text-dim mb-6">
            Step {step} of {totalSteps}
          </p>

          {/* Card */}
          <GlassPanel className="overflow-hidden">
            <div className="p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-heading text-2xl font-bold text-parchment tracking-tight mb-1">
                      Where do you operate?
                    </h2>
                    <p className="text-text-dim text-sm leading-relaxed font-body mb-6">
                      Enter your primary market and how far you can travel.
                    </p>

                    <label className="block text-xs font-heading tracking-widest uppercase text-text-dim mb-2">
                      City &amp; State
                    </label>
                    <input
                      type="text"
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      placeholder="Phoenix, AZ"
                      className={inputCls + ' mb-5'}
                    />

                    <label className="block text-xs font-heading tracking-widest uppercase text-text-dim mb-2">
                      Travel Radius
                    </label>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className={inputCls + ' appearance-none cursor-pointer'}
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <option key={r} value={r} style={{ background: '#111B24' }}>
                          {r} miles
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-heading text-2xl font-bold text-parchment tracking-tight mb-1">
                      What can you do?
                    </h2>
                    <p className="text-text-dim text-sm leading-relaxed font-body mb-6">
                      Select all the task types you can handle.
                    </p>

                    <motion.div
                      className="grid grid-cols-3 gap-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {TASK_TYPES.map(({ id, label, icon: Icon }) => {
                        const selected = taskTypes.includes(id)
                        const badgeColor = BADGE_COLORS[id] || '#00C6FF'
                        return (
                          <motion.button
                            key={id}
                            variants={cardItem}
                            onClick={() => toggleTaskType(id)}
                            className="flex flex-col items-center gap-2 p-4 rounded-sm text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan active:scale-95 transition-colors"
                            style={{
                              background: selected ? `${badgeColor}15` : 'rgba(255,255,255,0.03)',
                              border: selected ? `1px solid ${badgeColor}80` : '1px solid rgba(255,255,255,0.08)',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Icon
                              size={20}
                              style={{ color: selected ? badgeColor : '#C8D1DA' }}
                            />
                            <span
                              className="text-xs font-heading leading-tight"
                              style={{ color: selected ? '#F4F7FA' : '#C8D1DA' }}
                            >
                              {label}
                            </span>
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                    <h2 className="font-heading text-2xl font-bold text-parchment tracking-tight mb-1">
                      When are you available?
                    </h2>
                    <p className="text-text-dim text-sm leading-relaxed font-body mb-6">
                      Select the days you can take on tasks.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const active = availability.includes(day)
                        return (
                          <button
                            key={day}
                            onClick={() => toggleDay(day)}
                            className="px-4 py-2 rounded-sm text-sm font-heading tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95 transition-colors"
                            style={{
                              background: active ? 'rgba(0,198,255,0.15)' : 'rgba(255,255,255,0.04)',
                              border: active ? '1px solid rgba(0,198,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                              color: active ? '#00C6FF' : '#C8D1DA',
                            }}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassPanel>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5 gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm text-sm font-heading tracking-wider text-text-dim border border-[rgba(255,255,255,0.07)] bg-white/5 hover:bg-white/9 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-dim active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            {step < totalSteps ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-sm text-sm font-heading tracking-wider text-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: canAdvance() ? 'rgba(0,198,255,0.15)' : 'rgba(0,198,255,0.07)',
                  border: `1px solid ${canAdvance() ? 'rgba(0,198,255,0.5)' : 'rgba(0,198,255,0.2)'}`,
                }}
              >
                Next
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-sm font-heading tracking-wider text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: canAdvance() ? 'rgba(246,196,69,0.18)' : 'rgba(246,196,69,0.07)',
                  border: `1px solid ${canAdvance() ? 'rgba(246,196,69,0.55)' : 'rgba(246,196,69,0.2)'}`,
                }}
              >
                <CheckCircle size={15} />
                Complete Setup
              </button>
            )}
          </div>
        </GlassShell>
      </motion.div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function OpenTaskCard({ task, onAccept }) {
  return (
    <motion.div variants={cardItem}>
      <GlassPanel className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <TypeBadge type={task.taskType} />
          <span className="text-gold text-xs font-heading font-semibold">
            {task.pay ? `$${task.pay}` : '—'}
          </span>
        </div>

        <p className="text-parchment text-sm font-body leading-snug mb-1">
          {task.address || 'Address not provided'}
        </p>
        <p className="text-text-dim text-xs font-body mb-4">
          Due: {formatDue(task.dueDate)}
        </p>

        <button
          onClick={() => onAccept(task)}
          className="w-full py-2 rounded-sm text-xs font-heading tracking-widest uppercase text-cyan bg-cyan/10 border border-cyan/30 hover:bg-cyan/20 hover:border-cyan/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan active:scale-[0.98] transition-colors"
        >
          Accept Task
        </button>
      </GlassPanel>
    </motion.div>
  )
}

function MyTaskCard({ task }) {
  return (
    <motion.div variants={cardItem}>
      <GlassPanel className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <TypeBadge type={task.taskType} />
          <StatusPill status={task.status} />
        </div>

        <p className="text-parchment text-sm font-body leading-snug mb-1">
          {task.address || 'Address not provided'}
        </p>
        <p className="text-text-dim text-xs font-body">
          Due: {formatDue(task.dueDate)}
        </p>
      </GlassPanel>
    </motion.div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

function MainView({ bootsProfile, onEditSetup, firebaseUid, profile, user }) {
  const [openTasks, setOpenTasks] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loadingOpen, setLoadingOpen] = useState(true)
  const [loadingMine, setLoadingMine] = useState(true)
  const [accepting, setAccepting] = useState(null)

  const userMarket = bootsProfile?.market || ''

  // Subscribe: open tasks
  useEffect(() => {
    const q = query(collection(db, 'boots_tasks'), where('status', '==', 'open'))
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = userMarket
        ? all.filter((t) =>
            t.market?.toLowerCase().includes(userMarket.toLowerCase())
          )
        : all
      setOpenTasks(filtered)
      setLoadingOpen(false)
    })
    return unsub
  }, [userMarket])

  // Subscribe: my tasks
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(collection(db, 'boots_tasks'), where('acceptedBy', '==', firebaseUid))
    const unsub = onSnapshot(q, (snap) => {
      setMyTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingMine(false)
    })
    return unsub
  }, [firebaseUid])

  async function handleAccept(task) {
    if (!firebaseUid || accepting) return
    setAccepting(task.id)
    try {
      const taskRef = doc(db, 'boots_tasks', task.id)
      await updateDoc(taskRef, {
        acceptedBy: firebaseUid,
        acceptedByName: profile?.displayName || user?.name || 'Anonymous',
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      })
      await incrementStat(firebaseUid, 'bootsTasksCompleted')
    } catch (err) {
      console.error('Failed to accept task:', err)
    } finally {
      setAccepting(null)
    }
  }

  return (
    <div className="min-h-screen px-6 py-16 relative z-10">
      <div className="relative max-w-5xl mx-auto">
        {/* Page header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <Navigation2 size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                Boots on Ground
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              Field operations and property verification tasks
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onEditSetup}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-heading tracking-widest uppercase text-gold bg-gold/7 border border-[rgba(255,255,255,0.07)] hover:bg-gold/14 hover:border-gold-dim/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95 transition-colors"
            >
              <Pencil size={12} />
              Edit Setup
            </button>
          </div>
        </motion.div>

        {/* Two-column grid */}
        <GlassShell orbColors="emerald">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── Left: Open Tasks ── */}
            <div>
              <motion.h2
                className="font-heading text-sm tracking-widest uppercase mb-4 text-text-dim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                Available in Your Market
              </motion.h2>

              {loadingOpen ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : openTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <GlassPanel className="p-5">
                    <div className="py-4 text-center">
                      <Navigation2 size={28} className="mx-auto mb-3 text-text-dim/25" />
                      <p className="text-text-dim text-sm font-body">No open tasks in your area right now</p>
                      <p className="text-text-dim/40 text-xs mt-1 font-body">Check back soon</p>
                    </div>
                  </GlassPanel>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {openTasks.map((task) => (
                    <OpenTaskCard
                      key={task.id}
                      task={task}
                      onAccept={handleAccept}
                      accepting={accepting}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── Right: My Tasks ── */}
            <div>
              <motion.h2
                className="font-heading text-sm tracking-widest uppercase mb-4 text-text-dim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                My Active Tasks
              </motion.h2>

              {loadingMine ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(168,85,247,0.4)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : myTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <GlassPanel className="p-5">
                    <div className="py-4 text-center">
                      <CheckCircle size={28} className="mx-auto mb-3 text-text-dim/25" />
                      <p className="text-text-dim text-sm font-body">Accept a task to get started</p>
                      <p className="text-text-dim/40 text-xs mt-1 font-body">Your active tasks will appear here</p>
                    </div>
                  </GlassPanel>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {myTasks.map((task) => (
                    <MyTaskCard key={task.id} task={task} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </GlassShell>
      </div>
    </div>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function BootsOnGround() {
  const { user, profile, updateProfile, firebaseUid } = useAuth()

  // updateProfile is async; pull firebaseUid from user as well
  const uid = firebaseUid || user?.firebaseUid

  const bootsProfile = profile?.bootsProfile ?? null

  async function handleOnboardingComplete(data) {
    await updateProfile({ bootsProfile: data })
  }

  function handleEditSetup() {
    updateProfile({ bootsProfile: null })
  }

  return (
    <>
    {/* Background Image */}
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/boots-on-ground-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.6) 55%, rgba(11,15,20,0.88) 100%),
          linear-gradient(180deg, rgba(11,15,20,0.25) 0%, rgba(11,15,20,0.5) 40%, rgba(11,15,20,0.85) 100%)
        `,
      }} />
    </div>

    <AnimatePresence mode="wait">
      {!bootsProfile ? (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        </motion.div>
      ) : (
        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <MainView
            bootsProfile={bootsProfile}
            onEditSetup={handleEditSetup}
            firebaseUid={uid}
            profile={profile}
            user={user}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
