import { motion } from 'framer-motion'
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import ShojiCard from '../components/ShojiCard'

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl tracking-[0.06em] text-text-primary brush-underline">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl mt-3">
          Manage your platform and track partner sign-ups.
        </p>
      </div>

      <div className="katana-line my-4" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.length}
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={thisWeekCount}
        />
        <StatCard
          icon={Clock}
          label="Today"
          value={todayCount}
        />
      </div>

      {/* User table */}
      <ShojiCard hover={false} className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gold-dim/[0.15]">
          <h2 className="font-heading text-lg font-semibold tracking-wide text-text-primary">
            Registered Partners
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-dim text-sm font-heading">
              No partners have signed up yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-dim/[0.15]">
                  <th className="text-left px-6 py-3 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                    Username
                  </th>
                  <th className="text-left px-6 py-3 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
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
                    className="border-b border-gold-dim/[0.08] hover:bg-gold/[0.03] transition-colors duration-200"
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
                        <span className="text-sm text-text-primary font-medium">
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
      </ShojiCard>
    </motion.div>
  )
}
