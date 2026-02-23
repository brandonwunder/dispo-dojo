import { motion } from 'framer-motion'
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CountUp from 'react-countup'
import WoodPanel from '../components/WoodPanel'

const statConfig = [
  { icon: Users, label: 'Total Users', kanji: '\u7DCF' },
  { icon: Calendar, label: 'This Week', kanji: '\u9031' },
  { icon: Clock, label: 'Today', kanji: '\u4ECA' },
]

export default function AdminDashboard() {
  const { users } = useAuth()

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const thisWeekCount = users.filter((u) => {
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000
    return new Date(u.createdAt).getTime() > week
  }).length

  const todayCount = users.filter((u) => {
    const today = new Date().toDateString()
    return new Date(u.createdAt).toDateString() === today
  }).length

  const statValues = [users.length, thisWeekCount, todayCount]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <h1 className="font-display text-4xl text-gold">
            The Sensei's Quarters
          </h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl mt-3">
          Manage your platform and track partner sign-ups.
        </p>
      </div>

      <div className="katana-line my-4" />

      {/* Stats row — WoodPanel with scroll-card styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statConfig.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <WoodPanel hover={false} className="scroll-card relative">
                {/* Kanji watermark */}
                <div className="absolute top-2 right-3 font-display text-6xl text-gold/[0.06] pointer-events-none select-none z-0">
                  {stat.kanji}
                </div>

                {/* Hanko seal icon */}
                <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center mb-3 relative z-10">
                  <Icon size={18} className="text-white" />
                </div>

                {/* Label */}
                <p className="font-heading text-text-dim tracking-widest uppercase text-xs mb-1 relative z-10">
                  {stat.label}
                </p>

                {/* Value */}
                <p className="font-heading text-3xl text-gold-bright tracking-wide relative z-10">
                  <CountUp end={typeof statValues[i] === 'number' ? statValues[i] : 0} duration={1.5} separator="," />
                </p>
              </WoodPanel>
            </motion.div>
          )
        })}
      </div>

      {/* User table */}
      <WoodPanel hover={false} headerBar="Student Roster" className="!p-0">
        {users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-dim text-sm font-heading">
              No students have entered the dojo yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="lacquer-bar">
                  <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                    Username
                  </th>
                  <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-gold font-heading tracking-widest uppercase text-xs">
                    Signed Up
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...users].reverse().map((u, i) => (
                  <motion.tr
                    key={u.email}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gold-dim/[0.08] hover:bg-gold/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-bg text-xs font-bold shrink-0">
                          {u.name
                            .split(/\s/)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join('')}
                        </div>
                        <span className="text-sm text-parchment font-medium">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-text-dim">
                        <AtSign size={14} className="text-text-muted shrink-0" />
                        {u.username}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-text-dim">
                        <Mail size={14} className="text-text-muted shrink-0" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-text-dim">
                        <Phone size={14} className="text-text-muted shrink-0" />
                        {u.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-dim font-mono">
                      {formatDate(u.createdAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WoodPanel>
    </motion.div>
  )
}
