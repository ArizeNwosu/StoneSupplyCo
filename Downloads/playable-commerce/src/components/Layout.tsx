import { useEffect, useRef, useState } from 'react';
import { CreditCard, Gamepad2, LayoutDashboard, Menu, Store, WandSparkles, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', matches: ['/'] },
  { icon: WandSparkles, label: 'Create Experience', path: '/create', matches: ['/create', '/analyze', '/concepts', '/editor', '/targeting'] },
  { icon: Store, label: 'Store Connection', path: '/connect', matches: ['/connect'] },
  { icon: CreditCard, label: 'Billing', path: '/pricing', matches: ['/pricing'] },
];

function WorkspaceSummary() {
  const { state } = useApp();
  const name = state.store?.storeName ?? 'No store connected';
  const initials = state.store ? state.store.storeName.slice(0, 2).toUpperCase() : 'PC';
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">{initials}</div>
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-neutral-900">{name}</p><p className="text-xs text-neutral-500">{state.store ? 'Connected workspace' : 'Setup optional'}</p></div>
    </div>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav aria-label="Primary" className="space-y-1">
      {navItems.map((item) => {
        const active = item.matches.includes(location.pathname);
        const Icon = item.icon;
        return (
          <NavLink key={item.path} to={item.path} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-blue-100', active ? 'bg-blue-50 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950')}>
            <Icon className="mr-3 size-5 shrink-0" aria-hidden="true" />{item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    setMenuOpen(false);
    window.requestAnimationFrame(() => mainRef.current?.focus());
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-neutral-50 font-sans text-neutral-950 lg:flex lg:h-dvh lg:overflow-hidden">
      <a href="#main-content" className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">Skip to content</a>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
        <NavLink to="/" className="flex h-17 items-center border-b border-neutral-100 px-6 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100">
          <span className="mr-2 flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white"><Gamepad2 className="size-5" aria-hidden="true" /></span>
          <span className="text-lg font-bold tracking-tight">Playable</span>
        </NavLink>
        <div className="flex-1 px-3 py-6"><Navigation /></div>
        <div className="border-t border-neutral-200 p-4"><WorkspaceSummary /></div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <NavLink to="/" className="flex items-center rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><span className="mr-2 flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white"><Gamepad2 className="size-5" aria-hidden="true" /></span><span className="font-bold tracking-tight">Playable</span></NavLink>
        <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label="Open navigation" className="flex size-11 items-center justify-center rounded-lg text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-4 focus-visible:ring-blue-100"><Menu className="size-5" aria-hidden="true" /></button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[1px]" />
          <aside id="mobile-navigation" className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl" aria-label="Mobile navigation">
            <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4"><span className="font-bold">Menu</span><button type="button" autoFocus onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="flex size-11 items-center justify-center rounded-lg text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-4 focus-visible:ring-blue-100"><X className="size-5" aria-hidden="true" /></button></div>
            <div className="flex-1 overflow-y-auto p-4"><Navigation onNavigate={() => setMenuOpen(false)} /></div>
            <div className="border-t border-neutral-200 p-4"><WorkspaceSummary /></div>
          </aside>
        </div>
      )}

      <main id="main-content" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden bg-neutral-50 outline-none lg:overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
