import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus, Briefcase, Star, XCircle, CheckCircle, MessageSquare } from 'lucide-react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import GlassPanel from '../components/GlassPanel'
import ProfileSetupModal from '../components/boots/ProfileSetupModal'
import CreatePostModal from '../components/boots/CreatePostModal'
import BootsOperatorCard from '../components/boots/BootsOperatorCard'
import BootsFilterBar from '../components/boots/BootsFilterBar'
import BootsJobCard from '../components/boots/BootsJobCard'
import ApplyModal from '../components/boots/ApplyModal'
import ApplicantsList from '../components/boots/ApplicantsList'
import MessagePanel from '../components/boots/MessagePanel'
import ReviewForm from '../components/boots/ReviewForm'
import ReviewsList from '../components/boots/ReviewsList'

// ─── Tab Components ──────────────────────────────────────────────────────────

function FindBootsTab() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  useEffect(() => {
    const q = query(
      collection(db, 'boots_posts'),
      where('type', '==', 'service'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  // Client-side filtering
  const filtered = posts.filter((post) => {
    if (
      searchText &&
      !post.title?.toLowerCase().includes(searchText.toLowerCase()) &&
      !post.description?.toLowerCase().includes(searchText.toLowerCase())
    )
      return false
    if (taskTypeFilter && !post.taskTypes?.includes(taskTypeFilter)) return false
    if (availabilityFilter === 'available' && post.availability !== 'available') return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div>
      <BootsFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        taskTypeFilter={taskTypeFilter}
        onTaskTypeChange={setTaskTypeFilter}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={setAvailabilityFilter}
      />

      {filtered.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Navigation2 size={32} className="mx-auto mb-3 text-text-dim/25" />
          <p className="text-text-dim font-body text-sm">No boots operators available yet.</p>
          <p className="text-text-dim/40 text-xs mt-1 font-body">
            Be the first to post your services!
          </p>
        </GlassPanel>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((post) => (
            <BootsOperatorCard key={post.id} post={post} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function FindJobsTab({ firebaseUid, profile }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [applyPost, setApplyPost] = useState(null)
  const [userApplications, setUserApplications] = useState([])

  // Subscribe to job posts
  useEffect(() => {
    const q = query(
      collection(db, 'boots_posts'),
      where('type', '==', 'job'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  // Track which posts the current user has applied to
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'boots_applications'),
      where('applicantId', '==', firebaseUid),
    )
    const unsub = onSnapshot(q, (snap) => {
      setUserApplications(snap.docs.map((d) => d.data().postId))
    })
    return unsub
  }, [firebaseUid])

  // Client-side filtering
  const filtered = posts.filter((post) => {
    if (
      searchText &&
      !post.title?.toLowerCase().includes(searchText.toLowerCase()) &&
      !post.description?.toLowerCase().includes(searchText.toLowerCase())
    )
      return false
    if (taskTypeFilter && !post.taskTypes?.includes(taskTypeFilter)) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div>
      <BootsFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        taskTypeFilter={taskTypeFilter}
        onTaskTypeChange={setTaskTypeFilter}
        searchPlaceholder="Search jobs..."
      />

      {filtered.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <Briefcase size={32} className="mx-auto mb-3 text-text-dim/25" />
          <p className="text-text-dim font-body text-sm">No jobs posted yet.</p>
          <p className="text-text-dim/40 text-xs mt-1 font-body">
            Post a job to find boots operators in your market!
          </p>
        </GlassPanel>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((post) => (
            <BootsJobCard
              key={post.id}
              post={post}
              currentUserId={firebaseUid}
              userApplications={userApplications}
              onApply={(p) => setApplyPost(p)}
            />
          ))}
        </motion.div>
      )}

      <ApplyModal
        isOpen={!!applyPost}
        onClose={() => setApplyPost(null)}
        post={applyPost}
        firebaseUid={firebaseUid}
        profile={profile}
      />
    </div>
  )
}

// ─── Activity Sub-tab Config ─────────────────────────────────────────────────

const ACTIVITY_TABS = [
  { id: 'posts', label: 'My Posts' },
  { id: 'applications', label: 'My Applications' },
  { id: 'jobs', label: 'My Jobs' },
  { id: 'reviews', label: 'My Reviews' },
]

// ─── Loading Spinner ─────────────────────────────────────────────────────────

function ActivitySpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

// ─── Status Configs ──────────────────────────────────────────────────────────

const POST_STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  filled: { label: 'Filled', color: '#F6C445', bg: 'rgba(246,196,69,0.12)', border: 'rgba(246,196,69,0.3)' },
  closed: { label: 'Closed', color: '#C8D1DA', bg: 'rgba(200,209,218,0.08)', border: 'rgba(200,209,218,0.15)' },
  complete: { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
}

const APP_STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F6C445', bg: 'rgba(246,196,69,0.12)', border: 'rgba(246,196,69,0.3)', pulse: true },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  rejected: { label: 'Rejected', color: '#C8D1DA', bg: 'rgba(200,209,218,0.08)', border: 'rgba(200,209,218,0.15)' },
}

const JOB_STATUS_CONFIG = {
  filled: { label: 'Filled', color: '#F6C445', bg: 'rgba(246,196,69,0.12)', border: 'rgba(246,196,69,0.3)' },
  'in-progress': { label: 'In Progress', color: '#7F00FF', bg: 'rgba(127,0,255,0.12)', border: 'rgba(127,0,255,0.3)' },
  complete: { label: 'Complete', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ config, pulse }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider inline-flex items-center gap-1 ${pulse ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  )
}

// ─── Section 1: My Posts ─────────────────────────────────────────────────────

function MyPostsSection({ firebaseUid }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [closingId, setClosingId] = useState(null)

  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'boots_posts'),
      where('userId', '==', firebaseUid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [firebaseUid])

  async function handleClosePost(postId) {
    setClosingId(postId)
    try {
      await updateDoc(doc(db, 'boots_posts', postId), { status: 'closed' })
    } catch (err) {
      console.error('Failed to close post:', err)
    }
    setClosingId(null)
  }

  if (loading) return <ActivitySpinner />

  if (posts.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <Briefcase size={28} className="mx-auto mb-3" style={{ color: '#C8D1DA', opacity: 0.25 }} />
        <p className="text-text-dim font-body text-sm">You haven&apos;t created any posts yet.</p>
      </GlassPanel>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {posts.map((post) => {
        const statusCfg = POST_STATUS_CONFIG[post.status] || POST_STATUS_CONFIG.active
        const isJob = post.type === 'job'
        const canClose = post.status === 'active'

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GlassPanel className="p-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Type badge */}
                    <span
                      className="px-2 py-0.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider"
                      style={{
                        backgroundColor: isJob ? 'rgba(246,196,69,0.12)' : 'rgba(0,198,255,0.12)',
                        border: `1px solid ${isJob ? 'rgba(246,196,69,0.3)' : 'rgba(0,198,255,0.3)'}`,
                        color: isJob ? '#F6C445' : '#00C6FF',
                      }}
                    >
                      {isJob ? 'Job' : 'Service'}
                    </span>
                    <StatusBadge config={statusCfg} />
                  </div>
                  <h3
                    className="text-sm font-heading font-semibold tracking-wider"
                    style={{ color: '#F4F7FA' }}
                  >
                    {post.title}
                  </h3>
                </div>

                {/* Close button */}
                {canClose && (
                  <button
                    onClick={() => handleClosePost(post.id)}
                    disabled={closingId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/40 disabled:opacity-40 disabled:pointer-events-none shrink-0"
                    style={{
                      backgroundColor: 'rgba(229,57,53,0.08)',
                      borderColor: 'rgba(229,57,53,0.25)',
                      color: '#C8D1DA',
                    }}
                  >
                    <XCircle size={12} />
                    Close Post
                  </button>
                )}
              </div>

              {/* Applicants for job posts */}
              {isJob && post.status !== 'closed' && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <ApplicantsList postId={post.id} post={post} firebaseUid={firebaseUid} />
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Section 2: My Applications ──────────────────────────────────────────────

function MyApplicationsSection({ firebaseUid, onOpenMessages }) {
  const [applications, setApplications] = useState([])
  const [postsMap, setPostsMap] = useState({})
  const [loading, setLoading] = useState(true)

  // Subscribe to user's applications
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'boots_applications'),
      where('applicantId', '==', firebaseUid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [firebaseUid])

  // Fetch post details for each application
  useEffect(() => {
    if (applications.length === 0) return
    const postIds = [...new Set(applications.map((a) => a.postId))]
    const newMap = {}
    Promise.all(
      postIds.map(async (pid) => {
        const snap = await getDoc(doc(db, 'boots_posts', pid))
        if (snap.exists()) newMap[pid] = snap.data()
      }),
    ).then(() => setPostsMap(newMap))
  }, [applications])

  if (loading) return <ActivitySpinner />

  if (applications.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <Briefcase size={28} className="mx-auto mb-3" style={{ color: '#C8D1DA', opacity: 0.25 }} />
        <p className="text-text-dim font-body text-sm">You haven&apos;t applied to any jobs yet.</p>
      </GlassPanel>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {applications.map((app) => {
        const statusCfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.pending
        const postData = postsMap[app.postId]
        const postTitle = postData?.title || 'Loading...'
        const postAuthor = postData?.userName || postData?.userId || 'Unknown'

        return (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GlassPanel className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-heading font-semibold tracking-wider mb-0.5"
                    style={{ color: '#F4F7FA' }}
                  >
                    {postTitle}
                  </h3>
                  <p className="text-xs font-body" style={{ color: '#C8D1DA' }}>
                    by {postAuthor}
                  </p>
                </div>
                <StatusBadge config={statusCfg} pulse={statusCfg.pulse} />
              </div>

              {/* Pitch message */}
              {app.message && (
                <p
                  className="text-xs font-body leading-relaxed mt-2 mb-3"
                  style={{ color: '#C8D1DA', fontStyle: 'italic' }}
                >
                  &ldquo;{app.message}&rdquo;
                </p>
              )}

              {/* Accepted: Open Messages button (placeholder for Task 8) */}
              {app.status === 'accepted' && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 mt-1"
                  style={{
                    backgroundColor: 'rgba(0,198,255,0.10)',
                    borderColor: 'rgba(0,198,255,0.3)',
                    color: '#00C6FF',
                  }}
                  onClick={() => {
                    if (onOpenMessages) onOpenMessages()
                  }}
                >
                  <MessageSquare size={12} />
                  Open Messages
                </button>
              )}
            </GlassPanel>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Section 3: My Jobs ──────────────────────────────────────────────────────

function MyJobsSection({ firebaseUid, profile }) {
  const [acceptedJobs, setAcceptedJobs] = useState([])
  const [authorJobs, setAuthorJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAuthor, setLoadingAuthor] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)

  // Jobs where the user was accepted as the boots operator
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'boots_posts'),
      where('acceptedUserId', '==', firebaseUid),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setAcceptedJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [firebaseUid])

  // Jobs authored by user that are filled or complete
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'boots_posts'),
      where('userId', '==', firebaseUid),
      where('status', 'in', ['filled', 'complete']),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setAuthorJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingAuthor(false)
    })
    return unsub
  }, [firebaseUid])

  async function handleMarkComplete(postId) {
    setUpdatingId(postId)
    try {
      await updateDoc(doc(db, 'boots_posts', postId), { status: 'complete', updatedAt: new Date() })
    } catch (err) {
      console.error('Failed to mark complete:', err)
    }
    setUpdatingId(null)
  }

  if (loading || loadingAuthor) return <ActivitySpinner />

  // Merge and deduplicate
  const allJobsMap = new Map()
  ;[...acceptedJobs, ...authorJobs].forEach((j) => {
    if (!allJobsMap.has(j.id)) allJobsMap.set(j.id, j)
  })
  const allJobs = [...allJobsMap.values()]

  if (allJobs.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <Briefcase size={28} className="mx-auto mb-3" style={{ color: '#C8D1DA', opacity: 0.25 }} />
        <p className="text-text-dim font-body text-sm">No active or completed jobs yet.</p>
      </GlassPanel>
    )
  }

  return (
    <>
      <motion.div
        className="flex flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {allJobs.map((job) => {
          const statusKey = job.status === 'filled' ? 'filled' : job.status === 'complete' ? 'complete' : 'in-progress'
          const statusCfg = JOB_STATUS_CONFIG[statusKey] || JOB_STATUS_CONFIG.filled
          const isAuthor = job.userId === firebaseUid
          const otherParty = isAuthor ? (job.acceptedUserName || 'Boots Operator') : (job.userName || 'Investor')
          const canComplete = job.status === 'filled' || job.status === 'in-progress'
          const isComplete = job.status === 'complete'

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <GlassPanel className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-heading font-semibold tracking-wider mb-0.5"
                      style={{ color: '#F4F7FA' }}
                    >
                      {job.title}
                    </h3>
                    <p className="text-xs font-body" style={{ color: '#C8D1DA' }}>
                      {isAuthor ? 'Filled by' : 'Posted by'} {otherParty}
                    </p>
                  </div>
                  <StatusBadge config={statusCfg} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  {canComplete && (
                    <button
                      onClick={() => handleMarkComplete(job.id)}
                      disabled={updatingId === job.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]/40 disabled:opacity-40 disabled:pointer-events-none"
                      style={{
                        backgroundColor: 'rgba(16,185,129,0.12)',
                        borderColor: 'rgba(16,185,129,0.35)',
                        color: '#10b981',
                      }}
                    >
                      <CheckCircle size={12} />
                      Mark Complete
                    </button>
                  )}
                  {isComplete && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40"
                      style={{
                        backgroundColor: 'rgba(246,196,69,0.10)',
                        borderColor: 'rgba(246,196,69,0.3)',
                        color: '#F6C445',
                      }}
                      onClick={() => {
                        const revieweeId = isAuthor ? job.acceptedUserId : job.userId
                        const revieweeName = isAuthor ? (job.acceptedUserName || 'Boots Operator') : (job.userName || 'Investor')
                        setReviewTarget({ postId: job.id, revieweeId, revieweeName })
                      }}
                    >
                      <Star size={12} />
                      Leave Review
                    </button>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          )
        })}
      </motion.div>

      <ReviewForm
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        postId={reviewTarget?.postId}
        revieweeId={reviewTarget?.revieweeId}
        revieweeName={reviewTarget?.revieweeName}
        firebaseUid={firebaseUid}
        reviewerName={profile?.displayName}
      />
    </>
  )
}

// ─── Section 4: My Reviews ───────────────────────────────────────────────────

function MyReviewsSection({ firebaseUid }) {
  const [viewMode, setViewMode] = useState('received')

  return (
    <div className="flex flex-col gap-5">
      {/* Toggle: Reviews About Me / Reviews I've Written */}
      <div className="flex gap-1">
        {[
          { id: 'received', label: 'Reviews About Me' },
          { id: 'given', label: "Reviews I've Written" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={[
              'px-3 py-1.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider uppercase border transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/30',
              viewMode === tab.id ? '' : 'hover:brightness-125',
            ].join(' ')}
            style={
              viewMode === tab.id
                ? {
                    backgroundColor: 'rgba(246,196,69,0.12)',
                    borderColor: 'rgba(246,196,69,0.35)',
                    color: '#F6C445',
                  }
                : {
                    backgroundColor: 'rgba(200,209,218,0.05)',
                    borderColor: 'rgba(200,209,218,0.1)',
                    color: '#C8D1DA',
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'received' ? (
            <ReviewsList
              userId={firebaseUid}
              field="revieweeId"
              emptyMessage="No reviews about you yet. Complete jobs to receive reviews!"
            />
          ) : (
            <ReviewsList
              userId={firebaseUid}
              field="reviewerId"
              emptyMessage="You haven't written any reviews yet."
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── My Activity Tab ─────────────────────────────────────────────────────────

function MyActivityTab({ firebaseUid, profile, user, onOpenMessages }) {
  const [activeSubTab, setActiveSubTab] = useState('posts')

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {ACTIVITY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={[
              'px-3 py-1.5 rounded-sm text-[11px] font-heading font-semibold tracking-wider uppercase border transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30',
              activeSubTab === tab.id
                ? ''
                : 'hover:brightness-125',
            ].join(' ')}
            style={
              activeSubTab === tab.id
                ? {
                    backgroundColor: 'rgba(0,198,255,0.12)',
                    borderColor: 'rgba(0,198,255,0.35)',
                    color: '#00C6FF',
                  }
                : {
                    backgroundColor: 'rgba(200,209,218,0.05)',
                    borderColor: 'rgba(200,209,218,0.1)',
                    color: '#C8D1DA',
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'posts' && <MyPostsSection firebaseUid={firebaseUid} />}
          {activeSubTab === 'applications' && <MyApplicationsSection firebaseUid={firebaseUid} onOpenMessages={onOpenMessages} />}
          {activeSubTab === 'jobs' && <MyJobsSection firebaseUid={firebaseUid} profile={profile} />}
          {activeSubTab === 'reviews' && <MyReviewsSection firebaseUid={firebaseUid} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function BootsOnGround() {
  const { user, profile, updateProfile, firebaseUid } = useAuth()
  const uid = firebaseUid || user?.firebaseUid
  const [activeTab, setActiveTab] = useState('find-boots')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showMessages, setShowMessages] = useState(false)

  const TABS = [
    { id: 'find-boots', label: 'Find Boots People' },
    { id: 'find-jobs', label: 'Find Jobs' },
    { id: 'my-activity', label: 'My Activity' },
  ]

  function handleCreatePost() {
    if (!profile?.bootsProfile) {
      setShowProfileModal(true)
    } else {
      setShowPostModal(true) // Task 3 builds this
    }
  }

  async function handleProfileComplete(profileData) {
    await updateProfile({ bootsProfile: profileData })
    setShowProfileModal(false)
    setShowPostModal(true)
  }

  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/boots-on-ground-bg.png)',
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

      {/* Main content with tabs */}
      <div className="min-h-screen px-6 py-16 relative z-10">
        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
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
            <p
              className="text-sm mt-2 mx-auto max-w-[480px] leading-relaxed"
              style={{ color: '#C8D1DA' }}
            >
              Connect with boots-on-the-ground operators and investors in your market
            </p>
          </motion.div>

          {/* Tab bar + Create Post */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 border-b border-[rgba(0,198,255,0.12)]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'relative px-4 py-2.5 font-heading text-xs tracking-widest uppercase transition-colors',
                    activeTab === tab.id
                      ? 'text-cyan'
                      : 'text-text-dim hover:text-parchment',
                  ].join(' ')}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="boots-tab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C6FF]"
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMessages((prev) => !prev)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-heading tracking-wider border transition-colors active:scale-[0.98] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30"
                style={{
                  color: '#00C6FF',
                  borderColor: 'rgba(0,198,255,0.3)',
                  backgroundColor: 'rgba(0,198,255,0.05)',
                }}
              >
                <MessageSquare size={14} />
                Messages
              </button>
              <button
                onClick={handleCreatePost}
                className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
              >
                <Plus size={14} />
                Create Post
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'find-boots' && <FindBootsTab />}
          {activeTab === 'find-jobs' && <FindJobsTab firebaseUid={uid} profile={profile} />}
          {activeTab === 'my-activity' && (
            <MyActivityTab firebaseUid={uid} profile={profile} user={user} onOpenMessages={() => setShowMessages(true)} />
          )}
        </div>
      </div>

      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
      />

      <CreatePostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        firebaseUid={uid}
        profile={profile}
      />

      <MessagePanel
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        firebaseUid={uid}
      />
    </>
  )
}
