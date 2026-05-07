import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, Search, BookOpen, Circle, TrendingUp, Mail } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import Overview from './components/Overview';
import Explorer from './components/Explorer';
import Evidence from './components/Evidence';
import Intel from './components/Intel';
import { AlertBanner } from './components/AlertBanner';
import { DigestPanel } from './components/DigestPanel';

function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="25 45 230 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19D3F3" />
          <stop offset="100%" stopColor="#2E6BFF" />
        </linearGradient>
      </defs>
      <circle cx="140" cy="160" r="100" stroke="url(#iconG)" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="540 80" />
      <path d="M40 160 H95 L125 95 L160 225 L195 160 H250" stroke="url(#iconG)" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingLogo({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="25 45 230 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loadG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19D3F3" />
          <stop offset="100%" stopColor="#2E6BFF" />
        </linearGradient>
      </defs>
      {/* Faint static ring underneath for depth */}
      <circle cx="140" cy="160" r="100" stroke="url(#loadG)" strokeWidth="14" fill="none" opacity="0.12" />
      {/* Rotating arc — the logo circle becomes the spinner */}
      <circle
        className="logo-ring"
        cx="140" cy="160" r="100"
        stroke="url(#loadG)" strokeWidth="14" fill="none"
        strokeLinecap="round" strokeDasharray="440 188"
      />
      {/* Pulse line traces itself left-to-right then sweeps off */}
      <path
        className="logo-pulse-trace"
        d="M40 160 H95 L125 95 L160 225 L195 160 H250"
        stroke="url(#loadG)" strokeWidth="16" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoFull({ height = 38 }: { height?: number }) {
  const w = Math.round(height * (810 / 230));
  return (
    <svg width={w} height={height} viewBox="20 45 810 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19D3F3" />
          <stop offset="100%" stopColor="#2E6BFF" />
        </linearGradient>
      </defs>
      <circle cx="140" cy="160" r="100" stroke="url(#logoG)" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="540 80" />
      <path d="M40 160 H95 L125 95 L160 225 L195 160 H250" stroke="url(#logoG)" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="330" y="180" fontFamily="Arial, Helvetica, sans-serif" fontSize="92" fontWeight="700" letterSpacing="1">
        <tspan fill="#f8fafc">PULSE</tspan><tspan fill="url(#logoG)">GLP1</tspan>
      </text>
    </svg>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'explorer' | 'evidence' | 'intel'>('overview');
  const [apiData, setApiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [digestOpen, setDigestOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Failed to fetch intelligence data');
        const data = await res.json();
        setApiData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface border-b border-outline-variant/60 shadow-sm shadow-black/20">
        <div className="flex justify-between items-center px-margin h-16 w-full max-w-container-max mx-auto">
          <div className="flex items-center">
            <LogoFull height={38} />
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6 mr-8 relative">
              {(['overview', 'explorer', 'evidence', 'intel'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={clsx(
                    "text-label-caps px-4 py-2 rounded transition-colors uppercase relative z-10", 
                    currentTab === tab ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {currentTab === tab && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-surface-container-high rounded -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setDigestOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Weekly Intelligence Digest"
            >
              <Mail className="w-4 h-4" />
              <span className="text-label-caps hidden sm:inline">DIGEST</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success-container)]/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
              <Circle className="w-2.5 h-2.5 fill-current animate-pulse" style={{ color: 'var(--color-success)' }} />
              <span className="text-label-caps font-bold" style={{ color: 'var(--color-success)' }}>LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-container-max mx-auto px-margin pt-24 pb-24 md:pb-10 overflow-hidden relative flex-1 flex flex-col w-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-on-surface-variant analytical-border rounded-lg bg-surface-container-low min-h-[50vh]">
            <LoadingLogo size={96} />
            <h2 className="text-headline-md mb-2 text-on-surface">Ingesting Live Signals</h2>
            <p className="max-w-md">Querying public feeds to compile real-time market intelligence using AI...</p>
          </div>
        ) : error ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-on-surface-variant analytical-border rounded-lg bg-surface-container-low min-h-[50vh]">
               <Activity className="w-12 h-12 text-error mb-6" />
               <h2 className="text-headline-md mb-2 text-error">Intelligence Feed Offline</h2>
               <p className="max-w-md mb-6">{error}</p>
               <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-on-primary rounded text-label-caps font-bold">RETRY CONNECTION</button>
             </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full flex-1"
            >
              {currentTab === 'overview' && <Overview data={apiData} />}
              {currentTab === 'explorer' && <Explorer data={apiData} />}
              {currentTab === 'evidence' && <Evidence data={apiData} />}
              {currentTab === 'intel'    && <Intel />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AlertBanner />
      <DigestPanel open={digestOpen} onClose={() => setDigestOpen(false)} />

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[68px] px-4 bg-surface border-t border-outline-variant/60 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        {(['overview', 'explorer', 'evidence', 'intel'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={clsx(
              "flex flex-col items-center justify-center transition-colors px-4 py-2 rounded-lg relative z-10",
              currentTab === tab ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {currentTab === tab && (
              <motion.div
                layoutId="active-mobile-bg"
                className="absolute inset-0 bg-surface-container-high rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            {tab === 'overview' && <LayoutDashboard className="w-6 h-6" />}
            {tab === 'explorer' && <Search className="w-6 h-6" />}
            {tab === 'evidence' && <BookOpen className="w-6 h-6" />}
            {tab === 'intel'    && <TrendingUp className="w-6 h-6" />}
            <span className="text-label-caps mt-1 tracking-widest">{tab}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
