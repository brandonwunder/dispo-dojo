import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Copy, Check, ExternalLink, Link2, Share2 } from 'lucide-react'
import ShojiCard from '../components/ShojiCard'

const PLACEHOLDER_URL = 'https://dispodojo.com/subto-explained'

export default function WebsiteExplainer() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(PLACEHOLDER_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[800px] mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={28} className="text-gold" />
          <h1 className="font-display text-2xl tracking-[0.06em] brush-underline text-text-primary">
            Website Explainer
          </h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl">
          Share a simple, professional explanation of Subject-To with agents and
          sellers. Copy the link below and send it via text, email, or in person.
        </p>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <ShojiCard hover={false} className="p-6 overflow-hidden">
          {/* Preview header */}
          <div className="pb-6 border-b border-gold-dim/[0.1]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center">
                <Link2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-wide text-text-primary">
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

          {/* URL copy section */}
          <div className="py-6 border-b border-gold-dim/[0.1]">
            <label className="text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-3 block">
              Shareable Link
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 font-mono text-sm bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-4 py-3">
                <Globe size={16} className="text-gold shrink-0" />
                <span className="text-text-primary truncate">
                  {PLACEHOLDER_URL}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-heading font-semibold tracking-wide uppercase transition-all duration-300 shrink-0 border ${
                  copied
                    ? 'bg-success/20 text-success border-success/30'
                    : 'border-gold text-gold hover:bg-gold/[0.08] hover:shadow-[0_0_20px_-8px_rgba(201,169,110,0.3)]'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Usage tips */}
          <div className="pt-6">
            <h3 className="font-heading text-sm font-semibold tracking-wide text-text-primary mb-4 flex items-center gap-2">
              <Share2 size={16} className="text-gold" />
              When to Share This Link
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: 'After a cold call',
                  desc: 'Send the link via text right after introducing Subject-To on the phone.',
                },
                {
                  title: 'In your LOI email',
                  desc: 'Include it as a resource when sending Letters of Intent to agents.',
                },
                {
                  title: 'Agent asks "What is Sub-To?"',
                  desc: 'Instead of explaining over text, send the link and let the page do the work.',
                },
                {
                  title: 'Seller needs convincing',
                  desc: 'Ask the agent to forward it to their seller for a professional breakdown.',
                },
              ].map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <ShojiCard hover={false} className="p-4">
                    <p className="font-heading text-sm font-medium tracking-wide text-text-primary mb-1">
                      {tip.title}
                    </p>
                    <p className="text-xs text-text-dim leading-relaxed">
                      {tip.desc}
                    </p>
                  </ShojiCard>
                </motion.div>
              ))}
            </div>
          </div>
        </ShojiCard>
      </motion.div>

      {/* Coming soon note */}
      <div className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gold/20 bg-gold/[0.04]">
        <ExternalLink size={14} className="text-gold" />
        <span className="text-sm text-gold font-heading tracking-wide">
          Custom branded explainer page coming soon — link will be live shortly
        </span>
      </div>
    </motion.div>
  )
}
