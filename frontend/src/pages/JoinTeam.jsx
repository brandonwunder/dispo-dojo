import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Flame, Wrench, TrendingUp } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const highlights = [
  {
    icon: Flame,
    title: 'Warmed Leads',
    description: "Access to leads we've already qualified and underwritten",
  },
  {
    icon: Wrench,
    title: 'Full Tool Suite',
    description: 'Agent Finder, LOI Generator, Contract Generator, and more',
  },
  {
    icon: TrendingUp,
    title: 'Growth Path',
    description: "We invest in our team members' long-term success",
  },
]

const inputClasses =
  'input-calligraphy focus:outline-none bg-bg-card border border-gold-dim/20 rounded-sm px-4 py-3 text-parchment placeholder:text-text-muted transition-colors w-full'

export default function JoinTeam() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative max-w-[900px] mx-auto"
    >
      {/* Banner flags — subtle crimson/gold vertical stripes */}
      <div className="absolute top-0 left-8 w-3 h-28 bg-gradient-to-b from-crimson/25 to-transparent rounded-b-sm pointer-events-none" />
      <div className="absolute top-0 left-16 w-2.5 h-24 bg-gradient-to-b from-gold/20 to-transparent rounded-b-sm pointer-events-none" />
      <div className="absolute top-0 right-12 w-3 h-32 bg-gradient-to-b from-crimson/20 to-transparent rounded-b-sm pointer-events-none" />

      {/* -- The Pitch -- */}
      <motion.div variants={itemVariants} className="mb-10">
        <WoodPanel headerBar="Recruitment Hall — Join the Clan">
          <div className="max-w-3xl space-y-5">
            <motion.p variants={itemVariants} className="text-text-dim leading-relaxed font-body">
              We have a ton of leads that we've warmed up, properties that we've
              underwritten, and a constant flow of deal opportunities coming in. As
              we scale and open up new lead sources and financing types, we're
              looking for experienced cold callers to join our team.
            </motion.p>

            <motion.p variants={itemVariants} className="text-text-dim leading-relaxed font-body">
              We're not looking for just anybody. We want people who have
              experience, have closed deals before, or know enough to handle agent
              objections and close. Our team is extremely small and exclusive —
              this page is only up because we're looking for one to two people.
            </motion.p>

            <motion.p variants={itemVariants} className="text-text-dim leading-relaxed font-body">
              We run a very tight ship. Both partners in our company will
              personally vet every candidate to make sure they're the right fit.
              We're looking for people with a hustle mentality who know how to
              solve problems without being micromanaged and who have long-term
              goals in this industry.
            </motion.p>

            <motion.p variants={itemVariants} className="text-text-dim leading-relaxed font-body">
              We understand that everyone has different goals — and yes, you will
              always be cold calling — but we'd love to help you grow and reach
              your goals. We'll provide a position that gives you real experience,
              money in your pocket, and a path forward.
            </motion.p>
          </div>
        </WoodPanel>
      </motion.div>

      {/* -- Feature Highlights -- */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14"
      >
        {highlights.map((h) => {
          const Icon = h.icon
          return (
            <motion.div key={h.title} variants={itemVariants}>
              <WoodPanel hover={false} className="h-full">
                <div className="w-12 h-12 rounded-full hanko-seal flex items-center justify-center mb-3">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-semibold tracking-wide text-parchment mb-1.5">
                  {h.title}
                </h3>
                <p className="text-sm text-text-dim leading-relaxed font-body">
                  {h.description}
                </p>
              </WoodPanel>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Katana divider */}
      <div className="katana-line mb-10" />

      {/* -- Application Form -- */}
      <motion.div variants={itemVariants} className="mb-4">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <WoodPanel
              glow
              hover={false}
            >
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <CheckCircle size={48} className="text-gold" />
                <div>
                  <h3 className="font-display text-xl text-parchment mb-1">
                    Welcome to the Clan!
                  </h3>
                  <p className="text-text-dim font-body">
                    Brandon or Brad will reach out to you shortly.
                  </p>
                </div>
              </div>
            </WoodPanel>
          </motion.div>
        ) : (
          <WoodPanel hover={false} headerBar="Pledge Your Blade">
            <p className="text-text-dim font-body mb-6">
              Brandon or Brad will reach out personally.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block font-heading text-gold-dim tracking-wide uppercase text-xs mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block font-heading text-gold-dim tracking-wide uppercase text-xs mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block font-heading text-gold-dim tracking-wide uppercase text-xs mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="block font-heading text-gold-dim tracking-wide uppercase text-xs mb-1.5"
                >
                  Tell us about your experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={4}
                  required
                  placeholder="Describe your cold calling and deal-closing experience..."
                  value={form.experience}
                  onChange={handleChange}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="w-full gold-shimmer text-ink font-heading font-bold tracking-widest uppercase px-6 py-3 rounded-sm transition-all duration-300 hover:shadow-[0_0_24px_-4px_rgba(212,168,83,0.5)]"
              >
                Submit Application
              </button>
            </form>
          </WoodPanel>
        )}
      </motion.div>
    </motion.div>
  )
}
