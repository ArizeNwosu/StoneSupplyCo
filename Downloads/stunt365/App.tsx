
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import HookGenerator from './components/HookGenerator';
import Strategy from './components/Strategy';
import StuntArchive from './components/StuntArchive';
import { ContentPillar } from './types';

interface HookPrefill {
  title: string;
  pillar: ContentPillar;
  context: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [hookPrefill, setHookPrefill] = useState<HookPrefill>({
    title: '',
    pillar: ContentPillar.BREAKDOWN,
    context: '',
  });

  const handleGenerateHook = (title: string, pillar: ContentPillar, context: string) => {
    setHookPrefill({ title, pillar, context });
    setActiveTab('generator');
  };

  // The Planner needs a true fullscreen layout — no max-width cap, no outer page scroll.
  // All other tabs use the normal scrollable + max-w-7xl wrapper.
  const isGridMode = activeTab === 'planner';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'planner':
        return <Planner onGenerateHook={handleGenerateHook} />;
      case 'generator':
        return (
          <HookGenerator
            prefillTitle={hookPrefill.title}
            prefillPillar={hookPrefill.pillar}
            prefillContext={hookPrefill.context}
          />
        );
      case 'library':
        return <StuntArchive onGenerateHook={handleGenerateHook} />;
      case 'strategy':
        return <Strategy />;
      default:
        return (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
            <i className="fa-solid fa-hammer text-4xl mb-4"></i>
            <h2 className="text-xl font-bold oswald uppercase">Module Under Construction</h2>
            <p>We're building this. Stay tuned.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex bg-zinc-950 text-zinc-100" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Gold accent bar + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="h-1 taurus-gradient flex-shrink-0"></div>

        {isGridMode ? (
          // ── Grid mode: full height, no max-width, no outer scroll ──
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        ) : (
          // ── Standard mode: scrollable with max-width and footer ──
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
            <footer className="p-8 border-t border-zinc-900 text-center">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                &copy; 2025 Stunt364 Digital Archive · Exclusively Built for the Taurus World Stunt Awards
              </p>
            </footer>
          </main>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
