import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Video, Clip, Template, Variant, Download } from '../types';
import { mockTemplates } from '../mockData';

interface AppState {
  videos: Video[];
  clips: Clip[];
  templates: Template[];
  variants: Variant[];
  downloads: Download[];
  searchQuery: string;
  loaded: boolean;
}

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<Pick<AppState, 'videos' | 'clips' | 'templates' | 'variants'>> }
  | { type: 'UPLOAD_VIDEO'; payload: Video }
  | { type: 'FINISH_PROCESSING_VIDEO'; payload: { videoId: string; newClips: Clip[] } }
  | { type: 'ADD_CLIP'; payload: Clip }
  | { type: 'UPDATE_TEMPLATE'; payload: Template }
  | { type: 'DELETE_TEMPLATE_STEP'; payload: { templateId: string; stepIndex: number } }
  | { type: 'ADD_TEMPLATE_STEP'; payload: { templateId: string; step: string; index?: number } }
  | { type: 'MOVE_TEMPLATE_STEP'; payload: { templateId: string; from: number; to: number } }
  | { type: 'ADD_VARIANT'; payload: Variant }
  | { type: 'SCHEDULE_VARIANT'; payload: { variantId: string; date: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPDATE_VIDEO_PROGRESS'; payload: { videoId: string; progress: number } }
  | { type: 'UPDATE_VIDEO_STATUS'; payload: { id: string; status: 'ready' | 'failed'; fileUrl?: string; serverId?: string; thumbnail?: string } }
  | { type: 'UPDATE_VARIANT_STATUS'; payload: { id: string; status: Variant['status']; compositionUrl?: string } }
  | { type: 'UPDATE_CLIP_TAGS'; payload: { clipId: string; tags: string[] } }
  | { type: 'APPROVE_VARIANT'; payload: string }
  | { type: 'BULK_GENERATE_CONTENT'; payload: Variant[] }
  | { type: 'ADD_DOWNLOAD'; payload: Download };

const initialState: AppState = {
  videos: [],
  clips: [],
  templates: mockTemplates,
  variants: [],
  downloads: [],
  searchQuery: '',
  loaded: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return {
        ...state,
        videos: action.payload.videos ?? state.videos,
        clips: action.payload.clips ?? state.clips,
        templates: action.payload.templates?.length ? action.payload.templates : state.templates,
        variants: action.payload.variants ?? state.variants,
        loaded: true,
      };
    case 'UPLOAD_VIDEO':
      return { ...state, videos: [action.payload, ...state.videos] };
    case 'FINISH_PROCESSING_VIDEO':
      return {
        ...state,
        videos: state.videos.map(v => v.id === action.payload.videoId ? { ...v, status: 'ready' } : v),
        clips: [...action.payload.newClips, ...state.clips]
      };
    case 'ADD_CLIP':
      return { ...state, clips: [action.payload, ...state.clips] };
    case 'UPDATE_TEMPLATE':
      return { ...state, templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TEMPLATE_STEP':
      return {
        ...state,
        templates: state.templates.map(t => {
          if (t.id !== action.payload.templateId) return t;
          const steps = [...t.structure];
          steps.splice(action.payload.stepIndex, 1);
          return { ...t, structure: steps };
        })
      };
    case 'ADD_TEMPLATE_STEP':
      return {
        ...state,
        templates: state.templates.map(t => {
          if (t.id !== action.payload.templateId) return t;
          const steps = [...t.structure];
          typeof action.payload.index === 'number'
            ? steps.splice(action.payload.index, 0, action.payload.step)
            : steps.push(action.payload.step);
          return { ...t, structure: steps };
        })
      };
    case 'MOVE_TEMPLATE_STEP':
      return {
        ...state,
        templates: state.templates.map(t => {
          if (t.id !== action.payload.templateId) return t;
          const steps = [...t.structure];
          const [moved] = steps.splice(action.payload.from, 1);
          steps.splice(action.payload.to, 0, moved);
          return { ...t, structure: steps };
        })
      };
    case 'ADD_VARIANT':
      return { ...state, variants: [action.payload, ...state.variants] };
    case 'SCHEDULE_VARIANT':
      return { ...state, variants: state.variants.map(v => v.id === action.payload.variantId ? { ...v, scheduledFor: action.payload.date } : v) };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'UPDATE_VIDEO_PROGRESS':
      return { ...state, videos: state.videos.map(v => v.id === action.payload.videoId ? { ...v, progress: action.payload.progress } : v) };
    case 'UPDATE_VIDEO_STATUS':
      return {
        ...state,
        videos: state.videos.map(v => v.id === action.payload.id ? {
          ...v,
          status: action.payload.status,
          fileUrl: action.payload.fileUrl ?? v.fileUrl,
          serverId: action.payload.serverId ?? v.serverId,
          thumbnail: action.payload.thumbnail ?? v.thumbnail
        } : v)
      };
    case 'UPDATE_VARIANT_STATUS':
      return {
        ...state,
        variants: state.variants.map(v => v.id === action.payload.id ? {
          ...v,
          status: action.payload.status,
          compositionUrl: action.payload.compositionUrl ?? v.compositionUrl
        } : v)
      };
    case 'UPDATE_CLIP_TAGS':
      return { ...state, clips: state.clips.map(c => c.id === action.payload.clipId ? { ...c, tags: action.payload.tags } : c) };
    case 'APPROVE_VARIANT':
      return { ...state, variants: state.variants.map(v => v.id === action.payload ? { ...v, status: 'approved' } : v) };
    case 'BULK_GENERATE_CONTENT':
      return { ...state, variants: [...action.payload, ...state.variants] };
    case 'ADD_DOWNLOAD':
      return { ...state, downloads: [action.payload, ...state.downloads] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    Promise.all([
      fetch('/api/videos').then(r => r.json()).catch(() => []),
      fetch('/api/clips').then(r => r.json()).catch(() => []),
      fetch('/api/templates').then(r => r.json()).catch(() => []),
      fetch('/api/variants').then(r => r.json()).catch(() => []),
    ]).then(([videos, clips, templates, variants]) => {
      dispatch({ type: 'LOAD_STATE', payload: { videos, clips, templates, variants } });
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
