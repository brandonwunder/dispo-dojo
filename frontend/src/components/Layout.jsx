import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MistLayer from './MistLayer';
import TorchLight from './TorchLight';
import EmberField from './EmberField';
import RainEffect from './RainEffect';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
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

        <main className="ml-0 lg:ml-[250px] min-h-screen relative z-10">
          <RainEffect />
          <div>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
