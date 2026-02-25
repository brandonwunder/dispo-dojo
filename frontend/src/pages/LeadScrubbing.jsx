import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, X } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import { ForgeHammerIcon } from '../components/icons/index'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const VIDEOS = [
  {
    title: 'Finding Subject-To Leads',
    shortTitle: 'Subject-To',
    desc: 'How to identify assumable-mortgage candidates on the MLS — filters, equity signals, and days-on-market patterns that reveal motivated sellers.',
    color: '#A855F7',
    colorBg: 'rgba(127,0,255,0.12)',
    colorBorder: 'rgba(127,0,255,0.3)',
    colorGlow: 'rgba(127,0,255,0.2)',
    bullets: [
      'Setting up MLS filters for Sub-To candidates',
      'Reading equity stack indicators',
      'Days-on-market patterns that signal motivation',
      'How to approach the listing agent on these deals',
    ],
  },
  {
    title: 'Finding Stack Method Leads',
    shortTitle: 'Stack Method',
    desc: 'Layer equity, DOM, and price reduction criteria to surface highly motivated sellers before the competition finds them.',
    color: '#F6C445',
    colorBg: 'rgba(246,196,69,0.1)',
    colorBorder: 'rgba(246,196,69,0.3)',
    colorGlow: 'rgba(246,196,69,0.2)',
    bullets: [
      'What "the stack" means and why it works',
      'Combining filters for high-conviction leads',
      'Reading market signals in your zip code',
      'Building a repeatable daily search routine',
    ],
  },
  {
    title: 'Finding Cash Leads — Deal Sauce',
    shortTitle: 'Cash / Deal Sauce',
    desc: 'A full walkthrough of the Deal Sauce platform: dashboard navigation, finding cash leads, and identifying other lead types worth pursuing.',
    color: '#00C6FF',
    colorBg: 'rgba(0,198,255,0.08)',
    colorBorder: 'rgba(0,198,255,0.25)',
    colorGlow: 'rgba(0,198,255,0.2)',
    bullets: [
      'Platform navigation and account setup',
      'Understanding the Deal Sauce dashboard',
      'Filtering for cash leads in your market',
      'Identifying other lead categories available',
    ],
  },
]

/* ─── Video Modal ────────────────────────────────────────────────────────────── */

function VideoModal({ video, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-3xl rounded-sm border border-gold-dim/25 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0B0F14 100%)' }}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-text-dim hover:text-parchment hover:bg-black/70 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Video Placeholder Area */}
        <div
          className="aspect-video flex flex-col items-center justify-center gap-5 relative"
          style={{ background: `linear-gradient(135deg, ${video.colorBg}, rgba(11,15,20,0.95) 60%)` }}
        >
          {/* Subtle colored border glow at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent, ${video.color}, transparent)` }}
          />

          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center border-2 cursor-pointer"
            style={{
              background: `${video.colorBg}`,
              borderColor: video.colorBorder,
              boxShadow: `0 0 30px ${video.colorGlow}, 0 0 60px ${video.colorGlow}`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Play size={36} className="ml-1" style={{ color: video.color }} />
          </motion.div>
          <div className="text-center">
            <p className="text-parchment text-xl font-heading tracking-wide">Coming Soon...</p>
            <p className="text-text-dim text-sm font-body mt-1">This training video is being recorded</p>
          </div>
        </div>

        {/* Details below video */}
        <div className="px-6 py-5">
          {/* Title + badge */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-heading tracking-widest uppercase"
              style={{ background: video.colorBg, border: `1px solid ${video.colorBorder}`, color: video.color }}
            >
              Training
            </span>
            <h2 className="font-heading text-lg text-parchment tracking-wide">{video.title}</h2>
          </div>

          <p className="text-text-dim text-sm leading-relaxed font-body mb-5">{video.desc}</p>

          <div className="katana-line my-4" />

          {/* Bullet points */}
          <h3 className="text-xs font-heading text-text-dim tracking-widest uppercase mb-3">What You'll Learn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {video.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <ForgeHammerIcon size={14} className="shrink-0 mt-0.5" style={{ color: video.color }} />
                <span className="text-text-dim text-sm leading-relaxed font-body">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Video Card ─────────────────────────────────────────────────────────────── */

function VideoCard({ video, onClick }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="rounded-sm border border-gold-dim/20 overflow-hidden h-full flex flex-col"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0E1720 100%)' }}
      >
        {/* Thumbnail / Coming Soon Area */}
        <div
          className="aspect-video relative flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${video.colorBg}, rgba(11,15,20,0.9) 70%)` }}
        >
          {/* Colored line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 10%, ${video.color}, transparent 90%)` }}
          />

          {/* Play button */}
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center border"
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderColor: video.colorBorder,
              boxShadow: `0 0 20px ${video.colorGlow}`,
            }}
          >
            <Play size={24} className="ml-0.5 group-hover:scale-110 transition-transform duration-200" style={{ color: video.color }} />
          </motion.div>

          {/* Coming Soon overlay */}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-text-dim text-xs font-heading tracking-widest uppercase">Coming Soon...</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-4 py-4 flex-1 flex flex-col">
          <h3 className="font-heading text-sm text-parchment tracking-wide mb-2 leading-snug">{video.title}</h3>
          <p className="text-text-dim text-xs leading-relaxed font-body mb-4 flex-1 line-clamp-2">{video.desc}</p>

          {/* Watch CTA */}
          <div
            className="py-2 rounded-sm text-center font-heading text-xs tracking-widest uppercase border transition-colors duration-200"
            style={{
              borderColor: video.colorBorder,
              color: video.color,
              background: video.colorBg,
            }}
          >
            View Details
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function LeadScrubbing() {
  const [selectedVideo, setSelectedVideo] = useState(null)

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/finding-leads-bg.png)',
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1000px] mx-auto relative z-10"
      >
        {/* Forge Fire Glow */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 10% 50%, rgba(232, 101, 46, 0.15) 0%, transparent 50%)' }}
        />

        {/* Hero header */}
        <motion.div variants={itemVariants}>
          <div className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <ForgeHammerIcon size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                Finding Leads
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              On-market lead sourcing — training videos
            </p>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div variants={itemVariants} className="mb-8">
          <div
            className="flex items-start gap-3 px-5 py-4 rounded-sm border"
            style={{
              background: 'rgba(0, 198, 255, 0.05)',
              borderColor: 'rgba(0, 198, 255, 0.2)',
            }}
          >
            <Info size={18} className="text-cyan shrink-0 mt-0.5" />
            <p className="text-text-dim text-sm leading-relaxed font-body">
              These training videos focus on finding{' '}
              <span className="text-parchment font-heading">on-market properties</span> in each category.
              Once we identify a lead, we reach out directly to the listing agent to present our offer.
            </p>
          </div>
        </motion.div>

        {/* 3 Video Cards — Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VIDEOS.map((video) => (
            <VideoCard
              key={video.title}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
