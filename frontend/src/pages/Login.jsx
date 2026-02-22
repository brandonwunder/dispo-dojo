import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import MistLayer from '../components/MistLayer'
import CherryBlossoms from '../components/CherryBlossoms'
import { CursorProvider } from '../components/CustomCursor'
import NinjaTransition from '../components/NinjaTransition'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

function SignUpModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { signup } = useAuth()

  const handleStep1 = (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('All fields are required')
      return
    }
    setStep(2)
  }

  const handleStep2 = (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Username and password are required')
      return
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const result = signup(name.trim(), email.trim(), phone.trim(), username.trim(), password)
    if (result.success) {
      onSuccess()
    } else {
      setError(result.error)
    }
  }

  const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-bg-elevated border border-gold-dim/[0.15]
    text-text-primary text-sm placeholder:text-text-muted
    input-calligraphy focus:outline-none
    transition-all duration-200
  `

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="relative washi-texture overflow-hidden backdrop-blur-xl bg-bg-card/80 border border-gold-dim/[0.15] rounded-2xl p-8 shadow-[0_0_80px_-20px_rgba(212,168,83,0.15)]">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold-dim/20 pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold-dim/20 pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold-dim/20 pointer-events-none z-10" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold-dim/20 pointer-events-none z-10" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors z-20"
          >
            <X size={20} />
          </button>

          {/* Step indicator — dojo belt progression */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gold shadow-[0_0_8px_rgba(212,168,83,0.4)]' : 'bg-border'}`} />
            <div className="w-8 katana-line" />
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gold shadow-[0_0_8px_rgba(212,168,83,0.4)]' : 'bg-border'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl text-text-primary mb-2 tracking-[0.06em]">
                    Begin Training
                  </h2>
                  <p className="text-sm text-text-dim">Tell us who you are</p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson-bright text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Full Name
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Email Address
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Phone Number
                    </label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className={inputClass} />
                  </div>
                  <Button variant="gold" size="md" className="w-full mt-2">
                    <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={16} /></span>
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl text-text-primary mb-2 tracking-[0.06em]">
                    Choose Your Weapons
                  </h2>
                  <p className="text-sm text-text-dim">Set up your username & password</p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-2.5 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson-bright text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep2} className="space-y-5">
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Username
                    </label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe123" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Password
                    </label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                      Confirm Password
                    </label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className={inputClass} />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError('') }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gold-dim/[0.15] text-text-dim hover:border-gold hover:text-gold transition-all duration-200 text-sm"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <Button variant="gold" size="md" className="flex-1">
                      Begin Training
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [showNinja, setShowNinja] = useState(false)
  const { login, quickLogin } = useAuth()
  const navigate = useNavigate()

  const handleNinjaComplete = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() && !password) {
      quickLogin()
      setShowNinja(true)
      return
    }

    const result = login(identifier.trim(), password)
    if (result.success) {
      setShowNinja(true)
    } else {
      setError(result.error)
    }
  }

  const handleSignupSuccess = () => {
    setShowSignUp(false)
    setShowNinja(true)
  }

  const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-bg-elevated border border-gold-dim/[0.15]
    text-text-primary text-sm placeholder:text-text-muted
    input-calligraphy focus:outline-none
    transition-all duration-200
  `

  return (
    <CursorProvider>
      <div className="relative min-h-screen flex items-center justify-center bg-bg overflow-hidden">
        <MistLayer />
        <CherryBlossoms />
        <NinjaTransition active={showNinja} onComplete={handleNinjaComplete} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[420px] mx-4"
        >
          <div className="relative washi-texture overflow-hidden backdrop-blur-xl bg-bg-card/80 border border-gold-dim/[0.15] rounded-2xl p-8 shadow-[0_0_80px_-20px_rgba(212,168,83,0.15)]">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold-dim/20 pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold-dim/20 pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold-dim/20 pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold-dim/20 pointer-events-none z-10" />

            <div className="relative z-[2]">
              <div className="flex justify-center mb-8">
                <img src="/logo.png" alt="Dispo Dojo" className="w-[140px] animate-[logoFloat_4s_ease-in-out_infinite]" />
              </div>

              <div className="text-center mb-8">
                <h1 className="font-display text-2xl text-text-primary mb-2 tracking-[0.08em]">
                  Enter the Dojo
                </h1>
                <p className="text-sm text-text-dim">Sign in to begin your training</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson-bright text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="identifier" className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                    Email or Username
                  </label>
                  <input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@company.com or username" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-heading font-semibold text-text-dim mb-1.5 tracking-[0.08em] uppercase">
                    Password
                  </label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={inputClass} />
                </div>
                <Button variant="gold" size="md" className="w-full mt-2">
                  Enter
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-text-dim">
                  New recruit?{' '}
                  <button onClick={() => setShowSignUp(true)} className="text-gold hover:text-gold-bright transition-colors duration-200 font-medium">
                    Begin Training
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} onSuccess={handleSignupSuccess} />}
        </AnimatePresence>
      </div>
    </CursorProvider>
  )
}
