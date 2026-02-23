import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import DojoGateScene from '../components/three/DojoGateScene'
import NinjaTransition from '../components/NinjaTransition'
import { useAuth } from '../context/AuthContext'

const inputClass = `
  w-full px-4 py-3 bg-bg-card border border-[rgba(0,198,255,0.15)] rounded-sm
  text-parchment font-body focus:border-[rgba(0,198,255,0.4)] focus:shadow-[0_0_8px_rgba(0,198,255,0.15)] focus:outline-none
  transition-colors placeholder:text-text-dim/50
`

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
        className="relative z-10 w-full max-w-md"
      >
        <div className="wood-panel border border-[rgba(0,198,255,0.15)] rounded-sm relative overflow-hidden">
          {/* Rope binding at top */}
          <div className="rope-top" />

          {/* Metal brackets */}
          <div className="metal-bracket top-left" />
          <div className="metal-bracket top-right" />
          <div className="metal-bracket bottom-left" />
          <div className="metal-bracket bottom-right" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-dim hover:text-parchment transition-colors z-20"
          >
            <X size={20} />
          </button>

          <div className="px-8 pt-8 pb-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#00C6FF] shadow-[0_0_8px_rgba(0,198,255,0.4)]' : 'bg-border'}`} />
              <div className="w-8 katana-line" />
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#00C6FF] shadow-[0_0_8px_rgba(0,198,255,0.4)]' : 'bg-border'}`} />
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
                    <h2 className="font-display text-2xl text-parchment mb-2 tracking-[0.06em]">
                      Begin Training
                    </h2>
                    <p className="text-sm text-text-dim font-heading tracking-wide">Tell us who you are</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-sm bg-crimson/20 border border-crimson/30 text-crimson-bright text-sm">
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
                    <button type="submit" className="w-full py-3 mt-2 text-white font-heading font-bold tracking-widest uppercase rounded-sm shadow-[0_0_16px_rgba(229,57,53,0.3)] hover:shadow-[0_0_24px_rgba(229,57,53,0.45)] transition-shadow" style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)' }}>
                      <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={16} /></span>
                    </button>
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
                    <h2 className="font-display text-2xl text-parchment mb-2 tracking-[0.06em]">
                      Choose Your Weapons
                    </h2>
                    <p className="text-sm text-text-dim font-heading tracking-wide">Set up your username & password</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-sm bg-crimson/20 border border-crimson/30 text-crimson-bright text-sm">
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
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-[rgba(0,198,255,0.15)] text-text-dim hover:border-[#00C6FF] hover:text-[#00C6FF] transition-colors duration-200 text-sm"
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button type="submit" className="flex-1 py-3 text-white font-heading font-bold tracking-widest uppercase rounded-sm shadow-[0_0_16px_rgba(229,57,53,0.3)] hover:shadow-[0_0_24px_rgba(229,57,53,0.45)] transition-shadow" style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)' }}>
                        Begin Training
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background */}
      <DojoGateScene />

      {/* Login background image */}
      <div
        className="fixed inset-0 z-[1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/login-bg.png)' }}
      />

      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-[2] bg-gradient-to-t from-bg/90 via-bg/50 to-bg/30" />

      {/* Content */}
      <div className="relative z-[3] min-h-screen flex items-center justify-center p-4">
        {/* Login Panel */}
        <motion.div
          className="w-full max-w-md wood-panel border border-[rgba(0,198,255,0.15)] rounded-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Rope binding at top */}
          <div className="rope-top" />

          {/* Metal brackets */}
          <div className="metal-bracket top-left" />
          <div className="metal-bracket top-right" />
          <div className="metal-bracket bottom-left" />
          <div className="metal-bracket bottom-right" />

          {/* Logo */}
          <div className="flex justify-center pt-8 pb-4">
            <img src="/dispo-dojo-logo.png" alt="Dispo Dojo" className="w-48 h-auto object-contain" style={{ animation: 'logoFloat 6s ease-in-out infinite' }} />
          </div>

          <div className="px-8 pb-8">
            <h1 className="font-display text-3xl text-center text-parchment mb-1">
              Enter the Dojo
            </h1>
            <p className="text-text-dim text-center text-sm mb-6 font-heading tracking-wide">
              Welcome back, warrior
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-sm bg-crimson/20 border border-crimson/30 text-crimson-bright text-sm">
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
              <button type="submit" className="w-full py-3 mt-4 text-white font-heading font-bold tracking-widest uppercase rounded-sm shadow-[0_0_16px_rgba(229,57,53,0.3)] hover:shadow-[0_0_24px_rgba(229,57,53,0.45)] transition-shadow" style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)' }}>
                Enter the Dojo
              </button>
            </form>

            <p className="text-center mt-4 text-text-dim text-sm">
              New to the dojo?{' '}
              <button onClick={() => setShowSignUp(true)} className="text-[#00C6FF] ml-1 hover:text-[#00C6FF]/80 transition-colors">
                Begin Training
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Sign Up Modal */}
      <AnimatePresence>
        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} onSuccess={handleSignupSuccess} />}
      </AnimatePresence>

      {/* NinjaTransition overlay */}
      <NinjaTransition active={showNinja} onComplete={handleNinjaComplete} />
    </div>
  )
}
