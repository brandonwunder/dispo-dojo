import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GlassPanel from '../components/GlassPanel'
import ProfileSetupModal from '../components/boots/ProfileSetupModal'

// ─── Placeholder Tab Components ──────────────────────────────────────────────

function FindBootsTab() {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Boots operator listings coming soon...</p>
    </GlassPanel>
  )
}

function FindJobsTab() {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Job postings coming soon...</p>
    </GlassPanel>
  )
}

function MyActivityTab({ firebaseUid, profile, user }) {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Your activity will appear here...</p>
    </GlassPanel>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────────

export default function BootsOnGround() {
  const { user, profile, updateProfile, firebaseUid } = useAuth()
  const uid = firebaseUid || user?.firebaseUid
  const [activeTab, setActiveTab] = useState('find-boots')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)

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
            <button
              onClick={handleCreatePost}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
            >
              <Plus size={14} />
              Create Post
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'find-boots' && <FindBootsTab />}
          {activeTab === 'find-jobs' && <FindJobsTab />}
          {activeTab === 'my-activity' && (
            <MyActivityTab firebaseUid={uid} profile={profile} user={user} />
          )}
        </div>
      </div>

      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
      />
    </>
  )
}
