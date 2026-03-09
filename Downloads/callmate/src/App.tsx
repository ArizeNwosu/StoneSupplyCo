import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  ChevronRight, 
  AlertCircle, 
  History, 
  Check, 
  Volume2, 
  ArrowLeft,
  Loader2,
  Star,
  Share2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Settings,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { Logo } from './components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tone, CallScript, SAFE_LINES, PANIC_OPTIONS, PanicOption, COMMON_CALL_TYPES, Persona, Reflection, Tier, CallPerspective } from './types';
import { generateCallScript, generatePanicResponse, generateTTS, generateVoicemailScript, generateEmailFallback, generateBranch } from './services/gemini';
import { signUp, signIn, signInWithApple, signInWithGoogle, signOut, onAuthStateChange, sendPasswordReset } from './services/auth';
import { pushLocalDataToSupabase, fetchScripts, fetchReflections, fetchPersonas, fetchProfile, upsertProfile, saveScript, saveReflection, savePersona, deleteScript as dbDeleteScript, deletePersona as dbDeletePersona } from './services/db';
import type { User } from '@supabase/supabase-js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  isDark = true,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDark?: boolean;
}) => {
  const variants = {
    primary: isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30 ring-1 ring-blue-500/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/25 ring-1 ring-blue-400/20',
    secondary: isDark ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-white/5' : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 border border-black/5',
    outline: isDark ? 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400',
    ghost: isDark ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
    accent: 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20',
    glass: isDark ? 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 hover:border-white/30' : 'bg-black/5 backdrop-blur-md text-black border border-black/10 hover:bg-black/10 hover:border-black/20'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg font-medium',
    xl: 'px-8 py-4 text-xl font-semibold'
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};

const Card = ({ children, className, onClick, isDark = true }: { children: React.ReactNode, className?: string, onClick?: () => void, key?: React.Key, isDark?: boolean }) => (
  <motion.div 
    onClick={onClick}
    whileHover={onClick ? { scale: 1.01, y: -2 } : undefined}
    whileTap={onClick ? { scale: 0.99 } : undefined}
    className={cn(
      isDark ? 'bg-zinc-900/85 backdrop-blur-md border-white/10 hover:border-white/20' : 'bg-white/90 backdrop-blur-md border-black/10 hover:border-black/15',
      'border rounded-3xl p-5 shadow-md hover:shadow-xl transition-all duration-300',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </motion.div>
);

const CallTypeGrid = ({
  items,
  onSelect,
  selectedItem,
  isDark = true
}: {
  items: string[],
  onSelect: (item: string) => void,
  selectedItem?: string,
  isDark?: boolean
}) => (
  <div className={cn(
    "rounded-3xl border overflow-hidden transition-colors",
    isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
  )}>
    <div className="p-3 flex flex-wrap gap-2 max-h-[220px] overflow-y-auto scrollbar-hide">
      {items.map((item, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(item)}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm font-medium transition-all",
            selectedItem === item
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : isDark
              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
          )}
        >
          {item}
        </motion.button>
      ))}
    </div>
  </div>
);

const RotatingText = () => {
  const words = ["putting off?", "dreading?", "avoiding?"];
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const word = words[wordIndex];

    if (typing) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 65);
        return () => clearTimeout(t);
      } else {
        // Fully typed — pause then start erasing
        const t = setTimeout(() => setTyping(false), 1600);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
        return () => clearTimeout(t);
      } else {
        // Fully erased — move to next word
        setWordIndex((prev) => (prev + 1) % words.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, wordIndex]);

  return (
    <span className="text-purple-400 inline-block">
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-[1em] bg-purple-400 ml-[1px] align-middle"
      />
    </span>
  );
};

type AnxietySeverity = 'mild' | 'moderate' | 'severe' | 'debilitating';
type AnxietyRating = { scriptId: string; rating: number; timestamp: number };

const MILESTONES = [
  { id: 'first_call',   title: 'Ice Breaker',       desc: 'Completed your first scripted call',   icon: '📞' },
  { id: 'five_calls',   title: 'Getting Warmer',     desc: '5 calls completed',                   icon: '🔥' },
  { id: 'ten_calls',    title: 'Call Confident',     desc: '10 calls completed',                  icon: '💪' },
  { id: 'first_low',    title: 'Easy Does It',       desc: 'Finished a call feeling calm',        icon: '😌' },
  { id: 'anxiety_drop', title: 'Turning the Corner', desc: 'Anxiety score measurably improved',   icon: '📉' },
  { id: 'streak_7',     title: 'Week Strong',        desc: '7-day call streak',                   icon: '🏆' },
];

const TRIGGERS = [
  "I'll freeze and forget what to say",
  "I'll be judged or sound stupid",
  "I won't know how to handle what they say",
  "I'll get an unexpected call and panic",
  "Being put on hold or transferred",
  "Saying something I can't take back",
];

const IMPACT_AREAS = [
  { icon: '💼', label: 'Work / career opportunities' },
  { icon: '🏥', label: 'Medical & healthcare' },
  { icon: '🏠', label: 'Bills, landlords & admin' },
  { icon: '💔', label: 'Personal relationships' },
  { icon: '💰', label: "Money (can't negotiate)" },
];

