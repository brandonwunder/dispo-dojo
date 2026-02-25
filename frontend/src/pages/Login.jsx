import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import RainEffect from '../components/RainEffect'
import NinjaTransition from '../components/NinjaTransition'
import { useAuth } from '../context/AuthContext'

/* ─── Input focus helpers ─────────────────────────────────────────────── */

const inputFocus = (e) => {
  e.target.style.borderColor = 'rgba(0, 198, 255, 0.4)'
  e.target.style.boxShadow = '0 0 12px rgba(0, 198, 255, 0.15)'
}
const inputBlur = (e) => {
  e.target.style.borderColor = 'rgba(0, 198, 255, 0.1)'
  e.target.style.boxShadow = 'none'
}

const INPUT_CLS =
  'w-full px-4 py-3.5 rounded-lg text-[#F4F7FA] font-body placeholder:text-[#C8D1DA]/40 focus:outline-none'

const LABEL_CLS =
  'block text-[11px] font-heading font-semibold text-[#C8D1DA] mb-1.5 tracking-[0.08em] uppercase'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  SIGN UP MODAL (2-step form — unchanged functionality)                */
/* ═══════════════════════════════════════════════════════════════════════ */

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
      {/* Blurred overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(11, 15, 20, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        {/* Glassmorphism modal card */}
        <div
          className="relative rounded-xl overflow-hidden elevation-2"
          style={{
            background: 'rgba(17, 27, 36, 0.8)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
            border: '1px solid rgba(0, 198, 255, 0.12)',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #00C6FF, transparent)',
              opacity: 0.3,
            }}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#C8D1DA] hover:text-[#F4F7FA] transition-colors z-20"
          >
            <X size={20} />
          </button>

          <div className="px-9 pt-8 pb-9">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: step >= 1 ? '#00C6FF' : 'rgba(200, 209, 218, 0.3)',
                  boxShadow: step >= 1 ? '0 0 8px rgba(0,198,255,0.4)' : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              />
              <div className="w-8 katana-line" />
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: step >= 2 ? '#00C6FF' : 'rgba(200, 209, 218, 0.3)',
                  boxShadow: step >= 2 ? '0 0 8px rgba(0,198,255,0.4)' : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl mb-2 tracking-[0.06em] gold-shimmer-text">
                      Make an Account
                    </h2>
                    <p className="text-sm text-[#C8D1DA] font-heading tracking-wide">Tell us who you are</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-[rgba(229,57,53,0.15)] border border-[rgba(229,57,53,0.3)] text-[#EF5350] text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleStep1} className="space-y-5">
                    <div>
                      <label className={LABEL_CLS}>Full Name</label>
                      <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Email Address</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Phone Number</label>
                      <input
                        type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 mt-2 text-white font-heading font-bold tracking-widest uppercase rounded-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229, 57, 53, 0.3)' }}
                    >
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
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="font-display text-2xl mb-2 tracking-[0.06em] gold-shimmer-text">
                      Set Your Logins
                    </h2>
                    <p className="text-sm text-[#C8D1DA] font-heading tracking-wide">Set up your username & password</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-[rgba(229,57,53,0.15)] border border-[rgba(229,57,53,0.3)] text-[#EF5350] text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleStep2} className="space-y-5">
                    <div>
                      <label className={LABEL_CLS}>Username</label>
                      <input
                        type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                        placeholder="johndoe123"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Password</label>
                      <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Confirm Password</label>
                      <input
                        type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className={INPUT_CLS}
                        style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                      />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError('') }}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[#C8D1DA] hover:text-[#00C6FF] transition-colors duration-200 text-sm font-heading uppercase tracking-wider"
                        style={{ border: '1px solid rgba(0, 198, 255, 0.2)' }}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 text-white font-heading font-bold tracking-widest uppercase rounded-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229, 57, 53, 0.3)' }}
                      >
                        Enter the Dojo
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

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LOGIN MODAL — 3D Card Flip                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function LoginModal({ onClose, onSubmit, identifier, setIdentifier, password, setPassword, error, onShowSignUp }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(11, 15, 20, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* 3D perspective container */}
      <div className="relative z-10 w-full max-w-[420px]" style={{ perspective: '1200px' }}>
        <motion.div
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glassmorphism card */}
          <div
            className="relative rounded-xl overflow-hidden elevation-2"
            style={{
              background: 'rgba(17, 27, 36, 0.75)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              border: '1px solid rgba(0, 198, 255, 0.12)',
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #00C6FF, transparent)',
                opacity: 0.3,
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#C8D1DA] hover:text-[#F4F7FA] transition-colors z-20"
            >
              <X size={20} />
            </button>

            <div className="px-9 pt-10 pb-9">
              {/* Logo */}
              <div className="flex justify-center mb-5">
                <img
                  src="/dispo-dojo-logo.png"
                  alt="Dispo Dojo"
                  className="h-16 w-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 12px rgba(246,196,69,0.3))',
                    animation: 'logoFloat 6s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Heading */}
              <h2 className="font-display text-3xl text-center mb-1 gold-shimmer-text tracking-[0.04em]">
                Enter the Dojo
              </h2>
              <p className="text-[#C8D1DA] text-center text-sm mb-7 font-heading tracking-wide">
                Welcome back, warrior
              </p>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-[rgba(229,57,53,0.15)] border border-[rgba(229,57,53,0.3)] text-[#EF5350] text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label htmlFor="identifier" className={LABEL_CLS}>
                    Email or Username
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@company.com or username"
                    className={INPUT_CLS}
                    style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
                <div>
                  <label htmlFor="password" className={LABEL_CLS}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={INPUT_CLS}
                    style={{ background: 'rgba(11, 15, 20, 0.6)', border: '1px solid rgba(0, 198, 255, 0.1)' }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 mt-4 text-white font-heading font-bold tracking-widest uppercase rounded-lg transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #E53935, #B3261E)',
                    boxShadow: '0 0 16px rgba(229, 57, 53, 0.3)',
                  }}
                >
                  Enter the Dojo
                </button>
              </form>

              <p className="text-center mt-5 text-[#C8D1DA] text-sm">
                New to the dojo?{' '}
                <button
                  onClick={onShowSignUp}
                  className="text-[#00C6FF] ml-1 hover:underline transition-colors duration-200"
                >
                  Make an Account for FREE
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN LOGIN PAGE — Hero Landing                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showNinja, setShowNinja] = useState(false)
  const { login, quickLogin } = useAuth()
  const navigate = useNavigate()

  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSceneReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleNinjaComplete = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() && !password) {
      quickLogin()
      setShowLoginModal(false)
      setShowNinja(true)
      return
    }

    const result = login(identifier.trim(), password)
    if (result.success) {
      setShowLoginModal(false)
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
    <div className="min-h-screen relative overflow-hidden bg-[#0B0F14]">

      {/* Layer 0: Background photo with cinematic zoom */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/login-bg.png)',
          transform: sceneReady ? 'scale(1)' : 'scale(1.15)',
          filter: sceneReady ? 'blur(0px)' : 'blur(4px)',
          transition: 'transform 3500ms cubic-bezier(0.25,0.46,0.45,0.94), filter 3500ms cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      />

      {/* Layer 1: Vignette + premium fade overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(11,15,20,0.6) 45%, rgba(11,15,20,0.92) 100%)',
            'linear-gradient(180deg, rgba(11,15,20,0.55) 0%, rgba(11,15,20,0.25) 35%, rgba(11,15,20,0.35) 65%, rgba(11,15,20,0.8) 100%)',
          ].join(', '),
        }}
      />
      {/* Extra dark wash to push background further back */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ background: 'rgba(11,15,20,0.45)' }}
      />

      {/* Layer 2: Rain + lightning */}
      <div className="fixed inset-0 z-[2] pointer-events-none">
        <RainEffect count={150} lightning={true} />
      </div>

      {/* Layer 3: Fog/mist blobs */}
      <div className="fixed inset-0 z-[3] pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(14,90,136,0.25) 0%, transparent 70%)',
            top: '10%', left: '5%',
            opacity: sceneReady ? 0.15 : 0.6,
            transition: 'opacity 3500ms',
            animation: 'fogDrift1 40s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,198,255,0.15) 0%, transparent 70%)',
            top: '30%', right: '0%',
            opacity: sceneReady ? 0.12 : 0.5,
            transition: 'opacity 3500ms',
            animation: 'fogDrift2 35s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[700px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(14,90,136,0.2) 0%, transparent 70%)',
            bottom: '5%', left: '20%',
            opacity: sceneReady ? 0.1 : 0.5,
            transition: 'opacity 3500ms',
            animation: 'fogDrift3 45s ease-in-out infinite',
          }}
        />
      </div>

      {/* Layer 4: Lantern glow accents */}
      <div className="fixed inset-0 z-[4] pointer-events-none">
        <div
          className="absolute w-[200px] h-[200px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,154,60,0.18) 0%, transparent 70%)',
            top: '35%', left: '22%',
            opacity: sceneReady ? 1 : 0.3,
            transition: 'opacity 3500ms',
            animation: 'lanternPulse 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[180px] h-[180px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,154,60,0.15) 0%, transparent 70%)',
            top: '40%', right: '20%',
            opacity: sceneReady ? 1 : 0.3,
            transition: 'opacity 3500ms',
            animation: 'lanternPulse 4s ease-in-out infinite 1s',
          }}
        />
        <div
          className="absolute w-[160px] h-[160px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,154,60,0.12) 0%, transparent 70%)',
            bottom: '25%', left: '35%',
            opacity: sceneReady ? 1 : 0.2,
            transition: 'opacity 3500ms',
            animation: 'lanternPulse 4s ease-in-out infinite 2s',
          }}
        />
      </div>

      {/* ═══ Layer 10: HERO SECTION ═══ */}
      <div className="relative z-[10] min-h-screen flex flex-col items-center justify-center p-4 text-center">

        {/* Company Logo — 3x large */}
        <motion.img
          src="/dispo-dojo-logo.png"
          alt="Dispo Dojo"
          className="h-48 md:h-60 w-auto object-contain mb-6"
          style={{
            filter: 'drop-shadow(0 0 24px rgba(246,196,69,0.4))',
            animation: 'logoFloat 6s ease-in-out infinite',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Main Headline */}
        <motion.h1
          className="font-heading font-bold gold-shimmer-text leading-[1.05] tracking-[0.04em] uppercase px-4"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
            textShadow: '0 0 60px rgba(246,196,69,0.25), 0 4px 24px rgba(0,0,0,0.7)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          THE #1 WHOLESALING
          <br />
          JV TEAM
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="font-heading text-[#C8D1DA] tracking-[0.15em] uppercase mt-5 px-6 max-w-2xl"
          style={{
            fontSize: 'clamp(0.7rem, 1.8vw, 1.1rem)',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            lineHeight: '1.8',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          WE PROVIDE ALL THE TOOLS AND SUPPORT YOU NEED
          <br className="hidden sm:block" />
          {' '}TO SUCCEED IN WHOLESALING FOR FREE!
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={() => setShowLoginModal(true)}
          className="mt-10 px-10 py-4 text-white font-heading font-bold tracking-[0.2em] uppercase rounded-lg text-lg md:text-xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #E53935, #B3261E)',
            boxShadow: '0 0 30px rgba(229, 57, 53, 0.4), 0 0 60px rgba(229, 57, 53, 0.15)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{
            scale: 1.04,
            boxShadow: '0 0 40px rgba(229, 57, 53, 0.55), 0 0 80px rgba(229, 57, 53, 0.2)',
          }}
          whileTap={{ scale: 0.97 }}
        >
          Enter the Dojo
        </motion.button>
      </div>

      {/* ═══ Login Modal (3D Flip) ═══ */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSubmit={handleSubmit}
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={password}
            setPassword={setPassword}
            error={error}
            onShowSignUp={() => {
              setShowLoginModal(false)
              setShowSignUp(true)
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ Sign Up Modal ═══ */}
      <AnimatePresence>
        {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} onSuccess={handleSignupSuccess} />}
      </AnimatePresence>

      {/* ═══ NinjaTransition overlay ═══ */}
      <NinjaTransition active={showNinja} onComplete={handleNinjaComplete} />
    </div>
  )
}
