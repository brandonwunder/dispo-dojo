import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Copy, Check, ExternalLink, Link2, Share2 } from 'lucide-react'
import GlassPanel from '../components/GlassPanel'

const PLACEHOLDER_URL = 'https://dispodojo.com/subto-explained'

const tips = [
  {
    icon: Globe,
    title: 'After a cold call',
    desc: 'Send the link via text right after introducing Subject-To on the phone.',
  },
  {
    icon: Link2,
    title: 'In your LOI email',
    desc: 'Include it as a resource when sending Letters of Intent to agents.',
  },
  {
    icon: Share2,
    title: 'Agent asks "What is Sub-To?"',
    desc: 'Instead of explaining over text, send the link and let the page do the work.',
  },
  {
    icon: ExternalLink,
    title: 'Seller needs convincing',
    desc: 'Ask the agent to forward it to their seller for a professional breakdown.',
  },
]

export default function WebsiteExplainer() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(PLACEHOLDER_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
    {/* Background Image */}
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/subject-to-bg.png)',
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[800px] mx-auto relative z-10 px-6 py-16"
    >
      {/* Header */}
      <div className="text-center mb-8 max-w-[680px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
            <Link2 size={36} style={{ color: '#00C6FF' }} />
          </div>
          <h1
            className="font-display text-4xl"
            style={{
              color: '#F4F7FA',
              textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
            }}
          >
            Subject-To Explainer
          </h1>
        </div>
        <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
          Share a simple, professional explanation of Subject-To with agents and
          sellers. Copy the link below and send it via text, email, or in person.
        </p>
      </div>

        {/* URL Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <GlassPanel className="p-5">
            <div className="mb-4">
              <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Share the Dojo</span>
            </div>

            {/* Preview header */}
            <div className="pb-5 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}
                >
                  <Link2 size={20} style={{ color: '#00C6FF' }} />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold tracking-wide text-[#F4F7FA]">
                    Sub-To Explainer Page
                  </h2>
                  <p className="text-xs text-text-dim">
                    A clean, professional landing page for agents & sellers
                  </p>
                </div>
              </div>

              <p className="text-sm text-text-dim leading-relaxed">
                This link takes agents or sellers to a simple one-page website that
                explains the Subject-To process in plain English. It covers how it
                works, why it benefits the seller, and answers common questions — so
                you don't have to explain it every time over the phone.
              </p>
            </div>

            {/* Shareable Link */}
            <label className="block font-heading tracking-wide uppercase text-xs mb-3" style={{ color: '#00C6FF' }}>
              Shareable Link
            </label>

            <div className="flex items-center gap-3">
              <div
                className="flex-1 flex items-center gap-3 font-mono text-sm bg-black/30 border rounded-sm px-4 py-3"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <Globe size={16} className="shrink-0 relative z-10" style={{ color: '#00C6FF' }} />
                <span className="text-[#F4F7FA] truncate relative z-10">
                  {PLACEHOLDER_URL}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-heading font-semibold tracking-wide uppercase transition-all duration-300 shrink-0 ${
                  copied
                    ? 'bg-bamboo/20 text-bamboo border border-bamboo/30'
                    : ''
                }`}
                style={!copied ? {
                  background: 'rgba(0,198,255,0.1)',
                  border: '1px solid rgba(0,198,255,0.3)',
                  color: '#00C6FF',
                } : undefined}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Usage tips — 4 GlassPanel cards in grid */}
        <div className="mb-8">
          <h3 className="font-heading text-sm font-semibold tracking-wide text-[#F4F7FA] mb-4 flex items-center gap-2">
            <Share2 size={16} style={{ color: '#00C6FF' }} />
            When to Share This Link
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tips.map((tip, i) => {
              const Icon = tip.icon
              return (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <GlassPanel className="p-5 h-full">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}
                      >
                        <Icon size={14} style={{ color: '#00C6FF' }} />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium tracking-wide text-[#F4F7FA] mb-1">
                          {tip.title}
                        </p>
                        <p className="text-xs text-text-dim leading-relaxed">
                          {tip.desc}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Coming soon note — glass info bar */}
        <div
          className="rounded-2xl border"
          style={{ background: 'rgba(11,15,20,0.45)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-center gap-2 px-5 py-3 relative z-10">
            <ExternalLink size={14} style={{ color: '#00C6FF' }} />
            <span className="text-sm text-[#C8D1DA] font-heading tracking-wide">
              Custom branded explainer page coming soon — link will be live shortly
            </span>
          </div>
        </div>
    </motion.div>
    </>
  )
}
