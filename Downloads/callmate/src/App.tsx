import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Moon,
  Square,
  Copy,
  WifiOff
} from 'lucide-react';
import { Logo } from './components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card, CallTypeGrid, cn } from './components/ui';
import { DashboardScreen, HistoryScreen, HomeScreen, ScriptScreen, SettingsScreen } from './components/main-screens';
import { Tone, CallScript, SAFE_LINES, PANIC_OPTIONS, PanicOption, COMMON_CALL_TYPES, Persona, Reflection, Tier, CallPerspective } from './types';
import { generateCallScript, generatePanicResponse, generateTTS, generateVoicemailScript, generateEmailFallback, generateBranch } from './services/gemini';
import { signUp, signIn, signInWithApple, signInWithGoogle, signOut, onAuthStateChange, sendPasswordReset } from './services/auth';
import { pushLocalDataToSupabase, fetchScripts, fetchReflections, fetchAnxietyRatings, fetchPersonas, fetchProfile, upsertProfile, saveScript, saveReflection as dbSaveReflection, savePersona, syncAnxietyRatings, deleteScript as dbDeleteScript, deletePersona as dbDeletePersona } from './services/db';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError, setStatusBarDark, setStatusBarLight, openInAppBrowser } from './services/native';
import type { User } from '@supabase/supabase-js';
import breatheAudio from '../breathe.mp3';

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
type AnxietyRating = { id?: string; scriptId: string; rating: number; timestamp: number };

const isCallScript = (value: unknown): value is CallScript => {
  if (!value || typeof value !== 'object') return false;
  const script = value as Partial<CallScript>;
  return (
    typeof script.id === 'string' &&
    typeof script.description === 'string' &&
    typeof script.tone === 'string' &&
    typeof script.opening === 'string' &&
    typeof script.mainAsk === 'string' &&
    typeof script.close === 'string' &&
    typeof script.timestamp === 'number' &&
    !!script.branchX &&
    typeof script.branchX.condition === 'string' &&
    typeof script.branchX.response === 'string' &&
    !!script.branchY &&
    typeof script.branchY.condition === 'string' &&
    typeof script.branchY.response === 'string'
  );
};

const sanitizeHistory = (value: unknown): CallScript[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isCallScript);
};

