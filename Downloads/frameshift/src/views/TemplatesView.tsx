import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Layers, Plus, Zap, ArrowRight, Play, Edit2, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Variant } from '../types';

interface TemplatesViewProps {
  onNavigate?: (view: string) => void;
}

export default function TemplatesView({ onNavigate }: TemplatesViewProps) {
  const { state, dispatch } = useAppContext();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newStepText, setNewStepText] = useState('');
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const handleBulkGenerate = () => {
    if (state.clips.length < 5) {
      alert('Upload more videos to have enough clips for a full month of content!');
      return;
    }

    const newVariants: Variant[] = [];
    const startDate = new Date();
    
    // Generate 12 variants (3 per week for 4 weeks)
    for (let i = 0; i < 12; i++) {
      const template = state.templates[i % state.templates.length];
      const selectedClips: string[] = [];
      
      // Select random clips for the template structure
      for (let j = 0; j < template.structure.length; j++) {
        const randomIndex = Math.floor(Math.random() * state.clips.length);
        selectedClips.push(state.clips[randomIndex].id);
      }

      // Schedule: Mon/Wed/Fri logic roughly
      const daysToAdd = Math.floor(i / 3) * 7 + (i % 3 === 0 ? 1 : i % 3 === 1 ? 3 : 5);
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + daysToAdd);
      scheduledDate.setHours(10, 0, 0, 0); // 10 AM

      newVariants.push({
        id: `bulk_var_${Date.now()}_${i}`,
        templateId: template.id,
        clips: selectedClips,
        status: 'scheduled',
        thumbnail: state.clips.find(c => c.id === selectedClips[0])?.thumbnail || '',
        createdAt: new Date().toISOString(),
        scheduledFor: scheduledDate.toISOString()
      });
    }

    dispatch({ type: 'BULK_GENERATE_CONTENT', payload: newVariants });
    
    if (onNavigate) {
      onNavigate('calendar');
    } else {
      alert('Successfully generated 4 weeks of content! Check your calendar.');
    }
  };

  const handleRemoveStep = (templateId: string, stepIndex: number) => {
    dispatch({ type: 'DELETE_TEMPLATE_STEP', payload: { templateId, stepIndex } });
  };

  const handleAddStep = (templateId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (newStepText.trim()) {
      dispatch({ type: 'ADD_TEMPLATE_STEP', payload: { templateId, step: newStepText.trim() } });
      setNewStepText('');
    }
  };

  const handleMoveStep = (templateId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    dispatch({ type: 'MOVE_TEMPLATE_STEP', payload: { templateId, from: fromIndex, to: toIndex } });
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to prevent the dragged element from being instantly hidden if styles change
    setTimeout(() => {
       if (e.target instanceof HTMLElement) {
         e.target.style.opacity = '0.5';
       }
    }, 0);
  };

  const onDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
       e.target.style.opacity = '1';
    }
    setDraggedStepIndex(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, templateId: string, dropIndex: number) => {
    e.preventDefault();
    if (draggedStepIndex !== null && draggedStepIndex !== dropIndex) {
       handleMoveStep(templateId, draggedStepIndex, dropIndex);
    }
  };

  const handleGenerateMix = async (templateId: string) => {
    if (state.clips.length === 0) {
      alert('Please upload a video to extract clips before generating a mix.');
      return;
    }

    setGeneratingFor(templateId);

    const template = state.templates.find(t => t.id === templateId);
    const numClips = template?.structure.length || Math.min(3, state.clips.length);
    const selectedClips: string[] = [];
    const fullClipDetails: any[] = [];

    for (let i = 0; i < numClips; i++) {
      const clip = state.clips[i % state.clips.length];
      selectedClips.push(clip.id);
      fullClipDetails.push(clip);
    }

    const variantId = `var_${Date.now()}`;
    const sourceVideoId = fullClipDetails[0]?.videoId;

    // Immediately add the variant in 'generating' status
    const initialVariant: Variant = {
      id: variantId,
      templateId,
      clips: selectedClips,
      status: 'generating',
      thumbnail: state.clips.find(c => c.id === selectedClips[0])?.thumbnail || '',
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_VARIANT', payload: initialVariant });
    
    if (onNavigate) {
      onNavigate('dashboard');
    }

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            variantId, 
            clips: fullClipDetails,
            sourceVideoId 
        })
      });
      const data = await response.json();

      dispatch({ 
        type: 'UPDATE_VARIANT_STATUS', 
        payload: { 
          id: variantId, 
          status: 'review', 
          compositionUrl: data.videoUrl 
        } 
      });
    } catch (err) {
      console.error("Failed to generate composition:", err);
      dispatch({ 
        type: 'UPDATE_VARIANT_STATUS', 
        payload: { id: variantId, status: 'rejected' } 
      });
    }

    setGeneratingFor(null);
  };

  const filteredTemplates = state.searchQuery 
    ? state.templates.filter(t => t.name.toLowerCase().includes(state.searchQuery.toLowerCase()))
    : state.templates;
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Recipe Templates</h1>
          <p className="text-gray-400">Combine your atomic clips into proven storytelling formats.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="neon" 
            className="gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            onClick={() => handleBulkGenerate()}
            disabled={state.clips.length < 5}
          >
            <Zap className="w-4 h-4 fill-white" />
            Magic: Generate 4 Weeks of Content
          </Button>
          <Button variant="outline" className="gap-2 border-white/10">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const isEditing = editingTemplateId === template.id;

          return (
          <div key={template.id} className="bg-[#111113] border border-white/10 flex flex-col rounded-xl overflow-hidden hover:border-white/20 transition-all group">
             
             <div className="p-6 border-b border-white/10 bg-[#111113]">
               <div className="flex justify-between items-start mb-2">
                 <h2 className="text-xl font-bold tracking-tight">{template.name}</h2>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full z-10"
                    onClick={() => setEditingTemplateId(isEditing ? null : template.id)}
                  >
                    {isEditing ? <Check className="w-4 h-4 text-emerald-500" /> : <Edit2 className="w-4 h-4 text-gray-500 hover:text-white" />}
                  </Button>
               </div>
               <p className="text-sm text-gray-400 min-h-[40px] pr-8">{template.description}</p>
             </div>

             <div className="p-6 flex-1 flex flex-col bg-[#0B0B0C]">
                {isEditing ? (
                  <div className="space-y-3">
                    {template.structure.map((step, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragEnd={onDragEnd}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, template.id, index)}
                        className={`flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${draggedStepIndex === index ? 'bg-indigo-500/20 border-indigo-500/50' : ''}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <button 
                             disabled={index === 0} 
                             onClick={() => handleMoveStep(template.id, index, index - 1)}
                             className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                          ><ChevronUp className="w-3 h-3" /></button>
                          <button 
                             disabled={index === template.structure.length - 1}
                             onClick={() => handleMoveStep(template.id, index, index + 1)}
                             className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                          ><ChevronDown className="w-3 h-3" /></button>
                        </div>
                        <div className="flex-1 text-sm font-mono tracking-wider px-2 text-gray-300 uppercase">{step}</div>
                        <button 
                           onClick={() => handleRemoveStep(template.id, index)} 
                           className="text-red-400/50 hover:text-red-400 p-1 rounded-md"
                        ><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <form onSubmit={(e) => handleAddStep(template.id, e)} className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                      <input 
                        value={newStepText}
                        onChange={e => setNewStepText(e.target.value)}
                        placeholder="New step (e.g. b-roll)..."
                        className="flex-1 bg-[#111113] border border-white/10 rounded-md px-3 py-1.5 text-sm outline-none focus:border-white/20 text-white placeholder:text-gray-600"
                      />
                      <Button type="submit" size="sm" variant="outline" className="border-white/10"><Plus className="w-4 h-4" /></Button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {template.structure.map((step, index) => (
                      <React.Fragment key={index}>
                        <div className="border border-white/20 bg-white/5 px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider text-gray-300">
                          {step}
                        </div>
                        {index < template.structure.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-gray-600" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
             </div>

             <div className="p-4 border-t border-white/10 bg-[#111113] flex justify-between items-center">
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                  <Play className="w-3 h-3" />
                  {template.structure.length} Segments
                </span>
                <Button 
                   size="sm" 
                   variant="outline" 
                   className="gap-2 group-hover:bg-white/20 group-hover:text-white transition-colors"
                   onClick={() => handleGenerateMix(template.id)}
                   disabled={generatingFor === template.id}
                >
                  {generatingFor === template.id ? (
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  {generatingFor === template.id ? 'Generating...' : 'Generate Mix'}
                </Button>
             </div>
          </div>
        )})}

      </div>
    </div>
  );
}
