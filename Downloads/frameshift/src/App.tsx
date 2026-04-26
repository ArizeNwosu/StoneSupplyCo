/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { LayoutDashboard, Video, Scissors, Layers, Settings, Calendar as CalendarIcon, Download, LogOut, Play, Search } from 'lucide-react';
import { cn } from './lib/utils';
import { Button } from './components/ui/Button';
import { useAppContext } from './context/AppContext';

// Placeholder Views
import DashboardView from './views/DashboardView';
import VideosView from './views/VideosView';
import ClipsView from './views/ClipsView';
import TemplatesView from './views/TemplatesView';
import CalendarView from './views/CalendarView';
import DownloadsView from './views/DownloadsView';

export type ViewState = 'dashboard' | 'videos' | 'clips' | 'templates' | 'calendar' | 'downloads';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const { state, dispatch } = useAppContext();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  const navigation = [
    { name: 'Dashboard', value: 'dashboard', icon: LayoutDashboard },
    { name: 'Video Library', value: 'videos', icon: Video },
    { name: 'Extracted Clips', value: 'clips', icon: Scissors },
    { name: 'Templates', value: 'templates', icon: Layers },
    { name: 'Content Calendar', value: 'calendar', icon: CalendarIcon },
    { name: 'Downloads', value: 'downloads', icon: Download },
  ] as const;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView onNavigate={(v) => setCurrentView(v as ViewState)} />;
      case 'videos': return <VideosView onNavigate={(v) => setCurrentView(v as ViewState)} />;
      case 'clips': return <ClipsView />;
      case 'templates': return <TemplatesView onNavigate={(v) => setCurrentView(v as ViewState)} />;
      case 'calendar': return <CalendarView />;
      case 'downloads': return <DownloadsView />;
      default: return <DashboardView onNavigate={(v) => setCurrentView(v as ViewState)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0B0C] text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#111113] hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-indigo-400 mb-8">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">FrameShift</span>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors",
                  currentView === item.value 
                    ? "bg-white/10 text-white" 
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Processing Power</p>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[42%]" />
            </div>
            <p className="text-xs text-gray-500 mt-2">42 hrs remaining this month</p>
          </div>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded text-gray-400 hover:bg-white/10 hover:text-gray-100 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded text-gray-400 hover:bg-white/10 hover:text-gray-100 transition-colors">
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#111113] z-10 shrink-0">

          <div className="flex-1 max-w-xl relative hidden md:block">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search videos, clips, tags..." 
               value={state.searchQuery}
               onChange={handleSearch}
               className="w-full bg-[#0B0B0C] border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-white/20 transition-colors text-white placeholder:text-gray-500"
             />
          </div>

          <div className="flex items-center gap-3 ml-auto pl-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentView('videos')}>
              Upload Video
            </Button>
            <Button variant="neon" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 ml-2"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
