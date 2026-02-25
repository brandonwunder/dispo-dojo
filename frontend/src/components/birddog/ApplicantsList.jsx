import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#F6C445', Icon: Clock },
  accepted: { label: 'Accepted', color: '#10b981', Icon: UserCheck },
  passed:   { label: 'Passed',   color: '#E53935', Icon: XCircle },
}

// ─── ApplicantsList ───────────────────────────────────────────────────────────

export default function ApplicantsList({ post, firebaseUid }) {
  const [updating, setUpdating] = useState(null) // userId being updated

  const applicants = post?.applicants || []

  async function handleUpdateStatus(applicantUserId, newStatus) {
    setUpdating(applicantUserId)
    try {
      const postRef = doc(db, 'bird_dog_posts', post.id)
      const updatedApplicants = post.applicants.map((a) =>
        a.userId === applicantUserId ? { ...a, status: newStatus } : a
      )
      const updates = { applicants: updatedApplicants }
      // If accepting and post is still active, move to in_progress
      if (newStatus === 'accepted' && post.status === 'active') {
        updates.status = 'in_progress'
      }
      await updateDoc(postRef, updates)

      // Create a message thread when accepting an applicant
      if (newStatus === 'accepted') {
        const applicant = post.applicants.find((a) => a.userId === applicantUserId)
        await addDoc(collection(db, 'bird_dog_threads'), {
          jobPostId: post.id,
          jobTitle: post.title,
          participants: [post.userId, applicantUserId],
          participantNames: {
            [post.userId]: post.authorName,
            [applicantUserId]: applicant?.name || 'Unknown',
          },
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          unreadBy: [],
          createdAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('Update applicant status error:', err)
    } finally {
      setUpdating(null)
    }
  }

  // Empty state
  if (applicants.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)]">
        <p className="text-xs text-text-dim/40 font-body text-center py-4">
          No applicants yet
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)]">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim">
          Applicants
        </p>
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-heading font-bold"
          style={{
            color: '#00C6FF',
            backgroundColor: 'rgba(0,198,255,0.15)',
            border: '1px solid rgba(0,198,255,0.30)',
          }}
        >
          {applicants.length}
        </span>
      </div>

      {/* Applicant cards */}
      <AnimatePresence initial={false}>
        <div className="flex flex-col gap-2.5">
          {applicants.map((applicant, i) => {
            const statusCfg = STATUS_CONFIG[applicant.status] || STATUS_CONFIG.pending
            const StatusIcon = statusCfg.Icon
            const isUpdating = updating === applicant.userId

            return (
              <motion.div
                key={applicant.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="p-3 rounded-sm bg-black/30 border border-[rgba(255,255,255,0.07)]"
              >
                {/* Name + Status badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="font-heading font-bold text-sm text-parchment truncate">
                    {applicant.name || 'Unknown'}
                  </p>
                  <span
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-widest"
                    style={{
                      color: statusCfg.color,
                      backgroundColor: `${statusCfg.color}18`,
                      border: `1px solid ${statusCfg.color}33`,
                    }}
                  >
                    <StatusIcon size={10} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Pitch */}
                {applicant.pitch && (
                  <p className="text-sm text-text-dim leading-snug font-body mb-2">
                    {applicant.pitch}
                  </p>
                )}

                {/* Methods badges */}
                {applicant.methods?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {applicant.methods.map((m) => (
                      <span
                        key={m}
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
                        style={{
                          color: '#00C6FF',
                          backgroundColor: 'rgba(0,198,255,0.10)',
                          border: '1px solid rgba(0,198,255,0.30)',
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Service area tags */}
                {applicant.serviceArea?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {applicant.serviceArea.map((area) => (
                      <span
                        key={area}
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
                        style={{
                          color: '#F6C445',
                          backgroundColor: 'rgba(246,196,69,0.10)',
                          border: '1px solid rgba(246,196,69,0.30)',
                        }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats line */}
                <p className="text-[11px] text-text-dim/50 font-body mb-2">
                  {applicant.stats?.birdDogLeads || 0} bird dog lead{(applicant.stats?.birdDogLeads || 0) !== 1 ? 's' : ''}
                </p>

                {/* Action buttons — only for pending applicants */}
                {applicant.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(applicant.userId, 'accepted')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: '#10b981',
                        borderColor: 'rgba(16,185,129,0.35)',
                        backgroundColor: 'rgba(16,185,129,0.08)',
                      }}
                    >
                      <CheckCircle size={12} />
                      {isUpdating ? '...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(applicant.userId, 'passed')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: '#C8D1DA',
                        borderColor: 'rgba(255,255,255,0.12)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <XCircle size={12} />
                      {isUpdating ? '...' : 'Pass'}
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </AnimatePresence>
    </div>
  )
}
