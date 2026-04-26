import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { type ClipType, Clip } from '../types';
import { Scissors, Filter, Play, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import MediaModal from '../components/MediaModal';

export default function ClipsView() {
  const { state } = useAppContext();
  const [filterType, setFilterType] = useState<ClipType | 'all'>('all');
  const [selectedClip, setSelectedClip] = useState<Clip | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clipTypes: { label: string, value: ClipType | 'all' }[] = [
    { label: 'All Clips', value: 'all' },
    { label: 'Hooks & Interviews', value: 'interview' },
    { label: 'B-Roll', value: 'b-roll' },
    { label: 'Tutorials', value: 'tutorial' },
    { label: 'Reveals', value: 'reveal' },
  ];

  let filteredClips = filterType === 'all' ? state.clips : state.clips.filter(c => c.type === filterType);
  
  if (state.searchQuery) {
    filteredClips = filteredClips.filter(c => 
       c.tags.some(t => t.toLowerCase().includes(state.searchQuery.toLowerCase())) || 
       c.type.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
  }

  const openClipModal = (clip: Clip) => {
    setSelectedClip(clip);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Extracted Clips</h1>
          <p className="text-gray-400">Your atomic library of reusable video segments.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-2">
          {clipTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-colors border",
                filterType === type.value 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-[#0B0B0C] text-gray-400 border-white/10 hover:bg-[#111113] hover:text-gray-300"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredClips.map((clip) => (
          <div key={clip.id} onClick={() => openClipModal(clip)} className="group flex flex-col bg-[#111113] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer">
            <div className="aspect-[9/16] relative bg-[#0B0B0C] overflow-hidden flex-1">
              {clip.thumbnail ? (
                <img src={clip.thumbnail} alt={clip.type} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="w-10 h-10 rounded-full bg-indigo-600/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] transform group-hover:scale-110 transition-transform duration-200">
                   <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>

              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-mono text-gray-300 border border-white/20 uppercase tracking-wider">
                {clip.type}
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono text-gray-300">
                0:{clip.duration.toString().padStart(2, '0')}
              </div>
            </div>
            
            <div className="p-3 border-t border-white/10">
               <div className="flex flex-wrap gap-1 mb-2">
                 {clip.tags.map(tag => (
                   <span key={tag} className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                     {tag}
                   </span>
                 ))}
               </div>
               <div className="flex items-center justify-between mt-2">
                 <span className="text-xs text-gray-500 flex items-center gap-1">
                   <span className={cn(
                     "w-1.5 h-1.5 rounded-full inline-block",
                     clip.visualQuality === 'high' ? "bg-emerald-500" :
                     clip.visualQuality === 'medium' ? "bg-amber-500" : "bg-red-500"
                   )}/>
                   Q: {clip.visualQuality}
                 </span>
               </div>
            </div>
          </div>
        ))}
        
        {/* Empty state for filtered */}
        {filteredClips.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-gray-500">
            <Scissors className="w-8 h-8 mb-4 opacity-50" />
            <p>No clips found for this category or search.</p>
          </div>
        )}
      </div>

      <MediaModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         clip={selectedClip} 
         video={state.videos.find(v => v.id === selectedClip?.videoId)} 
      />
    </div>
  );
}