const MILESTONES = [
  { id: 'first_call',   title: 'Broke the Silence', desc: 'Completed your first scripted call',   icon: '📞' },
  { id: 'five_calls',   title: 'Faced the Ring',    desc: '5 calls completed',                   icon: '🔥' },
  { id: 'ten_calls',    title: 'Held the Line',     desc: '10 calls completed',                  icon: '💪' },
  { id: 'first_low',    title: 'Kept Your Cool',    desc: 'Finished a call feeling calm',        icon: '😌' },
  { id: 'anxiety_drop', title: 'Found Your Voice',  desc: 'Anxiety score measurably improved',   icon: '📉' },
  { id: 'streak_7',     title: 'On a Roll',         desc: '7-day call streak',                   icon: '🏆' },
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

const HAS_SEEN_ONBOARDING_KEY = 'callmate_has_seen_onboarding';
const AUTH_INTENT_KEY = 'callmate_auth_intent';
const BREATHE_SOUND_KEY = 'callmate_breathe_sound_enabled';
const BREATHE_VIBRATION_KEY = 'callmate_breathe_vibration_enabled';

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
  const [preCallCheckMode, setPreCallCheckMode] = useState<'script' | 'breathe'>('script');
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
  const [anxietyTriggers, setAnxietyTriggers] = useState<string[]>(() => {
    const saved = localStorage.getItem('callmate_triggers');
    return saved ? JSON.parse(saved) : [];
  });
  const [lifeImpact, setLifeImpact] = useState<string[]>(() => {
    const saved = localStorage.getItem('callmate_impact');
    return saved ? JSON.parse(saved) : [];
  });
  const [callAnxietyRatings, setCallAnxietyRatings] = useState<AnxietyRating[]>([]);
  const [callStreak, setCallStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'dashboard'>('home');
  const [showAlterEgo, setShowAlterEgo] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [trialScriptsUsed, setTrialScriptsUsed] = useState(0);
  const [userName, setUserName] = useState(() => localStorage.getItem('callmate_user_name') || '');
  const [userGender, setUserGender] = useState(() => localStorage.getItem('callmate_user_gender') || '');
  const [userAgeRange, setUserAgeRange] = useState(() => localStorage.getItem('callmate_user_age_range') || '');
  const [userEmail, setUserEmail] = useState('');
  const [starredScripts, setStarredScripts] = useState<string[]>(() => {
    const saved = localStorage.getItem('callmate_starred');
    return saved ? JSON.parse(saved) : [];
  });
  const [shareToast, setShareToast] = useState(false);
  const [expandedSafeLineIndex, setExpandedSafeLineIndex] = useState<number | null>(null);
  const [showMedicalPrep, setShowMedicalPrep] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    opening: true, mainAsk: true, branchX: true, branchY: true, close: true
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasBeenReviewPrompted, setHasBeenReviewPrompted] = useState(() => localStorage.getItem('callmate_review_prompted') === 'true');
  const [lastScriptDate, setLastScriptDate] = useState<number | null>(null);
  const [comebackNudgeDismissed, setComebackNudgeDismissed] = useState(false);
  const [isPracticePlaying, setIsPracticePlaying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [milestoneToast, setMilestoneToast] = useState<{ icon: string; title: string } | null>(null);
  const [customTriggerInput, setCustomTriggerInput] = useState('');
  const practiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevMilestoneIdsRef = useRef<Set<string>>(new Set());

  const isDark = theme === 'dark';

  // Sync native status bar with theme
  useEffect(() => {
    if (isDark) setStatusBarDark(); else setStatusBarLight();
  }, [isDark]);

  // Online / offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const TRIAL_SCRIPT_LIMIT = 5;
  const TRIAL_DAYS = 3;
  const getEffectiveTier = () => (localStorage.getItem('ringtone_tier') as Tier) || tier;
  const enforceAccessGate = (candidateTier = getEffectiveTier()) => {
    if (candidateTier === 'free') {
      setShowUpgradeModal(true);
      setUpgradeModalForced(true);
      return false;
    }
    return true;
  };

  const trialDaysRemaining = useMemo(() => {
    if (tier !== 'trial' || !trialStartDate) return null;
    const daysPassed = Math.floor((Date.now() - trialStartDate) / 86400000);
    return Math.max(0, TRIAL_DAYS - daysPassed);
  }, [tier, trialStartDate]);

  useEffect(() => { if (!showUpgradeModal) setUpgradeModalForced(false); }, [showUpgradeModal]);

  useEffect(() => {
    if (supabaseUser) {
      enforceAccessGate();
    }
  }, [supabaseUser, tier]);

  const isTrialActive = tier === 'trial' && (trialDaysRemaining ?? 0) > 0;
  const isPremium = tier === 'monthly' || tier === 'annual' || isTrialActive;
  const showComebackNudge = isTrialActive && lastScriptDate !== null &&
    (Date.now() - lastScriptDate) > 48 * 3600000 && !comebackNudgeDismissed;
  const isMedicalCall = useMemo(() => {
    if (!currentScript) return false;
    const d = currentScript.description.toLowerCase();
    return ['doctor', 'medical', 'dentist', 'hospital', 'clinic', 'physician', 'nurse', 'pharmacy', 'appointment'].some(kw => d.includes(kw));
  }, [currentScript]);

  useEffect(() => {
    setShowMedicalPrep(true);
  }, [currentScript?.id]);

  const nextMilestone = useMemo(() => {
    const count = history.length;
    if (count < 1) return { title: 'Broke the Silence', icon: '📞', needed: 1 };
    if (count < 5) return { title: 'Faced the Ring', icon: '🔥', needed: 5 - count };
    if (count < 10) return { title: 'Held the Line', icon: '💪', needed: 10 - count };
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

  // Milestone unlock toast
  useEffect(() => {
    const MILESTONE_DEFS = [
      { id: 'first_call', icon: '📞', title: 'Broke the Silence' },
      { id: 'five_calls', icon: '🔥', title: 'Faced the Ring' },
      { id: 'ten_calls', icon: '💪', title: 'Held the Line' },
      { id: 'first_low', icon: '😌', title: 'Easy Does It' },
      { id: 'anxiety_drop', icon: '📉', title: 'Turning the Corner' },
      { id: 'streak_7', icon: '🏆', title: 'Week Strong' },
    ];
    MILESTONE_DEFS.forEach(m => {
      if (unlockedMilestones.has(m.id) && !prevMilestoneIdsRef.current.has(m.id)) {
        setMilestoneToast({ icon: m.icon, title: m.title });
        setTimeout(() => setMilestoneToast(null), 3500);
      }
    });
    prevMilestoneIdsRef.current = new Set(unlockedMilestones);
  }, [unlockedMilestones]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ringtone_history');
    if (savedHistory) {
      try {
        const rawParsedHistory = JSON.parse(savedHistory);
        const parsedHistory = sanitizeHistory(rawParsedHistory);
        setHistory(parsedHistory);
        if (!Array.isArray(rawParsedHistory) || rawParsedHistory.length !== parsedHistory.length) {
          localStorage.setItem('ringtone_history', JSON.stringify(parsedHistory));
        }
      } catch {
        localStorage.removeItem('ringtone_history');
        setHistory([]);
      }
    }

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

    const savedTriggers = localStorage.getItem('callmate_triggers');
    if (savedTriggers) try { setAnxietyTriggers(JSON.parse(savedTriggers)); } catch {}
    const savedImpact = localStorage.getItem('callmate_impact');
    if (savedImpact) try { setLifeImpact(JSON.parse(savedImpact)); } catch {}

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

    const savedLastScript = localStorage.getItem('callmate_last_script_date');
    if (savedLastScript) setLastScriptDate(parseInt(savedLastScript));
  }, []);

  const viewRef = React.useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const editableSelector = 'input, textarea, select, [contenteditable="true"]';
    const ensureTimers = new Set<number>();

    const isEditable = (element: Element | null): element is HTMLElement => {
      return !!element && element instanceof HTMLElement && element.matches(editableSelector);
    };

    const findScrollableParent = (element: HTMLElement) => {
      let current: HTMLElement | null = element.parentElement;
      while (current) {
        const style = window.getComputedStyle(current);
        const canScroll = /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight;
        if (canScroll) return current;
        current = current.parentElement;
      }
      return null;
    };

    const setViewportMetrics = () => {
      const visualViewport = window.visualViewport;
      const height = visualViewport?.height ?? window.innerHeight;
      const keyboardInset = Math.max(0, window.innerHeight - height - (visualViewport?.offsetTop ?? 0));
      document.documentElement.style.setProperty('--app-vh', `${height}px`);
      document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
    };

    const ensureVisible = (target: Element | null, behavior: ScrollBehavior) => {
      if (!isEditable(target)) return;

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const rect = target.getBoundingClientRect();
      const topPadding = 24;
      const bottomPadding = 16;
      const visibleTop = topPadding;
      const visibleBottom = Math.max(visibleTop + rect.height + bottomPadding, viewportHeight - bottomPadding);

      if (rect.top >= visibleTop && rect.bottom <= visibleBottom) {
        return;
      }

      const scrollParent = findScrollableParent(target);
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const parentVisibleTop = Math.max(parentRect.top + topPadding, visibleTop);
        const parentVisibleBottom = Math.min(parentRect.bottom - bottomPadding, visibleBottom);

        if (rect.bottom > parentVisibleBottom) {
          scrollParent.scrollBy({ top: rect.bottom - parentVisibleBottom + 20, behavior });
          return;
        }

        if (rect.top < parentVisibleTop) {
          scrollParent.scrollBy({ top: rect.top - parentVisibleTop - 20, behavior });
          return;
        }

        return;
      }

      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
      const adjustedRect = target.getBoundingClientRect();
      if (adjustedRect.bottom > visibleBottom) {
        window.scrollBy({ top: adjustedRect.bottom - visibleBottom + 20, behavior });
      } else if (adjustedRect.top < visibleTop) {
        window.scrollBy({ top: adjustedRect.top - visibleTop - 20, behavior });
      }
    };

    const scheduleEnsureVisible = (target: Element | null, behavior: ScrollBehavior = 'smooth') => {
      ensureTimers.forEach(timer => window.clearTimeout(timer));
      ensureTimers.clear();
      [0, 120, 280, 520].forEach(delay => {
        const timer = window.setTimeout(() => {
          ensureVisible(target, behavior);
          ensureTimers.delete(timer);
        }, delay);
        ensureTimers.add(timer);
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      scheduleEnsureVisible(event.target as Element | null);
    };

    const handleViewportChange = () => {
      setViewportMetrics();
      scheduleEnsureVisible(document.activeElement, 'auto');
    };

    setViewportMetrics();

    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      ensureTimers.forEach(timer => window.clearTimeout(timer));
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // ─── Supabase session management ──────────────────────────────────────────
  useEffect(() => {
    // Check for existing session and enforce minimum splash duration in parallel.
    const init = async () => {
      try {
        const { supabase: sb } = await import('./services/supabase');
        const [{ data: { session } }] = await Promise.all([
          sb.auth.getSession(),
          new Promise<void>(resolve => setTimeout(resolve, 2000)),
        ]);
        if (session?.user) {
          setSupabaseUser(session.user);
          if (session.user.email) {
            setUserEmail(session.user.email);
            localStorage.setItem('callmate_user_email', session.user.email);
          }
          const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
          await loadUserDataFromSupabase(session.user.id);
          localStorage.removeItem(AUTH_INTENT_KEY);
          setView(authIntent === 'signup' ? 'setup' : 'home');
          enforceAccessGate();
        } else {
          const hasSeenOnboarding = localStorage.getItem(HAS_SEEN_ONBOARDING_KEY) === 'true';
          if (hasSeenOnboarding) {
            setView('account');
          } else {
            localStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
            setView('explainer');
          }
        }
      } catch (error) {
        console.error('App init failed', error);
        localStorage.removeItem(AUTH_INTENT_KEY);
        setSupabaseUser(null);
        setUserEmail('');
        setView('account');
      }
    };
    init();

    // Listen for future auth state changes (login / logout)
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Always sync user state for any event that has a valid session
        setSupabaseUser(session.user);
        if (session.user.email) {
          setUserEmail(session.user.email);
          localStorage.setItem('callmate_user_email', session.user.email);
        }
        if (event === 'SIGNED_IN') {
          try {
            await loadUserDataFromSupabase(session.user.id);
          } catch (error) {
            console.error('Failed to load user data after sign in', error);
          }
          const hasAccess = enforceAccessGate();
          const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
          if (authIntent) {
            localStorage.removeItem(AUTH_INTENT_KEY);
          }
          
          // Only automatically set view if we are currently in an onboarding/auth view
          // This avoids interrupting the user if they are already using the app
          if (hasAccess && ['splash', 'explainer', 'onboarding', 'reviews', 'account'].includes(viewRef.current)) {
            const isNewUser = authIntent === 'signup' || Date.now() - new Date(session.user.created_at).getTime() < 30000;
            setView(isNewUser ? 'setup' : 'home');
          }
        }
      } else {
        setSupabaseUser(null);
        if (event === 'SIGNED_OUT') {
          setUserEmail('');
          localStorage.removeItem('callmate_user_email');
          setView('account');
        }
      }
    });

    // Handle deep link callback from OAuth (com.trycallmate.app://login-callback)
    const setupDeepLink = async () => {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { App: CapApp } = await import('@capacitor/app');
      const completePendingAuthIfNeeded = async () => {
        const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
        if (!authIntent) return;
        const { supabase: sb } = await import('./services/supabase');
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) {
            setSupabaseUser(session.user);
            if (session.user.email) {
              setUserEmail(session.user.email);
              localStorage.setItem('callmate_user_email', session.user.email);
            }
            await loadUserDataFromSupabase(session.user.id);
            localStorage.removeItem(AUTH_INTENT_KEY);
            const hasAccess = enforceAccessGate();
            if (hasAccess) {
              setView(authIntent === 'signup' ? 'setup' : 'home');
            }
            return;
          }

          await new Promise(resolve => window.setTimeout(resolve, 250));
        }

        console.error('Pending auth session was not available after callback.');
      };

      const handleAuthCallbackUrl = async (url?: string | null) => {
        if (!url?.startsWith('com.trycallmate.app://')) return;
        // Close the browser immediately so the user is back in the app
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
        // Support both PKCE code callbacks and token-based email redirects.
        const { supabase: sb } = await import('./services/supabase');
        const params = new URLSearchParams(url.replace('#', '?').split('?')[1] ?? '');
        const code = params.get('code');
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('OAuth code exchange failed', error);
            return;
          }
          await completePendingAuthIfNeeded();
          return;
        }

        const accessToken = params.get('access_token');
        if (accessToken) {
          const refreshToken = params.get('refresh_token');
          const { error } = await sb.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (error) {
            console.error('OAuth token session restore failed', error, { hasRefreshToken: !!refreshToken });
            return;
          }
        }

        await completePendingAuthIfNeeded();
      };

      const launchUrl = await CapApp.getLaunchUrl();
      await handleAuthCallbackUrl(launchUrl?.url);

      CapApp.addListener('appUrlOpen', async ({ url }) => {
        await handleAuthCallbackUrl(url);
      });

      CapApp.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        await completePendingAuthIfNeeded();
      });
    };
    setupDeepLink();

    return () => subscription.unsubscribe();
  }, []);

  // Scroll to top whenever navigating to the main home view
  useEffect(() => {
    if (view === 'home') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [view]);

  useEffect(() => {
    if (!supabaseUser) return;

    const syncTimer = window.setTimeout(() => {
      void upsertProfile(supabaseUser.id, {
        name: userName.trim() || null,
        gender: userGender || null,
        age_range: userAgeRange || null,
        anxiety_severity: anxietySeverity || null,
        anxiety_triggers: anxietyTriggers,
        life_impact: lifeImpact,
        call_streak: callStreak,
        tier,
        trial_start_date: trialStartDate,
        dark_mode: isDark,
      });
    }, 250);

    return () => window.clearTimeout(syncTimer);
  }, [
    supabaseUser,
    userName,
    userGender,
    userAgeRange,
    anxietySeverity,
    anxietyTriggers,
    lifeImpact,
    callStreak,
    tier,
    trialStartDate,
    isDark,
  ]);

  // Safeguard: Redirect to home if logged in and trying to access onboarding
  useEffect(() => {
    const isAuthenticating = ['account', 'setup'].includes(view);
    const isOnboarding = ['explainer', 'onboarding', 'reviews'].includes(view);
    
    // Only redirect to home if we have a verified email AND we are on a landing/onboarding page
    // and NOT currently in the middle of the auth/setup flow.
    if (userEmail && isOnboarding && !isAuthenticating) {
      setView('home');
    }
  }, [userEmail, view]);

  const loadUserDataFromSupabase = async (userId: string) => {
    const [remoteScripts, remoteReflections, remoteRatings, remotePersonas, profile] = await Promise.all([
      fetchScripts(userId),
      fetchReflections(userId),
      fetchAnxietyRatings(userId),
      fetchPersonas(userId),
      fetchProfile(userId),
    ]);

    const sanitizedRemoteScripts = sanitizeHistory(remoteScripts);
    if (sanitizedRemoteScripts.length) {
      setHistory(sanitizedRemoteScripts);
      localStorage.setItem('ringtone_history', JSON.stringify(sanitizedRemoteScripts));
    }
    if (remoteReflections.length) {
      setReflections(remoteReflections);
      localStorage.setItem('ringtone_reflections', JSON.stringify(remoteReflections));
    }
    if (remoteRatings.length) {
      const mappedRatings = remoteRatings
        .map(r => ({
          id: r.id,
          scriptId: r.script_id,
          rating: r.rating,
          timestamp: r.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setCallAnxietyRatings(mappedRatings);
      localStorage.setItem('callmate_anxiety_ratings', JSON.stringify(mappedRatings));
    }
    if (remotePersonas.length) {
      setPersonas(remotePersonas);
      localStorage.setItem('callmate_personas', JSON.stringify(remotePersonas));
    }
    if (profile) {
      if (profile.name) { setUserName(profile.name); localStorage.setItem('callmate_user_name', profile.name); }
      if (profile.gender !== undefined && profile.gender !== null) { setUserGender(profile.gender); localStorage.setItem('callmate_user_gender', profile.gender); }
      if (profile.age_range !== undefined && profile.age_range !== null) { setUserAgeRange(profile.age_range); localStorage.setItem('callmate_user_age_range', profile.age_range); }
      if (profile.anxiety_severity) { setAnxietySeverity(profile.anxiety_severity as AnxietySeverity); localStorage.setItem('callmate_severity', profile.anxiety_severity); }
      if (Array.isArray(profile.anxiety_triggers)) { setAnxietyTriggers(profile.anxiety_triggers); localStorage.setItem('callmate_triggers', JSON.stringify(profile.anxiety_triggers)); }
      if (Array.isArray(profile.life_impact)) { setLifeImpact(profile.life_impact); localStorage.setItem('callmate_impact', JSON.stringify(profile.life_impact)); }
      if (typeof profile.call_streak === 'number') { setCallStreak(profile.call_streak); localStorage.setItem('callmate_streak', String(profile.call_streak)); }
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

  const handleDeleteBranch = (index: number) => {
    if (!currentScript?.extraBranches) return;
    const updated = {
      ...currentScript,
      extraBranches: currentScript.extraBranches.filter((_, i) => i !== index)
    };
    setCurrentScript(updated);
    const newHistory = history.map(h => h.id === updated.id ? updated : h);
    setHistory(newHistory);
    localStorage.setItem('ringtone_history', JSON.stringify(newHistory));
  };

  const handleGenerate = async (overrideTone?: Tone, overrideDesc?: string) => {
    const targetTone = overrideTone || tone;
    const targetDescription = overrideDesc || (overrideTone ? currentScript?.description : description) || description;
    
    // Check for limits
    if (!isPremium) {
      console.warn('Generate blocked: user is not premium or trial is inactive.', { tier, trialDaysRemaining });
      setShowUpgradeModal(true);
      return;
    }
    if (tier === 'trial' && trialScriptsUsed >= TRIAL_SCRIPT_LIMIT) {
      console.warn('Generate blocked: trial script limit reached.', { tier, trialScriptsUsed, limit: TRIAL_SCRIPT_LIMIT });
      setShowUpgradeModal(true);
      return;
    }

    const sanitizedDescription = targetDescription.trim().slice(0, 500);
    if (!sanitizedDescription) return;
    if (overrideTone) setIsRewriting(true); else setLoading(true);
    try {
      const userProfile = {
        name: userName || undefined,
        gender: userGender || undefined,
        ageRange: userAgeRange || undefined,
        anxietySeverity: anxietySeverity || undefined,
        anxietyTriggers: anxietyTriggers.length > 0 ? anxietyTriggers : undefined,
        lifeImpact: lifeImpact.length > 0 ? lifeImpact : undefined,
      };
      const script = await generateCallScript(sanitizedDescription, targetTone, perspective, selectedPersona || undefined, userProfile);
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

      hapticSuccess();
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
      console.error('Failed to generate script', error);
      hapticError();
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate script. ${message}`);
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
    // If already playing, stop
    if (isPracticePlaying) {
      practiceAudioRef.current?.pause();
      practiceAudioRef.current = null;
      setIsPracticePlaying(false);
      setIsPracticeMode(false);
      return;
    }
    setIsPracticeMode(true);
    try {
      const textToRead = `${currentScript.opening}. ${currentScript.mainAsk}. ${currentScript.close}`;
      const audioUrl = await generateTTS(textToRead);
      const audio = new Audio(audioUrl);
      practiceAudioRef.current = audio;
      audio.play();
      setIsPracticePlaying(true);
      setIsPracticeMode(false);
      audio.onended = () => {
        setIsPracticePlaying(false);
        practiceAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error(error);
      setIsPracticeMode(false);
      setIsPracticePlaying(false);
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

  const saveReflection = async (feedback: string, anxietyRating?: number) => {
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

    if (supabaseUser) {
      void dbSaveReflection(supabaseUser.id, reflection);
    }

    if (anxietyRating !== undefined) {
      const existingRating = callAnxietyRatings.find((rating) => rating.scriptId === currentScript.id);
      const newRating: AnxietyRating = {
        id: existingRating?.id ?? crypto.randomUUID(),
        scriptId: currentScript.id,
        rating: anxietyRating,
        timestamp: Date.now()
      };
      const newRatings = existingRating
        ? callAnxietyRatings
            .map((rating) => rating.scriptId === currentScript.id ? newRating : rating)
            .sort((a, b) => a.timestamp - b.timestamp)
        : [...callAnxietyRatings, newRating];
      setCallAnxietyRatings(newRatings);
      localStorage.setItem('callmate_anxiety_ratings', JSON.stringify(newRatings));

      if (supabaseUser) {
        void syncAnxietyRatings(supabaseUser.id, [newRating]);
      }

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

  const toggleSafeLine = (index: number) => {
    setExpandedSafeLineIndex(current => (current === index ? null : index));
  };

  if (view === 'splash') return (
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-[3rem] bg-[#8fae9e]/35"
        />
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
          className="absolute inset-0 rounded-[3rem] bg-[#d9c4a4]/28"
        />
        <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10", isDark ? "bg-[#22312b]" : "bg-[#4d6f62]")}>
          <Logo className="w-18 h-18 text-[#f8f4ed]" />
        </div>
      </motion.div>
      <h1 className="text-5xl font-semibold tracking-tight mt-8 relative z-10">Callmate</h1>
      <p className={cn("mt-2 relative z-10 text-sm font-medium", isDark ? "text-[#b6c2bc]" : "text-[#66756f]")}>A steadier way into hard calls.</p>
      <p className={cn("mt-8 relative z-10 text-base", isDark ? "text-[#e1e8e3]" : "text-[#3f5049]")}>You can handle this call.</p>
    </div>
  );

  if (view === 'explainer') return (
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <div className="relative z-10 flex-1 flex flex-col justify-between px-7 pt-14 pb-10 max-w-md mx-auto w-full">

        {/* Top section */}
        <div className="space-y-8">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isDark ? "text-[#9fc0b0]" : "text-[#5d8a7a]")}>
            A real form of anxiety
          </motion.p>

          {/* Definition */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
            <h1 className="text-6xl font-semibold tracking-tight leading-none">Tele&shy;phobia</h1>
            <p className={cn("text-sm tracking-wide", isDark ? "text-[#96a49e]" : "text-[#87938d]")}>/ˌtelɪˈfəʊbiə/ · noun</p>
            <p className={cn("text-base leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>
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
              <div key={stat} className={cn("flex items-center gap-4 p-4 rounded-2xl border warm-panel", isDark ? "bg-[#202926]/80 border-[#415049]" : "")}>
                <p className={cn("text-xl font-black w-14 shrink-0 tabular-nums", isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>{stat}</p>
                <p className={cn("text-sm leading-snug", isDark ? "text-[#d8e0db]" : "text-[#51615b]")}>{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="space-y-5 pt-6">
          <p className={cn("text-2xl font-semibold text-center", isDark ? "text-[#f5efe5]" : "text-[#22312b]")}>
            You are not broken.
          </p>
          <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base" onClick={() => setView('onboarding')}>
            Help me feel steadier <ChevronRight className="w-4 h-4" />
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
      <div className={cn("app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
        {/* Progress dots */}
        <div className="relative z-10 flex items-center justify-center gap-2 pt-10 pb-2 shrink-0">
          {[1, 2, 3, 4, 5].map(s => (
            <motion.div key={s} layout animate={{ width: s === onboardingStep ? 28 : 8 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn("h-1.5 rounded-full", s <= onboardingStep ? "bg-[#7b9d76]" : (isDark ? "bg-[#33403b]" : "bg-[#d8cdc0]"))} />
          ))}
        </div>

        <div className="keyboard-aware flex-1 flex flex-col px-7 pb-8 max-w-md mx-auto w-full relative z-10 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Profile ── */}
            {onboardingStep === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
                <div className="shrink-0 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5d8a7a] mb-3">Step 1 of 5 · Your Profile</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">Let's personalize your experience.</h2>
                </div>
                <div className={cn("mb-4 rounded-2xl p-4 flex items-start gap-3 border shrink-0", isDark ? "bg-[#202926] border-[#415049]" : "bg-[rgba(255,251,245,0.86)] border-[#d8cdc0]")}>
                  <span className="text-lg shrink-0">✨</span>
                    <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>
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
                      className={cn("w-full px-4 py-3.5 rounded-2xl border text-base font-medium focus:outline-none transition-all", isDark ? "bg-[#202926] border-[#415049] text-white placeholder:text-[#81918a] focus:border-[#7b9d76]" : "bg-[rgba(255,251,245,0.92)] border-[#d8cdc0] text-[#22312b] placeholder:text-[#95a19c] focus:border-[#7b9d76]")}
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
                              ? "bg-[#5d8a7a] border-[#5d8a7a] text-white"
                              : isDark ? "bg-[#202926] border-[#415049] text-[#c8d2cc] hover:border-[#66756f]" : "bg-[#f6f0e8] border-[#d8cdc0] text-[#66756f] hover:border-[#b7aa96]"
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
                              ? "bg-[#5d8a7a] border-[#5d8a7a] text-white"
                              : isDark ? "bg-[#202926] border-[#415049] text-[#c8d2cc] hover:border-[#66756f]" : "bg-[#f6f0e8] border-[#d8cdc0] text-[#66756f] hover:border-[#b7aa96]"
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5d8a7a] mb-3">Step 2 of 5 · Assessment</p>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5d8a7a] mb-3">Step 3 of 5 · Triggers</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">What's your biggest fear on a call?</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Select all that apply — this shapes your recovery plan.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-2">
                  {TRIGGERS.map(trigger => {
                    const selected = anxietyTriggers.includes(trigger);
                    return (
                      <motion.button key={trigger} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const next = selected ? anxietyTriggers.filter(t => t !== trigger) : [...anxietyTriggers, trigger];
                          setAnxietyTriggers(next);
                          localStorage.setItem('callmate_triggers', JSON.stringify(next));
                        }}
                        className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3",
                          selected ? "border-[#7b9d76] bg-[#7b9d76]/10" : isDark ? "border-[#415049] bg-[#202926]/70 hover:border-[#66756f]" : "border-[#d8cdc0] bg-[rgba(255,251,245,0.88)] hover:border-[#b7aa96]"
                        )}>
                        <div className={cn("w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all", selected ? "border-[#5d8a7a] bg-[#5d8a7a]" : isDark ? "border-[#66756f]" : "border-[#b7aa96]")}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <p className={cn("text-sm font-medium leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>{trigger}</p>
                      </motion.button>
                    );
                  })}
                  {/* Custom trigger input */}
                  <div className={cn("w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3", isDark ? "border-[#415049] bg-[#202926]/70" : "border-[#d8cdc0] bg-[rgba(255,251,245,0.88)]")}>
                    <div className={cn("w-5 h-5 rounded-md border-2 shrink-0", isDark ? "border-[#66756f]" : "border-[#b7aa96]")} />
                    <input
                      type="text"
                      value={customTriggerInput}
                      onChange={e => setCustomTriggerInput(e.target.value)}
                      placeholder="Something else..."
                      className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-zinc-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customTriggerInput.trim()) {
                          const t = customTriggerInput.trim();
                          if (!anxietyTriggers.includes(t)) {
                            const next = [...anxietyTriggers, t];
                            setAnxietyTriggers(next);
                            localStorage.setItem('callmate_triggers', JSON.stringify(next));
                          }
                          setCustomTriggerInput('');
                        }
                      }}
                    />
                    {customTriggerInput.trim() && (
                      <button
                        onClick={() => {
                          const t = customTriggerInput.trim();
                          if (!anxietyTriggers.includes(t)) {
                            const next = [...anxietyTriggers, t];
                            setAnxietyTriggers(next);
                            localStorage.setItem('callmate_triggers', JSON.stringify(next));
                          }
                          setCustomTriggerInput('');
                        }}
                        className="text-[#5d8a7a] text-xs font-bold shrink-0"
                      >Add</button>
                    )}
                  </div>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5d8a7a] mb-3">Step 4 of 5 · Impact</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-2">Where is phone anxiety costing you the most?</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Pick up to 2 — we'll prioritize those scenarios in your plan.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-2">
                  {IMPACT_AREAS.map(area => {
                    const selected = lifeImpact.includes(area.label);
                    const maxed = lifeImpact.length >= 2 && !selected;
                    return (
                      <motion.button key={area.label} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (maxed) return;
                          const next = selected ? lifeImpact.filter(i => i !== area.label) : [...lifeImpact, area.label];
                          setLifeImpact(next);
                          localStorage.setItem('callmate_impact', JSON.stringify(next));
                        }}
                        className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                          selected ? "border-[#7b9d76] bg-[#7b9d76]/10" : maxed ? "opacity-40 border-[#415049] bg-[#202926]/40 cursor-not-allowed"
                          : isDark ? "border-[#415049] bg-[#202926]/70 hover:border-[#66756f]" : "border-[#d8cdc0] bg-[rgba(255,251,245,0.88)] hover:border-[#b7aa96]"
                        )}>
                        <span className="text-2xl shrink-0">{area.icon}</span>
                        <p className={cn("text-sm font-medium flex-1", isDark ? "text-zinc-200" : "text-zinc-800")}>{area.label}</p>
                        {selected && <Check className="w-4 h-4 text-[#5d8a7a] shrink-0" />}
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7b9d76] mb-3">Step 5 of 5 · Your Plan</p>
                  <h2 className="text-3xl font-bold tracking-tight leading-tight mb-1">Here's what beating telephobia looks like.</h2>
                  <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-500")}>Most users feel measurably less anxious within 2 weeks.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-2">
                  <OnboardingDemoDashboard isDark={isDark} />
                </div>
                <div className="shrink-0 pt-4 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base bg-[#5d8a7a] hover:bg-[#527a6c] shadow-[#5d8a7a]/20" onClick={() => {
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
      // Get fresh session — supabaseUser closure may be stale at this point
      const { supabase: sb } = await import('./services/supabase');
      const { data: { session: freshSession } } = await sb.auth.getSession();
      if (!freshSession?.user) {
        throw new Error('No active auth session found.');
      }

      setSupabaseUser(freshSession.user);
      const resolvedEmail = freshSession.user.email ?? email;
      if (resolvedEmail) {
        setUserEmail(resolvedEmail);
        localStorage.setItem('callmate_user_email', resolvedEmail);
      }

      // Push local data to Supabase on first signup
      if (isNewUser) {
        await pushLocalDataToSupabase(freshSession.user.id, {
          scripts: history,
          reflections,
          anxietyRatings: callAnxietyRatings,
          personas,
          name: userName,
          gender: userGender,
          ageRange: userAgeRange,
          anxietySeverity,
          anxietyTriggers,
          lifeImpact,
          callStreak,
          tier,
          trialStartDate,
          darkMode: isDark,
        });
      }
      setView(isNewUser ? 'setup' : 'home');
    }}
  />;

  if (view === 'setup') return <SetupAnimation
    isDark={isDark}
    userName={userName}
    onDone={() => setView('home')}
  />;

  if (view === 'reviews') return (
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <div className="flex-1 flex flex-col px-6 py-10 overflow-y-auto max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
          <p className={cn("text-xs font-black uppercase tracking-[0.25em] mb-3", isDark ? "text-[#b7d0c4]" : "text-[#7b9d76]")}>
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
              className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-[#202926]/80 border-[#415049]" : "bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]")}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                  <p className={cn("text-[10px]", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>{r.location} · {r.tag}</p>
                </div>
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>"{r.quote}"</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-6 space-y-3">
          <Button
            size="xl"
            className="w-full bg-[#5d8a7a] hover:bg-[#527a6c] text-white shadow-lg shadow-[#5d8a7a]/20"
            onClick={() => {
              if (supabaseUser) {
                setView('home');
                setShowUpgradeModal(true);
                setUpgradeModalForced(true);
                return;
              }
              setView('account');
            }}
          >
            Let's get started <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen warm-therapeutic-bg transition-colors duration-500 selection:bg-white/10 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-zinc-900 text-zinc-300 text-xs font-semibold py-2 px-4"
          >
            <WifiOff className="w-3.5 h-3.5" /> You're offline — scripts saved locally
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone toast */}
      <AnimatePresence>
        {milestoneToast && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border"
            style={{ background: isDark ? '#202926' : '#fff', borderColor: isDark ? '#415049' : '#d8cdc0' }}
          >
            <span className="text-2xl">{milestoneToast.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Achievement Unlocked</p>
              <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-black")}>{milestoneToast.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={cn("sticky top-0 z-40 border-b px-6 py-4 flex items-center justify-between transition-colors", isDark ? "bg-[#161d1b]/95 border-[#33403b]" : "bg-[rgba(243,238,228,0.92)] border-[#d8cdc0]")}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isDark ? "bg-[#22312b]" : "bg-[#5d8a7a]")}>
            <Logo className="w-6 h-6 text-[#fbf8f2]" />
          </div>
          <span className="font-bold text-xl">Callmate</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('settings')}
            className={cn(
              "p-2 rounded-xl transition-all",
              view === 'settings' 
                ? (isDark ? "bg-[#f3eee4] text-[#22312b]" : "bg-[#5d8a7a] text-white") 
                : (isDark ? "bg-[#202926] text-[#97a59f] hover:bg-[#293330]" : "bg-[#ece5da] text-[#66756f] hover:bg-[#e3dacd]")
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>


      <main className="keyboard-aware max-w-2xl mx-auto p-6 pb-48">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <div key="home" className="space-y-8">

              {/* Comeback nudge — avoidance detection */}
              {showComebackNudge && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl border flex items-start justify-between gap-3 transition-colors",
                    isDark ? "bg-[#443925]/40 border-[#8f7752]" : "bg-[#f5ecd9] border-[#ddc8a5]"
                  )}
                >
                  <div className="flex-1">
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-1", isDark ? "text-[#dfc090]" : "text-[#a17e4d]")}>You've been quiet</p>
                    <p className={cn("text-sm font-semibold leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>
                      It's been a couple of days. The call you've been putting off is still waiting. You can come back to it gently.
                    </p>
                  </div>
                  <button onClick={() => setComebackNudgeDismissed(true)} className="shrink-0 p-1 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              <HomeScreen
                isDark={isDark}
                nextMilestone={history.length > 0 ? nextMilestone : null}
                currentScript={currentScript}
                setView={setView}
                sortedCallTypes={sortedCallTypes}
                sortMode={sortMode}
                setSortMode={setSortMode}
                description={description}
                setDescription={setDescription}
                isPremium={isPremium}
                personas={personas}
                selectedPersona={selectedPersona}
                setSelectedPersona={setSelectedPersona}
                perspective={perspective}
                setPerspective={setPerspective}
                tone={tone}
                setTone={setTone}
                loading={loading}
                handleGenerate={handleGenerate}
                expandedSafeLineIndex={expandedSafeLineIndex}
                toggleSafeLine={toggleSafeLine}
              />

            </div>
          )}

          {view === 'settings' && (
            <SettingsScreen
              key="settings"
              isDark={isDark}
              activeTab={activeTab}
              setView={setView}
              supabaseUser={supabaseUser}
              userEmail={userEmail}
              userName={userName}
              signOut={signOut}
              setSupabaseUser={setSupabaseUser}
              setUserEmail={setUserEmail}
              isPremium={isPremium}
              setShowUpgradeModal={setShowUpgradeModal}
              setTheme={setTheme}
              personas={personas}
              setSelectedPersona={setSelectedPersona}
              setShowPersonaModal={setShowPersonaModal}
              setPersonas={setPersonas}
              tier={tier}
              historyLength={history.length}
              clearHistory={clearHistory}
            />
          )}

          {view === 'dashboard' && (
            <DashboardScreen
              key="dashboard"
              isDark={isDark}
              historyLength={history.length}
              recoveryScore={recoveryScore}
              callStreak={callStreak}
              callAnxietyRatings={callAnxietyRatings}
              milestones={MILESTONES}
              unlockedMilestones={unlockedMilestones}
              anxietySeverity={anxietySeverity}
              lifeImpact={lifeImpact}
            />
          )}

          {view === 'history' && (
            <HistoryScreen
              key="history"
              isDark={isDark}
              currentScript={currentScript}
              setView={setView}
              isPremium={isPremium}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredHistory={filteredHistory}
              setCurrentScript={setCurrentScript}
              setPreviousView={setPreviousView}
              toggleStar={toggleStar}
              starredScripts={starredScripts}
            />
          )}

          {view === 'script' && currentScript && (
            <ScriptScreen
              key="script"
              isDark={isDark}
              currentScript={currentScript}
              isMedicalCall={isMedicalCall}
              showMedicalPrep={showMedicalPrep}
              onHideMedicalPrep={() => setShowMedicalPrep(false)}
              showSpeakerPrompt={showSpeakerPrompt}
              setShowSpeakerPrompt={setShowSpeakerPrompt}
              previousView={previousView}
              setActiveTab={setActiveTab}
              setView={setView}
              isPremium={isPremium}
              handlePractice={handlePractice}
              isPracticeMode={isPracticeMode}
              isPracticePlaying={isPracticePlaying}
              toggleStar={toggleStar}
              starredScripts={starredScripts}
              handleShare={handleShare}
              shareToast={shareToast}
              showAlterEgo={showAlterEgo}
              setShowAlterEgo={setShowAlterEgo}
              handleVoicemail={handleVoicemail}
              handleEmailFallback={handleEmailFallback}
              voicemailScript={voicemailScript}
              emailFallback={emailFallback}
              isRewriting={isRewriting}
              setTone={setTone}
              handleGenerate={handleGenerate}
              onShowPreCallCheck={() => {
                setPreCallCheckMode('script');
                setShowPreCallCheck(true);
              }}
              onShowReflectionPrompt={() => { hapticLight(); setShowReflectionPrompt(true); }}
              onShowPanicPanel={() => { hapticMedium(); setShowPanicPanel(true); setPanicCategory(null); setPanicResponse(null); }}
              scriptSections={
                <div className={cn("space-y-4 pb-32 transition-opacity", isRewriting && "opacity-50")}>
                  <ScriptSection title="Opening" step={1} content={currentScript.opening} isExpanded={expandedSections.opening} onToggle={() => setExpandedSections(p => ({...p, opening: !p.opening}))} isDark={isDark} color="blue" />
                  <ScriptSection title="Main Ask" step={2} content={currentScript.mainAsk} isExpanded={expandedSections.mainAsk} onToggle={() => setExpandedSections(p => ({...p, mainAsk: !p.mainAsk}))} isDark={isDark} color="purple" />
                  <ScriptSection title="Branch A" condition={currentScript.branchX.condition} content={currentScript.branchX.response} isBranch isExpanded={expandedSections.branchX} onToggle={() => setExpandedSections(p => ({...p, branchX: !p.branchX}))} isDark={isDark} color="emerald" />
                  <ScriptSection title="Branch B" condition={currentScript.branchY.condition} content={currentScript.branchY.response} isBranch isExpanded={expandedSections.branchY} onToggle={() => setExpandedSections(p => ({...p, branchY: !p.branchY}))} isDark={isDark} color="amber" />
                  {currentScript.extraBranches?.map((branch, i) => (
                    <ScriptSection
                      key={`extra-${i}`}
                      title="Extra Branch"
                      condition={branch.condition}
                      content={branch.response}
                      isBranch
                      isExpanded={true}
                      onToggle={() => {}}
                      onDelete={() => handleDeleteBranch(i)}
                      isDark={isDark}
                      color="amber"
                    />
                  ))}

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
              }
            />
          )}
        </AnimatePresence>
      </main>

      {['home', 'history', 'dashboard', 'settings'].includes(view) && !showPreCallCheck && (
        <div className="fixed bottom-[104px] right-6 z-[65] max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setPreCallCheckMode('breathe');
              setShowPreCallCheck(true);
            }}
            className={cn(
              "px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2 font-bold text-sm transition-all active:scale-[0.98]",
              isDark
                ? "bg-[#202926] border-[#415049] text-[#dbe8df] hover:border-[#66756f]"
                : "bg-[rgba(255,251,245,0.96)] border-[#d8cdc0] text-[#476f61] hover:border-[#b7aa96]"
            )}
          >
            <span>🧘</span>
            Breathe
          </button>
        </div>
      )}

      <nav className={cn("fixed bottom-0 left-0 right-0 border-t px-4 py-3 pb-8 z-50 flex items-center justify-around max-w-2xl mx-auto shadow-2xl transition-colors", isDark ? "bg-black border-white/5" : "bg-white border-black/5")}>
        {/* New Call */}
        <button onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'home' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'home' ? (isDark ? "bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "bg-blue-500/10") : "group-hover:bg-zinc-800/50")}>
            <Plus className={cn("w-6 h-6", activeTab === 'home' ? (isDark ? "text-blue-400" : "text-blue-600") : "")} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Prepare</span>
        </button>
        {/* Progress */}
        <button onClick={() => { setActiveTab('dashboard'); setView('dashboard'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'dashboard' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'dashboard' ? (isDark ? "bg-emerald-600/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-emerald-500/10") : "group-hover:bg-zinc-800/50")}>
            <RotateCcw className={cn("w-6 h-6", activeTab === 'dashboard' ? (isDark ? "text-emerald-400" : "text-emerald-600") : "")} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Progress</span>
        </button>
        {/* Journal */}
        <button onClick={() => { setActiveTab('history'); setView('history'); }}
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'history' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}>
          <div className={cn("p-2 rounded-2xl transition-all duration-300 relative",
            activeTab === 'history' ? (isDark ? "bg-purple-600/20 shadow-[0_0_20px_rgba(147,51,234,0.2)]" : "bg-purple-500/10") : "group-hover:bg-zinc-800/50")}>
            <History className={cn("w-6 h-6", activeTab === 'history' ? (isDark ? "text-purple-400" : "text-purple-600") : "")} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Journal</span>
        </button>
      </nav>

      <AnimatePresence>
        {showPanicPanel && (
          <>
            <div onClick={() => { setShowPanicPanel(false); setPanicResponse(null); }} className="fixed inset-0 bg-black/80 z-[60]" />
            <div className={cn("fixed bottom-0 left-0 right-0 rounded-t-[3rem] z-[70] max-h-[90vh] overflow-y-auto shadow-2xl max-w-2xl mx-auto border-t transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}>
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
                  <button
                    onClick={() => { setShowPanicPanel(false); setPanicResponse(null); setPanicCategory(null); }}
                    className={cn("p-2 rounded-full transition-colors", isDark ? "bg-zinc-800" : "bg-zinc-100")}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {panicLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                    <p className="text-zinc-500 text-sm">Generating response...</p>
                  </div>
                ) : panicResponse ? (
                  <div className="space-y-4">
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
                  </div>
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
                        <button
                          key={cat}
                          onClick={() => setPanicCategory(cat)}
                          className={cn("w-full p-5 border rounded-2xl text-left flex items-center gap-4 transition-all", isDark ? "bg-black border-zinc-800 hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:border-black/20")}
                        >
                          <span className="text-2xl">{catIcons[cat]}</span>
                          <div>
                            <p className={cn("font-bold text-base", isDark ? "text-white" : "text-black")}>{cat}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{catDescriptions[cat]}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Step 2: Choose specific scenario */
                  <div className="space-y-8">
                    <div className="space-y-2">
                      {PANIC_OPTIONS.filter(o => o.category === panicCategory).map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handlePanicAction(opt)}
                          className={cn("w-full p-5 border rounded-2xl text-left transition-all", isDark ? "bg-black border-zinc-800 hover:border-white/20" : "bg-zinc-50 border-zinc-200 hover:border-black/20")}
                        >
                          <p className={cn("text-base font-semibold transition-colors", isDark ? "text-zinc-200" : "text-zinc-800")}>{opt.label}</p>
                          <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
                        </button>
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
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && (
          <>
            <div onClick={() => setShowReviewModal(false)} className="fixed inset-0 bg-black/80 z-[100]" />
            <div className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t max-w-2xl mx-auto transition-colors", isDark ? "bg-[#202926] border-[#415049]" : "bg-[rgba(255,251,245,0.98)] border-[#d8cdc0]")}>
              <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto pb-10">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="text-4xl">🌟</div>
                  <h2 className="text-2xl font-bold">People love Callmate</h2>
                  <p className={cn("text-sm", isDark ? "text-[#c5d0ca]" : "text-[#607068]")}>Real stories from people who made the call.</p>
                </div>

                {/* Reviews */}
                <div className="space-y-3">
                  {[
                    { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after I hung up.", tag: "Medical / Doctor Call" },
                    { name: "James T.", location: "Austin", quote: "Negotiated my rent down $150/month. The Firm tone was unreal — my landlord didn't even push back.", tag: "Landlord Call" },
                    { name: "Priya K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call" },
                    { name: "Marcus R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing. Nothing else comes close.", tag: "Customer Service" },
                  ].map((r, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-[#171f1d] border-[#415049]" : "bg-[#fffdf9] border-[#d8cdc0]")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                          <p className={cn("text-[10px]", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>{r.location} · {r.tag}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0 mt-0.5">
                          {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                      <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>"{r.quote}"</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="space-y-3 pt-1">
                  <p className={cn("text-center text-xs font-semibold", isDark ? "text-[#b7c3bd]" : "text-[#66756f]")}>
                    Enjoying Callmate? A quick review helps others find us.
                  </p>
                  <Button
                    size="xl"
                    className="w-full bg-[#d8b278] hover:bg-[#cca469] text-[#22312b] shadow-lg shadow-[#d8b278]/25"
                    onClick={() => {
                      setShowReviewModal(false);
                      window.open('https://apps.apple.com/app/callmate', '_blank');
                    }}
                  >
                    ⭐⭐⭐⭐⭐ Rate on the App Store
                  </Button>
                  <button onClick={() => setShowReviewModal(false)} className={cn("w-full text-sm font-medium py-1 transition-colors", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#87938d] hover:text-[#66756f]")}>
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradeModal && (
          <>
            <div onClick={() => { if (!upgradeModalForced) setShowUpgradeModal(false); }} className="fixed inset-0 bg-black/80 z-[100]" />
            <div className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t max-w-2xl mx-auto max-h-[94dvh] overflow-y-auto transition-colors", isDark ? "bg-[#202926] border-[#415049]" : "bg-[rgba(255,251,245,0.98)] border-[#d8cdc0]")}>
              <div className="flex justify-center pt-4 pb-2">
                <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-[#5b6962]" : "bg-[#cdbfae]")} />
              </div>

              <div className="px-6 pb-10 space-y-6">
                {/* Personalised header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className={cn("text-2xl font-black leading-tight", isDark ? "text-white" : "text-black")}>
                      {userName ? (
                        <>Hey <span className={cn(isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>{userName}</span>,<br /></>
                      ) : null}
                      Unlock <span className={cn(isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>Callmate</span> to feel steadier on every call.
                    </h2>
                    <p className={cn("text-sm", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>3 days free · No payment due now · Cancel anytime</p>
                  </div>
                  {!upgradeModalForced && (
                    <button onClick={() => setShowUpgradeModal(false)} className={cn("p-2 rounded-full shrink-0 mt-1 transition-colors", isDark ? "bg-[#171f1d] hover:bg-[#2b3632]" : "bg-[#ece5da] hover:bg-[#e2d8ca]")}>
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Benefits */}
                <div className={cn("rounded-2xl border p-4 space-y-2.5 transition-colors", isDark ? "bg-[#171f1d] border-[#415049]" : "bg-[#fffdf9] border-[#d8cdc0]")}>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>Everything included</p>
                  {[
                    { icon: '📞', text: 'Unlimited call scripts — never face a call unprepared' },
                    { icon: '📚', text: 'Full call history — every script saved forever' },
                    { icon: '📉', text: 'Anxiety progress tracking — see your telephobia improve' },
                    { icon: '🚨', text: 'Panic mode — real-time help when calls go sideways' },
                    { icon: '🧘', text: 'Pre-call prep and breathing exercise' },
                    { icon: '🔊', text: 'Practice mode — hear your script read aloud by AI' },
                    { icon: '🎭', text: 'Alter ego mode, custom personas & more' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <span className="text-base shrink-0">{icon}</span>
                      <p className={cn("text-sm leading-snug", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* Pricing options */}
                <div className="space-y-3">
                  {/* Monthly */}
                  <div
                    onClick={() => { setTier('monthly'); localStorage.setItem('ringtone_tier', 'monthly'); setShowUpgradeModal(false); }}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] relative",
                      tier === 'monthly' ? (isDark ? "bg-[#274136]/45 border-[#7fa091]" : "bg-[#eef5f1] border-[#8fae9e]") : (isDark ? "bg-[#171f1d] border-[#415049] hover:border-[#66756f]" : "bg-[#fffdf9] border-[#d8cdc0] hover:border-[#b7aa96]")
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Monthly</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest", isDark ? "bg-[#5d8a7a]/20 text-[#b7d0c4]" : "bg-[#dbe8df] text-[#5d8a7a]")}>Popular</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>Billed monthly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>$6.99<span className={cn("text-sm font-normal", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>/mo</span></p>
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-[#274136]/35 text-[#d7e6df]" : "bg-[#eef5f1] text-[#4d6f62]")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then $6.99/month · No payment due now
                    </div>
                  </div>

                  {/* Annual */}
                  <div
                    onClick={() => { setTier('annual'); localStorage.setItem('ringtone_tier', 'annual'); setShowUpgradeModal(false); }}
                    className={cn(
                      "p-5 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] relative",
                      tier === 'annual' ? (isDark ? "bg-[#314230]/45 border-[#9bb68f]" : "bg-[#f1f5ea] border-[#a9be97]") : (isDark ? "bg-[#171f1d] border-[#415049] hover:border-[#66756f]" : "bg-[#fffdf9] border-[#d8cdc0] hover:border-[#b7aa96]")
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Annual</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest", isDark ? "bg-[#7b9d76]/20 text-[#d3e1cb]" : "bg-[#edf4e8] text-[#6e8f69]")}>Save 30%</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>Best value · Billed yearly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>$58.99<span className={cn("text-sm font-normal", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>/yr</span></p>
                        <p className={cn("text-[10px] font-black", isDark ? "text-[#c6ddb7]" : "text-[#6e8f69]")}>≈ $4.92/mo</p>
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-[#314230]/35 text-[#d9e6cf]" : "bg-[#edf4e8] text-[#587651]")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then $58.99/year · Cancel anytime
                    </div>
                  </div>
                </div>

                <ReviewSlideshow isDark={isDark} />

                <p className={cn("text-center text-xs leading-relaxed", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
                  You won't be charged until your 3-day free trial ends.<br />Cancel anytime before then — no questions asked.
                </p>

                {/* Footer links */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button onClick={() => openInAppBrowser('https://callmate.app/terms')} className={cn("text-xs transition-colors underline underline-offset-2", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#66756f] hover:text-[#4d5d56]")}>Terms of Service</button>
                  <span className={cn("text-xs", isDark ? "text-[#5b6962]" : "text-[#b6a998]")}>·</span>
                  <button onClick={() => openInAppBrowser('https://callmate.app/privacy')} className={cn("text-xs transition-colors underline underline-offset-2", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#66756f] hover:text-[#4d5d56]")}>Privacy Policy</button>
                  <span className={cn("text-xs", isDark ? "text-[#5b6962]" : "text-[#b6a998]")}>·</span>
                  <button
                    onClick={() => {/* restore purchase handler — wire StoreKit here */}}
                    className={cn("text-xs transition-colors underline underline-offset-2", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#66756f] hover:text-[#4d5d56]")}
                  >
                    Restore Purchase
                  </button>
                </div>

                {!upgradeModalForced && (
                  <button onClick={() => setShowUpgradeModal(false)} className={cn("w-full text-sm font-medium py-1 transition-colors", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#87938d] hover:text-[#66756f]")}>Maybe later</button>
                )}
              </div>
            </div>
          </>
        )}

        {showPersonaModal && (
          <>
            <div onClick={() => setShowPersonaModal(false)} className="fixed inset-0 bg-black/80 z-[100]" />
            <div className={cn("fixed bottom-0 left-0 right-0 p-8 rounded-t-[3rem] z-[110] shadow-2xl border-t transition-colors max-w-2xl mx-auto", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{selectedPersona ? 'Edit Call Role' : 'New Call Role'}</h2>
                    <p className={cn("text-sm leading-relaxed", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
                      A call role is the version of you this script should speak from, not the person you are calling.
                    </p>
                  </div>
                  <button onClick={() => setShowPersonaModal(false)} className={cn("p-2 rounded-full", isDark ? "bg-zinc-800" : "bg-zinc-100")}><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Role Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Calm Tenant, Composed Patient, Clear Manager" 
                      defaultValue={selectedPersona?.name}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                      id="persona-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">How This Version of You Speaks</label>
                    <textarea 
                      placeholder="e.g. I am calm, direct, and respectful. I do not over-explain. I ask clearly for what I need and stay grounded if there is pushback." 
                      defaultValue={selectedPersona?.context}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none h-32 resize-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                      id="persona-context"
                    />
                    <p className={cn("text-xs leading-relaxed px-1", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
                      Describe your stance, boundaries, and energy for this kind of call. Tone still controls whether the script sounds professional, assertive, friendly, or firm.
                    </p>
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
                  Save Call Role
                </Button>
              </div>
            </div>
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
            mode={preCallCheckMode}
            onClose={() => setShowPreCallCheck(false)}
          />
        )}

        {showReflectionPrompt && (
          <>
            <div onClick={() => setShowReflectionPrompt(false)} className="fixed inset-0 bg-black/80 z-[100]" />
            <div className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t p-8 max-w-2xl mx-auto transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}>
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
                  <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto">
                    {[
                      { rating: 1, label: 'Calm',       emoji: '😌', color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' },
                      { rating: 2, label: 'Mild',        emoji: '😊', color: 'border-lime-500/60 bg-lime-500/10 text-lime-400' },
                      { rating: 3, label: 'Nervous',     emoji: '😬', color: 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400' },
                      { rating: 4, label: 'Anxious',     emoji: '😰', color: 'border-orange-500/60 bg-orange-500/10 text-orange-400' },
                      { rating: 5, label: 'Near panic',  emoji: '🚨', color: 'border-red-500/60 bg-red-500/10 text-red-400' },
                    ].map(opt => (
                      <button key={opt.rating}
                        onClick={() => saveReflection(`Anxiety: ${opt.rating}/5 — ${opt.label}`, opt.rating)}
                        className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center min-w-0", opt.color)}>
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-[9px] font-black uppercase tracking-wide">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowReflectionPrompt(false)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Skip</button>
              </div>
            </div>
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
    <div className={cn("rounded-2xl border p-4 transition-colors", isDark ? "bg-[#171f1d] border-[#415049]" : "bg-[#fffdf9] border-[#d8cdc0]")}>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="space-y-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[#d8b278] text-[#d8b278]" />)}
          </div>
          <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>"{r.quote}"</p>
          <p className={cn("text-[11px]", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>{r.name} · {r.location} · {r.tag}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-3">
        {SLIDESHOW_REVIEWS.map((_, i) => (
          <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === index ? "w-5 bg-[#d8b278]" : (isDark ? "w-1.5 bg-[#5b6962]" : "w-1.5 bg-[#cdbfae]"))} />
        ))}
      </div>
    </div>
  );
}

function BreathingGuide({
  onComplete,
  soundEnabled,
  vibrationEnabled,
}: {
  onComplete: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}) {
  type Phase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'done';
  const [phase, setPhase] = React.useState<Phase>('ready');
  const [cycle, setCycle] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const TOTAL = 3;
  const START_DELAY = 4000;
  const PAUSE_BETWEEN = 4000;
  const INHALE = 5000, HOLD = 6000, EXHALE = 9000;
  const ACTIVE_CYCLE = INHALE + HOLD + EXHALE;

  React.useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => { setPhase('inhale'); setCycle(0); }, START_DELAY));
    for (let c = 0; c < TOTAL; c++) {
      const base = START_DELAY + c * (ACTIVE_CYCLE + PAUSE_BETWEEN);
      t.push(setTimeout(() => setPhase('hold'), base + INHALE));
      t.push(setTimeout(() => setPhase('exhale'), base + INHALE + HOLD));
      if (c < TOTAL - 1) {
        t.push(setTimeout(() => setPhase('ready'), base + ACTIVE_CYCLE));
        t.push(setTimeout(() => { setPhase('inhale'); setCycle(c + 1); }, base + ACTIVE_CYCLE + PAUSE_BETWEEN));
      }
    }
    t.push(setTimeout(() => setPhase('done'), START_DELAY + TOTAL * ACTIVE_CYCLE + (TOTAL - 1) * PAUSE_BETWEEN));
    return () => t.forEach(clearTimeout);
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current ?? new Audio(breatheAudio);
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.loop = false;

    if (!soundEnabled) {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [soundEnabled]);

  React.useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!soundEnabled) {
      audio.pause();
      return;
    }

    if (phase === 'inhale') {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
      return;
    }

    if (phase === 'hold' || phase === 'exhale') {
      if (audio.paused) {
        void audio.play().catch(() => {});
      }
      return;
    }

    if (phase === 'ready' || phase === 'done') {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [cycle, phase, soundEnabled]);

  React.useEffect(() => {
    if (!['inhale', 'hold', 'exhale'].includes(phase)) return;

    const playPulse = () => {
      if (vibrationEnabled) {
        if ('vibrate' in navigator) {
          navigator.vibrate(
            phase === 'hold'
              ? [320, 120, 320]
              : phase === 'inhale'
                ? [220, 90, 220]
                : [260, 110, 260]
          );
        }
        void (phase === 'hold' ? hapticHeavy() : phase === 'inhale' ? hapticHeavy() : hapticMedium());
      }

    };

    playPulse();

    const pulseInterval = window.setInterval(
      playPulse,
      phase === 'hold' ? 900 : phase === 'inhale' ? 1200 : 1400
    );

    return () => window.clearInterval(pulseInterval);
  }, [phase, soundEnabled, vibrationEnabled]);

  const cfg: Record<Phase, { label: string; sub: string; color: string; scale: number; dur: number }> = {
    ready:  { label: 'Settle in',      sub: 'Find a comfortable position',               color: '#7b9d76', scale: 0.38, dur: 0.5 },
    inhale: { label: 'Breathe In',     sub: 'Slowly inhale through your nose',           color: '#7b9d76', scale: 1.0,  dur: INHALE / 1000 },
    hold:   { label: 'Hold',           sub: 'Hold it gently',                            color: '#d8c5a6', scale: 1.0,  dur: HOLD / 1000 },
    exhale: { label: 'Breathe Out',    sub: 'Slowly exhale through your mouth',          color: '#5d8a7a', scale: 0.38, dur: EXHALE / 1000 },
    done:   { label: 'You are steady', sub: "Your body is calmer now.",                  color: '#5d8a7a', scale: 0.38, dur: 0.5 },
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
              className="text-[#fbf8f2] font-black text-sm drop-shadow-lg leading-tight"
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
          className="text-[#66756f] text-sm text-center"
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
                i < cycle ? "bg-[#7b9d76] w-4" :
                i === cycle ? "bg-[#5d8a7a] w-6" : "bg-[#d8cdc0] w-1.5"
              )}
            />
          ))}
        </div>
      )}

      {/* Done CTA */}
      {phase === 'done' && (
        <button
          onClick={onComplete}
          className="mt-1 px-8 py-3.5 rounded-2xl bg-[#5d8a7a] hover:bg-[#527a6c] active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-[#5d8a7a]/20"
        >
          Continue
        </button>
      )}
    </div>
  );
}

function PreCallCheck({
  isDark,
  mode,
  onClose,
}: {
  isDark: boolean;
  mode: 'script' | 'breathe';
  onClose: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [mantraTaps, setMantraTaps] = React.useState(0);
  const [soundEnabled, setSoundEnabled] = React.useState(() => localStorage.getItem(BREATHE_SOUND_KEY) !== 'false');
  const [vibrationEnabled, setVibrationEnabled] = React.useState(() => localStorage.getItem(BREATHE_VIBRATION_KEY) !== 'false');

  React.useEffect(() => {
    localStorage.setItem(BREATHE_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  React.useEffect(() => {
    localStorage.setItem(BREATHE_VIBRATION_KEY, String(vibrationEnabled));
  }, [vibrationEnabled]);

  return (
    <div className={cn("fixed inset-0 z-[130] flex flex-col warm-therapeutic-bg transition-colors", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-5 shrink-0">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 28 : 8, opacity: i <= step ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn("h-1.5 rounded-full", i <= step ? "bg-[#5d8a7a]" : (isDark ? "bg-[#33403b]" : "bg-[#d8cdc0]"))}
            />
          ))}
        </div>
        <button onClick={onClose} className={cn("text-sm font-semibold transition-colors", isDark ? "text-[#97a59f] hover:text-[#dbe3de]" : "text-[#66756f] hover:text-[#22312b]")}>
          Skip
        </button>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className={cn("rounded-2xl border p-3 space-y-3", isDark ? "bg-[#202926]/88 border-[#415049]" : "bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]")}>
          <div className="min-w-0">
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
              {mode === 'breathe' ? 'Breathe' : 'Pre-Call Check'}
            </p>
            <p className={cn("text-sm leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#51615b]")}>
              Use sound and vibration cues if they help you settle.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSoundEnabled(value => !value)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors",
                soundEnabled
                  ? (isDark ? "bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#dbe8df]" : "bg-[#dbe8df] border-[#8fae9e] text-[#476f61]")
                  : (isDark ? "bg-[#171f1d] border-[#415049] text-[#97a59f]" : "bg-[#f3eee4] border-[#d8cdc0] text-[#66756f]")
              )}
            >
              Sound {soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => setVibrationEnabled(value => !value)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors",
                vibrationEnabled
                  ? (isDark ? "bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#dbe8df]" : "bg-[#dbe8df] border-[#8fae9e] text-[#476f61]")
                  : (isDark ? "bg-[#171f1d] border-[#415049] text-[#97a59f]" : "bg-[#f3eee4] border-[#d8cdc0] text-[#66756f]")
              )}
            >
              Vibration {vibrationEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 keyboard-aware">
        <AnimatePresence mode="wait">

          {/* Step 0 — Smile */}
          {step === 0 && (
            <motion.div key="smile" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">😊</div>
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>Step 1 of 3 · Soften</p>
                <h2 className={cn("text-2xl font-black leading-tight mb-3", isDark ? "text-[#f6f2ea]" : "text-[#22312b]")}>Let your face soften before the call starts.</h2>
                <p className={cn("text-sm leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#51615b]")}>
                  Smiling — even a small, deliberate one — triggers a real biological response. It activates your parasympathetic nervous system, lowers cortisol, and shifts your brain's perception of the situation from threat to manageable.
                </p>
              </div>
              <div className={cn("w-full rounded-2xl border p-4 text-left warm-panel", isDark ? "bg-[#202926]/88 border-[#415049]" : "")}>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>Try this right now</p>
                <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>Take a small real smile for 5 seconds. Notice your jaw unclench and your shoulders drop a little. Keep that softness when the call begins.</p>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Breathing */}
          {step === 1 && (
            <motion.div key="breath" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-4">
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>Step 2 of 3 · Breathe</p>
                <h2 className={cn("text-2xl font-black leading-tight mb-1", isDark ? "text-[#f6f2ea]" : "text-[#22312b]")}>Take three slower breaths.</h2>
                <p className={cn("text-sm", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>Follow the circle and let your pace come down.</p>
              </div>
              <BreathingGuide onComplete={() => setStep(2)} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} />
            </motion.div>
          )}

          {/* Step 2 — Mindset */}
          {step === 2 && (
            <motion.div key="mindset" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">🧠</div>
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-2", isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>Step 3 of 3 · Reframe</p>
                <h2 className={cn("text-2xl font-black leading-tight mb-3", isDark ? "text-[#f6f2ea]" : "text-[#22312b]")}>This call does not need to be perfect.</h2>
                <p className={cn("text-sm leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#51615b]")}>
                  The person on the other end is focused on their own day, their own tasks. They're not analyzing your voice, judging your words, or waiting for you to stumble. Most people are understanding — they just want to resolve the same thing you do.
                </p>
              </div>
              <div className={cn("w-full rounded-2xl border p-5 text-left warm-panel", isDark ? "bg-[#202926]/88 border-[#415049]" : "")}>
                <p className={cn("text-xs font-black uppercase tracking-widest mb-3", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>Tap this reminder 5 times</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    void hapticLight();
                    setMantraTaps(t => Math.min(t + 1, 5));
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl text-center font-black text-base transition-all border-2",
                    mantraTaps >= 5
                      ? (isDark ? "bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#b7d0c4]" : "bg-[#dbe8df] border-[#8fae9e] text-[#476f61]")
                      : (isDark ? "bg-[#5d8a7a]/10 border-[#5d8a7a]/30 text-[#dbe8df] hover:bg-[#5d8a7a]/15" : "bg-[#f3eee4] border-[#d8cdc0] text-[#476f61] hover:bg-[#ece5da]")
                  )}
                >
                  {mantraTaps >= 5 ? '✓ I only need to be clear, not perfect.' : '"I only need to be clear, not perfect."'}
                </motion.button>
                <div className="flex justify-center gap-2 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: i < mantraTaps ? 1 : 0.7, opacity: i < mantraTaps ? 1 : 0.25 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={cn("w-2.5 h-2.5 rounded-full", i < mantraTaps ? "bg-[#5d8a7a]" : (isDark ? "bg-[#415049]" : "bg-[#d8cdc0]"))}
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
                ? (isDark ? "bg-[#202926] text-[#5b6962] cursor-not-allowed" : "bg-[#ece5da] text-[#97a59f] cursor-not-allowed")
                : "bg-[#5d8a7a] hover:bg-[#527a6c] active:scale-[0.99] text-white shadow-lg shadow-[#5d8a7a]/20"
            )}
          >
            {step === 1 ? 'Follow the breathing guide above' : 'Next'}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#5d8a7a] hover:bg-[#527a6c] active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-[#5d8a7a]/20"
          >
            {mode === 'breathe' ? 'Back to App' : "I'm Ready to Start the Call"}
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
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col items-center justify-center px-8 transition-colors relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <div className="w-full max-w-sm relative z-10">
        {/* Logo + heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isDark ? "bg-[#22312b]" : "bg-[#5d8a7a]")}>
              <Logo className="w-5 h-5 text-[#fbf8f2]" />
            </div>
            <span className="font-bold text-xl">Callmate</span>
          </div>
          <h1 className="text-2xl font-black leading-tight">
            {userName ? `Setting things up for you, ${userName}.` : 'Setting things up for you.'}
          </h1>
          <p className={cn("text-sm mt-1.5", isDark ? "text-[#9aa8a2]" : "text-[#6f7d75]")}>This will feel calm and quick.</p>
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
                    className="w-5 h-5 rounded-full bg-[#7b9d76] flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#7b9d76] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className={cn("w-5 h-5 rounded-full border-2 shrink-0", isDark ? "border-zinc-700" : "border-zinc-300")} />
                )}
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isDone ? (isDark ? "text-white" : "text-[#22312b]") : (isDark ? "text-[#899791]" : "text-[#7d8b84]")
                )}>
                  {text}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Finale */}
        <motion.div
          animate={{ opacity: showFinale ? 1 : 0, y: showFinale ? 0 : 20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: showFinale ? 'auto' : 'none' }}
          className="space-y-4"
        >
          <div>
            <p className={cn("text-xs font-black uppercase tracking-widest mb-1.5", isDark ? "text-[#a9c2b5]" : "text-[#5d8a7a]")}>All set</p>
            <h2 className="text-2xl font-black leading-tight">
              {userName ? `Your Callmate is ready, ${userName}.` : 'Your Callmate is ready.'}
            </h2>
          </div>
          <button
            onClick={onDone}
            className="w-full py-4 rounded-2xl bg-[#5d8a7a] hover:bg-[#527a6c] active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-[#5d8a7a]/20"
          >
            Enter Callmate
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function AccountSetup({ isDark, userName, tier, trialStartDate, onComplete }: {
  isDark: boolean;
  userName: string;
  tier: string;
  trialStartDate: number | null;
  onComplete: (email: string, isNewUser: boolean) => Promise<void>;
}) {
  const [mode, setMode] = React.useState<'signup' | 'login'>('signup');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [appleLoading, setAppleLoading] = React.useState(false);

  const trialEndDate = trialStartDate
    ? new Date(trialStartDate + 3 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  const switchMode = (next: 'signup' | 'login') => {
    setMode(next);
    setEmail('');
    setPassword('');
    setEmailError('');
    setPendingConfirmationEmail('');
  };

  const formatAuthError = (message?: string, fallback = 'Something went wrong. Please try again.') => {
    const normalized = message?.toLowerCase() ?? '';
    if (!normalized) return fallback;
    if (normalized.includes('email rate limit exceeded') || normalized.includes('over_email_send_rate_limit') || normalized.includes('429')) {
      return 'Too many email attempts. Try again in a few minutes or use Apple Sign In.';
    }
    return message ?? fallback;
  };

  const finishSignedInUser = async (
    user: { email?: string | null; created_at?: string } | null | undefined,
    authIntent: 'signup' | 'login' = mode
  ) => {
    if (!user) {
      setEmailError('Authentication did not complete. Please try again.');
      return false;
    }

    const authEmail = user.email ?? '';
    const inferredNewUser = user.created_at
      ? Date.now() - new Date(user.created_at).getTime() < 30000
      : false;
    const isNewUser = authIntent === 'signup' || inferredNewUser;

    await onComplete(authEmail, isNewUser);
    return true;
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
    setPendingConfirmationEmail('');
    try {
      if (mode === 'signup') {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await signUp(normalizedEmail, password, userName || undefined);
        if (error) {
          setEmailError(formatAuthError(error.message));
          return;
        }
        if (data.session?.user) {
          await onComplete(data.session.user.email ?? normalizedEmail, true);
          return;
        }
        setPendingConfirmationEmail(normalizedEmail);
      } else {
        const { error } = await signIn(email.trim().toLowerCase(), password);
        if (error) {
          setEmailError('Incorrect email or password.');
          return;
        }
        await onComplete(email.trim().toLowerCase(), false);
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter your email above first.');
      return;
    }
    const { error } = await sendPasswordReset(email.trim().toLowerCase());
    if (error) {
      setEmailError(formatAuthError(error.message));
      return;
    }
    setEmailError('Password reset email sent — check your inbox.');
  };

  const showConfirmationState = mode === 'signup' && !!pendingConfirmationEmail;

  const handleApple = async () => {
    setAppleLoading(true);
    setEmailError('');
    localStorage.setItem(AUTH_INTENT_KEY, mode);
    try {
      const result = await signInWithApple();
      const { error, data } = result as { error: any; data: any };
      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        setEmailError(
          msg.includes('client') || msg.includes('provider') || msg.includes('enabled')
            ? 'Apple Sign In is not configured yet — use email below.'
            : formatAuthError(error.message)
        );
      } else {
        const appleUser = data?.user ?? data?.session?.user;
        if (appleUser) {
          await finishSignedInUser(appleUser, mode);
        }
      }
    } catch (e: any) {
      localStorage.removeItem(AUTH_INTENT_KEY);
      const msg = e?.message ?? '';
      if (!msg.toLowerCase().includes('cancel')) {
        setEmailError(`Apple Sign In failed: ${formatAuthError(msg)}`);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setEmailError('');
    localStorage.setItem(AUTH_INTENT_KEY, mode);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) {
        localStorage.removeItem(AUTH_INTENT_KEY);
        const msg = error.message?.toLowerCase() ?? '';
        setEmailError(
          msg.includes('client') || msg.includes('provider') || msg.includes('enabled')
            ? 'Google Sign In is not configured yet — use email below.'
            : formatAuthError(error.message)
        );
      } else if ('user' in data || 'session' in data) {
        const oauthResult = data as any;
        const googleUser = oauthResult?.user ?? oauthResult?.session?.user;
        if (googleUser) {
          await finishSignedInUser(googleUser, mode);
        }
      }
    } catch (e: any) {
      localStorage.removeItem(AUTH_INTENT_KEY);
      const msg = e?.message ?? '';
      if (!msg.toLowerCase().includes('cancel')) {
        setEmailError(`Google Sign In failed: ${formatAuthError(msg)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.08, 0.14, 0.08] }} transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-30%] right-[-20%] w-[70vw] h-[70vw] rounded-full blur-[130px] bg-[#7b9d76] pointer-events-none" />

      <div className="keyboard-aware flex-1 flex flex-col px-6 py-10 overflow-y-auto max-w-lg mx-auto w-full justify-center">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isDark ? "bg-[#22312b]" : "bg-[#5d8a7a]")}>
              <Logo className="w-5 h-5 text-[#fbf8f2]" />
            </div>
            <span className="font-bold text-xl">Callmate</span>
          </div>
          <p className={cn("text-xs font-black uppercase tracking-[0.25em] mb-2", isDark ? "text-[#a9c2b5]" : "text-[#5d8a7a]")}>
            {tier === 'annual' ? 'Annual Plan · Save 30%' : 'Monthly Plan'}
          </p>
          <h1 className="text-3xl font-bold leading-tight mb-2">
            {mode === 'login' ? 'Welcome back.' : (userName ? `One last step, ${userName}.` : 'One last step.')}
          </h1>
          <p className={cn("text-sm leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#607068]")}>
            {mode === 'login'
              ? 'Sign in to pick up right where you left off.'
              : 'Your scripts and progress stay with your account, so your support is there when you need it.'}
          </p>
        </motion.div>

        {!showConfirmationState && (
          <>
        {/* Social auth */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-3 mb-5">
          <button onClick={handleApple} disabled={loading || appleLoading} className={cn(
            "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50",
            isDark ? "bg-[#f4efe6] text-[#22312b] border-[#f4efe6] hover:bg-[#ebe4d8]" : "bg-[#22312b] text-[#fbf8f2] border-[#22312b] hover:bg-[#2e4039]"
          )}>
            {appleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                {mode === 'login' ? 'Sign in with Apple' : 'Continue with Apple'}
              </>
            )}
          </button>
          <button onClick={handleGoogle} disabled={loading} className={cn(
            "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50",
            isDark ? "bg-[#202926] text-white border-[#46534d] hover:border-[#66756f]" : "bg-[rgba(255,251,245,0.92)] text-[#22312b] border-[#d8cdc0] hover:border-[#b7aa96]"
          )}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {mode === 'login' ? 'Sign in with Google' : 'Continue with Google'}
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="flex items-center gap-3 mb-5">
          <div className={cn("flex-1 h-px", isDark ? "bg-[#415049]" : "bg-[#d8cdc0]")} />
          <span className={cn("text-xs font-bold", isDark ? "text-[#8f9d97]" : "text-[#87938d]")}>{mode === 'login' ? 'or sign in with email' : 'or sign up with email'}</span>
          <div className={cn("flex-1 h-px", isDark ? "bg-[#415049]" : "bg-[#d8cdc0]")} />
        </motion.div>
          </>
        )}

        {showConfirmationState ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className={cn(
              "rounded-3xl border p-5 space-y-4 mb-5",
              isDark ? "bg-[#202926]/85 border-[#415049]" : "bg-[rgba(255,251,245,0.94)] border-[#d8cdc0]"
            )}
          >
            <div className="space-y-2">
              <p className={cn("text-xs font-black uppercase tracking-[0.25em]", isDark ? "text-[#b4d0bd]" : "text-[#7b9d76]")}>Account Created</p>
              <h2 className="text-2xl font-bold leading-tight">Check your email to finish signing up.</h2>
              <p className={cn("text-sm leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#607068]")}>
                We sent a confirmation link to <span className={cn("font-semibold", isDark ? "text-white" : "text-black")}>{pendingConfirmationEmail}</span>.
                Tap that link and we&apos;ll finish bringing you into Callmate.
              </p>
            </div>
            <div className={cn("rounded-2xl p-4 text-sm leading-relaxed", isDark ? "bg-[#171f1d] border border-[#415049] text-[#d9e2dd]" : "bg-[#fffdf9] border border-[#d8cdc0] text-[#54645d]")}>
              If you don&apos;t see it, check spam or promotions. If you already confirmed, continue below.
            </div>
          </motion.div>
        ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="space-y-3 mb-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            className={cn(
              "w-full px-4 py-4 rounded-2xl border text-base focus:outline-none transition-colors",
              isDark ? "bg-[#202926] border-[#415049] text-white placeholder:text-[#82908a] focus:border-[#7b9d76]" : "bg-[rgba(255,251,245,0.94)] border-[#d8cdc0] text-[#22312b] placeholder:text-[#92a09a] focus:border-[#7b9d76]"
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
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="space-y-3">
          {showConfirmationState ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setEmail(pendingConfirmationEmail);
                  setPassword('');
                  setEmailError('');
                  setPendingConfirmationEmail('');
                }}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25"
              >
                I already confirmed my email
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingConfirmationEmail('');
                  setEmail('');
                  setPassword('');
                  setEmailError('');
                }}
                className={cn(
                  "w-full py-3 rounded-2xl border text-sm font-semibold transition-colors",
                  isDark ? "border-zinc-700 text-zinc-300 hover:border-zinc-500" : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                )}
              >
                Use a different email
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account & Start Free Trial')}
            </button>
          )}
          {mode === 'signup' && trialEndDate && (
            <p className={cn("text-center text-xs leading-relaxed", isDark ? "text-zinc-500" : "text-zinc-400")}>
              Your 3-day free trial starts now. No charge until {trialEndDate}.<br />Cancel anytime.
            </p>
          )}
          {mode === 'signup' && (
            <p className={cn("text-center text-[11px] leading-relaxed", isDark ? "text-zinc-600" : "text-zinc-400")}>
              By creating an account you agree to our{' '}
              <button type="button" onClick={() => openInAppBrowser('https://callmate.app/terms')} className={cn("underline underline-offset-2 transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black")}>Terms of Service</button>
              {' '}and{' '}
              <button type="button" onClick={() => openInAppBrowser('https://callmate.app/privacy')} className={cn("underline underline-offset-2 transition-colors", isDark ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-black")}>Privacy Policy</button>.
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
    { icon: '📞', title: 'Broke the Silence', unlocked: phase >= 2 },
    { icon: '🔥', title: 'Faced the Ring', unlocked: phase >= 2 },
    { icon: '😌', title: 'Easy Does It', unlocked: phase >= 3 },
    { icon: '📉', title: 'Turning the Corner', unlocked: false },
    { icon: '💪', title: 'Held the Line', unlocked: false },
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
  onDelete,
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
  onDelete?: () => void,
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
            <div className="shrink-0 pt-1 flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(); }}
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Delete branch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
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
