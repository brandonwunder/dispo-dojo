import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MistLayer from './MistLayer';
import TorchLight from './TorchLight';
import EmberField from './EmberField';
import { CursorProvider } from './CustomCursor';
import RainEffect from './RainEffect';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CursorProvider>
      <div className="min-h-screen bg-bg ink-wash wall-texture">
        {/* === ATMOSPHERE STACK === */}
        <MistLayer />
        <TorchLight
          positions={[
            { top: '2%', left: '25%' },
            { top: '2%', right: '5%' },
          ]}
          intensity={0.7}
        />
        <EmberField density={35} />
        <RainEffect />

        {/* === LAYOUT === */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile hamburger button */}
        <button
          className="fixed top-3 left-3 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-[#0d0d1a]/80 border border-gold-dim/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} className="text-gold" />
        </button>

        <main className="ml-0 lg:ml-[250px] min-h-screen relative">
          <div className="p-6 relative z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </CursorProvider>
  );
}
