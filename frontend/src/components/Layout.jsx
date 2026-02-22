import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import MistLayer from './MistLayer'
import CherryBlossoms from './CherryBlossoms'
import { CursorProvider } from './CustomCursor'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const location = useLocation()

  return (
    <CursorProvider>
      <div className="min-h-screen bg-bg">
        {/* Background effects */}
        <MistLayer />
        <CherryBlossoms />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="ml-[250px] min-h-screen flex flex-col relative z-10">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </CursorProvider>
  )
}
