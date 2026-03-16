import React, { useState, useRef } from 'react';
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, Copy, Download, History, Loader2, Moon, Phone, Search, Settings, Share2, Star, Sun, Trash2, Upload, X, Instagram, ShieldAlert, LifeBuoy, Flag } from 'lucide-react';
import type { ImportPreview } from '../services/exportImport';
import { Tone, SAFE_LINES, Persona, CallScript, Tier, CallPerspective, PracticeSessionSummary } from '../types';
import { Button, Card, CallTypeGrid, ScriptCardSkeleton, ScriptViewSkeleton, cn } from './ui';
import type { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { openInAppBrowser } from '../services/native';
import tiktokIcon from '../../icons/tiktok.svg';

type HomeScreenProps = {
  isDark: boolean;
  nextMilestone: { title: string; icon: string; needed: number } | null;
  currentScript: CallScript | null;
  setView: (view: 'script') => void;
  sortedCallTypes: string[];
  sortMode: 'Random' | 'A-Z';
  setSortMode: React.Dispatch<React.SetStateAction<'Random' | 'A-Z'>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  isPremium: boolean;
  personas: Persona[];
  selectedPersona: Persona | null;
  setSelectedPersona: React.Dispatch<React.SetStateAction<Persona | null>>;
  perspective: CallPerspective;
  setPerspective: React.Dispatch<React.SetStateAction<CallPerspective>>;
  tone: Tone;
  setTone: React.Dispatch<React.SetStateAction<Tone>>;
  loading: boolean;
  generateError?: string | null;
  generateAttempt?: number;
  handleGenerate: () => void;
  expandedSafeLineIndex: number | null;
  toggleSafeLine: (index: number) => void;
};

function CopyButton({ text, isDark }: { text: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className={cn('flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-colors', copied ? 'text-emerald-500' : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function HomeScreen(props: HomeScreenProps) {
  const {
    isDark,
    nextMilestone,
    currentScript,
    setView,
    sortedCallTypes,
    sortMode,
    setSortMode,
    description,
    setDescription,
    isPremium,
    personas,
    selectedPersona,
    setSelectedPersona,
    perspective,
    setPerspective,
    tone,
    setTone,
    loading,
    generateError = null,
    generateAttempt = 0,
    handleGenerate,
    expandedSafeLineIndex,
    toggleSafeLine,
  } = props;

  const handleGeneratePress = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.setTimeout(() => {
      handleGenerate();
    }, 40);
  };

  return (
    <div className="space-y-8 pb-28">
      {nextMilestone && (
        <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors', isDark ? 'bg-[#202926]/80 border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
          <span className="text-xl">{nextMilestone.icon}</span>
          <p className={cn('text-xs flex-1', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
            <span className="font-black">{nextMilestone.needed} more {nextMilestone.needed === 1 ? 'script' : 'scripts'}</span> until you unlock <span className={cn('font-semibold', isDark ? 'text-zinc-200' : 'text-zinc-800')}>{nextMilestone.title}</span>
          </p>
        </div>
      )}

      {currentScript && (
        <div
          onClick={() => setView('script')}
          className={cn('p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all', isDark ? 'bg-[#274136]/45 border-[#527a6c] hover:border-[#7fa091]' : 'bg-[#eef5f1] border-[#bfd2c8] hover:border-[#8fae9e]')}
        >
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-0.5', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')}>Resume Active Script</p>
            <p className={cn('text-sm font-semibold truncate', isDark ? 'text-zinc-200' : 'text-zinc-800')}>{currentScript.description}</p>
          </div>
          <ChevronRight className={cn('w-4 h-4 shrink-0', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')} />
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Select Call Type</h2>
          <div className={cn('flex p-1 rounded-full border transition-colors', isDark ? 'bg-[#202926] border-[#415049]' : 'bg-[#ece5da] border-[#d8cdc0]')}>
            {['Random', 'A-Z'].map((m) => (
              <button key={m} onClick={() => setSortMode(m as 'Random' | 'A-Z')} className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all', sortMode === m ? (isDark ? 'bg-[#f3eee4] text-[#22312b]' : 'bg-[#5d8a7a] text-white') : (isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]'))}>{m}</button>
            ))}
          </div>
        </div>
        <div className={cn('rounded-[1.8rem] border p-3 transition-colors', isDark ? 'bg-[linear-gradient(180deg,#202926_0%,#19211f_100%)] border-[#415049]' : 'bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(247,241,233,0.96)_100%)] border-[#d8cdc0]')}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
            {sortedCallTypes.map((item) => {
              const selected = item === description;
              return (
                <button
                  key={item}
                  onClick={() => setDescription(item)}
                  className={cn(
                    'snap-start shrink-0 rounded-[1.35rem] border px-4 py-3 text-left text-sm font-medium leading-snug transition-all duration-200 min-w-[160px]',
                    selected
                      ? isDark
                        ? 'bg-[linear-gradient(135deg,#f3eee4_0%,#d8cdbf_100%)] border-[#f3eee4] text-[#22312b] shadow-[0_12px_26px_rgba(243,238,228,0.12)]'
                        : 'bg-[linear-gradient(135deg,#22312b_0%,#385046_100%)] border-[#22312b] text-white shadow-[0_14px_28px_rgba(34,49,43,0.16)]'
                      : isDark
                      ? 'bg-[linear-gradient(180deg,#242d2a_0%,#1d2523_100%)] border-[#415049] text-[#dbe3de] hover:border-[#66756f]'
                      : 'bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(247,241,233,0.96)_100%)] border-[#d8cdc0] text-[#22312b] hover:border-[#b7aa96]'
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {isPremium && personas.length > 0 && (
        <section>
          <div className="mb-4 space-y-1.5">
            <h2 className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Your Role for This Call</h2>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
              Choose the version of you this script should speak from. Tone changes how it sounds. Your role changes the point of view.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedPersona(null)} className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all', !selectedPersona ? (isDark ? 'bg-[#f3eee4] text-[#22312b]' : 'bg-[#5d8a7a] text-white') : (isDark ? 'bg-[#202926] text-[#a8b4ae]' : 'bg-[#ece5da] text-[#6f7d75]'))}>My Usual Voice</button>
            {personas.map((p) => (
              <button key={p.id} onClick={() => setSelectedPersona(p)} className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all', selectedPersona?.id === p.id ? (isDark ? 'bg-[#f3eee4] text-[#22312b]' : 'bg-[#5d8a7a] text-white') : (isDark ? 'bg-[#202926] text-[#a8b4ae]' : 'bg-[#ece5da] text-[#6f7d75]'))}>{p.name}</button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Perspective</h2>
          <div className={cn('flex p-1 rounded-xl transition-colors', isDark ? 'bg-[#202926]' : 'bg-[#ece5da]')}>
            <button onClick={() => setPerspective('outgoing')} className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative', perspective === 'outgoing' ? (isDark ? 'bg-[#2d3834] text-white shadow-[0_0_15px_rgba(121,157,139,0.18)]' : 'bg-[#fffdf9] text-[#22312b] shadow-sm') : 'text-[#7e8a84] hover:text-[#5d8a7a]')}>I'm Calling</button>
            <button onClick={() => setPerspective('incoming')} className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative', perspective === 'incoming' ? (isDark ? 'bg-[#2d3834] text-white shadow-[0_0_15px_rgba(121,157,139,0.18)]' : 'bg-[#fffdf9] text-[#22312b] shadow-sm') : 'text-[#7e8a84] hover:text-[#5d8a7a]')}>I'm Answering</button>
          </div>
        </div>

        <h2 className={cn('text-xs font-bold uppercase tracking-widest mb-4 transition-colors', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
          {perspective === 'outgoing' ? 'Describe Your Call' : 'Who is calling and why?'}
        </h2>
        <Card isDark={isDark} className="p-0 overflow-hidden">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder={perspective === 'outgoing' ? 'I need to call my landlord...' : 'My bank is calling about a suspicious charge...'}
            maxLength={500}
            className={cn('w-full h-32 p-6 text-xl bg-transparent focus:outline-none resize-none transition-colors font-medium', isDark ? 'placeholder:text-[#798780] text-white' : 'placeholder:text-[#95a19c] text-[#22312b]')}
          />
          <div className={cn('px-4 pb-2 flex justify-end transition-colors', isDark ? 'bg-transparent' : 'bg-transparent')}>
            <span className={cn('text-[10px] tabular-nums transition-colors', description.length >= 450 ? (description.length >= 500 ? 'text-red-500' : 'text-amber-500') : (isDark ? 'text-[#798780]' : 'text-[#95a19c]'))}>
              {description.length}/500
            </span>
          </div>
          <div className={cn('p-4 border-t flex flex-wrap gap-2 transition-colors', isDark ? 'bg-[#171f1d] border-[#415049]' : 'bg-[#f5efe6] border-[#d8cdc0]')}>
            {(['Professional', 'Assertive', 'Friendly', 'Firm'] as Tone[]).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  tone === t
                    ? (isDark ? 'bg-[#f3eee4] text-[#22312b] shadow-[0_0_20px_rgba(211,223,216,0.18)]' : 'bg-[#5d8a7a] text-white shadow-lg')
                    : (isDark ? 'bg-[#242d2a] text-[#a8b4ae] border border-[#415049] hover:bg-[#2d3834]' : 'bg-[#ece5da] text-[#66756f] border border-[#d8cdc0] hover:bg-[#e3dacd]')
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
        <Button size="xl" variant="primary" isDark={isDark} className="w-full mt-4 h-14 font-bold tracking-tight" disabled={!description.trim() || loading} onClick={handleGeneratePress}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-5 h-5" /> Get Ready for This Call</>}
        </Button>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-1"
          >
            <p className={cn('text-xs text-center font-semibold mb-4', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
              {generateAttempt > 0 ? `Retrying… (attempt ${generateAttempt + 1} of 3)` : 'Crafting your script…'}
            </p>
            <ScriptViewSkeleton isDark={isDark} />
          </motion.div>
        )}

        {!loading && generateError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-4 p-4 rounded-2xl border flex items-start justify-between gap-3',
              isDark ? 'bg-red-950/30 border-red-800/50' : 'bg-red-50 border-red-200'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', isDark ? 'text-red-400' : 'text-red-600')}>
                Generation Failed
              </p>
              <p className={cn('text-sm leading-snug', isDark ? 'text-red-300' : 'text-red-700')}>
                {generateError}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className={cn(
                'shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                isDark ? 'bg-red-900/60 text-red-300 hover:bg-red-800/60' : 'bg-red-100 text-red-700 hover:bg-red-200'
              )}
            >
              Retry
            </button>
          </motion.div>
        )}
      </section>

      <section>
        <h2 className={cn('text-xs font-bold uppercase tracking-widest mb-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Incoming Call Kit</h2>
        <div className="grid grid-cols-1 gap-2">
          {SAFE_LINES.map((line, i) => {
            const expanded = expandedSafeLineIndex === i;
            return (
              <button key={i} onClick={() => toggleSafeLine(i)} className={cn('text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3', expanded ? (isDark ? 'bg-[#274136]/45 border-[#527a6c]' : 'bg-[#eef5f1] border-[#bfd2c8]') : (isDark ? 'bg-[#202926]/80 border-[#415049] hover:border-[#66756f] hover:bg-[#202926]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0] hover:border-[#b7aa96] hover:bg-[#f6f0e8]'))}>
                <div className="flex-1">
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>{line.situation}</p>
                  <p className={cn('font-semibold leading-snug transition-all', expanded ? 'text-xl leading-relaxed' : 'text-sm', isDark ? 'text-zinc-100' : 'text-zinc-900')}>"{line.line}"</p>
                </div>
                {expanded ? <ChevronUp className={cn('w-4 h-4 shrink-0 mt-0.5', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')} /> : <ChevronDown className={cn('w-4 h-4 shrink-0 mt-0.5', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')} />}
              </button>
            );
          })}
        </div>
        <p className={cn('text-[10px] mt-2 text-center', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>Tap any line to expand it for easier reading during the call</p>
      </section>
    </div>
  );
}

type SettingsScreenProps = {
  isDark: boolean;
  activeTab: 'home' | 'history' | 'dashboard';
  setView: (view: 'home' | 'history' | 'dashboard' | 'account') => void;
  supabaseUser: User | null;
  userEmail: string;
  userName: string;
  signOut: () => Promise<unknown>;
  setSupabaseUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  isPremium: boolean;
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  personas: Persona[];
  setSelectedPersona: React.Dispatch<React.SetStateAction<Persona | null>>;
  setShowPersonaModal: React.Dispatch<React.SetStateAction<boolean>>;
  deletePersona: (personaId: string) => void;
  tier: Tier;
  historyLength: number;
  clearHistory: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportFile: (file: File) => Promise<ImportPreview | { error: string }>;
  onImportConfirm: (preview: ImportPreview, mode: 'merge' | 'replace') => void;
};

function SettingItem({ isDark, icon, label, onClick }: { isDark: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 transition-all active:scale-[0.98]',
        isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
      )}
    >
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isDark ? 'bg-zinc-800' : 'bg-zinc-100')}>
        {icon}
      </div>
      <span className={cn('flex-1 text-left font-bold', isDark ? 'text-zinc-200' : 'text-zinc-800')}>{label}</span>
      <ChevronRight className={cn('w-4 h-4', isDark ? 'text-zinc-600' : 'text-zinc-400')} />
    </button>
  );
}

export function SettingsScreen(props: SettingsScreenProps) {
  const {
    isDark,
    activeTab,
    setView,
    supabaseUser,
    userEmail,
    userName,
    signOut,
    setSupabaseUser,
    setUserEmail,
    isPremium,
    setShowUpgradeModal,
    setTheme,
    personas,
    setSelectedPersona,
    setShowPersonaModal,
    deletePersona,
    tier,
    historyLength,
    clearHistory,
    onExportJSON,
    onExportCSV,
    onImportFile,
    onImportConfirm,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportError(null);
    setImportPreview(null);
    const result = await onImportFile(file);
    setImportLoading(false);
    if ('error' in result) {
      setImportError(result.error);
    } else {
      setImportPreview(result);
    }
    e.target.value = '';
  };

  const handleSignOutPress = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setSupabaseUser(null);
    setUserEmail('');
    localStorage.removeItem('callmate_user_email');
    setView('account');

    void signOut().catch((error) => {
      console.error('Sign out failed', error);
    });
  };

  const handleShareCallmate = async () => {
    const shareUrl = 'https://www.trycallmate.app';
    const shareText = 'Callmate helps make hard phone calls easier. Try it here: https://www.trycallmate.app';

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Callmate',
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      window.prompt('Copy this link', shareUrl);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" isDark={isDark} onClick={() => setView(activeTab)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Profile</h3>
          {(supabaseUser || userEmail) ? (
            <Card isDark={isDark} className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5d8a7a] flex items-center justify-center text-white font-black text-lg shrink-0 select-none">
                  {(userName || userEmail || supabaseUser?.email || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{userName || 'Callmate User'}</p>
                  <p className={cn('text-sm truncate', isDark ? 'text-zinc-400' : 'text-zinc-500')}>{userEmail || supabaseUser?.email || ''}</p>
                  <p className={cn('text-xs font-semibold mt-0.5', isDark ? 'text-[#b7d0c4]' : 'text-[#5d8a7a]')}>Cloud account connected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOutPress}
                className={cn('w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors', isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700')}
              >
                Sign Out
              </button>
            </Card>
          ) : (
            <Card isDark={isDark} className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl', isDark ? 'bg-zinc-800' : 'bg-zinc-100')}>👤</div>
                <div>
                  <p className="font-bold">{userName || 'Guest'}</p>
                  <p className={cn('text-sm', isDark ? 'text-zinc-500' : 'text-zinc-400')}>Progress saved locally only</p>
                </div>
              </div>
              <Button className="w-full" isDark={isDark} onClick={() => setView('account')}>
                Create Account or Sign In
              </Button>
            </Card>
          )}
        </section>

        {!isPremium && (
          <Card isDark={isDark} className="!bg-[linear-gradient(135deg,#6f927f_0%,#5d8a7a_45%,#486c60_100%)] !border-none p-6 text-white overflow-hidden relative shadow-[0_24px_48px_rgba(93,138,122,0.24)]">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Complete Your Trial Setup</h3>
              <p className="text-[#f3f8f4] text-sm mb-4">Choose a plan to unlock full access and start your 3-day free trial.</p>
              <Button
                isDark={false}
                className="w-full bg-[linear-gradient(135deg,#22312b_0%,#31463d_100%)] text-white border-none shadow-[0_18px_36px_rgba(34,49,43,0.18)] hover:brightness-[1.03]"
                onClick={() => setShowUpgradeModal(true)}
              >
                Start Free Trial
              </Button>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-20">
              <Star className="w-32 h-32" />
            </div>
          </Card>
        )}

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Display</h3>
          <Card isDark={isDark} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Theme</p>
                <p className="text-zinc-500 text-sm">Switch between light and dark mode</p>
              </div>
              <div className={cn('flex p-1 rounded-2xl transition-colors', isDark ? 'bg-[#171f1d]' : 'bg-[#ece5da]')}>
                <button onClick={() => { setTheme('light'); localStorage.setItem('ringtone_theme', 'light'); }} className={cn('p-2 rounded-xl transition-all', !isDark ? 'bg-[#fffdf9] text-[#22312b] shadow-sm' : 'text-[#97a59f]')}>
                  <Sun className="w-5 h-5" />
                </button>
                <button onClick={() => { setTheme('dark'); localStorage.setItem('ringtone_theme', 'dark'); }} className={cn('p-2 rounded-xl transition-all', isDark ? 'bg-[#2d3834] text-white shadow-sm' : 'text-[#6f7d75]')}>
                  <Moon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <h3 className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Call Roles</h3>
              <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>
                Save different versions of you for different situations, like tenant, patient, manager, or advocate.
              </p>
            </div>
            {isPremium && (
              <button onClick={() => { setSelectedPersona(null); setShowPersonaModal(true); }} className={cn('text-xs font-bold uppercase tracking-widest hover:underline', isDark ? 'text-[#b7d0c4]' : 'text-[#5d8a7a]')}>
                + Add New
              </button>
            )}
          </div>
          <Card isDark={isDark} className="p-4 space-y-3">
            {!isPremium ? (
              <div className="py-4 text-center">
                <p className="text-zinc-500 text-sm mb-3">Saved call roles are a premium feature</p>
                <Button variant="ghost" size="sm" isDark={isDark} onClick={() => setShowUpgradeModal(true)}>Learn More</Button>
              </div>
            ) : personas.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">No saved call roles yet.</p>
            ) : (
              personas.map((p) => (
                <div key={p.id} className={cn('p-4 rounded-2xl border flex items-center justify-between', isDark ? 'bg-[#171f1d] border-[#415049]' : 'bg-[#fffdf9] border-[#d8cdc0]')}>
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{p.context}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedPersona(p); setShowPersonaModal(true); }} className={cn('p-2 transition-colors', isDark ? 'text-[#97a59f] hover:text-[#b7d0c4]' : 'text-[#6f7d75] hover:text-[#5d8a7a]')}>
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePersona(p.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Account & Usage</h3>
          <Card isDark={isDark} className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Current Plan</p>
                <p className="text-zinc-500 text-sm">
                  {tier === 'admin' ? 'Admin Access' : tier === 'annual' ? 'Annual Plan' : tier === 'monthly' ? 'Monthly Plan' : tier === 'trial' ? '3-Day Free Trial' : 'Trial required'}
                </p>
              </div>
              {tier !== 'admin' && (
                <Button variant="outline" size="sm" isDark={isDark} onClick={() => setShowUpgradeModal(true)}>
                  {tier === 'free' ? 'Start Trial' : 'Manage'}
                </Button>
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Data Management</h3>
          <Card isDark={isDark} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Call History</p>
                <p className="text-zinc-500 text-sm">{historyLength} scripts saved locally</p>
              </div>
              <button onClick={clearHistory} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Data &amp; Backup</h3>
          <Card isDark={isDark} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Export All Data</p>
                <p className="text-zinc-500 text-sm">Scripts + reflections as JSON</p>
              </div>
              <button onClick={onExportJSON} className={cn('p-3 rounded-2xl transition-colors', isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-100 hover:bg-zinc-200')}>
                <Download className="w-5 h-5" />
              </button>
            </div>
            <div className={cn('border-t', isDark ? 'border-zinc-700' : 'border-zinc-200')} />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Export Scripts</p>
                <p className="text-zinc-500 text-sm">Scripts only as CSV</p>
              </div>
              <button onClick={onExportCSV} className={cn('p-3 rounded-2xl transition-colors', isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-100 hover:bg-zinc-200')}>
                <Download className="w-5 h-5" />
              </button>
            </div>
            <div className={cn('border-t', isDark ? 'border-zinc-700' : 'border-zinc-200')} />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Import Backup</p>
                <p className="text-zinc-500 text-sm">Restore from .json file</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className={cn('p-3 rounded-2xl transition-colors', isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-100 hover:bg-zinc-200')}
              >
                {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
            </div>
            {importError && (
              <p className="text-red-500 text-sm">{importError}</p>
            )}
            {importPreview && (
              <div className={cn('rounded-2xl p-4 space-y-3', isDark ? 'bg-zinc-700' : 'bg-zinc-100')}>
                <p className="font-bold">Found {importPreview.scripts.length} scripts and {importPreview.reflections.length} reflections</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onImportConfirm(importPreview, 'merge'); setImportPreview(null); }}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm"
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => { onImportConfirm(importPreview, 'replace'); setImportPreview(null); }}
                    className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => setImportPreview(null)}
                    className={cn('px-3 py-2 rounded-xl font-bold text-sm', isDark ? 'bg-zinc-600 text-zinc-300' : 'bg-zinc-200 text-zinc-600')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Community & Support</h3>
          <Card isDark={isDark} className="p-2 overflow-hidden">
            <SettingItem
              isDark={isDark}
              icon={<Star className="w-4 h-4 text-amber-400" />}
              label="Rate Callmate"
              onClick={() => {}}
            />
            <div className={cn('mx-4 border-t', isDark ? 'border-zinc-800' : 'border-zinc-100')} />
            <SettingItem
              isDark={isDark}
              icon={<Share2 className="w-4 h-4 text-blue-400" />}
              label="Share Callmate"
              onClick={() => { void handleShareCallmate(); }}
            />
            <div className={cn('mx-4 border-t', isDark ? 'border-zinc-800' : 'border-zinc-100')} />
            <SettingItem
              isDark={isDark}
              icon={<Instagram className="w-4 h-4 text-pink-500" />}
              label="Follow us on IG"
              onClick={() => { void openInAppBrowser('https://www.instagram.com/trycallmate'); }}
            />
            <div className={cn('mx-4 border-t', isDark ? 'border-zinc-800' : 'border-zinc-100')} />
            <SettingItem
              isDark={isDark}
              icon={
                <img
                  src={tiktokIcon}
                  alt=""
                  aria-hidden="true"
                  className={cn('w-4 h-4 object-contain', isDark ? 'brightness-0 invert' : 'brightness-0')}
                />
              }
              label="Follow us on TT"
              onClick={() => { void openInAppBrowser('https://www.tiktok.com/@callmate'); }}
            />
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Help & Legal</h3>
          <Card isDark={isDark} className="p-2 overflow-hidden">
            <SettingItem
              isDark={isDark}
              icon={<ShieldAlert className="w-4 h-4 text-purple-400" />}
              label="Disclaimer"
              onClick={() => { void openInAppBrowser('https://www.trycallmate.app/disclaimer.html'); }}
            />
            <div className={cn('mx-4 border-t', isDark ? 'border-zinc-800' : 'border-zinc-100')} />
            <SettingItem
              isDark={isDark}
              icon={<LifeBuoy className="w-4 h-4 text-emerald-400" />}
              label="Support"
              onClick={() => { void openInAppBrowser('https://www.trycallmate.app/support.html'); }}
            />
            <div className={cn('mx-4 border-t', isDark ? 'border-zinc-800' : 'border-zinc-100')} />
            <SettingItem
              isDark={isDark}
              icon={<Flag className="w-4 h-4 text-red-400" />}
              label="Report Abuse"
              onClick={() => { void openInAppBrowser('https://www.trycallmate.app/abuse.html'); }}
            />
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className={cn('text-xs font-bold uppercase tracking-widest px-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>App Info</h3>
          <div className="px-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Version</span>
              <span className={cn('font-mono transition-colors', isDark ? 'text-zinc-300' : 'text-zinc-700')}>2.1.0-hybrid</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Build</span>
              <span className={cn('font-mono transition-colors', isDark ? 'text-zinc-300' : 'text-zinc-700')}>2026.03.08</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type DashboardScreenProps = {
  isDark: boolean;
  historyLength: number;
  recoveryScore: number;
  callStreak: number;
  callAnxietyRatings: Array<{ rating: number }>;
  practiceSessions: PracticeSessionSummary[];
  milestones: Array<{ id: string; icon: string; title: string }>;
  unlockedMilestones: Set<string>;
  anxietySeverity: string;
  lifeImpact: string[];
};

export function DashboardScreen(props: DashboardScreenProps) {
  const {
    isDark,
    historyLength,
    recoveryScore,
    callStreak,
    callAnxietyRatings,
    practiceSessions,
    milestones,
    unlockedMilestones,
    anxietySeverity,
    lifeImpact,
  } = props;
  const recentPracticeSessions = practiceSessions.slice(-6);
  const recentActualCalls = callAnxietyRatings.slice(-6);
  const practiceChartPoints = recentPracticeSessions.map((entry, index, array) => {
    const x = array.length === 1 ? 126 : (index / (array.length - 1)) * 252;
    const y = 72 - (Math.max(0, Math.min(entry.confidenceScore, 100)) / 100) * 62;
    return { x, y };
  });
  const actualChartPoints = recentActualCalls.map((entry, index, array) => {
    const x = array.length === 1 ? 126 : (index / (array.length - 1)) * 252;
    const confidenceScore = Math.max(0, Math.min((6 - entry.rating) * 20, 100));
    const y = 72 - (confidenceScore / 100) * 62;
    return { x, y };
  });
  const practicePath = practiceChartPoints.reduce((path, point, index) => (
    index === 0 ? `M ${point.x},${point.y}` : `${path} L ${point.x},${point.y}`
  ), '');
  const actualPath = actualChartPoints.reduce((path, point, index) => (
    index === 0 ? `M ${point.x},${point.y}` : `${path} L ${point.x},${point.y}`
  ), '');
  const practiceAreaPath = practicePath ? `${practicePath} L ${practiceChartPoints[practiceChartPoints.length - 1]?.x ?? 252},72 L ${practiceChartPoints[0]?.x ?? 0},72 Z` : '';
  const latestConfidence = practiceSessions.length > 0 ? practiceSessions[practiceSessions.length - 1].confidenceScore : null;
  const averageConfidence = practiceSessions.length > 0
    ? Math.round(practiceSessions.slice(-5).reduce((sum, session) => sum + session.confidenceScore, 0) / Math.min(practiceSessions.length, 5))
    : null;
  const averageActualConfidence = callAnxietyRatings.length > 0
    ? Math.round(callAnxietyRatings.slice(-5).reduce((sum, entry) => sum + ((6 - entry.rating) * 20), 0) / Math.min(callAnxietyRatings.length, 5))
    : null;
  const latestActualConfidence = callAnxietyRatings.length > 0 ? (6 - callAnxietyRatings[callAnxietyRatings.length - 1].rating) * 20 : null;
  const convergenceGap = latestConfidence !== null && latestActualConfidence !== null
    ? Math.abs(latestConfidence - latestActualConfidence)
    : null;
  const trendLabel = practiceSessions.length < 2
    ? 'First practice score logged'
    : latestConfidence !== null && latestConfidence >= 80
      ? 'Strong recent practice confidence'
      : latestConfidence !== null && latestConfidence >= 65
        ? 'Confidence is trending up'
        : 'Confidence is still building';

  return (
    <div className="space-y-5 pb-32">
      <div>
        <p className={cn('text-sm', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
          {historyLength === 0 ? 'Complete your first call to start tracking.' : `${historyLength} call${historyLength !== 1 ? 's' : ''} logged · telephobia recovery in progress`}
        </p>
      </div>

      <div className={cn('rounded-3xl border p-5 transition-colors', isDark ? 'bg-[#202926] border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Recovery Score</p>
            <p className={cn('text-6xl font-black tabular-nums', recoveryScore >= 60 ? 'text-[#9fc0b0]' : recoveryScore >= 30 ? 'text-[#d8b278]' : 'text-[#95a19c]')}>{recoveryScore}</p>
          </div>
          <div className="text-right">
            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Streak</p>
            <p className={cn('text-3xl font-black', callStreak > 0 ? 'text-[#d8b278]' : 'text-[#95a19c]')}>
              {callStreak > 0 ? '🔥' : '—'} {callStreak > 0 ? callStreak : 0}
            </p>
          </div>
        </div>
        <div className={cn('h-2.5 rounded-full overflow-hidden', isDark ? 'bg-[#171f1d]' : 'bg-[#e7ddd0]')}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${recoveryScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn('h-full rounded-full', recoveryScore >= 60 ? 'bg-[#7b9d76]' : recoveryScore >= 30 ? 'bg-[#d8b278]' : 'bg-[#95a19c]')}
          />
        </div>
        <p className={cn('text-xs mt-2', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>
          {recoveryScore === 0 ? 'Complete your first call to begin.' : recoveryScore < 30 ? 'Early days - every call counts.' : recoveryScore < 60 ? "You're making real progress." : 'Significant improvement detected.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Calls Scripted', value: historyLength, color: 'text-blue-400' },
          { label: 'Practice Calls', value: practiceSessions.length, color: 'text-emerald-400' },
          { label: 'Avg Confidence', value: averageConfidence !== null ? `${averageConfidence}/${averageActualConfidence ?? '—'}` : '—', color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className={cn('rounded-2xl border p-4 text-center transition-colors', isDark ? 'bg-[#202926] border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
            <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
            <p className={cn('text-[9px] font-bold uppercase tracking-widest mt-1 leading-tight', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className={cn('rounded-3xl border p-5 transition-colors', isDark ? 'bg-[#202926] border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
        <p className={cn('text-[10px] font-black uppercase tracking-widest mb-4', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Confidence Correlation</p>
        <div className="flex gap-5 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] rounded-full bg-[#7b9d76]" />
            <p className={cn('text-xs font-semibold', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>Practice calls</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-[4px]" viewBox="0 0 32 4" aria-hidden="true">
              <line
                x1="0"
                y1="2"
                x2="32"
                y2="2"
                stroke={isDark ? '#d4d4d8' : '#1f2937'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
            <p className={cn('text-xs font-semibold', isDark ? 'text-[#b7c3bd]' : 'text-[#66756f]')}>Actual calls</p>
          </div>
        </div>
        {practiceSessions.length === 0 && callAnxietyRatings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-4xl">📉</p>
            <p className={cn('text-sm text-center', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Complete a simulated call or log a real call to start tracking confidence here.</p>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox="0 0 252 92" className="w-full" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="progressLineGradMuted" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={isDark ? '#d4d4d8' : '#1f2937'} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={isDark ? '#71717a' : '#52525b'} stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="progressLineGradActive" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8ca79a" />
                  <stop offset="55%" stopColor="#7b9d76" />
                  <stop offset="100%" stopColor="#5d8a7a" />
                </linearGradient>
                <linearGradient id="progressFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7b9d76" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#7b9d76" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[18, 40, 62].map((y) => (
                <line key={y} x1="0" y1={y} x2="252" y2={y} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
              ))}
              {practiceAreaPath && <path d={practiceAreaPath} fill="url(#progressFillGrad)" />}
              {actualPath && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke="url(#progressLineGradMuted)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 4"
                />
              )}
              {practicePath && (
                <path
                  d={practicePath}
                  fill="none"
                  stroke="url(#progressLineGradActive)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {actualChartPoints.map((point, index) => (
                <circle
                  key={`actual-${point.x}-${point.y}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.2"
                  fill={isDark ? '#161d1b' : '#ffffff'}
                  stroke={isDark ? '#d4d4d8' : '#1f2937'}
                  strokeWidth="1.3"
                />
              ))}
              {practiceChartPoints.map((point, index) => (
                <circle
                  key={`practice-${point.x}-${point.y}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.6"
                  fill={isDark ? '#161d1b' : '#ffffff'}
                  stroke={index === practiceChartPoints.length - 1 ? '#7b9d76' : (isDark ? '#7b8580' : '#5f6d67')}
                  strokeWidth={index === practiceChartPoints.length - 1 ? '1.8' : '1.4'}
                />
              ))}
              <text x="0" y="86" fontSize="10" fill={isDark ? '#a1a1aa' : '#6b7280'}>Earlier</text>
              <text x="220" y="86" fontSize="10" fill={isDark ? '#a1a1aa' : '#6b7280'}>Recent</text>
            </svg>
          </div>
        )}
        {practiceSessions.length + callAnxietyRatings.length === 1 && (
          <p className={cn('text-xs mt-2 text-center', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>You have your first confidence datapoint. Add another practice or real call to see the trend line.</p>
        )}
        {(practiceSessions.length > 1 || callAnxietyRatings.length > 1) && (
          <p className={cn('text-xs mt-3 text-center leading-relaxed', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>
            <span className={cn('font-bold', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>{trendLabel}.</span>{' '}
            {convergenceGap !== null
              ? `The current gap between practice and actual confidence is ${convergenceGap} points. The goal is for both lines to keep rising until that gap narrows.`
              : 'Practice and actual confidence are plotted together so you can see whether real calls are catching up to practice.'}
          </p>
        )}
      </div>

      <div className={cn('rounded-3xl border p-5 transition-colors', isDark ? 'bg-[#202926] border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
        <p className={cn('text-[10px] font-black uppercase tracking-widest mb-4', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Milestones</p>
        <div className="grid grid-cols-3 gap-3">
          {milestones.map((m) => {
            const unlocked = unlockedMilestones.has(m.id);
            return (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all',
                  unlocked
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 opacity-100 scale-100' : 'bg-emerald-50 border-emerald-200 opacity-100 scale-100'
                    : isDark ? 'bg-zinc-800/40 border-zinc-800 opacity-35 scale-[0.97]' : 'bg-zinc-100 border-zinc-200 opacity-35 scale-[0.97]'
                )}
              >
                <span className="text-2xl">{unlocked ? m.icon : '🔒'}</span>
                <p className={cn('text-[9px] font-bold leading-tight uppercase tracking-wide', unlocked ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-zinc-600')}>{m.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {anxietySeverity && (
        <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-[#202926]/80 border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
          <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Your Starting Point</p>
          <p className={cn('text-sm font-semibold capitalize', isDark ? 'text-white' : 'text-black')}>{anxietySeverity} telephobia</p>
          {lifeImpact.length > 0 && <p className={cn('text-xs mt-1', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>Focus areas: {lifeImpact.join(' · ')}</p>}
        </div>
      )}
    </div>
  );
}

type HistoryScreenProps = {
  isDark: boolean;
  currentScript: CallScript | null;
  setView: (view: 'script') => void;
  isPremium: boolean;
  isLoading?: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredHistory: CallScript[];
  setCurrentScript: React.Dispatch<React.SetStateAction<CallScript | null>>;
  setPreviousView: React.Dispatch<React.SetStateAction<'home' | 'history'>>;
  toggleStar: (id: string) => void;
  starredScripts: string[];
};

export function HistoryScreen(props: HistoryScreenProps) {
  const {
    isDark,
    currentScript,
    setView,
    isPremium,
    isLoading = false,
    searchQuery,
    setSearchQuery,
    filteredHistory,
    setCurrentScript,
    setPreviousView,
    toggleStar,
    starredScripts,
  } = props;

  return (
    <div className="space-y-5 pb-28">
      <div className="flex flex-col gap-6 mb-12 px-2 relative z-[100]">
        <div className="flex items-center justify-between">
          {currentScript && (
            <Button variant="outline" size="sm" isDark={isDark} onClick={() => setView('script')}>
              <ArrowLeft className="w-4 h-4" /> Active Script
            </Button>
          )}
        </div>

        {currentScript && (
          <div
            onClick={() => setView('script')}
            className={cn('p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all', isDark ? 'bg-[#274136]/45 border-[#527a6c] hover:border-[#7fa091]' : 'bg-[#eef5f1] border-[#bfd2c8] hover:border-[#8fae9e]')}
          >
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-bold uppercase tracking-widest mb-0.5', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')}>Active Script</p>
              <p className={cn('text-sm font-semibold truncate', isDark ? 'text-zinc-200' : 'text-zinc-800')}>{currentScript.description}</p>
            </div>
            <ChevronRight className={cn('w-4 h-4 shrink-0', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')} />
          </div>
        )}

        {isPremium && (
          <div className={cn('relative flex items-center transition-colors', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
            <Search className="absolute left-4 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none transition-all', isDark ? 'bg-[#202926] border-[#415049] focus:border-[#7b9d76]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0] focus:border-[#7b9d76]')}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((k) => (
            <ScriptCardSkeleton key={k} isDark={isDark} />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className={cn('py-20 text-center space-y-4 rounded-[2.5rem] border relative z-10 transition-colors', isDark ? 'bg-[#202926]/60 border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors', isDark ? 'bg-[#171f1d]' : 'bg-[#ece5da]')}>
            <History className="w-8 h-8 text-zinc-500" />
          </div>
          <p className={cn(isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>{searchQuery ? 'No matches found.' : 'No scripts generated yet.'}</p>
        </div>
      ) : (
        filteredHistory.map((s, i) => {
          const colors = ['bg-[#d9d0bf]', 'bg-[#b9cdbc]', 'bg-[#ddc3a7]', 'bg-[#cdb6a6]', 'bg-[#c2d1d4]', 'bg-[#d8cfe0]'];
          const bgColor = colors[i % colors.length];
          return (
            <div
              key={s.id}
              onClick={() => {
                setCurrentScript(s);
                setPreviousView('history');
                setView('script');
              }}
            className={cn('relative p-8 rounded-[2.5rem] cursor-pointer shadow-[0_12px_32px_rgba(40,34,28,0.14)] transition-all hover:-translate-y-1 active:scale-[0.98] group min-h-[220px]', bgColor, 'text-black')}
              style={{ zIndex: i + 1 }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 flex-1">
                  <h3 className="text-2xl font-bold tracking-tight leading-snug line-clamp-2">{s.description}</h3>
                  <p className="text-black/50 font-medium text-sm mt-1">{s.tone} Call</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-xl font-bold leading-none">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                  <div className="text-black/30 text-xs font-bold mt-1">{new Date(s.timestamp).toLocaleDateString('de-DE')}</div>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toggleStar(s.id); }}>
                  <Star className={cn('w-5 h-5', starredScripts.includes(s.id) ? 'text-amber-500 fill-amber-500' : 'text-black/40')} />
                </div>
              </div>
            </div>
          );
        })
      )}
      <div className="h-40" />
    </div>
  );
}

type ScriptScreenProps = {
  isDark: boolean;
  currentScript: CallScript;
  isMedicalCall: boolean;
  showMedicalPrep: boolean;
  onHideMedicalPrep: () => void;
  showSpeakerPrompt: boolean;
  setShowSpeakerPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  previousView: 'home' | 'history';
  setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'history' | 'dashboard'>>;
  setView: (view: 'home' | 'history') => void;
  isPremium: boolean;
  handleSimulateCall: () => void;
  isLaunchingSimulator: boolean;
  toggleStar: (id: string) => void;
  starredScripts: string[];
  handleShare: () => void;
  shareToast: boolean;
  showAlterEgo: boolean;
  setShowAlterEgo: React.Dispatch<React.SetStateAction<boolean>>;
  handleVoicemail: () => void;
  handleEmailFallback: () => void;
  voicemailScript: string;
  emailFallback: string;
  isRewriting: boolean;
  setTone: React.Dispatch<React.SetStateAction<Tone>>;
  handleGenerate: (overrideTone?: Tone) => void;
  scriptSections: React.ReactNode;
  onShowPreCallCheck: () => void;
  onShowReflectionPrompt: () => void;
  onShowPanicPanel: () => void;
};

export function ScriptScreen(props: ScriptScreenProps) {
  const {
    isDark,
    currentScript,
    isMedicalCall,
    showMedicalPrep,
    onHideMedicalPrep,
    showSpeakerPrompt,
    setShowSpeakerPrompt,
    previousView,
    setActiveTab,
    setView,
    isPremium,
    handleSimulateCall,
    isLaunchingSimulator,
    toggleStar,
    starredScripts,
    handleShare,
    shareToast,
    showAlterEgo,
    setShowAlterEgo,
    handleVoicemail,
    handleEmailFallback,
    voicemailScript,
    emailFallback,
    isRewriting,
    setTone,
    handleGenerate,
    scriptSections,
    onShowPreCallCheck,
    onShowReflectionPrompt,
    onShowPanicPanel,
  } = props;

  return (
    <div className="space-y-6 pt-8">
      {isMedicalCall && showMedicalPrep && (
        <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-[#203039]/70 border-[#4f7588]' : 'bg-[#eef5fb] border-[#c7d9e8]')}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🏥</span>
              <p className={cn('text-xs font-black uppercase tracking-widest', isDark ? 'text-[#9ac7df]' : 'text-[#557f99]')}>Medical Call Prep</p>
            </div>
            <button
              type="button"
              onClick={onHideMedicalPrep}
              className={cn('shrink-0 p-1 rounded-full transition-colors', isDark ? 'text-[#89a2ad] hover:text-[#d7e5ea] hover:bg-white/5' : 'text-[#6d7f88] hover:text-[#3f5561] hover:bg-black/5')}
              aria-label="Close medical call prep"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {[
              'Write down your symptoms and when they started',
              'Have your insurance card and pharmacy info ready',
              'Note any current medications or allergies',
              'State your main concern clearly in the first sentence',
              "It's okay to ask them to repeat or slow down - they're used to it",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={cn('w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5', isDark ? 'border-[#6e96ac]' : 'border-[#9ebbd0]')}>
                  <span className={cn('text-[9px] font-black', isDark ? 'text-[#9ac7df]' : 'text-[#557f99]')}>{i + 1}</span>
                </div>
                <p className={cn('text-xs leading-snug', isDark ? 'text-[#d8e3e8]' : 'text-[#425863]')}>{tip}</p>
              </div>
            ))}
          </div>
          <p className={cn('text-[10px] mt-3 leading-relaxed', isDark ? 'text-[#89a2ad]' : 'text-[#6d7f88]')}>They deal with these calls all day. You are not bothering them.</p>
        </div>
      )}

      {showSpeakerPrompt && (
        <div className={cn('rounded-2xl border p-4 flex items-start justify-between gap-3 transition-colors', isDark ? 'bg-[#264138]/45 border-[#527a6c]' : 'bg-[#eef5f1] border-[#bfd2c8]')}>
          <div>
            <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')}>Put it on speaker</p>
            <p className={cn('text-sm leading-snug', isDark ? 'text-[#dbe3de]' : 'text-[#425863]')}>Both hands free to read and type during the call. Screen stays on.</p>
          </div>
          <button onClick={() => setShowSpeakerPrompt(false)} className={cn('shrink-0 mt-0.5 transition-colors', isDark ? 'text-[#89a2ad] hover:text-[#d7e5ea]' : 'text-[#6d7f88] hover:text-[#3f5561]')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" isDark={isDark} onClick={() => { setActiveTab(previousView); setView(previousView); }}>
          <ArrowLeft className="w-4 h-4" /> {previousView === 'history' ? 'History' : 'Home'}
        </Button>
        <div className="flex gap-2">
          {isPremium && (
            <Button variant="outline" size="sm" isDark={isDark} onClick={handleSimulateCall} className={cn(isLaunchingSimulator && 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500')}>
              {isLaunchingSimulator ? <Loader2 className="animate-spin w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="outline" size="sm" isDark={isDark} onClick={() => toggleStar(currentScript.id)} className={cn(starredScripts.includes(currentScript.id) && 'bg-amber-500/20 border-amber-500/50 text-amber-500')}>
            <Star className={cn('w-4 h-4', starredScripts.includes(currentScript.id) && 'fill-current')} />
          </Button>
          <Button variant="outline" size="sm" isDark={isDark} onClick={handleShare} className={cn(shareToast && 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500')}>
            {shareToast ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className={cn('rounded-3xl border p-5 transition-colors', isDark ? 'bg-[linear-gradient(180deg,#202926_0%,#19211f_100%)] border-[#415049]' : 'bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(245,239,230,0.96)_100%)] border-[#d8cdc0]')}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn('text-lg font-bold leading-snug flex-1', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>{currentScript.description}</p>
          <span
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
              currentScript.tone === 'Professional' ? (isDark ? 'bg-[#304c57] border-[#4f7588] text-[#9ac7df]' : 'bg-[#eef5fb] border-[#c7d9e8] text-[#557f99]')
                : currentScript.tone === 'Assertive' ? (isDark ? 'bg-[#4b3a1f] border-[#9b7a37] text-[#dfc090]' : 'bg-[#f6eddc] border-[#ddc8a5] text-[#a17e4d]')
                : currentScript.tone === 'Friendly' ? (isDark ? 'bg-[#274136] border-[#527a6c] text-[#b9d5c8]' : 'bg-[#eef5f1] border-[#bfd2c8] text-[#5d8a7a]')
                : (isDark ? 'bg-[#4c2d34] border-[#8a4f5d] text-[#e0b7c0]' : 'bg-[#f8ecef] border-[#e3c1ca] text-[#a25d6d]')
            )}
          >
            {currentScript.tone}
          </span>
        </div>
      </div>

      <div className={cn('rounded-3xl border overflow-hidden transition-all', showAlterEgo ? (isDark ? 'bg-[#2b233f] border-[#7867a7]' : 'bg-[#f1edfb] border-[#d7cef2]') : (isDark ? 'bg-[linear-gradient(180deg,#202926_0%,#19211f_100%)] border-[#415049]' : 'bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(245,239,230,0.96)_100%)] border-[#d8cdc0]'))}>
        <button onClick={() => setShowAlterEgo((p) => !p)} className="w-full flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎭</span>
            <div>
              <p className={cn('text-sm font-bold', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>Alter Ego Mode</p>
              <p className={cn('text-xs', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>{showAlterEgo ? 'You are Alex - confident caller' : "Pretend you're someone else"}</p>
            </div>
          </div>
          <div className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', showAlterEgo ? 'bg-[#7867a7]' : (isDark ? 'bg-[#4a5a53]' : 'bg-[#d8cdc0]'))}>
            <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: `translateX(${showAlterEgo ? 22 : 2}px)` }} />
          </div>
        </button>
        {showAlterEgo && (
          <div className={cn('mx-4 mb-4 p-4 rounded-2xl border', isDark ? 'bg-[#34294b] border-[#7867a7]/50' : 'bg-[#f1edfb] border-[#d7cef2]')}>
            <p className={cn('text-sm font-bold mb-1', isDark ? 'text-[#d8cff4]' : 'text-[#5b4a87]')}>You are Alex Stone.</p>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#c9bee8]' : 'text-[#6d5c98]')}>
              A confident public speaker who makes phone calls every single day. Calls are just conversations - you start them, guide them, and end them on your terms. This is just another call.
            </p>
          </div>
        )}
      </div>

      {isPremium && (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" isDark={isDark} className="flex-1" onClick={handleVoicemail}>
            Voicemail Script
          </Button>
          <Button variant="outline" size="sm" isDark={isDark} className="flex-1" onClick={handleEmailFallback}>
            Email Fallback
          </Button>
        </div>
      )}

      {voicemailScript && (
        <Card isDark={isDark} className={cn(isDark ? 'bg-[#274136]/45 border-[#527a6c]' : 'bg-[#eef5f1] border-[#bfd2c8]')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Voicemail Script</p>
            <CopyButton text={voicemailScript} isDark={isDark} />
          </div>
          <p className={cn('text-lg italic leading-relaxed', isDark ? 'text-[#e2efe8]' : 'text-[#365347]')}>"{voicemailScript}"</p>
        </Card>
      )}

      {emailFallback && (
        <Card isDark={isDark} className={cn(isDark ? 'bg-[#203039]/70 border-[#4f7588]' : 'bg-[#eef5fb] border-[#c7d9e8]')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Follow-up Email</p>
            <CopyButton text={emailFallback} isDark={isDark} />
          </div>
          <p className={cn('text-lg italic leading-relaxed whitespace-pre-wrap', isDark ? 'text-[#d8e3e8]' : 'text-[#425863]')}>{emailFallback}</p>
        </Card>
      )}

      <div className={cn('border rounded-3xl p-4 flex flex-col gap-3 transition-colors', isDark ? 'bg-[linear-gradient(180deg,#202926_0%,#19211f_100%)] border-[#415049]' : 'bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(245,239,230,0.96)_100%)] border-[#d8cdc0]')}>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-bold uppercase tracking-widest', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Adjust Tone</span>
          {isRewriting && <Loader2 className="animate-spin" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Professional', 'Assertive', 'Friendly', 'Firm'] as Tone[]).map((t) => (
            <button
              key={t}
              disabled={isRewriting}
              onClick={() => {
                setTone(t);
                handleGenerate(t);
              }}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all', currentScript.tone === t ? (isDark ? 'bg-[#f3eee4] text-[#22312b]' : 'bg-[#5d8a7a] text-white') : (isDark ? 'bg-[#242d2a] text-[#a8b4ae] border border-[#415049] hover:bg-[#2d3834]' : 'bg-[#ece5da] text-[#66756f] border border-[#d8cdc0] hover:bg-[#e3dacd]'))}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('flex items-start gap-3 px-4 py-3 rounded-2xl border transition-colors', isDark ? 'bg-[#202926]/80 border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
        <span className="text-base shrink-0 mt-0.5">💙</span>
        <p className={cn('text-xs leading-relaxed', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
          The person on the other line is <span className={isDark ? 'text-[#f6f2ea] font-semibold' : 'text-[#22312b] font-semibold'}>not annoyed at you</span>. They're just doing their job - same as you.
        </p>
      </div>

      {scriptSections}

      <div className="fixed bottom-[100px] left-0 right-0 px-6 max-w-2xl mx-auto z-[60] flex flex-col gap-3">
        {isPremium && (
          <button onClick={onShowPreCallCheck} className={cn('w-full py-3.5 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]', isDark ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'border-indigo-400/50 text-indigo-600 bg-indigo-50 hover:bg-indigo-100')}>
            <span>🧘</span> Pre-Call Check - Ready to Make the Call?
          </button>
        )}
        {isPremium && (
          <Button variant="accent" size="lg" className="w-full h-14 rounded-2xl shadow-xl" onClick={onShowReflectionPrompt}>
            <Check className="w-5 h-5" /> Call Complete - Log It
          </Button>
        )}
        <Button size="xl" className={cn('w-full h-20 rounded-[2rem] shadow-2xl border-4 transition-all bg-red-600 text-white hover:bg-red-500 shadow-red-600/40 hover:shadow-red-500/60', isDark ? 'border-red-900' : 'border-red-300')} onClick={onShowPanicPanel}>
          <AlertCircle className="w-8 h-8" /> They said something unexpected
        </Button>
      </div>
    </div>
  );
}
