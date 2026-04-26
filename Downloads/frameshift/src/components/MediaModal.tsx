import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Play, Pause, SkipForward, SkipBack, Scissors, Layers } from 'lucide-react';
import { Button } from './ui/Button';
import { Video, Clip, Variant } from '../types';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  video?: Video;
  clip?: Clip;
  variant?: Variant;
}

export default function MediaModal({ isOpen, onClose, video, clip, variant }: MediaModalProps) {
  const { state, dispatch } = useAppContext();
  const [newTag, setNewTag] = useState('');
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Reset input when opening a new clip
  useEffect(() => {
    setNewTag('');
    setCurrentClipIndex(0);
  }, [clip?.id, variant?.id]);

  if (!isOpen) return null;

  const title = variant ? `Generated Mix - #${variant.id.replace('var_', '')}` : clip ? `Clip Details - ${clip.id}` : video?.title || 'Video Player';
  
  // Find all clips for the variant to display them
  const variantClips = variant ? variant.clips.map(id => state.clips.find(c => c.id === id)).filter(Boolean) as Clip[] : [];
  
  // Find variant template
  const variantTemplate = variant ? state.templates.find(t => t.id === variant.templateId) : null;
  
  let activeClip = clip;
  if (variant && variantClips.length > 0) {
    activeClip = variantClips[currentClipIndex];
  }

  // Media Fragment URL support handles simulated clip trimming
  let url = video?.fileUrl;
  
  if (variant?.compositionUrl) {
    // If we have a final mix, play that directly
    url = variant.compositionUrl;
  } else if (activeClip) {
    const parentVideo = state.videos.find(v => v.id === activeClip.videoId);
    url = parentVideo?.fileUrl;
    if (url && activeClip.startTime !== undefined) {
       url = `${url}#t=${activeClip.startTime}${activeClip.endTime ? ',' + activeClip.endTime : ''}`;
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeClip || !variant || variant.compositionUrl) return;
    
    // Check if we hit the end of the current clip (only for jumping simulation)
    if (activeClip.endTime && videoRef.current.currentTime >= activeClip.endTime - 0.2) {
       if (currentClipIndex < variantClips.length - 1) {
         setCurrentClipIndex(prev => prev + 1);
       } else {
         videoRef.current.pause(); // stop at end
       }
    }
  };

  const handleApproveVariant = () => {
    if (variant) {
      dispatch({ type: 'APPROVE_VARIANT', payload: variant.id });
      onClose();
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !clip) return;
    
    // Prevent duplicate tags
    if (!clip.tags.includes(newTag.trim().toLowerCase())) {
        dispatch({ 
            type: 'UPDATE_CLIP_TAGS', 
            payload: { clipId: clip.id, tags: [...clip.tags, newTag.trim().toLowerCase()] } 
        });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!clip) return;
    dispatch({ 
        type: 'UPDATE_CLIP_TAGS', 
        payload: { clipId: clip.id, tags: clip.tags.filter(t => t !== tagToRemove) } 
    });
  };

  const isFinalMix = !!variant?.compositionUrl;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className={cn(
        "bg-[#111113] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300",
        isFinalMix ? "w-full max-w-4xl" : "w-full max-w-6xl"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#161618]">
          <div>
            <h2 className="text-lg font-bold text-white truncate pr-4">{title}</h2>
            {isFinalMix && <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Master Composition Ready</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
        
        <div className="flex-1 bg-[#0B0B0C] relative flex flex-col lg:flex-row min-h-[500px]">
          {/* Main Video Area */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0B0B0C] to-[#111113]">
            {url ? (
               <div className={cn(
                 "relative rounded-xl overflow-hidden shadow-2xl bg-black border border-white/5",
                 isFinalMix || variant ? "aspect-[9/16] h-[70vh]" : "aspect-video w-full"
               )}>
                 <video 
                    ref={videoRef}
                    key={url}
                    src={url} 
                    controls 
                    autoPlay 
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full object-contain"
                 />
                 
                 {isFinalMix && (
                    <div className="absolute top-4 left-4 flex gap-2">
                       <div className="px-2 py-1 rounded bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-tighter animate-pulse shadow-lg shadow-indigo-600/50">
                         Final Build
                       </div>
                    </div>
                 )}
               </div>
            ) : (
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <Play className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-sm">Media file not found or still processing...</p>
               </div>
            )}
          </div>
          
          {/* Side Info - ONLY show for individual clips or non-finalized variants */}
          {!isFinalMix && (clip || variant) && (
             <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#111113] p-8 flex flex-col">
                {clip && (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clip Anatomy</h3>
                    </div>
                    
                    <div className="space-y-6 text-sm">
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Category</p>
                          <span className="text-lg text-white font-medium capitalize">{clip.type}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Duration</p>
                            <span className="text-white font-mono">{clip.duration}s</span>
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Quality</p>
                            <span className="text-emerald-400 font-mono uppercase">{clip.visualQuality}</span>
                          </div>
                       </div>

                       <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">AI Context Tags</p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {clip.tags.map(tag => (
                              <span key={tag} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono bg-indigo-500/10 text-indigo-300 pl-2.5 pr-1.5 py-1.5 rounded-full border border-indigo-500/20">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                          <form onSubmit={handleAddTag} className="flex gap-2">
                            <input 
                               type="text" 
                               value={newTag}
                               onChange={(e) => setNewTag(e.target.value)}
                               placeholder="Label..." 
                               className="flex-1 bg-[#0B0B0C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all" 
                            />
                            <Button type="submit" size="sm" variant="outline" className="rounded-lg border-white/10 hover:bg-white/5">
                               <Plus className="w-4 h-4" />
                            </Button>
                          </form>
                       </div>
                    </div>
                  </>
                )}
                
                {variant && !isFinalMix && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Story Timeline</h3>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                       {variantClips.map((c, i) => (
                           <div 
                             key={`${c.id}-${i}`} 
                             onClick={() => setCurrentClipIndex(i)}
                             className={cn(
                               "flex gap-4 p-3 rounded-xl border transition-all cursor-pointer",
                               currentClipIndex === i ? "bg-indigo-500/10 border-indigo-500/30 translate-x-1" : "bg-white/5 border-transparent hover:bg-white/10"
                             )}
                           >
                              <div className="w-16 h-12 bg-black rounded-lg overflow-hidden shrink-0 relative">
                                 <img src={c.thumbnail} className="w-full h-full object-cover" />
                                 {currentClipIndex === i && <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white animate-ping" /></div>}
                              </div>
                              <div className="flex flex-col justify-center min-w-0 flex-1">
                                 <span className="text-[10px] font-mono text-gray-500 uppercase">{variantTemplate?.structure[i] || c.type}</span>
                                 <span className="text-xs font-medium text-white truncate">{c.tags.join(', ') || 'General Clip'}</span>
                              </div>
                           </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>
          )}
          
          {/* Final Mix Summary - Simple and Clean */}
          {isFinalMix && (
            <div className="w-80 border-l border-white/10 bg-[#111113] p-8 flex flex-col justify-between">
               <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                       <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                       LIVE READY
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Composition</p>
                    <p className="text-white text-sm leading-relaxed">Generated via <span className="text-indigo-400 font-mono">"{variantTemplate?.name}"</span> using {variantClips.length} unique segments.</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500">File Format</span>
                        <span className="text-white font-mono">H.264 MP4</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Resolution</span>
                        <span className="text-white font-mono">1080x1920</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <Button
                    variant="neon"
                    className="w-full h-12 rounded-xl text-sm font-bold shadow-indigo-600/20"
                    onClick={() => {
                      if (!variant?.compositionUrl) return;
                      const fileName = `frameshift_${variant.id}.mp4`;
                      const a = document.createElement('a');
                      a.href = variant.compositionUrl;
                      a.download = fileName;
                      a.click();
                      dispatch({
                        type: 'ADD_DOWNLOAD',
                        payload: {
                          id: `dl_${Date.now()}`,
                          variantId: variant.id,
                          fileName,
                          filePath: variant.compositionUrl,
                          fileSize: 0,
                          downloadedAt: new Date().toISOString(),
                        }
                      });
                    }}
                  >
                    Export to Device
                  </Button>
                  <Button variant="outline" onClick={onClose} className="w-full h-12 rounded-xl border-white/10 text-gray-400 text-sm">
                    Back to Dashboard
                  </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