export default function App() {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [view, setView] = useState<'splash' | 'explainer' | 'onboarding' | 'reviews' | 'account' | 'setup' | 'home' | 'history' | 'dashboard' | 'script' | 'settings'>('splash');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [description, setDescription] = useState('');
  const [perspective, setPerspective] = useState<CallPerspective>('outgoing');
  const [tone, setTone] = useState<Tone>('Professional');
  const [loading, setLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [currentScript, setCurrentScript] = useState<CallScript | null>(null);
  const [history, setHistory] = useState<CallScript[]>([]);
  const [tier, setTier] = useState<Tier>('free');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [voicemailScript, setVoicemailScript] = useState<string | null>(null);
  const [emailFallback, setEmailFallback] = useState<string | null>(null);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalForced, setUpgradeModalForced] = useState(false);
  const [showPreCallCheck, setShowPreCallCheck] = useState(false);
  const [showPostCallReinforcement, setShowPostCallReinforcement] = useState(false);
  const [postCallRating, setPostCallRating] = useState<number | undefined>(undefined);
  const [showPanicPanel, setShowPanicPanel] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);
  const [panicResponse, setPanicResponse] = useState<string | null>(null);
  const [showSpeakerPrompt, setShowSpeakerPrompt] = useState(true);
  const [speakerPromptCount, setSpeakerPromptCount] = useState(0);
  const [panicCategory, setPanicCategory] = useState<string | null>(null);
  const [panicInput, setPanicInput] = useState<string>('');
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [addBranchInput, setAddBranchInput] = useState('');
  const [addBranchLoading, setAddBranchLoading] = useState(false);
  const [sessionScriptCount, setSessionScriptCount] = useState(0);
  const [sortMode, setSortMode] = useState<'Random' | 'A-Z'>('Random');
  const [previousView, setPreviousView] = useState<'home' | 'history'>('home');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [anxietySeverity, setAnxietySeverity] = useState<AnxietySeverity | null>(null);
  const [anxietyTriggers, setAnxietyTriggers] = useState<string[]>([]);
  const [lifeImpact, setLifeImpact] = useState<string[]>([]);
  const [callAnxietyRatings, setCallAnxietyRatings] = useState<AnxietyRating[]>([]);
  const [callStreak, setCallStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'dashboard'>('home');
  const [showAlterEgo, setShowAlterEgo] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [trialScriptsUsed, setTrialScriptsUsed] = useState(0);
  const [userName, setUserName] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userAgeRange, setUserAgeRange] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [starredScripts, setStarredScripts] = useState<string[]>(() => {
    const saved = localStorage.getItem('callmate_starred');
    return saved ? JSON.parse(saved) : [];
  });
  const [shareToast, setShareToast] = useState(false);
  const [copiedLineIndex, setCopiedLineIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    opening: true, mainAsk: true, branchX: true, branchY: true, close: true
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasBeenReviewPrompted, setHasBeenReviewPrompted] = useState(() => localStorage.getItem('callmate_review_prompted') === 'true');
  const [lastScriptDate, setLastScriptDate] = useState<number | null>(null);
  const [comebackNudgeDismissed, setComebackNudgeDismissed] = useState(false);

  const isDark = theme === 'dark';
  const TRIAL_SCRIPT_LIMIT = 5;
  const TRIAL_DAYS = 3;

  const trialDaysRemaining = useMemo(() => {
    if (tier !== 'trial' || !trialStartDate) return null;
    const daysPassed = Math.floor((Date.now() - trialStartDate) / 86400000);
    return Math.max(0, TRIAL_DAYS - daysPassed);
  }, [tier, trialStartDate]);

  useEffect(() => { if (!showUpgradeModal) setUpgradeModalForced(false); }, [showUpgradeModal]);

  const isTrialActive = tier === 'trial' && (trialDaysRemaining ?? 0) > 0;
  const isPremium = tier === 'monthly' || tier === 'annual' || isTrialActive;
  const showComebackNudge = isTrialActive && lastScriptDate !== null &&
    (Date.now() - lastScriptDate) > 48 * 3600000 && !comebackNudgeDismissed;
  const isMedicalCall = useMemo(() => {
    if (!currentScript) return false;
    const d = currentScript.description.toLowerCase();
    return ['doctor', 'medical', 'dentist', 'hospital', 'clinic', 'physician', 'nurse', 'pharmacy', 'appointment'].some(kw => d.includes(kw));
  }, [currentScript]);

  const nextMilestone = useMemo(() => {
    const count = history.length;
    if (count < 1) return { title: 'Ice Breaker', icon: '📞', needed: 1 };
    if (count < 5) return { title: 'Getting Warmer', icon: '🔥', needed: 5 - count };
    if (count < 10) return { title: 'Call Confident', icon: '💪', needed: 10 - count };
    return null;
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    return history.filter(s => 
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const sortedCallTypes = useMemo(() => {
    if (sortMode === 'A-Z') return [...COMMON_CALL_TYPES].sort();
    return COMMON_CALL_TYPES;
  }, [sortMode]);

  const recoveryScore = useMemo(() => {
    if (history.length === 0) return 0;
    let score = Math.min(history.length * 6, 40);
    if (callAnxietyRatings.length >= 2) {
      const earlyAvg = callAnxietyRatings.slice(0, 3).reduce((s, r) => s + r.rating, 0) / Math.min(callAnxietyRatings.length, 3);
      const recentAvg = callAnxietyRatings.slice(-3).reduce((s, r) => s + r.rating, 0) / Math.min(callAnxietyRatings.length, 3);
      const improvement = earlyAvg - recentAvg;
      if (improvement > 0) score += Math.min(improvement * 12, 35);
    }
    score += Math.min(callAnxietyRatings.filter(r => r.rating <= 2).length * 5, 20);
    if (callStreak >= 7) score += 5;
    return Math.min(Math.round(score), 100);
  }, [history, callAnxietyRatings, callStreak]);

  const unlockedMilestones = useMemo(() => {
    const ids = new Set<string>();
    if (history.length >= 1) ids.add('first_call');
    if (history.length >= 5) ids.add('five_calls');
    if (history.length >= 10) ids.add('ten_calls');
    if (callAnxietyRatings.some(r => r.rating <= 2)) ids.add('first_low');
    if (callAnxietyRatings.length >= 2 && callAnxietyRatings[callAnxietyRatings.length - 1].rating < callAnxietyRatings[0].rating) ids.add('anxiety_drop');
    if (callStreak >= 7) ids.add('streak_7');
    return ids;
  }, [history, callAnxietyRatings, callStreak]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ringtone_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedTheme = localStorage.getItem('ringtone_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);

    const savedTier = localStorage.getItem('ringtone_tier') as Tier;
    if (savedTier) setTier(savedTier);

    const savedSpeakerCount = parseInt(localStorage.getItem('callmate_speaker_count') || '0');
    setSpeakerPromptCount(savedSpeakerCount);

    // Auto-show upgrade modal if trial already expired
    const savedTierOnLoad = localStorage.getItem('ringtone_tier') as Tier;
    const savedTrialStartOnLoad = localStorage.getItem('callmate_trial_start');
    if (savedTierOnLoad === 'trial' && savedTrialStartOnLoad) {
      const daysPassed = Math.floor((Date.now() - parseInt(savedTrialStartOnLoad)) / 86400000);
      if (daysPassed >= 3) {
        setTimeout(() => setShowUpgradeModal(true), 800);
      }
    }

    const savedRatings = localStorage.getItem('callmate_anxiety_ratings');
    if (savedRatings) setCallAnxietyRatings(JSON.parse(savedRatings));

    const savedStreak = localStorage.getItem('callmate_streak');
    if (savedStreak) setCallStreak(parseInt(savedStreak));

    const savedSeverity = localStorage.getItem('callmate_severity') as AnxietySeverity;
    if (savedSeverity) setAnxietySeverity(savedSeverity);

    const savedTrialStart = localStorage.getItem('callmate_trial_start');
    if (savedTrialStart) setTrialStartDate(parseInt(savedTrialStart));
    const savedTrialScripts = localStorage.getItem('callmate_trial_scripts');
    if (savedTrialScripts) setTrialScriptsUsed(parseInt(savedTrialScripts));

    const savedName = localStorage.getItem('callmate_user_name');
    if (savedName) setUserName(savedName);
    const savedGender = localStorage.getItem('callmate_user_gender');
    if (savedGender) setUserGender(savedGender);
    const savedAge = localStorage.getItem('callmate_user_age_range');
    if (savedAge) setUserAgeRange(savedAge);

    const savedEmail = localStorage.getItem('callmate_user_email');
    if (savedEmail) setUserEmail(savedEmail);

    const savedLastScript = localStorage.getItem('callmate_last_script_date');
    if (savedLastScript) setLastScriptDate(parseInt(savedLastScript));

    const timer = setTimeout(() => { if (view === 'splash') setView('explainer'); }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Supabase session management ──────────────────────────────────────────
  useEffect(() => {
    // Restore existing session on mount
    const restoreSession = async () => {
      const { data: { session } } = await (await import('./services/supabase')).supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        await loadUserDataFromSupabase(session.user.id);
      }
    };
    restoreSession();

    // Listen for future auth state changes (login / logout)
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        if (event === 'SIGNED_IN') {
          await loadUserDataFromSupabase(session.user.id);
        }
      } else {
        setSupabaseUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserDataFromSupabase = async (userId: string) => {
    const [remoteScripts, remoteReflections, remotePersonas, profile] = await Promise.all([
      fetchScripts(userId),
      fetchReflections(userId),
      fetchPersonas(userId),
      fetchProfile(userId),
    ]);

    if (remoteScripts.length) {
      setHistory(remoteScripts);
      localStorage.setItem('ringtone_history', JSON.stringify(remoteScripts));
    }
    if (remoteReflections.length) {
      setReflections(remoteReflections);
      localStorage.setItem('ringtone_reflections', JSON.stringify(remoteReflections));
    }
    if (remotePersonas.length) {
      setPersonas(remotePersonas);
      localStorage.setItem('callmate_personas', JSON.stringify(remotePersonas));
    }
    if (profile) {
      if (profile.name) { setUserName(profile.name); localStorage.setItem('callmate_user_name', profile.name); }
      if (profile.tier) { setTier(profile.tier as Tier); localStorage.setItem('ringtone_tier', profile.tier); }
      if (profile.trial_start_date) { setTrialStartDate(profile.trial_start_date); localStorage.setItem('callmate_trial_start', String(profile.trial_start_date)); }
      setTheme(profile.dark_mode ? 'dark' : 'light');
    }
  };

  // Keep screen awake during active call
  useEffect(() => {
    if (view !== 'script') return;
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: WakeLockSentinel) => {
        wakeLock = lock;
      }).catch(() => {});
    }
    return () => { wakeLock?.release().catch(() => {}); };
  }, [view]);

  const handleAddBranch = async () => {
    if (!addBranchInput.trim() || !currentScript) return;
    setAddBranchLoading(true);
    try {
      const branch = await generateBranch(currentScript.description, addBranchInput, currentScript.tone);
      const updated = {
        ...currentScript,
        extraBranches: [...(currentScript.extraBranches || []), branch]
      };
      setCurrentScript(updated);
      if (tier !== 'free') {
        const newHistory = history.map(h => h.id === updated.id ? updated : h);
        setHistory(newHistory);
        localStorage.setItem('ringtone_history', JSON.stringify(newHistory));
      }
      setAddBranchInput('');
      setShowAddBranch(false);
    } catch (error) {
      console.error(error);
    } finally {
      setAddBranchLoading(false);
    }
  };

  const handleGenerate = async (overrideTone?: Tone, overrideDesc?: string) => {
    const targetTone = overrideTone || tone;
    const targetDescription = overrideDesc || (overrideTone ? currentScript?.description : description) || description;
    
    // Check for limits
    if (!isPremium) { setShowUpgradeModal(true); return; }
    if (tier === 'trial' && trialScriptsUsed >= TRIAL_SCRIPT_LIMIT) { setShowUpgradeModal(true); return; }

    if (!targetDescription.trim()) return;
    if (overrideTone) setIsRewriting(true); else setLoading(true);
    try {
      const userProfile = { name: userName || undefined, gender: userGender || undefined, ageRange: userAgeRange || undefined };
      const script = await generateCallScript(targetDescription, targetTone, perspective, selectedPersona || undefined, userProfile);
      setCurrentScript(script);

      // Auto-save to history for all tiers
      const newHistory = [script, ...history].slice(0, 100);
      setHistory(newHistory);
      localStorage.setItem('ringtone_history', JSON.stringify(newHistory));

      // Track last script date for re-engagement
      const now = Date.now();
      setLastScriptDate(now);
      localStorage.setItem('callmate_last_script_date', String(now));

      // Trigger review prompt after 3rd or 7th script
      if ((newHistory.length === 3 || newHistory.length === 7) && !hasBeenReviewPrompted) {
        setTimeout(() => setShowReviewModal(true), 3500);
        setHasBeenReviewPrompted(true);
        localStorage.setItem('callmate_review_prompted', 'true');
      }

      if (tier === 'trial') {
        const next = trialScriptsUsed + 1;
        setTrialScriptsUsed(next);
        localStorage.setItem('callmate_trial_scripts', String(next));
      }

      setVoicemailScript(null);
      setEmailFallback(null);
      setShowAddBranch(false);
      setAddBranchInput('');
      setPreviousView('home');
      setView('script');
      if (!overrideTone) {
        setSessionScriptCount(prev => prev + 1);
        const newCount = speakerPromptCount + 1;
        if (speakerPromptCount < 5) {
          setShowSpeakerPrompt(true);
          setSpeakerPromptCount(newCount);
          localStorage.setItem('callmate_speaker_count', newCount.toString());
        } else {
          setShowSpeakerPrompt(false);
        }
      }
    } catch (error) {
      alert('Failed to generate script.');
    } finally {
      setLoading(false);
      setIsRewriting(false);
    }
  };

  const handlePractice = async () => {
    if (!currentScript) return;
    if (tier !== 'annual') {
      setShowUpgradeModal(true);
      return;
    }
    setIsPracticeMode(true);
    try {
      const textToRead = `${currentScript.opening}. ${currentScript.mainAsk}. ${currentScript.close}`;
      const audioUrl = await generateTTS(textToRead);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => { setIsPracticeMode(false); URL.revokeObjectURL(audioUrl); };
    } catch (error) {
      console.error(error);
      setIsPracticeMode(false);
    }
  };

  const handleVoicemail = async () => {
    if (!currentScript) return;
    try {
      const script = await generateVoicemailScript(currentScript);
      setVoicemailScript(script);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailFallback = async () => {
    if (!currentScript) return;
    try {
      const fallback = await generateEmailFallback(currentScript);
      setEmailFallback(fallback);
    } catch (error) {
      console.error(error);
    }
  };

  const saveReflection = (feedback: string, anxietyRating?: number) => {
    if (!currentScript) return;
    const reflection: Reflection = {
      id: crypto.randomUUID(),
      scriptId: currentScript.id,
      feedback,
      timestamp: Date.now()
    };
    const newReflections = [reflection, ...reflections];
    setReflections(newReflections);
    localStorage.setItem('ringtone_reflections', JSON.stringify(newReflections));

    if (anxietyRating !== undefined) {
      const newRating: AnxietyRating = { scriptId: currentScript.id, rating: anxietyRating, timestamp: Date.now() };
      const newRatings = [...callAnxietyRatings, newRating];
      setCallAnxietyRatings(newRatings);
      localStorage.setItem('callmate_anxiety_ratings', JSON.stringify(newRatings));

      // Update streak
      const today = new Date().toDateString();
      const lastCallDate = localStorage.getItem('callmate_last_call_date');
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastCallDate === yesterday ? callStreak + 1 : lastCallDate === today ? callStreak : 1;
      setCallStreak(newStreak);
      localStorage.setItem('callmate_streak', String(newStreak));
      localStorage.setItem('callmate_last_call_date', today);

      // Trigger review modal after a calm/mild call
      if (anxietyRating <= 2 && !hasBeenReviewPrompted && history.length >= 2) {
        setTimeout(() => setShowReviewModal(true), 600);
        setHasBeenReviewPrompted(true);
        localStorage.setItem('callmate_review_prompted', 'true');
      }
    }
    setShowReflectionPrompt(false);
    if (anxietyRating !== undefined) {
      setPostCallRating(anxietyRating);
      setTimeout(() => setShowPostCallReinforcement(true), 350);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all call history?')) {
      setHistory([]);
      localStorage.removeItem('ringtone_history');
    }
  };

  const handlePanicAction = async (option: PanicOption) => {
    setPanicLoading(true);
    setPanicInput(option.label);
    try {
      const response = await generatePanicResponse(currentScript!, option.label);
      setPanicResponse(response);
    } catch (error) {
      console.error(error);
    } finally {
      setPanicLoading(false);
    }
  };

  const handleCustomPanic = async (text: string) => {
    if (!text.trim()) return;
    setPanicLoading(true);
    setPanicInput(text);
    try {
      const response = await generatePanicResponse(currentScript!, text);
      setPanicResponse(response);
    } catch (error) {
      console.error(error);
    } finally {
      setPanicLoading(false);
    }
  };

  const savePanicAsBranch = () => {
    if (!currentScript || !panicResponse || !panicInput) return;
    const updated = {
      ...currentScript,
      extraBranches: [...(currentScript.extraBranches || []), { condition: panicInput, response: panicResponse }]
    };
    setCurrentScript(updated);
    const newHistory = history.map(h => h.id === updated.id ? updated : h);
    setHistory(newHistory);
    localStorage.setItem('ringtone_history', JSON.stringify(newHistory));
  };

  const toggleStar = (scriptId: string) => {
    setStarredScripts(prev => {
      const next = prev.includes(scriptId)
        ? prev.filter(id => id !== scriptId)
        : [...prev, scriptId];
      localStorage.setItem('callmate_starred', JSON.stringify(next));
      return next;
    });
  };

  const handleShare = async () => {
    if (!currentScript) return;
    const text = `📞 ${currentScript.description}\n\nOpening:\n${currentScript.opening}\n\nMain Ask:\n${currentScript.mainAsk}\n\nIf they say "${currentScript.branchX.condition}":\n${currentScript.branchX.response}\n\nIf they say "${currentScript.branchY.condition}":\n${currentScript.branchY.response}\n\nClose:\n${currentScript.close}\n\n— via Callmate`;
    if (navigator.share) {
      try { await navigator.share({ title: `Call Script: ${currentScript.description}`, text }); } catch {}
    } else {
      await copyText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {}
    // Fallback for restricted contexts (HTTP, older browsers)
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(el);
  };

  const handleCopyLine = async (text: string, index: number) => {
    await copyText(text);
    setCopiedLineIndex(index);
    setTimeout(() => setCopiedLineIndex(null), 2000);
  };

  if (view === 'splash') return (
    <div className={cn("h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Splash Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"
      />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-[3rem] bg-blue-500/40"
        />
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          className="absolute inset-0 rounded-[3rem] bg-blue-400/30"
        />
        <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl bg-black relative z-10">
          <Logo className="w-18 h-18 text-white" />
        </div>
      </motion.div>
      <h1 className="text-5xl font-bold tracking-tighter mt-8 relative z-10">CALLMATE</h1>
      <p className="text-zinc-500 mt-2 relative z-10 text-sm font-medium">Beat telephobia. One call at a time.</p>
    </div>
  );

  if (view === 'explainer') return (
    <div className={cn("h-screen flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[130px] pointer-events-none" />
      <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col justify-between px-7 pt-14 pb-10 max-w-md mx-auto w-full">

        {/* Top section */}
        <div className="space-y-8">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
            Also known as Phone Anxiety
          </motion.p>

          {/* Definition */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
            <h1 className="text-6xl font-black tracking-tighter leading-none">Tele&shy;phobia</h1>
            <p className={cn("text-sm font-mono tracking-wide", isDark ? "text-zinc-500" : "text-zinc-400")}>/ˌtelɪˈfəʊbiə/ · noun</p>
            <p className={cn("text-base leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-600")}>
              The fear or reluctance to make or receive phone calls — a real, diagnosed condition that affects daily life.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="space-y-2.5">
            {[
              { stat: '76%',  desc: 'of millennials experience telephobia' },
              { stat: '1 in 3', desc: 'adults actively avoid phone calls' },
              { stat: '40M+', desc: 'Americans affected — most never seek help' },
            ].map(({ stat, desc }) => (
              <div key={stat} className={cn("flex items-center gap-4 p-4 rounded-2xl border", isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                <p className="text-xl font-black text-purple-400 w-14 shrink-0 tabular-nums">{stat}</p>
                <p className={cn("text-sm leading-snug", isDark ? "text-zinc-300" : "text-zinc-700")}>{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="space-y-5 pt-6">
          <p className={cn("text-2xl font-bold text-center", isDark ? "text-white" : "text-black")}>
            You are not alone. 💙
          </p>
          <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base" onClick={() => setView('onboarding')}>
            I want to fix this <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  if (view === 'onboarding') {
    const severityOptions: { value: AnxietySeverity; emoji: string; label: string; desc: string; color: string }[] = [
      { value: 'mild',        emoji: '😬', label: 'Mild',         desc: 'I make calls but feel uneasy beforehand',                     color: 'border-yellow-500/50 bg-yellow-500/5' },
      { value: 'moderate',    emoji: '😰', label: 'Moderate',     desc: 'I delay or avoid calls when I can',                           color: 'border-orange-500/50 bg-orange-500/5' },
      { value: 'severe',      emoji: '🫣', label: 'Severe',       desc: 'I almost never answer or make calls',                         color: 'border-red-500/50 bg-red-500/5' },
      { value: 'debilitating',emoji: '🚨', label: 'Debilitating', desc: 'Calls trigger physical symptoms — heart racing, shaking',     color: 'border-red-700/60 bg-red-700/8' },
    ];

    return (
      <div className={cn("h-screen flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
        <motion.div animate={{ x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Progress dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 pt-10 pb-2 shrink-0">
          {[1, 2, 3, 4, 5].map(s => (
            <motion.div key={s} layout animate={{ width: s === onboardingStep ? 28 : 8 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn("h-1.5 rounded-full", s <= onboardingStep ? "bg-blue-500" : (isDark ? "bg-zinc-800" : "bg-zinc-200"))} />
          ))}
        </div>

        <div className="flex-1 flex flex-col px-7 pb-8 max-w-md mx-auto w-full relative z-10 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Profile ── */}
            {onboardingStep === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 mb-3">Step 1 of 5 · Your Profile</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">Let's personalize your experience.</h2>
                </div>
                <div className={cn("mb-4 rounded-2xl p-4 flex items-start gap-3 border shrink-0", isDark ? "bg-blue-500/8 border-blue-500/20" : "bg-blue-50 border-blue-100")}>
                  <span className="text-lg shrink-0">✨</span>
                  <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>
                    This helps us personalize your call scripts — using your name naturally and tailoring the language to you.
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-5 pb-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>First name <span className="text-blue-500">*</span></p>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. Alex"
                      className={cn("w-full px-4 py-3.5 rounded-2xl border text-base font-medium focus:outline-none transition-all", isDark ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500/60" : "bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400 focus:border-blue-400")}
                    />
                  </div>
                  {/* Gender */}
                  <div className="space-y-2">
                    <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
                      Gender <span className={cn("font-normal normal-case tracking-normal text-[11px]", isDark ? "text-zinc-600" : "text-zinc-400")}>· optional</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                        <button key={g}
                          onClick={() => { const v = g === userGender ? '' : g; setUserGender(v); localStorage.setItem('callmate_user_gender', v); }}
                          className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            userGender === g
                              ? "bg-blue-600 border-blue-500 text-white"
                              : isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-400"
                          )}
                        >{g}</button>
                      ))}
                    </div>
                  </div>
                  {/* Age range */}
                  <div className="space-y-2">
                    <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
                      Age range <span className={cn("font-normal normal-case tracking-normal text-[11px]", isDark ? "text-zinc-600" : "text-zinc-400")}>· optional</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['18–24', '25–34', '35–44', '45–54', '55+'].map(a => (
                        <button key={a}
                          onClick={() => { const v = a === userAgeRange ? '' : a; setUserAgeRange(v); localStorage.setItem('callmate_user_age_range', v); }}
                          className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            userAgeRange === a
                              ? "bg-blue-600 border-blue-500 text-white"
                              : isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-400"
                          )}
                        >{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pt-5">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold" disabled={!userName.trim()} onClick={() => { localStorage.setItem('callmate_user_name', userName); setOnboardingStep(2); }}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Severity ── */}
            {onboardingStep === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 mb-3">Step 2 of 5 · Assessment</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">How would you describe your relationship with phone calls?</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>76% of millennials experience telephobia. You're not alone.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-2">
                  {severityOptions.map(opt => (
                    <motion.button key={opt.value} whileTap={{ scale: 0.98 }} onClick={() => { setAnxietySeverity(opt.value); localStorage.setItem('callmate_severity', opt.value); }}
                      className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                        anxietySeverity === opt.value ? opt.color + " shadow-lg" : isDark ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                      )}>
                      <span className="text-3xl shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-bold text-base", isDark ? "text-white" : "text-black")}>{opt.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                      {anxietySeverity === opt.value && <Check className="w-5 h-5 text-blue-400 shrink-0" />}
                    </motion.button>
                  ))}
                </div>
                <div className="shrink-0 pt-5 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold" disabled={!anxietySeverity} onClick={() => setOnboardingStep(3)}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                  <button onClick={() => setOnboardingStep(1)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Back</button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Triggers ── */}
            {onboardingStep === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 mb-3">Step 3 of 5 · Triggers</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">What's your biggest fear on a call?</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Select all that apply — this shapes your recovery plan.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-2">
                  {TRIGGERS.map(trigger => {
                    const selected = anxietyTriggers.includes(trigger);
                    return (
                      <motion.button key={trigger} whileTap={{ scale: 0.98 }}
                        onClick={() => setAnxietyTriggers(p => selected ? p.filter(t => t !== trigger) : [...p, trigger])}
                        className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3",
                          selected ? "border-blue-500/50 bg-blue-500/10" : isDark ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                        )}>
                        <div className={cn("w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all", selected ? "border-blue-500 bg-blue-500" : isDark ? "border-zinc-600" : "border-zinc-300")}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <p className={cn("text-sm font-medium leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>{trigger}</p>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="shrink-0 pt-5 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold" onClick={() => setOnboardingStep(4)}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                  <button onClick={() => setOnboardingStep(2)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Back</button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Life Impact ── */}
            {onboardingStep === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 mb-3">Step 4 of 5 · Impact</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">Where is phone anxiety costing you the most?</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Pick up to 2 — we'll prioritize those scenarios in your plan.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-2">
                  {IMPACT_AREAS.map(area => {
                    const selected = lifeImpact.includes(area.label);
                    const maxed = lifeImpact.length >= 2 && !selected;
                    return (
                      <motion.button key={area.label} whileTap={{ scale: 0.98 }}
                        onClick={() => !maxed && setLifeImpact(p => selected ? p.filter(i => i !== area.label) : [...p, area.label])}
                        className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                          selected ? "border-blue-500/50 bg-blue-500/10" : maxed ? "opacity-40 border-zinc-800 bg-zinc-900/30 cursor-not-allowed"
                          : isDark ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
                        )}>
                        <span className="text-2xl shrink-0">{area.icon}</span>
                        <p className={cn("text-sm font-medium flex-1", isDark ? "text-zinc-200" : "text-zinc-800")}>{area.label}</p>
                        {selected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="shrink-0 pt-5 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold" onClick={() => setOnboardingStep(5)}>
                    See My Plan <ChevronRight className="w-4 h-4" />
                  </Button>
                  <button onClick={() => setOnboardingStep(3)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Back</button>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Animated Demo Dashboard ── */}
            {onboardingStep === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-3">Step 5 of 5 · Your Plan</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-1">Here's what beating telephobia looks like.</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Most users feel measurably less anxious within 2 weeks.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-2">
                  <OnboardingDemoDashboard isDark={isDark} />
                </div>
                <div className="shrink-0 pt-4 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30" onClick={() => {
                    if (tier === 'free') {
                      const now = Date.now();
                      setTrialStartDate(now);
                      setTier('trial');
                      localStorage.setItem('callmate_trial_start', String(now));
                      localStorage.setItem('ringtone_tier', 'trial');
                    }
                    setView('reviews');
                  }}>
                    Start My Free Trial <ChevronRight className="w-4 h-4" />
                  </Button>
                  <p className="text-center text-[10px] text-zinc-500 pt-1">3 days free · No payment due now · Cancel anytime</p>
                  <button onClick={() => setOnboardingStep(4)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Back</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (view === 'account') return <AccountSetup
    isDark={isDark}
    userName={userName}
    tier={tier}
    trialStartDate={trialStartDate}
    onComplete={async (email, isNewUser) => {
      setUserEmail(email);
      localStorage.setItem('callmate_user_email', email);
      // Push local data to Supabase on first signup
      if (isNewUser && supabaseUser) {
        await pushLocalDataToSupabase(supabaseUser.id, {
          scripts: history,
          reflections,
          anxietyRatings: callAnxietyRatings,
          personas,
          name: userName,
          tier,
          trialStartDate,
          darkMode: isDark,
        });
      }
      // New user → setup animation; returning user → home directly
      setView(isNewUser ? 'setup' : 'home');
    }}
  />;

  if (view === 'setup') return <SetupAnimation
    isDark={isDark}
    userName={userName}
    onDone={() => setView('home')}
  />;

  if (view === 'reviews') return (
    <div className={cn("h-screen flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Subtle background blob */}
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.18, 0.12] }} transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full blur-[120px] bg-emerald-500 pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 py-10 overflow-y-auto max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
          <p className={cn("text-xs font-black uppercase tracking-[0.25em] mb-3", isDark ? "text-emerald-400" : "text-emerald-600")}>
            You're in good company 💙
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            People just like you<br />are making the calls.
          </h1>
        </motion.div>

        {/* Reviews */}
        <div className="space-y-3 flex-1">
          {[
            { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after I hung up.", tag: "Medical / Doctor Call" },
            { name: "James T.", location: "Austin", quote: "Negotiated my rent down $150/month. The Firm tone was unreal — my landlord didn't even push back.", tag: "Landlord Call" },
            { name: "Priya K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call" },
            { name: "Marcus R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing.", tag: "Customer Service" },
          ].map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-zinc-50 border-zinc-200")}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                  <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-zinc-400")}>{r.location} · {r.tag}</p>
                </div>
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>"{r.quote}"</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-6 space-y-3">
          <Button size="xl" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25" onClick={() => { setView('home'); setShowUpgradeModal(true); setUpgradeModalForced(true); }}>
            Let's get started <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen transition-colors duration-500 selection:bg-white/10 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: [0, 40, 0], 
            y: [0, 60, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.15]",
            isDark ? "bg-blue-600" : "bg-blue-200"
          )}
        />
        <motion.div 
          animate={{ 
            x: [0, -60, 0], 
            y: [0, -40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.15]",
            isDark ? "bg-emerald-600" : "bg-emerald-200"
          )}
        />
        <motion.div 
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.1]",
            isDark ? "bg-purple-600" : "bg-purple-200"
          )}
        />
      </div>

      <header className={cn("sticky top-0 z-40 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between transition-colors", isDark ? "bg-black/40 border-white/5" : "bg-white/40 border-black/5")}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black">
            <Logo className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl">Callmate</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('settings')}
            className={cn(
              "p-2 rounded-xl transition-all",
              view === 'settings' 
                ? (isDark ? "bg-white text-black" : "bg-black text-white") 
                : (isDark ? "bg-white/5 text-zinc-400 hover:bg-white/10" : "bg-black/5 text-zinc-500 hover:bg-black/10")
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>


      <main className="max-w-2xl mx-auto p-6 pb-48">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

              {/* Comeback nudge — avoidance detection */}
              {showComebackNudge && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl border flex items-start justify-between gap-3 transition-colors",
                    isDark ? "bg-amber-500/10 border-amber-500/25" : "bg-amber-50 border-amber-200"
                  )}
                >
                  <div className="flex-1">
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">You've been quiet 👀</p>
                    <p className={cn("text-sm font-semibold leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>
                      It's been a couple of days. The call you've been putting off is still waiting. You've got this.
                    </p>
                  </div>
                  <button onClick={() => setComebackNudgeDismissed(true)} className="shrink-0 p-1 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Milestone proximity card */}
              {nextMilestone && history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors",
                    isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                  )}
                >
                  <span className="text-xl">{nextMilestone.icon}</span>
                  <p className={cn("text-xs flex-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    <span className="font-black">{nextMilestone.needed} more {nextMilestone.needed === 1 ? 'script' : 'scripts'}</span> until you unlock <span className={cn("font-semibold", isDark ? "text-zinc-200" : "text-zinc-800")}>{nextMilestone.title}</span>
                  </p>
                </motion.div>
              )}

              {/* Resume active script banner */}
              {currentScript && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setView('script')}
                  className={cn(
                    "p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all",
                    isDark ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40" : "bg-blue-50 border-blue-200 hover:border-blue-400"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-0.5">Resume Active Script</p>
                    <p className={cn("text-sm font-semibold truncate", isDark ? "text-zinc-200" : "text-zinc-800")}>{currentScript.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                </motion.div>
              )}

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Call Type</h2>
                  <div className={cn("flex p-1 rounded-full border transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200")}>
                    {['Random', 'A-Z'].map((m) => (
                      <button key={m} onClick={() => setSortMode(m as any)} className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all", sortMode === m ? (isDark ? "bg-white text-black" : "bg-black text-white") : "text-zinc-500")}>{m}</button>
                    ))}
                  </div>
                </div>
                <CallTypeGrid items={sortedCallTypes} onSelect={(item) => setDescription(item)} selectedItem={description} isDark={isDark} />
              </section>

              {isPremium && personas.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Calling as Persona</h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                      onClick={() => setSelectedPersona(null)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        !selectedPersona ? (isDark ? "bg-white text-black" : "bg-black text-white") : (isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600")
                      )}
                    >
                      Default
                    </button>
                    {personas.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedPersona(p)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          selectedPersona?.id === p.id ? (isDark ? "bg-white text-black" : "bg-black text-white") : (isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-600")
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Perspective</h2>
                  <div className={cn("flex p-1 rounded-xl transition-colors", isDark ? "bg-zinc-900" : "bg-zinc-100")}>
                    <button 
                      onClick={() => setPerspective('outgoing')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative", 
                        perspective === 'outgoing' 
                          ? (isDark ? "bg-zinc-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-white text-black shadow-sm") 
                          : "text-zinc-500 hover:text-zinc-400"
                      )}
                    >
                      I'm Calling
                    </button>
                    <button 
                      onClick={() => setPerspective('incoming')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative", 
                        perspective === 'incoming' 
                          ? (isDark ? "bg-zinc-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-white text-black shadow-sm") 
                          : "text-zinc-500 hover:text-zinc-400"
                      )}
                    >
                      I'm Answering
                    </button>
                  </div>
                </div>

                <h2 className={cn("text-xs font-bold uppercase tracking-widest mb-4 transition-colors", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  {perspective === 'outgoing' ? 'Describe Your Call' : 'Who is calling and why?'}
                </h2>
                <Card isDark={isDark} className="p-0 overflow-hidden">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder={perspective === 'outgoing' ? "I need to call my landlord..." : "My bank is calling about a suspicious charge..."} 
                    className={cn("w-full h-32 p-6 text-xl bg-transparent focus:outline-none resize-none transition-colors font-medium", isDark ? "placeholder:text-zinc-600" : "placeholder:text-zinc-400")}
                  />
                  <div className={cn("p-4 border-t flex flex-wrap gap-2 transition-colors", isDark ? "bg-zinc-800/30 border-zinc-700/50" : "bg-zinc-50/60 border-zinc-200")}>
                    {(['Professional', 'Assertive', 'Friendly', 'Firm'] as Tone[]).map((t) => (
                      <button 
                        key={t} 
                        onClick={() => setTone(t)} 
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all", 
                          tone === t 
                            ? (isDark ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-black text-white shadow-lg") 
                            : (isDark ? "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800" : "bg-zinc-200/50 text-zinc-600 border border-zinc-300/50 hover:bg-zinc-200")
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Card>
                <Button size="xl" variant="primary" isDark={isDark} className="w-full mt-4 h-14 font-bold tracking-tight" disabled={!description.trim() || loading} onClick={() => handleGenerate()}>
                  {loading ? <Loader2 className="animate-spin" /> : <><Phone className="w-5 h-5" /> Prepare My Call</>}
                </Button>
              </section>

              {/* Incoming Call Kit — always visible, zero AI generation time */}
              <section>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Incoming Call Kit</h2>
                <div className="grid grid-cols-1 gap-2">
                  {SAFE_LINES.map((line, i) => {
                    const copied = copiedLineIndex === i;
                    return (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCopyLine(line.line, i)}
                        className={cn(
                          "text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3",
                          copied
                            ? (isDark ? "bg-emerald-500/10 border-emerald-500/40" : "bg-emerald-50 border-emerald-300")
                            : (isDark ? "bg-zinc-900/80 border-white/8 hover:border-white/20 hover:bg-zinc-900" : "bg-zinc-100/80 border-black/8 hover:border-black/20 hover:bg-zinc-100")
                        )}
                      >
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{line.situation}</p>
                          <p className={cn("text-sm font-semibold leading-snug", isDark ? "text-zinc-100" : "text-zinc-900")}>"{line.line}"</p>
                        </div>
                        {copied
                          ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          : <Share2 className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                        }
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 text-center">Tap any line to copy · Use when the phone is already ringing</p>
              </section>

            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" isDark={isDark} onClick={() => setView(activeTab)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <h2 className="text-3xl font-bold">Settings</h2>
              </div>

              <div className="space-y-6">

                {/* Profile section */}
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Profile</h3>
                  {userEmail ? (
                    <Card isDark={isDark} className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 select-none">
                          {(userName || userEmail)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg">{userName || 'Callmate User'}</p>
                          <p className={cn("text-sm truncate", isDark ? "text-zinc-400" : "text-zinc-500")}>{userEmail}</p>
                          <p className="text-xs text-emerald-500 font-semibold mt-0.5">✓ Synced to cloud</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await signOut();
                          setSupabaseUser(null);
                          setUserEmail('');
                          localStorage.removeItem('callmate_user_email');
                        }}
                        className={cn("w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors", isDark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300" : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700")}
                      >
                        Sign Out
                      </button>
                    </Card>
                  ) : (
                    <Card isDark={isDark} className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                          👤
                        </div>
                        <div>
                          <p className="font-bold">{userName || 'Guest'}</p>
                          <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-400")}>Progress saved locally only</p>
                        </div>
                      </div>
                      <Button className="w-full" isDark={isDark} onClick={() => setView('account')}>
                        Create Account or Sign In
                      </Button>
                    </Card>
                  )}
                </section>

                {!isPremium && (
                  <Card isDark={isDark} className="bg-gradient-to-br from-blue-600 to-indigo-600 border-none p-6 text-white overflow-hidden relative">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2">Go Premium</h3>
                      <p className="text-blue-100 text-sm mb-4">Unlimited scripts, practice mode, custom personas, and more.</p>
                      <Button variant="glass" isDark={true} className="w-full bg-white text-blue-600 border-none" onClick={() => setShowUpgradeModal(true)}>
                        Upgrade Now
                      </Button>
                    </div>
                    <div className="absolute -right-8 -bottom-8 opacity-20">
                      <Star className="w-32 h-32" />
                    </div>
                  </Card>
                )}

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Display</h3>
                  <Card isDark={isDark} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Theme</p>
                        <p className="text-zinc-500 text-sm">Switch between light and dark mode</p>
                      </div>
                      <div className={cn("flex p-1 rounded-2xl transition-colors", isDark ? "bg-black" : "bg-zinc-200")}>
                        <button 
                          onClick={() => { setTheme('light'); localStorage.setItem('ringtone_theme', 'light'); }}
                          className={cn("p-2 rounded-xl transition-all", !isDark ? "bg-white text-black shadow-sm" : "text-zinc-500")}
                        >
                          <Sun className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { setTheme('dark'); localStorage.setItem('ringtone_theme', 'dark'); }}
                          className={cn("p-2 rounded-xl transition-all", isDark ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500")}
                        >
                          <Moon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom Personas</h3>
                    {isPremium && (
                      <button onClick={() => { setSelectedPersona(null); setShowPersonaModal(true); }} className="text-blue-500 text-xs font-bold uppercase tracking-widest hover:underline">
                        + Add New
                      </button>
                    )}
                  </div>
                  <Card isDark={isDark} className="p-4 space-y-3">
                    {!isPremium ? (
                      <div className="py-4 text-center">
                        <p className="text-zinc-500 text-sm mb-3">Personas are a premium feature</p>
                        <Button variant="ghost" size="sm" isDark={isDark} onClick={() => setShowUpgradeModal(true)}>Learn More</Button>
                      </div>
                    ) : personas.length === 0 ? (
                      <p className="text-zinc-500 text-sm text-center py-4">No custom personas yet.</p>
                    ) : (
                      personas.map(p => (
                        <div key={p.id} className={cn("p-4 rounded-2xl border flex items-center justify-between", isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200")}>
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{p.context}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedPersona(p); setShowPersonaModal(true); }} className="p-2 text-zinc-500 hover:text-blue-500 transition-colors">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPersonas(personas.filter(x => x.id !== p.id))} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </Card>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Account & Usage</h3>
                  <Card isDark={isDark} className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Current Tier</p>
                        <p className="text-zinc-500 text-sm capitalize">{tier} Plan</p>
                      </div>
                      <Button variant="outline" size="sm" isDark={isDark} onClick={() => setShowUpgradeModal(true)}>
                        Change
                      </Button>
                    </div>
                  </Card>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Data Management</h3>
                  <Card isDark={isDark} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Call History</p>
                        <p className="text-zinc-500 text-sm">{history.length} scripts saved locally</p>
                      </div>
                      <button 
                        onClick={clearHistory}
                        className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">App Info</h3>
                  <div className="px-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Version</span>
                      <span className={cn("font-mono transition-colors", isDark ? "text-zinc-300" : "text-zinc-700")}>2.1.0-hybrid</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Build</span>
                      <span className={cn("font-mono transition-colors", isDark ? "text-zinc-300" : "text-zinc-700")}>2026.03.08</span>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-32">
              {/* Header */}
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Recovery Progress</h2>
                <p className={cn("text-sm mt-1", isDark ? "text-zinc-500" : "text-zinc-500")}>
                  {history.length === 0 ? "Complete your first call to start tracking." : `${history.length} call${history.length !== 1 ? 's' : ''} logged · telephobia recovery in progress`}
                </p>
              </div>

              {/* Recovery Score */}
              <div className={cn("rounded-3xl border p-5 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Recovery Score</p>
                    <p className={cn("text-6xl font-black tabular-nums", recoveryScore >= 60 ? "text-emerald-400" : recoveryScore >= 30 ? "text-amber-400" : "text-zinc-400")}>{recoveryScore}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Streak</p>
                    <p className={cn("text-3xl font-black", callStreak > 0 ? "text-orange-400" : "text-zinc-600")}>
                      {callStreak > 0 ? '🔥' : '—'} {callStreak > 0 ? callStreak : 0}
                    </p>
                  </div>
                </div>
                {/* Score bar */}
                <div className={cn("h-2.5 rounded-full overflow-hidden", isDark ? "bg-zinc-800" : "bg-zinc-200")}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${recoveryScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn("h-full rounded-full", recoveryScore >= 60 ? "bg-emerald-500" : recoveryScore >= 30 ? "bg-amber-500" : "bg-zinc-500")}
                  />
                </div>
                <p className={cn("text-xs mt-2", isDark ? "text-zinc-600" : "text-zinc-400")}>
                  {recoveryScore === 0 ? "Complete your first call to begin." : recoveryScore < 30 ? "Early days — every call counts." : recoveryScore < 60 ? "You're making real progress." : "Significant improvement detected."}
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Calls Scripted', value: history.length, color: 'text-blue-400' },
                  { label: 'Low-Anxiety Calls', value: callAnxietyRatings.filter(r => r.rating <= 2).length, color: 'text-emerald-400' },
                  { label: 'Avg Anxiety', value: callAnxietyRatings.length > 0 ? (callAnxietyRatings.slice(-5).reduce((s, r) => s + r.rating, 0) / Math.min(callAnxietyRatings.length, 5)).toFixed(1) : '—', color: 'text-purple-400' },
                ].map((stat, i) => (
                  <div key={i} className={cn("rounded-2xl border p-4 text-center transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                    <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-1 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Anxiety trend chart */}
              <div className={cn("rounded-3xl border p-5 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Anxiety Trend</p>
                {callAnxietyRatings.length < 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <p className="text-4xl">📉</p>
                    <p className={cn("text-sm text-center", isDark ? "text-zinc-500" : "text-zinc-500")}>Rate your anxiety after each call to see your trend here.</p>
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${Math.max(callAnxietyRatings.length * 40, 200)} 80`} className="w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    {callAnxietyRatings.map((r, i) => {
                      const x = i * 40 + 5;
                      const y = ((r.rating - 1) / 4) * 60 + 5;
                      const nx = (i + 1) * 40 + 5;
                      const nr = callAnxietyRatings[i + 1];
                      const ny = nr ? ((nr.rating - 1) / 4) * 60 + 5 : null;
                      return (
                        <g key={i}>
                          {ny !== null && <line x1={x} y1={y} x2={nx} y2={ny} stroke="url(#trendGrad)" strokeWidth="2.5" strokeLinecap="round" />}
                          <circle cx={x} cy={y} r="5" fill={r.rating <= 2 ? '#22c55e' : r.rating <= 3 ? '#f59e0b' : '#ef4444'} />
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Milestones */}
              <div className={cn("rounded-3xl border p-5 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Milestones</p>
                <div className="grid grid-cols-3 gap-3">
                  {MILESTONES.map((m) => {
                    const unlocked = unlockedMilestones.has(m.id);
                    return (
                      <motion.div
                        key={m.id}
                        animate={{ opacity: unlocked ? 1 : 0.35, scale: unlocked ? 1 : 0.97 }}
                        className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all",
                          unlocked
                            ? isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"
                            : isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                        )}
                      >
                        <span className="text-2xl">{unlocked ? m.icon : '🔒'}</span>
                        <p className={cn("text-[9px] font-bold leading-tight uppercase tracking-wide", unlocked ? (isDark ? "text-emerald-400" : "text-emerald-700") : "text-zinc-600")}>{m.title}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Severity context */}
              {anxietySeverity && (
                <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Your Starting Point</p>
                  <p className={cn("text-sm font-semibold capitalize", isDark ? "text-white" : "text-black")}>{anxietySeverity} telephobia</p>
                  {lifeImpact.length > 0 && <p className="text-xs text-zinc-500 mt-1">Focus areas: {lifeImpact.join(' · ')}</p>}
                </div>
              )}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-[-140px] pt-4">
              <div className="flex flex-col gap-6 mb-12 px-2 relative z-[100]">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight">History</h2>
                  {currentScript && (
                    <Button variant="outline" size="sm" isDark={isDark} onClick={() => setView('script')}>
                      <ArrowLeft className="w-4 h-4" /> Active Script
                    </Button>
                  )}
                </div>

                {/* Active script resume banner */}
                {currentScript && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setView('script')}
                    className={cn(
                      "p-4 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all",
                      isDark ? "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40" : "bg-blue-50 border-blue-200 hover:border-blue-400"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-0.5">Active Script</p>
                      <p className={cn("text-sm font-semibold truncate", isDark ? "text-zinc-200" : "text-zinc-800")}>{currentScript.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                  </motion.div>
                )}
                
                {isPremium && (
                  <div className={cn("relative flex items-center transition-colors", isDark ? "text-zinc-400" : "text-zinc-500")}>
                    <Search className="absolute left-4 w-5 h-5 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Search scripts..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 rounded-2xl border focus:outline-none transition-all",
                        isDark ? "bg-zinc-900 border-zinc-800 focus:border-white/20" : "bg-zinc-100 border-zinc-200 focus:border-black/20"
                      )}
                    />
                  </div>
                )}
              </div>
              
              {filteredHistory.length === 0 ? (
                <div className={cn("py-20 text-center space-y-4 rounded-[2.5rem] border relative z-10 transition-colors", isDark ? "bg-zinc-900/30 border-zinc-800/50" : "bg-zinc-100/50 border-zinc-200")}>
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors", isDark ? "bg-zinc-900" : "bg-zinc-200")}>
                    <History className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-500">{searchQuery ? "No matches found." : "No scripts generated yet."}</p>
                </div>
              ) : (
                filteredHistory.map((s, i) => {
                  const colors = [
                    'bg-[#A8A291]',
                    'bg-[#1E7145]',
                    'bg-[#D66D42]',
                    'bg-[#A12B2B]',
                    'bg-[#4A6FA5]',
                    'bg-[#7B68EE]'
                  ];
                  const bgColor = colors[i % colors.length];
                  
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                      onClick={() => { setCurrentScript(s); setPreviousView('history'); setView('script'); }}
                      className={cn(
                        "relative p-8 rounded-[2.5rem] cursor-pointer shadow-[0_-4px_16px_rgba(0,0,0,0.12)] transition-all hover:translate-y-[-20px] active:scale-[0.98] group min-h-[220px]",
                        bgColor,
                        "text-black"
                      )}
                      style={{ zIndex: i + 1 }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 flex-1">
                          <h3 className="text-2xl font-bold tracking-tight leading-snug line-clamp-2">
                            {s.description}
                          </h3>
                          <p className="text-black/50 font-medium text-sm mt-1">
                            {s.tone} Call
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-xl font-bold leading-none">
                            {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                          <div className="text-black/30 text-xs font-bold mt-1">
                            {new Date(s.timestamp).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div
                          className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"
                          onClick={(e) => { e.stopPropagation(); toggleStar(s.id); }}
                        >
                          <Star className={cn("w-5 h-5", starredScripts.includes(s.id) ? "text-amber-500 fill-amber-500" : "text-black/40")} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {/* Extra spacer for the last card to be fully visible */}
              <div className="h-40" />
            </motion.div>
          )}

          {view === 'script' && currentScript && (
            <motion.div key="script" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Medical Call Extra Help Banner */}
              {isMedicalCall && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-blue-950/50 border-blue-500/25" : "bg-blue-50 border-blue-200")}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🏥</span>
                    <p className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-blue-400" : "text-blue-600")}>Medical Call Prep</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Write down your symptoms and when they started",
                      "Have your insurance card and pharmacy info ready",
                      "Note any current medications or allergies",
                      "State your main concern clearly in the first sentence",
                      "It's okay to ask them to repeat or slow down — they're used to it",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5", isDark ? "border-blue-500/40" : "border-blue-300")}>
                          <span className="text-[9px] font-black text-blue-400">{i + 1}</span>
                        </div>
                        <p className={cn("text-xs leading-snug", isDark ? "text-zinc-300" : "text-zinc-700")}>{tip}</p>
                      </div>
                    ))}
                  </div>
                  <p className={cn("text-[10px] mt-3 leading-relaxed", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    They deal with these calls all day. You are not bothering them.
                  </p>
                </motion.div>
              )}

              {/* Speaker Mode Prompt — shown first 5 script sessions */}
              <AnimatePresence>
                {showSpeakerPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className={cn("rounded-2xl border p-4 flex items-start justify-between gap-3 transition-colors", isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200")}
                  >
                    <div>
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Put it on speaker</p>
                      <p className={cn("text-sm leading-snug", isDark ? "text-zinc-300" : "text-zinc-700")}>Both hands free to read and type during the call. Screen stays on.</p>
                    </div>
                    <button onClick={() => setShowSpeakerPrompt(false)} className="text-zinc-500 hover:text-zinc-300 shrink-0 mt-0.5">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>


              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" isDark={isDark} onClick={() => { setActiveTab(previousView); setView(previousView); }}><ArrowLeft className="w-4 h-4" /> {previousView === 'history' ? 'History' : 'Home'}</Button>
                <div className="flex gap-2">
                  {isPremium && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      isDark={isDark} 
                      onClick={handlePractice}
                      className={cn(isPracticeMode && "bg-emerald-500/20 border-emerald-500/50 text-emerald-500")}
                    >
                      {isPracticeMode ? <Loader2 className="animate-spin w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      Practice
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    isDark={isDark}
                    onClick={() => currentScript && toggleStar(currentScript.id)}
                    className={cn(currentScript && starredScripts.includes(currentScript.id) && "bg-amber-500/20 border-amber-500/50 text-amber-500")}
                  >
                    <Star className={cn("w-4 h-4", currentScript && starredScripts.includes(currentScript.id) && "fill-current")} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isDark={isDark}
                    onClick={handleShare}
                    className={cn(shareToast && "bg-emerald-500/20 border-emerald-500/50 text-emerald-500")}
                  >
                    {shareToast ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Script Identity Card */}
              <div className={cn("rounded-3xl border p-5 transition-colors", isDark ? "bg-zinc-900/70 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
                <div className="flex items-start justify-between gap-3">
                  <p className={cn("text-lg font-bold leading-snug flex-1", isDark ? "text-white" : "text-black")}>
                    {currentScript.description}
                  </p>
                  <span className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    currentScript.tone === 'Professional' ? (isDark ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600")
                    : currentScript.tone === 'Assertive' ? (isDark ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600")
                    : currentScript.tone === 'Friendly' ? (isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600")
                    : (isDark ? "bg-rose-500/15 border-rose-500/30 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-600")
                  )}>
                    {currentScript.tone}
                  </span>
                </div>
              </div>

              {/* Alter Ego Mode */}
              <motion.div layout className={cn("rounded-3xl border overflow-hidden transition-all", showAlterEgo ? (isDark ? "bg-indigo-950/50 border-indigo-500/30" : "bg-indigo-50 border-indigo-200") : (isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"))}>
                <button onClick={() => setShowAlterEgo(p => !p)} className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎭</span>
                    <div>
                      <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-black")}>Alter Ego Mode</p>
                      <p className="text-xs text-zinc-500">{showAlterEgo ? "You are Alex — confident caller" : "Pretend you're someone else"}</p>
                    </div>
                  </div>
                  <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", showAlterEgo ? "bg-indigo-500" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}>
                    <motion.div layout animate={{ x: showAlterEgo ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </button>
                <AnimatePresence>
                  {showAlterEgo && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className={cn("mx-4 mb-4 p-4 rounded-2xl border", isDark ? "bg-indigo-900/30 border-indigo-500/20" : "bg-indigo-100 border-indigo-200")}>
                        <p className={cn("text-sm font-bold mb-1", isDark ? "text-indigo-200" : "text-indigo-900")}>You are Alex Chen.</p>
                        <p className={cn("text-sm leading-relaxed", isDark ? "text-indigo-300/80" : "text-indigo-800")}>
                          A confident public speaker who makes phone calls every single day. Calls are just conversations — you start them, guide them, and end them on your terms. This is just another call.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

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
                <Card isDark={isDark} className="bg-emerald-500/5 border-emerald-500/20">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Voicemail Script</p>
                  <p className={cn("text-lg italic leading-relaxed", isDark ? "text-emerald-100" : "text-emerald-900")}>"{voicemailScript}"</p>
                </Card>
              )}

              {emailFallback && (
                <Card isDark={isDark} className="bg-blue-500/5 border-blue-500/20">
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-2">Follow-up Email</p>
                  <p className={cn("text-lg italic leading-relaxed whitespace-pre-wrap", isDark ? "text-blue-100" : "text-blue-900")}>{emailFallback}</p>
                </Card>
              )}

              <div className={cn("border rounded-3xl p-4 flex flex-col gap-3 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200")}>
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Adjust Tone</span>{isRewriting && <Loader2 className="animate-spin" />}</div>
                <div className="flex flex-wrap gap-2">
                  {(['Professional', 'Assertive', 'Friendly', 'Firm'] as Tone[]).map((t) => (
                    <button key={t} disabled={isRewriting} onClick={() => { setTone(t); handleGenerate(t); }} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-all", currentScript.tone === t ? (isDark ? "bg-white text-black" : "bg-black text-white") : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500"))}>{t}</button>
                  ))}
                </div>
              </div>
              {/* Reassurance note */}
              <div className={cn("flex items-start gap-3 px-4 py-3 rounded-2xl border transition-colors", isDark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-zinc-50 border-zinc-200")}>
                <span className="text-base shrink-0 mt-0.5">💙</span>
                <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-500" : "text-zinc-500")}>
                  The person on the other line is <span className={isDark ? "text-zinc-300 font-semibold" : "text-zinc-700 font-semibold"}>not annoyed at you</span>. They're just doing their job — same as you.
                </p>
              </div>

              <div className={cn("space-y-4 pb-32 transition-opacity", isRewriting && "opacity-50")}>
                <ScriptSection title="Opening" step={1} content={currentScript.opening} isExpanded={expandedSections.opening} onToggle={() => setExpandedSections(p => ({...p, opening: !p.opening}))} isDark={isDark} color="blue" />
                <ScriptSection title="Main Ask" step={2} content={currentScript.mainAsk} isExpanded={expandedSections.mainAsk} onToggle={() => setExpandedSections(p => ({...p, mainAsk: !p.mainAsk}))} isDark={isDark} color="purple" />
                <ScriptSection title="Branch A" condition={currentScript.branchX.condition} content={currentScript.branchX.response} isBranch isExpanded={expandedSections.branchX} onToggle={() => setExpandedSections(p => ({...p, branchX: !p.branchX}))} isDark={isDark} color="emerald" />
                <ScriptSection title="Branch B" condition={currentScript.branchY.condition} content={currentScript.branchY.response} isBranch isExpanded={expandedSections.branchY} onToggle={() => setExpandedSections(p => ({...p, branchY: !p.branchY}))} isDark={isDark} color="amber" />
                {/* Extra branches (manually added or auto-saved from panic) */}
                {currentScript.extraBranches?.map((branch, i) => (
                  <ScriptSection
                    key={`extra-${i}`}
                    title={`Extra Branch`}
                    condition={branch.condition}
                    content={branch.response}
                    isBranch
                    isExpanded={true}
                    onToggle={() => {}}
                    isDark={isDark}
                    color="amber"
                  />
                ))}

                {/* Add a Branch */}
                <AnimatePresence>
                  {showAddBranch ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={cn("rounded-2xl border p-4 space-y-3 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200")}>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">What scenario do you want to prepare for?</p>
                      <textarea
                        value={addBranchInput}
                        onChange={e => setAddBranchInput(e.target.value)}
                        placeholder="e.g. What if they ask why it took me so long?"
                        className={cn("w-full rounded-xl border p-3 text-sm focus:outline-none resize-none h-20 transition-colors", isDark ? "bg-black border-zinc-800 text-white" : "bg-white border-zinc-300 text-black")}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" isDark={isDark} onClick={() => { setShowAddBranch(false); setAddBranchInput(''); }}>Cancel</Button>
                        <Button size="sm" className="flex-1" disabled={!addBranchInput.trim() || addBranchLoading} onClick={handleAddBranch}>
                          {addBranchLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Add Branch'}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowAddBranch(true)}
                      className={cn("w-full py-3 rounded-2xl border border-dashed text-sm font-medium transition-all flex items-center justify-center gap-2", isDark ? "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300" : "border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:text-zinc-600")}
                    >
                      <Plus className="w-4 h-4" /> Add a branch
                    </motion.button>
                  )}
                </AnimatePresence>

                <ScriptSection title="Close" step={3} content={currentScript.close} isExpanded={expandedSections.close} onToggle={() => setExpandedSections(p => ({...p, close: !p.close}))} isDark={isDark} color="rose" />
              </div>
              <div className="fixed bottom-[100px] left-0 right-0 px-6 max-w-2xl mx-auto z-[60] flex flex-col gap-3">
                {isPremium && (
                  <button
                    onClick={() => setShowPreCallCheck(true)}
                    className={cn(
                      "w-full py-3.5 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
                      isDark ? "border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" : "border-indigo-400/50 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    )}
                  >
                    <span>🧘</span> Pre-Call Check — Ready to Make the Call?
                  </button>
                )}
                {isPremium && (
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full h-14 rounded-2xl shadow-xl"
                    onClick={() => setShowReflectionPrompt(true)}
                  >
                    <Check className="w-5 h-5" /> Call Complete — Log It
                  </Button>
                )}
                <Button
                  size="xl"
                  className={cn(
                    "w-full h-20 rounded-[2rem] shadow-2xl border-4 transition-all bg-red-600 text-white hover:bg-red-500 shadow-red-600/40 hover:shadow-red-500/60",
                    isDark ? "border-red-900" : "border-red-300"
                  )}
                  onClick={() => { setShowPanicPanel(true); setPanicCategory(null); setPanicResponse(null); }}
                >
                  <AlertCircle className="w-8 h-8" /> They said something unexpected
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className={cn("fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-4 py-3 pb-8 z-50 flex items-center justify-around max-w-2xl mx-auto shadow-2xl transition-colors", isDark ? "bg-black/80 border-white/5" : "bg-white/80 border-black/5")}>
        {/* New Call */}
        <button onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'home' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'home' ? (isDark ? "bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "bg-blue-500/10") : "group-hover:bg-zinc-800/50")}>
            <Plus className={cn("w-6 h-6", activeTab === 'home' ? (isDark ? "text-blue-400" : "text-blue-600") : "")} />
            {activeTab === 'home' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Prepare</span>
        </button>
        {/* Progress */}
        <button onClick={() => { setActiveTab('dashboard'); setView('dashboard'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'dashboard' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'dashboard' ? (isDark ? "bg-emerald-600/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-emerald-500/10") : "group-hover:bg-zinc-800/50")}>
            <RotateCcw className={cn("w-6 h-6", activeTab === 'dashboard' ? (isDark ? "text-emerald-400" : "text-emerald-600") : "")} />
            {activeTab === 'dashboard' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Progress</span>
        </button>
        {/* Journal */}
        <button onClick={() => { setActiveTab('history'); setView('history'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'history' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'history' ? (isDark ? "bg-purple-600/20 shadow-[0_0_20px_rgba(147,51,234,0.2)]" : "bg-purple-500/10") : "group-hover:bg-zinc-800/50")}>
            <History className={cn("w-6 h-6", activeTab === 'history' ? (isDark ? "text-purple-400" : "text-purple-600") : "")} />
            {activeTab === 'history' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Journal</span>
        </button>
      </nav>

      <AnimatePresence>
        {showPanicPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowPanicPanel(false); setPanicResponse(null); }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("fixed bottom-0 left-0 right-0 rounded-t-[3rem] z-[70] max-h-[90vh] overflow-y-auto shadow-2xl max-w-2xl mx-auto border-t transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    {panicCategory && !panicResponse && (
                      <button onClick={() => setPanicCategory(null)} className={cn("p-2 rounded-full transition-colors", isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700")}>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <h2 className="text-3xl font-bold">
                      {panicResponse ? 'Say This Now' : panicCategory ? panicCategory : 'Live Response'}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowPanicPanel(false); setPanicResponse(null); setPanicCategory(null); }}
                    className={cn("p-2 rounded-full transition-colors", isDark ? "bg-zinc-800" : "bg-zinc-100")}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {panicLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    <p className="text-zinc-500 text-sm">Generating response...</p>
                  </div>
                ) : panicResponse ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-8">
                      <p className="text-xs font-bold text-emerald-500 uppercase mb-3">Say this now:</p>
                      <p className={cn("text-2xl font-medium italic leading-relaxed transition-colors", isDark ? "text-emerald-100" : "text-emerald-900")}>"{panicResponse}"</p>
                    </div>
                    <Button variant="accent" size="lg" className="w-full" onClick={() => { savePanicAsBranch(); setShowPanicPanel(false); setPanicResponse(null); setPanicCategory(null); }}>
                      <Check className="w-4 h-4" /> Back to Script (saves as branch)
                    </Button>
                    <Button variant="ghost" size="sm" isDark={isDark} className="w-full" onClick={() => { setShowPanicPanel(false); setPanicResponse(null); setPanicCategory(null); }}>
                      Dismiss without saving
                    </Button>
                  </motion.div>
                ) : !panicCategory ? (
                  /* Step 1: Choose category */
                  <div className="space-y-3">
                    <p className={cn("text-sm mb-4", isDark ? "text-zinc-400" : "text-zinc-600")}>What just happened?</p>
                    {(['Pushback', 'Transfer', 'Question', 'Exit'] as const).map((cat) => {
                      const catIcons: Record<string, string> = { Pushback: '🚫', Transfer: '↔️', Question: '❓', Exit: '🚪' };
                      const catDescriptions: Record<string, string> = {
                        Pushback: 'They said no, got defensive, or pushed back',
                        Transfer: 'Being transferred or put on hold',
                        Question: 'They asked something unexpected',
                        Exit: 'Need to end the call'
                      };
                      return (
                        <motion.button
                          key={cat}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPanicCategory(cat)}
                          className={cn("w-full p-5 border rounded-2xl text-left flex items-center gap-4 transition-all", isDark ? "bg-black border-zinc-800 hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:border-black/20")}
                        >
                          <span className="text-2xl">{catIcons[cat]}</span>
                          <div>
                            <p className={cn("font-bold text-base", isDark ? "text-white" : "text-black")}>{cat}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{catDescriptions[cat]}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto" />
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  /* Step 2: Choose specific scenario */
                  <div className="space-y-8">
                    <div className="space-y-2">
                      {PANIC_OPTIONS.filter(o => o.category === panicCategory).map((opt, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handlePanicAction(opt)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn("w-full p-5 border rounded-2xl text-left transition-all", isDark ? "bg-black border-zinc-800 hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:border-black/20")}
                        >
                          <p className={cn("text-base font-semibold transition-colors", isDark ? "text-zinc-200" : "text-zinc-800")}>{opt.label}</p>
                          <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
                        </motion.button>
                      ))}
                    </div>
                    <div className={cn("rounded-2xl border p-1 transition-colors", isDark ? "border-zinc-800" : "border-zinc-200")}>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 pt-3 pb-2">Or describe it:</p>
                      <div className="relative">
                        <textarea
                          placeholder="What did they say?"
                          className={cn("w-full rounded-xl p-3 text-base focus:outline-none min-h-[80px] transition-colors bg-transparent resize-none", isDark ? "text-white" : "text-black")}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomPanic((e.target as HTMLTextAreaElement).value); } }}
                        />
                        <div className="p-2 flex justify-end">
                          <Button size="sm" className="rounded-xl" onClick={(e) => { const ta = (e.currentTarget.closest('.relative')?.querySelector('textarea')) as HTMLTextAreaElement; handleCustomPanic(ta?.value || ''); }}>
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReviewModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t max-w-2xl mx-auto transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}
            >
              <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto pb-10">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="text-4xl">🌟</div>
                  <h2 className="text-2xl font-bold">People love Callmate</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>Real stories from people who made the call.</p>
                </div>

                {/* Reviews */}
                <div className="space-y-3">
                  {[
                    { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after I hung up.", tag: "Medical / Doctor Call" },
                    { name: "James T.", location: "Austin", quote: "Negotiated my rent down $150/month. The Firm tone was unreal — my landlord didn't even push back.", tag: "Landlord Call" },
                    { name: "Priya K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call" },
                    { name: "Marcus R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing. Nothing else comes close.", tag: "Customer Service" },
                  ].map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-zinc-800/60 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                          <p className={cn("text-[10px]", isDark ? "text-zinc-500" : "text-zinc-400")}>{r.location} · {r.tag}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0 mt-0.5">
                          {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                      <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>"{r.quote}"</p>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="space-y-3 pt-1">
                  <p className={cn("text-center text-xs font-semibold", isDark ? "text-zinc-400" : "text-zinc-500")}>
                    Enjoying Callmate? A quick review helps others find us.
                  </p>
                  <Button
                    size="xl"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25"
                    onClick={() => {
                      setShowReviewModal(false);
                      window.open('https://apps.apple.com/app/callmate', '_blank');
                    }}
                  >
                    ⭐⭐⭐⭐⭐ Rate on the App Store
                  </Button>
                  <button onClick={() => setShowReviewModal(false)} className={cn("w-full text-sm font-medium py-1 transition-colors", isDark ? "text-zinc-500 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-500")}>
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!upgradeModalForced) setShowUpgradeModal(false); }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t max-w-2xl mx-auto max-h-[94dvh] overflow-y-auto transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}
            >
              <div className="flex justify-center pt-4 pb-2">
                <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-300")} />
              </div>

              <div className="px-6 pb-10 space-y-6">
                {/* Personalised header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className={cn("text-2xl font-black leading-tight", isDark ? "text-white" : "text-black")}>
                      {userName ? (
                        <>Hey <span className="text-indigo-400">{userName}</span>,<br /></>
                      ) : null}
                      Unlock <span className="text-indigo-400">Callmate</span> to reduce call anxiety faster.
                    </h2>
                    <p className="text-zinc-500 text-sm">3 days free · No payment due now · Cancel anytime</p>
                  </div>
                  {!upgradeModalForced && (
                    <button onClick={() => setShowUpgradeModal(false)} className={cn("p-2 rounded-full shrink-0 mt-1 transition-colors", isDark ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200")}>
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Benefits */}
                <div className={cn("rounded-2xl border p-4 space-y-2.5 transition-colors", isDark ? "bg-zinc-800/60 border-zinc-700" : "bg-zinc-50 border-zinc-200")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Everything included</p>
                  {[
                    { icon: '📞', text: 'Unlimited call scripts — never face a call unprepared' },
                    { icon: '📚', text: 'Full call history — every script saved forever' },
                    { icon: '📉', text: 'Anxiety progress tracking — see your telephobia improve' },
                    { icon: '🚨', text: 'Panic mode — real-time help when calls go sideways' },
                    { icon: '🔊', text: 'Practice mode — hear your script read aloud by AI' },
                    { icon: '🎭', text: 'Alter ego mode, custom personas & more' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <span className="text-base shrink-0">{icon}</span>
                      <p className={cn("text-sm leading-snug", isDark ? "text-zinc-300" : "text-zinc-700")}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* Pricing options */}
                <div className="space-y-3">
                  {/* Monthly */}
                  <div
                    onClick={() => { setTier('monthly'); localStorage.setItem('ringtone_tier', 'monthly'); setShowUpgradeModal(false); setView('account'); }}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] relative",
                      tier === 'monthly' ? (isDark ? "bg-indigo-900/40 border-indigo-500" : "bg-indigo-50 border-indigo-400") : (isDark ? "bg-zinc-800/40 border-zinc-700 hover:border-zinc-500" : "bg-zinc-50 border-zinc-200 hover:border-zinc-400")
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Monthly</h3>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Popular</span>
                        </div>
                        <p className="text-zinc-500 text-xs">Billed monthly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>$6.99<span className="text-sm font-normal text-zinc-500">/mo</span></p>
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-indigo-500/10 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then $6.99/month · No payment due now
                    </div>
                  </div>

                  {/* Annual */}
                  <div
                    onClick={() => { setTier('annual'); localStorage.setItem('ringtone_tier', 'annual'); setShowUpgradeModal(false); setView('account'); }}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] relative",
                      tier === 'annual' ? (isDark ? "bg-emerald-900/40 border-emerald-500" : "bg-emerald-50 border-emerald-400") : (isDark ? "bg-zinc-800/40 border-zinc-700 hover:border-zinc-500" : "bg-zinc-50 border-zinc-200 hover:border-zinc-400")
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Annual</h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Save 30%</span>
                        </div>
                        <p className="text-zinc-500 text-xs">Best value · Billed yearly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>$58.99<span className="text-sm font-normal text-zinc-500">/yr</span></p>
                        <p className="text-[10px] text-emerald-400 font-black">≈ $4.92/mo</p>
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then $58.99/year · Cancel anytime
                    </div>
                  </div>
                </div>

                <ReviewSlideshow isDark={isDark} />

                <p className="text-center text-xs text-zinc-500 leading-relaxed">
                  You won't be charged until your 3-day free trial ends.<br />Cancel anytime before then — no questions asked.
                </p>

                {/* Footer links */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <a href="/terms" className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Terms of Service</a>
                  <span className="text-zinc-700 text-xs">·</span>
                  <a href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Privacy Policy</a>
                  <span className="text-zinc-700 text-xs">·</span>
                  <button
                    onClick={() => {/* restore purchase handler */}}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2"
                  >
                    Restore Purchase
                  </button>
                </div>

                {!upgradeModalForced && (
                  <button onClick={() => setShowUpgradeModal(false)} className="w-full text-zinc-500 text-sm font-medium py-1 hover:text-zinc-400 transition-colors">Maybe later</button>
                )}
              </div>
            </motion.div>
          </>
        )}

        {showPersonaModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPersonaModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("fixed bottom-0 left-0 right-0 p-8 rounded-t-[3rem] z-[110] shadow-2xl border-t transition-colors max-w-2xl mx-auto", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{selectedPersona ? 'Edit Persona' : 'New Persona'}</h2>
                  <button onClick={() => setShowPersonaModal(false)} className={cn("p-2 rounded-full", isDark ? "bg-zinc-800" : "bg-zinc-100")}><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Persona Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. My Boss, Landlord" 
                      defaultValue={selectedPersona?.name}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                      id="persona-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Context / Relationship</label>
                    <textarea 
                      placeholder="e.g. He is very busy and prefers direct answers. We have a formal relationship." 
                      defaultValue={selectedPersona?.context}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none h-32 resize-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                      id="persona-context"
                    />
                  </div>
                </div>
                <Button size="xl" className="w-full" onClick={() => {
                  const name = (document.getElementById('persona-name') as HTMLInputElement).value;
                  const context = (document.getElementById('persona-context') as HTMLTextAreaElement).value;
                  if (!name || !context) return;
                  
                  if (selectedPersona) {
                    setPersonas(personas.map(p => p.id === selectedPersona.id ? { ...p, name, context } : p));
                  } else {
                    setPersonas([...personas, { id: crypto.randomUUID(), name, context }]);
                  }
                  setShowPersonaModal(false);
                }}>
                  Save Persona
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {showPostCallReinforcement && (
          <PostCallReinforcement
            isDark={isDark}
            rating={postCallRating}
            onClose={() => { setShowPostCallReinforcement(false); setPostCallRating(undefined); }}
          />
        )}

        {showPreCallCheck && (
          <PreCallCheck
            isDark={isDark}
            onClose={() => setShowPreCallCheck(false)}
          />
        )}

        {showReflectionPrompt && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReflectionPrompt(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t p-8 max-w-2xl mx-auto transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Call Complete</h2>
                  <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>Rate your anxiety — this tracks your telephobia recovery.</p>
                </div>
                <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3 text-center", isDark ? "text-zinc-500" : "text-zinc-400")}>How anxious were you during that call?</p>
                  <div className="flex gap-2">
                    {[
                      { rating: 1, label: 'Calm',       emoji: '😌', color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' },
                      { rating: 2, label: 'Mild',        emoji: '😊', color: 'border-lime-500/60 bg-lime-500/10 text-lime-400' },
                      { rating: 3, label: 'Nervous',     emoji: '😬', color: 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400' },
                      { rating: 4, label: 'Anxious',     emoji: '😰', color: 'border-orange-500/60 bg-orange-500/10 text-orange-400' },
                      { rating: 5, label: 'Near panic',  emoji: '🚨', color: 'border-red-500/60 bg-red-500/10 text-red-400' },
                    ].map(opt => (
                      <motion.button key={opt.rating} whileTap={{ scale: 0.94 }}
                        onClick={() => saveReflection(`Anxiety: ${opt.rating}/5 — ${opt.label}`, opt.rating)}
                        className={cn("flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all", opt.color)}>
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-[9px] font-black uppercase tracking-wide">{opt.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowReflectionPrompt(false)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Skip</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const SLIDESHOW_REVIEWS = [
  { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after.", tag: "Medical Call" },
  { name: "James T.", location: "Austin", quote: "Negotiated my rent down $150/month. My landlord didn't even push back.", tag: "Landlord Call" },
  { name: "Priya K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call" },
  { name: "Marcus R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing.", tag: "Customer Service" },
];

function ReviewSlideshow({ isDark }: { isDark: boolean }) {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % SLIDESHOW_REVIEWS.length), 3200);
    return () => clearInterval(t);
  }, []);
  const r = SLIDESHOW_REVIEWS[index];
  return (
    <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-50 border-zinc-200")}>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="space-y-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-200" : "text-zinc-800")}>"{r.quote}"</p>
          <p className={cn("text-[11px]", isDark ? "text-zinc-500" : "text-zinc-400")}>{r.name} · {r.location} · {r.tag}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-3">
        {SLIDESHOW_REVIEWS.map((_, i) => (
          <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === index ? "w-5 bg-amber-400" : (isDark ? "w-1.5 bg-zinc-700" : "w-1.5 bg-zinc-300"))} />
        ))}
      </div>
    </div>
  );
}

function BreathingGuide({ onComplete }: { onComplete: () => void }) {
  type Phase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'done';
  const [phase, setPhase] = React.useState<Phase>('ready');
  const [cycle, setCycle] = React.useState(0);

  const TOTAL = 3;
  const INHALE = 4000, HOLD = 2000, EXHALE = 6000;
  const CYCLE = INHALE + HOLD + EXHALE; // 12000ms

  React.useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    // Small delay before first inhale so user sees the UI
    t.push(setTimeout(() => { setPhase('inhale'); setCycle(0); }, 600));
    for (let c = 0; c < TOTAL; c++) {
      const base = 600 + c * CYCLE;
      t.push(setTimeout(() => setPhase('hold'), base + INHALE));
      t.push(setTimeout(() => setPhase('exhale'), base + INHALE + HOLD));
      if (c < TOTAL - 1) {
        t.push(setTimeout(() => { setPhase('inhale'); setCycle(c + 1); }, base + CYCLE));
      }
    }
    t.push(setTimeout(() => setPhase('done'), 600 + TOTAL * CYCLE));
    return () => t.forEach(clearTimeout);
  }, []);

  const cfg: Record<Phase, { label: string; sub: string; color: string; scale: number; dur: number }> = {
    ready:  { label: 'Get ready',      sub: 'Find a comfortable position',               color: '#6366f1', scale: 0.38, dur: 0.5 },
    inhale: { label: 'Breathe In',     sub: 'Slowly inhale through your nose',           color: '#6366f1', scale: 1.0,  dur: INHALE / 1000 },
    hold:   { label: 'Hold',           sub: 'Hold it gently',                            color: '#8b5cf6', scale: 1.0,  dur: 0.4 },
    exhale: { label: 'Breathe Out',    sub: 'Slowly exhale through your mouth',          color: '#06b6d4', scale: 0.38, dur: EXHALE / 1000 },
    done:   { label: 'Well done ✓',   sub: "You're calmer. Your body is ready.",        color: '#22c55e', scale: 0.38, dur: 0.5 },
  };

  const c = cfg[phase];

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Animated breathing circle */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: c.scale * 1.5, opacity: 0.06, backgroundColor: c.color }}
          transition={{ duration: c.dur, ease: 'easeInOut' }}
        />
        {/* Mid ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: c.scale * 1.18, opacity: 0.12, backgroundColor: c.color }}
          transition={{ duration: c.dur, ease: 'easeInOut' }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: c.scale * 1.05, opacity: 0.22, backgroundColor: c.color }}
          transition={{ duration: c.dur, ease: 'easeInOut' }}
        />
        {/* Main circle */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: c.scale, opacity: 0.88, backgroundColor: c.color }}
          transition={{ duration: c.dur, ease: 'easeInOut' }}
        />
        {/* Label inside */}
        <div className="relative z-10 text-center px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25 }}
              className="text-white font-black text-sm drop-shadow-lg leading-tight"
            >
              {c.label}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Subtitle */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase + 'sub'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-zinc-400 text-sm text-center"
        >
          {c.sub}
        </motion.p>
      </AnimatePresence>

      {/* Cycle dots */}
      {phase !== 'done' && phase !== 'ready' && (
        <div className="flex gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i < cycle ? "bg-indigo-400 w-4" :
                i === cycle ? "bg-indigo-500 w-6" : "bg-zinc-700 w-1.5"
              )}
            />
          ))}
        </div>
      )}

      {/* Done CTA */}
      {phase === 'done' && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onComplete}
          className="mt-1 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm transition-all"
        >
          Continue →
        </motion.button>
      )}
    </div>
  );
}

function PreCallCheck({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const [step, setStep] = React.useState(0);
  const [mantraTaps, setMantraTaps] = React.useState(0);

  return (
    <div className={cn("fixed inset-0 z-[130] flex flex-col transition-colors", isDark ? "bg-black" : "bg-zinc-950")}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-5 shrink-0">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 28 : 8, opacity: i <= step ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn("h-1.5 rounded-full", i <= step ? "bg-indigo-500" : "bg-zinc-700")}
            />
          ))}
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-400 text-sm font-semibold transition-colors">
          Skip
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6">
        <AnimatePresence mode="wait">

          {/* Step 0 — Smile */}
          {step === 0 && (
            <motion.div key="smile" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">😊</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Step 1 of 3 — Smile</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-3">Turn on your smile before the call starts.</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Smiling — even a small, deliberate one — triggers a real biological response. It activates your parasympathetic nervous system, lowers cortisol, and shifts your brain's perception of the situation from threat to manageable.
                </p>
              </div>
              <div className={cn("w-full rounded-2xl border p-4 text-left", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-800 border-zinc-700")}>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Try this right now</p>
                <p className="text-zinc-300 text-sm leading-relaxed">Take a moment to smile — a real one. Hold it for 5 seconds. Notice how your shoulders drop a little. Keep that smile when the call starts. It works even if the other person can't see you.</p>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Breathing */}
          {step === 1 && (
            <motion.div key="breath" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Step 2 of 3 — Breathe</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-1">3 deep breaths.</h2>
                <p className="text-zinc-500 text-sm">Follow the circle. Let it guide you.</p>
              </div>
              <BreathingGuide onComplete={() => setStep(2)} />
            </motion.div>
          )}

          {/* Step 2 — Mindset */}
          {step === 2 && (
            <motion.div key="mindset" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">🧠</div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Step 3 of 3 — Reframe</p>
                <h2 className="text-2xl font-black text-white leading-tight mb-3">They're not thinking about you.</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  The person on the other end is focused on their own day, their own tasks. They're not analyzing your voice, judging your words, or waiting for you to stumble. Most people are understanding — they just want to resolve the same thing you do.
                </p>
              </div>
              <div className={cn("w-full rounded-2xl border p-5 text-left", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-800 border-zinc-700")}>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Tap the mantra 5 times</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setMantraTaps(t => Math.min(t + 1, 5))}
                  className={cn(
                    "w-full py-4 rounded-2xl text-center font-black text-base transition-all border-2",
                    mantraTaps >= 5
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                  )}
                >
                  {mantraTaps >= 5 ? '✓ This is going to be a great call.' : '"This is going to be a great call."'}
                </motion.button>
                <div className="flex justify-center gap-2 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: i < mantraTaps ? 1 : 0.7, opacity: i < mantraTaps ? 1 : 0.25 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={cn("w-2.5 h-2.5 rounded-full", i < mantraTaps ? "bg-indigo-400" : "bg-zinc-700")}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 shrink-0 pt-3">
        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1} // auto-advances from breathing step
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base transition-all",
              step === 1
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/25"
            )}
          >
            {step === 1 ? 'Follow the breathing guide above →' : 'Next →'}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-emerald-600/25"
          >
            I'm Ready — Start the Call 📞
          </button>
        )}
      </div>
    </div>
  );
}

function PostCallReinforcement({ isDark, rating, onClose }: { isDark: boolean; rating: number | undefined; onClose: () => void }) {
  const r = rating ?? 3;
  const isCalm = r <= 2;
  const isHard = r >= 4;

  const emoji = isCalm ? '🌟' : isHard ? '💪' : '✅';
  const headline = isCalm
    ? 'You handled that beautifully.'
    : isHard
    ? 'You showed up. That takes real courage.'
    : 'Call complete. You did it.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center px-8"
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 6, repeat: Infinity }}
        className={cn("absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] pointer-events-none", isCalm ? "bg-emerald-500" : isHard ? "bg-orange-500" : "bg-indigo-500")}
      />

      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm gap-5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14, delay: 0.2 }}
          className="text-6xl"
        >
          {emoji}
        </motion.div>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Post-Call</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">{headline}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Take a deep breath — it's over. They've already moved on to their next call and they are not thinking about you. Don't spend one more second of your energy on it.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Your post-call ritual</p>
          {[
            { icon: '🌬️', text: 'Take one long, slow breath out.' },
            { icon: '🎉', text: 'Give yourself actual credit — out loud if you can. "I did that."' },
            { icon: '📈', text: 'Every call you face makes the next one easier. This one counts.' },
          ].map(({ icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="flex items-start gap-3"
            >
              <span className="text-base shrink-0">{icon}</span>
              <p className="text-zinc-300 text-sm leading-snug">{text}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 mt-1"
        >
          Close
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function SetupAnimation({ isDark, userName, onDone }: { isDark: boolean; userName: string; onDone: () => void }) {
  const [step, setStep] = React.useState(-1); // -1 = none started yet
  const [showFinale, setShowFinale] = React.useState(false);

  const steps = [
    "Building your anxiety profile",
    "Preparing your script toolkit",
    "Activating Panic Mode & Safe lines",
    "Syncing your progress tracker",
  ];

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Kick off each step completing sequentially, 700ms apart
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), i * 1050 + 300));
    });
    // Show finale after all steps done
    timers.push(setTimeout(() => setShowFinale(true), steps.length * 1050 + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={cn("h-screen flex flex-col items-center justify-center px-8 transition-colors relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[10%] w-[80vw] h-[80vw] rounded-full blur-[140px] bg-indigo-500 pointer-events-none"
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Callmate</span>
          </div>
          <h1 className="text-2xl font-black leading-tight">
            {userName ? `Setting things up for you, ${userName}.` : 'Setting things up for you.'}
          </h1>
          <p className={cn("text-sm mt-1.5", isDark ? "text-zinc-500" : "text-zinc-400")}>This only takes a second.</p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {steps.map((text, i) => {
            const isDone = step >= i;
            const isActive = step === i - 1; // the next one to complete
            return (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3"
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className={cn("w-5 h-5 rounded-full border-2 shrink-0", isDark ? "border-zinc-700" : "border-zinc-300")} />
                )}
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isDone ? (isDark ? "text-white" : "text-black") : (isDark ? "text-zinc-600" : "text-zinc-400")
                )}>
                  {text}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Finale */}
        <AnimatePresence>
          {showFinale && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-1.5", isDark ? "text-indigo-400" : "text-indigo-600")}>All set</p>
                <h2 className="text-2xl font-black leading-tight">
                  {userName ? `Your Callmate is ready, ${userName}.` : 'Your Callmate is ready.'}
                </h2>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                onClick={onDone}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25"
              >
                Start Making Calls →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AccountSetup({ isDark, userName, tier, trialStartDate, onComplete }: {
  isDark: boolean;
  userName: string;
  tier: string;
  trialStartDate: number | null;
  onComplete: (email: string, isNewUser: boolean) => void;
}) {
  const [mode, setMode] = React.useState<'signup' | 'login'>('signup');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const trialEndDate = trialStartDate
    ? new Date(trialStartDate + 3 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  const switchMode = (next: 'signup' | 'login') => {
    setMode(next);
    setEmail('');
    setPassword('');
    setEmailError('');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setEmailError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setEmailError('');
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email.trim().toLowerCase(), password, userName || undefined);
        if (error) { setEmailError(error.message); setLoading(false); return; }
        onComplete(email.trim().toLowerCase(), true);
      } else {
        const { error } = await signIn(email.trim().toLowerCase(), password);
        if (error) { setEmailError('Incorrect email or password.'); setLoading(false); return; }
        onComplete(email.trim().toLowerCase(), false);
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter your email above first.');
      return;
    }
    await sendPasswordReset(email.trim().toLowerCase());
    setEmailError('Password reset email sent — check your inbox.');
  };

  const handleApple = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    if (error) { setEmailError(error.message); setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setEmailError(error.message); setLoading(false); }
  };

  return (
    <div className={cn("h-screen flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.1, 0.16, 0.1] }} transition={{ duration: 9, repeat: Infinity }}
        className="absolute top-[-30%] right-[-20%] w-[70vw] h-[70vw] rounded-full blur-[130px] bg-indigo-500 pointer-events-none" />

      <div className="flex-1 flex flex-col px-6 py-10 overflow-y-auto max-w-lg mx-auto w-full justify-center">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-black">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Callmate</span>
          </div>
          <p className={cn("text-xs font-black uppercase tracking-[0.25em] mb-2", isDark ? "text-indigo-400" : "text-indigo-600")}>
            {tier === 'annual' ? 'Annual Plan · Save 30%' : 'Monthly Plan'}
          </p>
          <h1 className="text-3xl font-bold leading-tight mb-2">
            {mode === 'login' ? 'Welcome back.' : (userName ? `One last step, ${userName}.` : 'One last step.')}
          </h1>
          <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>
            {mode === 'login'
              ? 'Sign in to access your scripts and progress.'
              : 'Your scripts and recovery progress are saved to your account — not just this device.'}
          </p>
        </motion.div>

        {/* Social auth */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3 mb-5">
          <button onClick={handleApple} disabled={loading} className={cn(
            "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50",
            isDark ? "bg-white text-black border-white hover:bg-zinc-100" : "bg-black text-white border-black hover:bg-zinc-800"
          )}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            {mode === 'login' ? 'Sign in with Apple' : 'Continue with Apple'}
          </button>
          <button onClick={handleGoogle} disabled={loading} className={cn(
            "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50",
            isDark ? "bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500" : "bg-white text-black border-zinc-200 hover:border-zinc-400"
          )}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {mode === 'login' ? 'Sign in with Google' : 'Continue with Google'}
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="flex items-center gap-3 mb-5">
          <div className={cn("flex-1 h-px", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
          <span className={cn("text-xs font-bold", isDark ? "text-zinc-600" : "text-zinc-400")}>{mode === 'login' ? 'or sign in with email' : 'or sign up with email'}</span>
          <div className={cn("flex-1 h-px", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
        </motion.div>

        {/* Email + password form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="space-y-3 mb-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            className={cn(
              "w-full px-4 py-4 rounded-2xl border text-base focus:outline-none transition-colors",
              isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400 focus:border-indigo-400"
            )}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'login' ? 'Your password' : 'Create a password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setEmailError(''); }}
              className={cn(
                "w-full px-4 py-4 rounded-2xl border text-base focus:outline-none transition-colors pr-12",
                isDark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400 focus:border-indigo-400"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className={cn("absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-widest", isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'login' && (
            <div className="flex justify-end px-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className={cn("text-xs font-semibold", isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500")}
              >
                Forgot password?
              </button>
            </div>
          )}
          {emailError && (
            <p className="text-red-400 text-xs px-1">{emailError}</p>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account & Start Free Trial'}
          </button>
          {mode === 'signup' && trialEndDate && (
            <p className={cn("text-center text-xs leading-relaxed", isDark ? "text-zinc-500" : "text-zinc-400")}>
              Your 3-day free trial starts today. No charge until {trialEndDate}.<br />Cancel anytime.
            </p>
          )}
          {mode === 'signup' && (
            <p className={cn("text-center text-[11px] leading-relaxed", isDark ? "text-zinc-600" : "text-zinc-400")}>
              By creating an account you agree to our{' '}
              <a href="/terms" className={cn("underline underline-offset-2 transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black")}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className={cn("underline underline-offset-2 transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black")}>Privacy Policy</a>.
            </p>
          )}
          <p className={cn("text-center text-sm pt-1", isDark ? "text-zinc-500" : "text-zinc-400")}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className={cn("font-semibold", isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500")}
            >
              {mode === 'login' ? 'Sign up →' : 'Sign in →'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedCounter({ to, duration = 2.2, active }: { to: number; duration?: number; active: boolean }) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const steps = 40;
    const stepSize = to / steps;
    const stepDuration = (duration * 1000) / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += stepSize;
      if (cur >= to) { setValue(to); clearInterval(t); }
      else setValue(Math.round(cur));
    }, stepDuration);
    return () => clearInterval(t);
  }, [active, to, duration]);
  return <>{value}</>;
}

function OnboardingDemoDashboard({ isDark }: { isDark: boolean }) {
  const [phase, setPhase] = React.useState(0);
  // phase 0 = before, phase 1 = animating, phase 2 = milestones, phase 3 = done
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => setPhase(3), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const demoMilestones = [
    { icon: '📞', title: 'Ice Breaker', unlocked: phase >= 2 },
    { icon: '🔥', title: 'Getting Warmer', unlocked: phase >= 2 },
    { icon: '😌', title: 'Easy Does It', unlocked: phase >= 3 },
    { icon: '📉', title: 'Turning the Corner', unlocked: false },
    { icon: '💪', title: 'Call Confident', unlocked: false },
    { icon: '🏆', title: 'Week Strong', unlocked: false },
  ];

  // Anxiety: starts high (y=10=top) trends down to low (y=62=bottom)
  const anxietyPath = "M 0,10 C 18,12 30,16 44,22 S 72,30 90,36 S 118,44 140,48 S 168,54 192,57 S 220,60 252,62";
  // Confidence: starts low (y=62=bottom) trends up to high (y=10=top) — inverse of anxiety
  const confidencePath = "M 0,62 C 18,60 30,56 44,50 S 72,42 90,36 S 118,28 140,24 S 168,18 192,15 S 220,12 252,10";
  const pathLen = 290;

  return (
    <div className="space-y-3">
      {/* Before / After label */}
      <div className="flex items-center gap-3">
        <div className={cn("flex-1 h-px", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
        <AnimatePresence mode="wait">
          {phase === 0
            ? <motion.span key="before" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Starting out</motion.span>
            : <motion.span key="after" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-widest text-emerald-500">After 2 weeks</motion.span>
          }
        </AnimatePresence>
        <div className={cn("flex-1 h-px", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
      </div>

      {/* Stats row */}
      <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
        <div className="grid grid-cols-3 divide-x divide-zinc-800/50">
          {[
            { label: 'Recovery Score', value: phase >= 1 ? 72 : 0, suffix: '', color: phase >= 1 ? 'text-emerald-400' : 'text-zinc-500' },
            { label: 'Streak', value: phase >= 1 ? 14 : 0, suffix: 'D', color: phase >= 1 ? 'text-orange-400' : 'text-zinc-500' },
            { label: 'Calls Done', value: phase >= 1 ? 12 : 0, suffix: '', color: phase >= 1 ? 'text-blue-400' : 'text-zinc-500' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center px-2">
              <p className={cn("text-2xl font-black tabular-nums transition-colors", stat.color)}>
                <AnimatedCounter to={stat.value} active={phase >= 1} />{stat.suffix}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5 text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dual-line chart: Anxiety ↓ + Confidence ↑ */}
      <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Anxiety vs. Confidence · Over 2 weeks</p>
        <div className="flex gap-5 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] rounded-full bg-red-500" />
            <p className="text-xs font-semibold text-zinc-400">Anxiety</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] rounded-full bg-indigo-400" />
            <p className="text-xs font-semibold text-zinc-400">Confidence</p>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 252 72" className="w-full" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradAnxiety" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="lineGradConf" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[16, 36, 56].map(y => (
              <line key={y} x1="0" y1={y} x2="252" y2={y} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
            ))}
            {/* Crossing highlight */}
            {phase >= 1 && (
              <motion.circle cx="126" cy="36" r="5" fill={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.4 }} />
            )}
            {/* Anxiety line */}
            <motion.path
              d={anxietyPath}
              fill="none"
              stroke="url(#lineGradAnxiety)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              initial={{ strokeDashoffset: pathLen }}
              animate={{ strokeDashoffset: phase >= 1 ? 0 : pathLen }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
            />
            {/* Confidence line */}
            <motion.path
              d={confidencePath}
              fill="none"
              stroke="url(#lineGradConf)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              initial={{ strokeDashoffset: pathLen }}
              animate={{ strokeDashoffset: phase >= 1 ? 0 : pathLen }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.4 }}
            />
            {/* Anxiety: start dot (red, top-left) */}
            <circle cx="0" cy="10" r="4" fill="#ef4444" />
            {/* Anxiety: end dot (amber, bottom-right) */}
            {phase >= 1 && (
              <motion.circle cx="252" cy="62" r="4" fill="#fbbf24" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.1, type: 'spring' }} />
            )}
            {/* Confidence: start dot (muted indigo, bottom-left) */}
            <circle cx="0" cy="62" r="4" fill="#818cf8" fillOpacity="0.5" />
            {/* Confidence: end dot (bright indigo, top-right) */}
            {phase >= 1 && (
              <motion.circle cx="252" cy="10" r="4" fill="#6366f1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.3, type: 'spring' }} />
            )}
            {/* Trophy at the peak of the confidence line */}
            {phase >= 1 && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.6, type: 'spring', stiffness: 320, damping: 14 }}
                style={{ transformOrigin: '252px 10px' }}
              >
                <text x="252" y="-5" textAnchor="middle" fontSize="15">🏆</text>
              </motion.g>
            )}
          </svg>
        </div>
        {/* Crossover label */}
        {phase >= 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="text-center text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-2">
            <span className="text-indigo-400">78%</span> of our members successfully increased their confidence with <span className="text-indigo-400">Callmate</span>
          </motion.p>
        )}
      </div>

      {/* Milestones */}
      <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Milestones</p>
        <div className="grid grid-cols-3 gap-2">
          {demoMilestones.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: m.unlocked ? 1 : 0.3, scale: m.unlocked ? 1 : 0.95 }}
              transition={{ delay: m.unlocked ? 0.1 * i : 0, type: 'spring', stiffness: 300 }}
              className={cn("flex flex-col items-center gap-1 p-2 rounded-xl text-center border transition-all",
                m.unlocked
                  ? isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"
                  : isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              )}
            >
              <span className="text-xl">{m.unlocked ? m.icon : '🔒'}</span>
              <p className={cn("text-[9px] font-bold leading-tight", m.unlocked ? (isDark ? "text-emerald-400" : "text-emerald-700") : "text-zinc-600")}>{m.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScriptSection({
  title,
  content,
  condition,
  step,
  isBranch = false,
  isExpanded,
  onToggle,
  isDark = true,
  color = 'zinc'
}: {
  title: string,
  content: string,
  condition?: string,
  step?: number,
  isBranch?: boolean,
  isExpanded: boolean,
  onToggle: () => void,
  isDark?: boolean,
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'zinc'
}) {
  const palette: Record<string, { solid: string; tint: string; text: string; border: string }> = {
    blue:    { solid: 'bg-blue-500',    tint: isDark ? 'bg-blue-950/60'    : 'bg-blue-50',    text: isDark ? 'text-blue-400'    : 'text-blue-600',    border: isDark ? 'border-blue-500/25'    : 'border-blue-200' },
    purple:  { solid: 'bg-purple-500',  tint: isDark ? 'bg-purple-950/60'  : 'bg-purple-50',  text: isDark ? 'text-purple-400'  : 'text-purple-600',  border: isDark ? 'border-purple-500/25'  : 'border-purple-200' },
    emerald: { solid: 'bg-emerald-600', tint: isDark ? 'bg-emerald-950/60' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-500/25' : 'border-emerald-200' },
    amber:   { solid: 'bg-amber-500',   tint: isDark ? 'bg-amber-950/60'   : 'bg-amber-50',   text: isDark ? 'text-amber-400'   : 'text-amber-600',   border: isDark ? 'border-amber-500/25'   : 'border-amber-200' },
    rose:    { solid: 'bg-rose-600',    tint: isDark ? 'bg-rose-950/60'    : 'bg-rose-50',    text: isDark ? 'text-rose-400'    : 'text-rose-600',    border: isDark ? 'border-rose-500/25'    : 'border-rose-200' },
    zinc:    { solid: 'bg-zinc-600',    tint: isDark ? 'bg-zinc-900'       : 'bg-zinc-50',    text: isDark ? 'text-zinc-400'    : 'text-zinc-600',    border: isDark ? 'border-zinc-700'       : 'border-zinc-200' },
  };
  const p = palette[color];

  if (isBranch) {
    return (
      <div className={cn("rounded-3xl border overflow-hidden transition-all", p.tint, p.border)}>
        <button onClick={onToggle} className="w-full text-left p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3", p.text)}>
                <span className="text-sm">💬</span> If they say...
              </span>
              {condition && (
                <div className={cn("rounded-2xl px-4 py-3 border", isDark ? "bg-black/30 border-white/[0.07]" : "bg-white/80 border-black/10")}>
                  <p className={cn("text-sm font-medium leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>"{condition}"</p>
                </div>
              )}
            </div>
            <div className="shrink-0 pt-1">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </div>
          </div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="px-5 pb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/8" : "bg-black/8")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.3em]", p.text)}>Then say</span>
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/8" : "bg-black/8")} />
                </div>
                <p className={cn("text-xl font-semibold leading-relaxed", isDark ? "text-zinc-50" : "text-zinc-900")}>{content}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl border overflow-hidden transition-all", p.tint, p.border)}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-4">
          {step !== undefined && (
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0", p.solid)}>
              {step}
            </div>
          )}
          <div>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", p.text)}>{step !== undefined ? `Step ${step}` : 'Section'}</p>
            <h3 className={cn("text-base font-bold mt-0.5", isDark ? "text-white" : "text-black")}>{title}</h3>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-5 pb-6">
              <p className={cn("text-xl font-semibold leading-relaxed", isDark ? "text-zinc-50" : "text-zinc-900")}>{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
