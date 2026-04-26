import React, { useState } from 'react';
import { ViewState } from '../App';
import { Button } from '../components/ui/Button';
import { Clock, Scissors, Video as VideoIcon, Zap, ChevronRight, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import MediaModal from '../components/MediaModal';
import { Variant } from '../types';

interface DashboardViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { state, dispatch } = useAppContext();
  const recentVariants = state.variants.slice(0, 3);
  const processingVideos = state.videos.filter(v => v.status === 'processing');
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPreview = (variant: Variant) => {
    setSelectedVariant(variant);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, Creator</h1>
          <p className="text-gray-400">Here's what your content engine has been generating.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="neon" className="gap-2" onClick={() => onNavigate('videos')}>
            <UploadCloud className="w-4 h-4" />
            Upload New Video
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Source Videos" value={state.videos.length.toString()} icon={<VideoIcon className="w-4 h-4 text-gray-400" />} />
        <StatCard title="Extracted Clips" value={state.clips.length.toString()} icon={<Scissors className="w-4 h-4 text-gray-400" />} />
        <StatCard title="Generated Variants" value={state.variants.length.toString()} icon={<Zap className="w-4 h-4 text-indigo-400 shadow-indigo-600 drop-shadow-md" />} />
        <StatCard title="Hours Saved" value="112" icon={<Clock className="w-4 h-4 text-gray-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Variants or Onboarding */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Ready for Review</h2>
            {recentVariants.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('clips')} className="gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {state.videos.length === 0 ? (
            <div className="bg-[#111113] border border-white/10 p-12 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">Step 1: Upload a Source Video</h2>
              <p className="text-gray-400 max-w-md mb-8">Start by uploading a long-form video. The AI will automatically extract short, reusable clips (B-roll, hooks, interviews) from it.</p>
              <Button variant="neon" size="lg" onClick={() => onNavigate('videos')}>Go to Video Library</Button>
            </div>
          ) : state.variants.length === 0 ? (
            <div className="bg-[#111113] border border-white/10 p-12 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">Step 2: Generate Mixes</h2>
              <p className="text-gray-400 max-w-md mb-8">You have clips ready! Now head over to the Templates section to automatically generate new videos by mixing your clips together.</p>
              <Button variant="neon" size="lg" onClick={() => onNavigate('templates')}>Explore Templates</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentVariants.map(variant => (
                <div key={variant.id} className="group relative bg-[#111113] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer">
                  <div className="aspect-video w-full overflow-hidden bg-[#0B0B0C] relative">
                     {variant.status === 'generating' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600/5">
                           <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                           <span className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase tracking-wider">Compiling Mix...</span>
                        </div>
                     ) : (
                        <img src={variant.thumbnail} alt="variant thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                     )}
                     <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-mono text-gray-300 uppercase tracking-wider border border-white/20">
                       {variant.status}
                     </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-1">Generated Mix #{variant.id.replace('var', '').replace('_', '').slice(-4)}</h3>
                    <p className="text-xs text-gray-500 font-mono">Template: {variant.templateId}</p>
                    
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1" 
                          onClick={(e) => { e.stopPropagation(); openPreview(variant); }}
                          disabled={variant.status === 'generating'}
                        >
                          Preview
                        </Button>
                        {variant.status === 'review' ? (
                           <Button size="sm" className="flex-1 bg-white text-black hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'APPROVE_VARIANT', payload: variant.id }); }}>Approve</Button>
                        ) : (
                           <Button size="sm" variant="outline" className="flex-1" disabled>{variant.status === 'generating' ? '...' : 'Approved'}</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Generate more card */}
              <div 
                onClick={() => onNavigate('templates')}
                className="bg-[#111113] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:border-white/20 transition-colors cursor-pointer min-h-[240px] p-6 text-center"
              >
                <Zap className="w-8 h-8 mb-3 opacity-50" />
                <h3 className="font-medium mb-1">Generate More</h3>
                <p className="text-xs">Select more templates to generate new content variants.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Processing Queue & Calendar Snippet */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Processing Queue</h2>
            <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-4">
               {processingVideos.map(video => (
                 <div key={video.id} className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="truncate max-w-[180px] text-gray-300">{video.title}</span>
                     <span className="text-xs font-mono text-indigo-400 font-medium">Processing...</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${Math.min(video.progress || 0, 100)}%` }} 
                      />
                   </div>
                   <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                     <span>Extracting Scenes</span>
                     <span>{Math.min(video.progress || 0, 100)}%</span>
                   </div>
                 </div>
               ))}
               {processingVideos.length === 0 && (
                 <div className="text-sm text-gray-500 text-center py-4">No active processing jobs.</div>
               )}
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Upcoming</h2>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>Full schedule</Button>
             </div>
             
             <div className="space-y-3">
               {state.variants.filter(v => v.scheduledFor).map(variant => (
                  <div key={variant.id} className="flex gap-3 bg-[#111113] border border-white/10 p-3 rounded-lg hover:border-white/20 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded bg-white/10 overflow-hidden shrink-0">
                      <img src={variant.thumbnail} alt="v" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <p className="text-sm font-medium truncate">Mix #{variant.id.replace('var', '')}</p>
                       <p className="text-xs text-gray-500 capitalize">{format(new Date(variant.scheduledFor!), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
               ))}
             </div>
          </div>

        </div>

      </div>
      <MediaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} variant={selectedVariant} />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-white/10 p-5 rounded-xl flex flex-col justify-between hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  )
}
