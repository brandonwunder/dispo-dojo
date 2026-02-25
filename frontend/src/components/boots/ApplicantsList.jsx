import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck, UserX, Clock } from 'lucide-react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#F6C445',
    bg: 'rgba(246,196,69,0.12)',
    border: 'rgba(246,196,69,0.3)',
  },
  accepted: {
    label: 'Accepted',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
  },
  rejected: {
    label: 'Rejected',
    color: '#C8D1DA',
    bg: 'rgba(200,209,218,0.08)',
    border: 'rgba(200,209,218,0.15)',
  },
}

// ─── ApplicantsList ─────────────────────────────────────────────────────────

export default function ApplicantsList({ postId, post, firebaseUid }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // applicationId being updated

  useEffect(() => {
    if (!postId) return

    const q = query(
      collection(db, 'boots_applications'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
    )

    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [postId])

  async function handleAccept(application) {
    setUpdating(application.id)
    try {
      await updateDoc(doc(db, 'boots_applications', application.id), {
        status: 'accepted',
      })
      await updateDoc(doc(db, 'boots_posts', postId), {
        acceptedUserId: application.applicantId,
        status: 'filled',
      })
    } catch (err) {
      console.error('Failed to accept applicant:', err)
    }
    setUpdating(null)
  }

  async function handleReject(application) {
    setUpdating(application.id)
    try {
      await updateDoc(doc(db, 'boots_applications', application.id), {
        status: 'rejected',
      })
    } catch (err) {
      console.error('Failed to reject applicant:', err)
    }
    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div
          className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="py-5 text-center">
        <Clock size={20} className="mx-auto mb-2" style={{ color: '#C8D1DA', opacity: 0.3 }} />
        <p className="text-xs font-body" style={{ color: '#C8D1DA', opacity: 0.6 }}>
          No applications yet
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <p
        className="text-[10px] font-heading font-semibold tracking-widest uppercase mb-0.5"
        style={{ color: '#C8D1DA' }}
      >
        Applicants ({applications.length})
      </p>

      <AnimatePresence>
        {applications.map((app) => {
          const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
          const firstLetter = (app.applicantName || 'A').charAt(0).toUpperCase()
          const isPending = app.status === 'pending'
          const isUpdating = updating === app.id

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <GlassPanel className="p-3.5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold"
                    style={{
                      backgroundColor: 'rgba(0,198,255,0.12)',
                      color: '#00C6FF',
                      border: '1px solid rgba(0,198,255,0.25)',
                    }}
                  >
                    {firstLetter}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-heading font-semibold tracking-wider"
                        style={{ color: '#F4F7FA' }}
                      >
                        {app.applicantName || 'Anonymous'}
                      </span>
                      {/* Status badge */}
                      <span
                        className="px-1.5 py-0.5 rounded-sm text-[9px] font-heading font-semibold tracking-wider"
                        style={{
                          backgroundColor: status.bg,
                          border: `1px solid ${status.border}`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Pitch message */}
                    {app.message && (
                      <p
                        className="text-xs font-body leading-relaxed mb-2"
                        style={{ color: '#C8D1DA', fontStyle: 'italic' }}
                      >
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}

                    {/* Action buttons - only for pending */}
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(app)}
                          disabled={isUpdating}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]/40 disabled:opacity-40 disabled:pointer-events-none"
                          style={{
                            backgroundColor: 'rgba(16,185,129,0.12)',
                            borderColor: 'rgba(16,185,129,0.35)',
                            color: '#10b981',
                          }}
                        >
                          <UserCheck size={12} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(app)}
                          disabled={isUpdating}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/40 disabled:opacity-40 disabled:pointer-events-none"
                          style={{
                            backgroundColor: 'rgba(229,57,53,0.08)',
                            borderColor: 'rgba(229,57,53,0.25)',
                            color: '#C8D1DA',
                          }}
                        >
                          <UserX size={12} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
