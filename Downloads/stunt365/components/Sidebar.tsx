
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'strategy', label: 'THE VISION', icon: 'fa-chess-knight' },
    { id: 'dashboard', label: 'ANALYTICS', icon: 'fa-chart-line' },
    { id: 'planner', label: 'THE GRID', icon: 'fa-calendar-days' },
    { id: 'generator', label: 'HOOK ENGINE', icon: 'fa-wand-magic-sparkles' },
    { id: 'library', label: 'STUNT ARCHIVE', icon: 'fa-film' },
  ];

  return (
    <div className="w-72 bg-black border-r border-zinc-900 h-screen sticky top-0 flex flex-col p-8">
      <div className="mb-12">
        <h1 className="text-4xl oswald taurus-text-gold tracking-tighter leading-none italic font-black">
          STUNT364
        </h1>
        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.4em] font-extrabold mt-2">Rolling Hype Machine</p>
      </div>

      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-5 py-4 transition-all duration-300 ${
              activeTab === item.id
                ? 'bg-zinc-900/40 text-[#C5A059] border-l-2 border-[#C5A059]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/20'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center text-xs`}></i>
            <span className="font-extrabold text-[11px] tracking-[0.2em] uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-6 pt-10">
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-none relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059]/40"></div>
          <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest mb-2 italic">Client Presentation</p>
          <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
            Exclusively prepared for the <br/><span className="text-white font-bold">Taurus World Stunt Awards</span>.
          </p>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.8)]"></div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Digital Ops v1.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
