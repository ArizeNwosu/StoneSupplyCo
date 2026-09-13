// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import type { AppState, BrandProfile, Concept, GameSpec, StoreConfig } from '../types';

type Action =
  | { type: 'SET_STORE'; payload: StoreConfig }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_BRAND_PROFILE'; payload: BrandProfile }
  | { type: 'SET_GENERATING_CONCEPTS'; payload: boolean }
  | { type: 'SET_CONCEPTS'; payload: Concept[] }
  | { type: 'SELECT_CONCEPT'; payload: Concept }
  | { type: 'SET_BUILDING_SPEC'; payload: boolean }
  | { type: 'SET_GAME_SPEC'; payload: GameSpec }
  | { type: 'UPDATE_GAME_SPEC'; payload: Partial<GameSpec> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FLOW' };

const initialState: AppState = {
  store: null,
  brandProfile: null,
  concepts: [],
  selectedConcept: null,
  gameSpec: null,
  experience: null,
  analyzing: false,
  generatingConcepts: false,
  buildingSpec: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STORE':
      return { ...state, store: action.payload };
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.payload, error: null };
    case 'SET_BRAND_PROFILE':
      return { ...state, brandProfile: action.payload, analyzing: false };
    case 'SET_GENERATING_CONCEPTS':
      return { ...state, generatingConcepts: action.payload };
    case 'SET_CONCEPTS':
      return { ...state, concepts: action.payload, generatingConcepts: false };
    case 'SELECT_CONCEPT':
      return { ...state, selectedConcept: action.payload };
    case 'SET_BUILDING_SPEC':
      return { ...state, buildingSpec: action.payload };
    case 'SET_GAME_SPEC':
      return { ...state, gameSpec: action.payload, buildingSpec: false };
    case 'UPDATE_GAME_SPEC':
      if (!state.gameSpec) return state;
      return {
        ...state,
        gameSpec: {
          ...state.gameSpec,
          ...action.payload,
          branding: action.payload.branding
            ? { ...state.gameSpec.branding, ...action.payload.branding }
            : state.gameSpec.branding,
          intro: action.payload.intro
            ? { ...state.gameSpec.intro, ...action.payload.intro }
            : state.gameSpec.intro,
          reward: action.payload.reward
            ? { ...state.gameSpec.reward, ...action.payload.reward }
            : state.gameSpec.reward,
          result: action.payload.result
            ? { ...state.gameSpec.result, ...action.payload.result }
            : state.gameSpec.result,
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, analyzing: false, generatingConcepts: false, buildingSpec: false };
    case 'RESET_FLOW':
      return { ...initialState, store: state.store };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
