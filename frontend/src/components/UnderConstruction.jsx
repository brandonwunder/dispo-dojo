import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShurikenIcon } from '../icons/index'
import { ArrowLeft } from 'lucide-react'

export default function UnderConstruction() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* Spinning shuriken */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(246,196,69,0.15) 0%, transparent 70%)',
              transform: 'scale(2)',
            }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ color: '#F6C445', filter: 'drop-shadow(0 0 20px rgba(246,196,69,0.4))' }}
          >
            <ShurikenIcon size={80} />
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-4xl md:text-5xl mb-4"
        style={{
          color: '#F6C445',
          textShadow: '0 0 30px rgba(246,196,69,0.3), 0 0 60px rgba(246,196,69,0.1)',
        }}
      >
        Dojo Under Preparation
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-lg mb-2 max-w-md"
        style={{ color: '#C8D1DA', lineHeight: 1.7 }}
      >
        The sensei is sharpening this blade.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-sm mb-10 max-w-md"
        style={{ color: '#8a9bae', lineHeight: 1.7 }}
      >
        This section is being crafted and will be available soon. Check back shortly.
      </motion.p>

      {/* Back to Dashboard button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-heading text-sm tracking-wide"
        style={{
          background: 'linear-gradient(135deg, rgba(0,198,255,0.15), rgba(14,90,136,0.2))',
          border: '1px solid rgba(0,198,255,0.3)',
          color: '#00C6FF',
          boxShadow: '0 0 20px rgba(0,198,255,0.1)',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </motion.button>
    </div>
  )
}
