import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MessageSquare, ShieldAlert, ChevronDown, Copy, Check } from 'lucide-react'

const tabs = [
  { id: 'calling', label: 'Calling Scripts', icon: Phone },
  { id: 'texting', label: 'Texting Scripts', icon: MessageSquare },
  { id: 'objections', label: 'Objection Handling', icon: ShieldAlert },
]

const callingScripts = [
  {
    title: 'Initial Agent Outreach',
    scenario: 'Cold calling a listing agent for the first time about their listing.',
    script: `Hi [Agent Name], my name is [Your Name] — I came across your listing at [Property Address] and wanted to reach out.

I work with a group of investors and we're actively looking to close deals in [City/Area]. We can close quickly, often in as little as 14 days, and we cover all closing costs.

Would you be open to hearing a creative offer on the property? We have several options that could work for your seller — including ones that can get them full asking price.

[If yes] Great! Can I get the best email to send over our offer details?

[If no] No problem at all. If anything changes or the listing sits a bit, feel free to reach out. I'll send you my info just in case.`,
  },
  {
    title: 'Follow-Up Call (Day 3-5)',
    scenario: 'Following up with an agent who showed initial interest.',
    script: `Hey [Agent Name], it's [Your Name] — we spoke a few days ago about [Property Address].

I just wanted to follow up and see if you had a chance to look over what I sent. We're still very interested in the property and ready to move quickly.

Is there a time this week we could chat for 5 minutes to go over the details? I think we can put together something that really works for your seller.`,
  },
  {
    title: 'Sub-To Introduction Call',
    scenario: 'Explaining Subject-To to an agent who is unfamiliar.',
    script: `So what we do is called a "Subject-To" acquisition — it's been around for decades and it's completely legal and ethical.

Essentially, your seller transfers the deed to us, and we take over their existing mortgage payments. The loan stays in their name temporarily, but we're contractually obligated to make every payment.

The benefit to your seller is they get out from under the property without having to bring money to closing, and they protect their credit. You still get your full commission — we make sure of that.

Would it help if I sent you a one-page explainer you could share with your seller?`,
  },
  {
    title: 'Expired Listing Outreach',
    scenario: 'Reaching out to agents whose listings just expired.',
    script: `Hi [Agent Name], I noticed your listing at [Property Address] recently came off the market. I know that can be frustrating.

I work with a group of investors who specialize in properties that didn't sell traditionally. We have some creative solutions that could still get your seller a great outcome — and you'd still earn your commission.

Would you be open to a quick 5-minute call to see if it's a fit?`,
  },
]

const textingScripts = [
  {
    title: 'Initial Text to Agent',
    scenario: 'First contact via text message.',
    script: `Hi [Agent Name]! This is [Your Name]. I came across your listing at [Address] and I have a buyer who may be interested. Are you open to creative offers? Happy to chat whenever works for you.`,
  },
  {
    title: 'Follow-Up Text',
    scenario: 'Following up after no response (Day 2-3).',
    script: `Hey [Agent Name], just following up on [Address]. We're actively closing deals in the area and can move fast. Would love to connect if you have a minute this week!`,
  },
  {
    title: 'Value-Add Text',
    scenario: 'Providing value to build the relationship.',
    script: `Hi [Agent Name]! Quick question — if I could bring you a solution that gets your seller full asking price, covers all closing costs, and closes in 14 days, would that be worth a 5-min call? No pressure either way.`,
  },
  {
    title: 'After Sending LOI',
    scenario: 'Texting after sending a Letter of Intent.',
    script: `Hey [Agent Name], just sent over our LOI for [Address] to your email. Let me know if you have any questions — happy to hop on a quick call to walk through it. We're ready to move fast on this one.`,
  },
  {
    title: 'Re-Engage Cold Lead',
    scenario: 'Reaching back out after weeks of silence.',
    script: `Hey [Agent Name]! It's [Your Name]. We chatted a while back about [Address]. Just checking in — is the property still available? We've closed a few deals in the area recently and are still looking.`,
  },
]

