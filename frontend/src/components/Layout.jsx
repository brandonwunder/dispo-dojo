import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MistLayer from './MistLayer';
import TorchLight from './TorchLight';
import EmberField from './EmberField';
import { CursorProvider } from './CustomCursor';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const location = useLocation();

  return (
    <CursorProvider>
      <div className="min-h-screen bg-bg ink-wash wall-texture">
        {/* === ATMOSPHERE STACK === */}
        {/* Layer 1: Mist (lowest) */}
        <MistLayer />
        {/* Layer 2: Torch light glows */}
        <TorchLight
          positions={[
            { top: '2%', left: '25%' },
            { top: '2%', right: '5%' },
          ]}
          intensity={0.7}
        />
        {/* Layer 3: Floating embers */}
        <EmberField density={35} />

        {/* === LAYOUT === */}
        <Sidebar />
        <main className="ml-[250px] min-h-screen relative z-10">
          <Header />
          <div className="p-6">
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