const objectionHandling = [
  {
    objection: '"My seller would never agree to that."',
    response: `I totally understand — and honestly, most sellers haven't heard of Subject-To before. But when they see the numbers and realize they can walk away without bringing money to closing, protect their credit, and have someone else handle the payments — it clicks pretty fast.

Would it help if I sent you a simple one-page explainer you could share with them? No pressure at all.`,
  },
  {
    objection: '"That sounds too good to be true."',
    response: `I get that a lot, and I appreciate the healthy skepticism — that means you're looking out for your client.

Here's the thing: we're contractually obligated to make every mortgage payment. We put that in writing. And this strategy has been used in real estate for decades — it's completely legal and done through a title company just like any other closing.

Happy to connect you with our title company or attorney if that would give you more confidence.`,
  },
  {
    objection: '"I need to get my seller full asking price."',
    response: `That's actually what we aim for. With a Subject-To deal, we can often offer full asking price because we're not asking for traditional financing or bank approval. We take over the existing payments, so there's no lender discount.

Your seller gets their price, you get your full commission, and we handle the rest. Want me to run the numbers on this specific deal?`,
  },
  {
    objection: '"What happens if you stop making payments?"',
    response: `Great question — and it's the most important one. First, it's in our contract that we're legally obligated to make every payment. Second, we have a vested interest in keeping that mortgage current because we own the property.

We also carry insurance and have reserves specifically for this. We can even set up an escrow account where your seller can verify payments are being made every month. We want everyone protected.`,
  },
  {
    objection: '"I\'ve never heard of Subject-To before."',
    response: `That's completely normal — most traditional agents haven't worked with it. But it's been a legitimate real estate strategy for decades.

In simple terms: the seller deeds us the property, and we take over making the mortgage payments. The loan stays in their name temporarily, but we handle everything. It's done through a title company with a standard closing process.

I have a quick explainer I can send over that breaks it all down in plain English. Would that be helpful?`,
  },
  {
    objection: '"I need to talk to my broker first."',
    response: `Absolutely, please do! We encourage that. Subject-To is a well-known strategy and any experienced broker will be familiar with it.

If your broker has any questions, I'm happy to hop on a call with both of you. We work with brokers and agents all the time on these types of deals. Just let me know when works.`,
  },
  {
    objection: '"We already have other offers."',
    response: `That's great — competition means it's a solid property. Here's what makes our offer different though:

We can close in as little as 14 days, we cover all closing costs, and there's no financing contingency — so no risk of the deal falling through because a bank says no. If your other offers have any contingencies or delays, ours might be worth considering as a backup at minimum.`,
  },
  {
    objection: '"My seller wants to list it traditionally first."',
    response: `Totally respect that. Here's what I'd suggest — let them try the market. If it doesn't sell in 30-60 days, or if they get tired of showings and lowball offers, give me a call. We'll still be here and ready to close quickly.

I'll send you my info so you have it on file. No pressure at all.`,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-heading uppercase tracking-wide transition-colors duration-200 border border-transparent hover:border-[#00C6FF]/20 focus-visible:outline-none focus-visible:border-[#00C6FF]/40 active:scale-95"
      style={{
        color: copied ? '#4ade80' : '#00C6FF',
        background: copied ? 'rgba(74, 222, 128, 0.06)' : 'rgba(0, 198, 255, 0.04)',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function ScriptCard({ title, scenario, script, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <motion.div variants={itemVariants}>
      <div
        className="rounded-sm border overflow-hidden"
        style={{
          background: 'rgba(11,15,20,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          borderColor: 'rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Cyan accent line at top */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #00C6FF, transparent)' }} />

        {/* Collapsible header */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.02]"
        >
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-wide text-gold">{title}</h3>
            <p className="text-xs text-text-dim mt-0.5">{scenario}</p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 ml-4"
          >
            <ChevronDown size={18} className="text-gold-dim" />
          </motion.div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.07)]">
                <div className="flex justify-end mt-3 mb-2">
                  <CopyButton text={script} />
                </div>
                <div
                  className="rounded-sm border border-[rgba(255,255,255,0.07)] p-4"
                  style={{ background: 'rgba(11, 15, 20, 0.6)' }}
                >
                  <pre className="text-sm text-parchment whitespace-pre-wrap font-body leading-relaxed">
                    {script}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ObjectionCard({ objection, response, index }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <motion.div variants={itemVariants}>
      <div
        className="rounded-sm border overflow-hidden"
        style={{
          background: 'rgba(11,15,20,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          borderColor: 'rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Crimson accent line at top */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #E53935, transparent)' }} />

        {/* Collapsible header */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left px-5 py-4 transition-colors duration-200 hover:bg-white/[0.02]"
        >
          <div className="flex items-start gap-3 flex-1">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: '#E53935' }} />
            <p className="font-heading text-sm font-semibold tracking-wide border-l-2 pl-3" style={{ color: '#E53935', borderColor: '#E53935' }}>
              {objection}
            </p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 ml-4"
          >
            <ChevronDown size={18} className="text-gold-dim" />
          </motion.div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-5 px-5 border-t border-[rgba(255,255,255,0.07)]">
                <div className="flex justify-end mb-2">
                  <CopyButton text={response} />
                </div>
                <div className="border-l-2 border-gold pl-4">
                  <p className="text-xs font-heading font-semibold tracking-[0.08em] uppercase mb-2" style={{ color: '#00C6FF' }}>
                    Your Response
                  </p>
                  <pre className="text-sm text-parchment whitespace-pre-wrap font-body leading-relaxed">
                    {response}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function Scripts() {
  const [activeTab, setActiveTab] = useState('calling')

  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/scripts-bg.png)',
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
        className="relative z-10 max-w-[900px] mx-auto px-6 py-16"
      >
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <Phone size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              The Training Dojo
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            Proven calling scripts, text templates, and objection handlers to help you close deals with listing agents.
          </p>
        </div>
      </div>

        {/* Tabs — cyan underline pattern (matching AdminDashboard) */}
        <div className="flex gap-1 mb-6 border-b border-[rgba(0,198,255,0.12)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-heading text-xs tracking-widest uppercase transition-colors duration-150 relative ${
                activeTab === tab.id ? 'text-[#00C6FF]' : 'text-text-dim hover:text-parchment'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="scripts-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C6FF]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === 'calling' && (
              <motion.div
                key="calling"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {callingScripts.map((s, i) => (
                  <ScriptCard key={s.title} {...s} index={i} />
                ))}
              </motion.div>
            )}

            {activeTab === 'texting' && (
              <motion.div
                key="texting"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {textingScripts.map((s, i) => (
                  <ScriptCard key={s.title} {...s} index={i} />
                ))}
              </motion.div>
            )}

            {activeTab === 'objections' && (
              <motion.div
                key="objections"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {objectionHandling.map((o, i) => (
                  <ObjectionCard key={o.objection} {...o} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </motion.div>
    </>
  )
}
