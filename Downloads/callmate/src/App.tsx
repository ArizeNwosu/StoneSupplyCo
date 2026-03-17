import React, { Suspense, lazy, useState, useEffect, useMemo, useRef } from 'react';
import {
  Phone,
  ChevronRight,
  AlertCircle,
  History,
  Check,
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
  Tv,
  Sun,
  Moon,
  Copy,
  Ellipsis,
  Users,
  WifiOff,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card, CallTypeGrid, ScriptCardSkeleton, ScriptViewSkeleton, cn } from './components/ui';
import { Tone, CallScript, SAFE_LINES, PANIC_OPTIONS, PanicOption, COMMON_CALL_TYPES, Persona, Reflection, Tier, CallPerspective, PracticeScenario, PracticeSessionSummary } from './types';
import { generateCallScript, generatePanicResponse, generateVoicemailScript, generateEmailFallback, generateBranch } from './services/gemini';
import { signUp, signIn, signInWithApple, signInWithGoogle, signOut, onAuthStateChange, sendPasswordReset } from './services/auth';
import { pushLocalDataToSupabase, fetchScripts, fetchReflections, fetchAnxietyRatings, fetchPersonas, fetchProfile, upsertProfile, saveScript, saveReflection as dbSaveReflection, savePersona, syncAnxietyRatings, deleteAllScriptsForUser, deletePersona as dbDeletePersona } from './services/db';
import { fetchAccessState, startTrial } from './services/access';
import { enqueueFailedSave, drainOfflineQueue } from './services/offlineQueue';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticError, setStatusBarDark, setStatusBarLight, openInAppBrowser, requestNotificationsAccess, requestVoiceSimulatorPermissions, scheduleLocalNotification } from './services/native';
import type { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import type { ImportPreview } from './services/exportImport';
import { buildPracticeScenario } from './services/practiceSimulator';
import appStoreIcon from '../icons/app-store.svg';
import reviewAvatar1 from '../avatar/1.png';
import reviewAvatar2 from '../avatar/2.png';
import reviewAvatar3 from '../avatar/3.png';
import reviewAvatar4 from '../avatar/4.png';
import facebookIcon from '../icons/facebook (1).svg';
import instagramIcon from '../icons/instagram (1).svg';
import tiktokIcon from '../icons/tiktok.svg';
import xIcon from '../icons/x.svg';
import youtubeIcon from '../icons/youtube.svg';
import loginBackground from '../backgrounds/login.mp4';
import appIconPng from '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';

const HomeScreen = lazy(() => import('./components/main-screens').then((module) => ({ default: module.HomeScreen })));
const HistoryScreen = lazy(() => import('./components/main-screens').then((module) => ({ default: module.HistoryScreen })));
const DashboardScreen = lazy(() => import('./components/main-screens').then((module) => ({ default: module.DashboardScreen })));
const ScriptScreen = lazy(() => import('./components/main-screens').then((module) => ({ default: module.ScriptScreen })));
const SettingsScreen = lazy(() => import('./components/main-screens').then((module) => ({ default: module.SettingsScreen })));
const CallSimulator = lazy(() => import('./components/call-simulator').then((module) => ({ default: module.CallSimulator })));
const AccountSetup = lazy(() => import('./components/auth-flow').then((module) => ({ default: module.AccountSetup })));
const SetupAnimation = lazy(() => import('./components/auth-flow').then((module) => ({ default: module.SetupAnimation })));
const OnboardingNotificationsStep = lazy(() => import('./components/auth-flow').then((module) => ({ default: module.OnboardingNotificationsStep })));
const OnboardingDemoDashboard = lazy(() => import('./components/auth-flow').then((module) => ({ default: module.OnboardingDemoDashboard })));
const ReviewSlideshow = lazy(() => import('./components/script-support').then((module) => ({ default: module.ReviewSlideshow })));
const PreCallCheck = lazy(() => import('./components/script-support').then((module) => ({ default: module.PreCallCheck })));
const PostCallReinforcement = lazy(() => import('./components/script-support').then((module) => ({ default: module.PostCallReinforcement })));
const ScriptSection = lazy(() => import('./components/script-support').then((module) => ({ default: module.ScriptSection })));

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
const PRACTICE_SESSIONS_KEY = 'callmate_practice_sessions';
const HISTORY_STORAGE_KEY = 'callmate_history';
const HISTORY_STORAGE_LEGACY_KEY = 'ringtone_history';
const REFLECTIONS_STORAGE_KEY = 'callmate_reflections';
const REFLECTIONS_STORAGE_LEGACY_KEY = 'ringtone_reflections';
const THEME_STORAGE_KEY = 'callmate_theme';
const THEME_STORAGE_LEGACY_KEY = 'ringtone_theme';

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
const PENDING_OAUTH_CALLBACK_KEY = 'callmate_pending_oauth_callback';
const SPLASH_VISIBLE_MS = 3200;
// Module-level guard: prevents re-entry into Apple/Google SSO even if AccountSetup remounts
// mid-flow (e.g. due to a SIGNED_OUT event triggering setView('account')).
let ssoInFlight = false;

function readStoredJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function DeferredScreenFallback({ isDark, kind = 'generic' }: { isDark: boolean; kind?: 'home' | 'history' | 'script' | 'generic' }) {
  if (kind === 'home' || kind === 'history') {
    return (
      <div className="space-y-4 pb-28">
        <ScriptCardSkeleton isDark={isDark} />
        <ScriptCardSkeleton isDark={isDark} />
        <ScriptCardSkeleton isDark={isDark} />
      </div>
    );
  }

  if (kind === 'script') {
    return <ScriptViewSkeleton isDark={isDark} />;
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className={cn('w-7 h-7 animate-spin', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')} />
    </div>
  );
}

export default function App() {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [view, setView] = useState<'splash' | 'explainer' | 'reset' | 'onboarding' | 'reviews' | 'account' | 'setup' | 'notifications' | 'home' | 'history' | 'dashboard' | 'script' | 'settings'>('splash');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [description, setDescription] = useState('');
  const [perspective, setPerspective] = useState<CallPerspective>('outgoing');
  const [tone, setTone] = useState<Tone>('Professional');
  const [loading, setLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateAttempt, setGenerateAttempt] = useState(0);
  const [currentScript, setCurrentScript] = useState<CallScript | null>(null);
  const [history, setHistory] = useState<CallScript[]>([]);
  const [tier, setTier] = useState<Tier>('free');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showOnboardingDiscovery, setShowOnboardingDiscovery] = useState(() => !localStorage.getItem('callmate_heard_about_us'));
  const [showOnboardingThankYou, setShowOnboardingThankYou] = useState(false);
  const [showIntroBreathe, setShowIntroBreathe] = useState(false);
  const [setupNextView, setSetupNextView] = useState<'reviews' | 'notifications'>('notifications');
  const [anxietySeverity, setAnxietySeverity] = useState<AnxietySeverity | null>(null);
  const [anxietyTriggers, setAnxietyTriggers] = useState<string[]>(() => readStoredJson('callmate_triggers', []));
  const [lifeImpact, setLifeImpact] = useState<string[]>(() => readStoredJson('callmate_impact', []));
  const [callAnxietyRatings, setCallAnxietyRatings] = useState<AnxietyRating[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSessionSummary[]>(() => readStoredJson(PRACTICE_SESSIONS_KEY, []));
  const [callStreak, setCallStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'dashboard'>('home');
  const [showAlterEgo, setShowAlterEgo] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<number | null>(null);
  const [trialScriptsUsed, setTrialScriptsUsed] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
  const [isAccessStateReady, setIsAccessStateReady] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState<'monthly' | 'annual' | null>(null);
  const [userName, setUserName] = useState(() => localStorage.getItem('callmate_user_name') || '');
  const [userGender, setUserGender] = useState(() => localStorage.getItem('callmate_user_gender') || '');
  const [userAgeRange, setUserAgeRange] = useState(() => localStorage.getItem('callmate_user_age_range') || '');
  const [heardAboutUs, setHeardAboutUs] = useState(() => localStorage.getItem('callmate_heard_about_us') || '');
  const [userEmail, setUserEmail] = useState('');
  const [starredScripts, setStarredScripts] = useState<string[]>(() => readStoredJson('callmate_starred', []));
  const [shareToast, setShareToast] = useState(false);
  const [expandedSafeLineIndex, setExpandedSafeLineIndex] = useState<number | null>(null);
  const [showMedicalPrep, setShowMedicalPrep] = useState(true);
  const [showSplashPulse, setShowSplashPulse] = useState(false);
  const [showSplashText, setShowSplashText] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    opening: true, mainAsk: true, branchX: true, branchY: true, close: true
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasBeenReviewPrompted, setHasBeenReviewPrompted] = useState(() => localStorage.getItem('callmate_review_prompted') === 'true');
  const [lastScriptDate, setLastScriptDate] = useState<number | null>(null);
  const [comebackNudgeDismissed, setComebackNudgeDismissed] = useState(false);
  const [showCallSimulator, setShowCallSimulator] = useState(false);
  const [simulatorScenario, setSimulatorScenario] = useState<PracticeScenario | null>(null);
  const [isLaunchingSimulator, setIsLaunchingSimulator] = useState(false);
  const [personaDraftName, setPersonaDraftName] = useState('');
  const [personaDraftContext, setPersonaDraftContext] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [iapPrices, setIapPrices] = useState<{ monthly?: string; annual?: string }>({});
  const [milestoneToast, setMilestoneToast] = useState<{ icon: string; title: string } | null>(null);
  const [customTriggerInput, setCustomTriggerInput] = useState('');
  const prevMilestoneIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel[]>([]);
  const didBootstrapInitialSessionRef = useRef(false);

  const isDark = theme === 'dark';

  const persistPracticeSessions = (items: PracticeSessionSummary[]) => {
    setPracticeSessions(items);
    localStorage.setItem(PRACTICE_SESSIONS_KEY, JSON.stringify(items));
  };

  const resetSignedOutProfileState = () => {
    setUserName('');
    setUserGender('');
    setUserAgeRange('');
    setHeardAboutUs('');
    setAnxietySeverity(null);
    setAnxietyTriggers([]);
    setLifeImpact([]);
    setCallStreak(0);
    setSelectedPersona(null);
    setShowOnboardingDiscovery(true);
    setShowOnboardingThankYou(false);
    setOnboardingStep(1);
    setHasBeenReviewPrompted(false);
    setLastScriptDate(null);
    setSpeakerPromptCount(0);
    setShowSpeakerPrompt(true);
    persistPracticeSessions([]);
    localStorage.removeItem('callmate_user_name');
    localStorage.removeItem('callmate_user_gender');
    localStorage.removeItem('callmate_user_age_range');
    localStorage.removeItem('callmate_heard_about_us');
    localStorage.removeItem('callmate_severity');
    localStorage.removeItem('callmate_triggers');
    localStorage.removeItem('callmate_impact');
    localStorage.removeItem('callmate_streak');
    localStorage.removeItem('callmate_last_call_date');
    localStorage.removeItem('callmate_last_script_date');
    localStorage.removeItem('callmate_review_prompted');
    localStorage.removeItem('callmate_speaker_count');
    localStorage.removeItem('callmate_starred');
    localStorage.removeItem(PRACTICE_SESSIONS_KEY);
  };

  // Sync native status bar and html class with theme
  useEffect(() => {
    if (isDark) {
      setStatusBarDark();
      document.documentElement.classList.add('dark-mode');
    } else {
      setStatusBarLight();
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDark]);

  // Load real IAP prices from StoreKit (native only, non-blocking)
  useEffect(() => {
    void (async () => {
      try {
        const { fetchProducts, PRODUCT_IDS } = await import('./services/iap');
        const products = await fetchProducts();
        const priceMap: { monthly?: string; annual?: string } = {};
        for (const p of products) {
          if (p.id === PRODUCT_IDS.monthly) priceMap.monthly = p.displayPrice;
          if (p.id === PRODUCT_IDS.annual) priceMap.annual = p.displayPrice;
        }
        if (priceMap.monthly || priceMap.annual) setIapPrices(priceMap);
      } catch {
        // Not on native or StoreKit unavailable — fallback to hardcoded prices
      }
    })();
  }, []);

  // Online / offline detection + queue drain on reconnect
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      if (!supabaseUser) return;
      setIsSyncing(true);
      try {
        await drainOfflineQueue();
      } catch {
        // non-critical
      } finally {
        setIsSyncing(false);
      }
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [supabaseUser]);

  const TRIAL_SCRIPT_LIMIT = 5;
  const TRIAL_DAYS = 3;
  const enforceAccessGate = (candidateTier = tier, candidateTrialStart = trialStartDate) => {
    if (!isAccessStateReady) {
      return true;
    }
    const trialActive = candidateTier === 'trial' && !!candidateTrialStart && Math.floor((Date.now() - candidateTrialStart) / 86400000) < TRIAL_DAYS;
    const hasAccess = candidateTier === 'admin' || candidateTier === 'monthly' || candidateTier === 'annual' || trialActive;
    if (!hasAccess) {
      setShowUpgradeModal(true);
      setUpgradeModalForced(true);
      return false;
    }
    setShowUpgradeModal(false);
    setUpgradeModalForced(false);
    return true;
  };

  const applyAccessState = (access: Awaited<ReturnType<typeof fetchAccessState>>) => {
    setTier(access.tier);
    setTrialStartDate(access.trialStartedAt);
    setTrialScriptsUsed(access.scriptsUsed);
    setSelectedPlan(access.selectedPlan);
    setIsAccessStateReady(true);
    const hasActiveTrial = access.tier === 'trial' && !!access.trialStartedAt && Math.floor((Date.now() - access.trialStartedAt) / 86400000) < TRIAL_DAYS;
    const hasPaidAccess = access.tier === 'admin' || access.tier === 'monthly' || access.tier === 'annual' || hasActiveTrial;
    if (hasPaidAccess) {
      setShowUpgradeModal(false);
      setUpgradeModalForced(false);
    }
  };

  const loadAccessState = async () => {
    const access = await fetchAccessState();
    applyAccessState(access);
    return access;
  };

  const loadAccessStateSafely = async () => {
    try {
      return await loadAccessState();
    } catch (error) {
      console.error('Failed to load access state', error);
      setIsAccessStateReady(true);
      return null;
    }
  };

  const beginTrial = async (plan: 'monthly' | 'annual') => {
    if (!supabaseUser) {
      setShowUpgradeModal(false);
      setView('account');
      return null;
    }
    try {
      const access = await startTrial(plan);
      applyAccessState(access);
      return access;
    } catch (error) {
      console.error('Failed to start trial', error);
      alert('Unable to start your trial right now. Please try again.');
      return null;
    }
  };

  const verifyPurchaseReceipt = async (payload: { transactionId: string; jwsToken: string; productId: string }) => {
    const { supabase } = await import('./services/supabase');
    const { data, error } = await supabase.functions.invoke('verify-purchase', { body: payload });
    if (error) throw error;
    applyAccessState(data);
    return data;
  };

  const handleIAPPurchase = async (plan: 'monthly' | 'annual') => {
    if (!supabaseUser) { setShowUpgradeModal(false); setView('account'); return; }
    if (purchasingPlan) return;
    setPurchasingPlan(plan);
    try {
      const { purchaseProduct, PRODUCT_IDS } = await import('./services/iap');
      const productId = PRODUCT_IDS[plan];
      const { transactionId, jwsToken } = await purchaseProduct(productId);

      // Fix 3: Optimistically apply tier and close modal immediately — user lands on home
      // while verify-purchase runs in background (avoids Edge Function cold-start blocking UX).
      setTier(plan);
      setSelectedPlan(plan);
      setIsAccessStateReady(true);
      setShowUpgradeModal(false);
      if (['notifications', 'reviews', 'setup', 'onboarding', 'explainer'].includes(viewRef.current)) {
        setView('home');
      }
      setPurchasingPlan(null);

      // Verify in background — do not keep the paywall in a perpetual loading state.
      void (async () => {
        try {
          await verifyPurchaseReceipt({ transactionId, jwsToken, productId });
        } catch (verifyError: any) {
          console.error('Purchase verification failed:', verifyError?.message);
          await loadAccessStateSafely();
          const detail = verifyError?.context?.message ?? verifyError?.message ?? String(verifyError);
          alert(`Purchase verification failed: ${detail}`);
        }
      })();
    } catch (error: any) {
      if (error?.message === 'cancelled') return;
      const detail = error?.context?.message ?? error?.message ?? String(error);
      console.error('Purchase failed:', detail, error);
      alert(`Purchase failed: ${detail}`);
    } finally {
      setPurchasingPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (!supabaseUser) {
      setShowUpgradeModal(false);
      setView('account');
      return;
    }

    try {
      const { restorePurchases } = await import('./services/iap');
      const entitlements = await restorePurchases();

      if (!entitlements.length) {
        alert('No previous purchases were found for this Apple ID.');
        return;
      }

      const verificationResults = await Promise.allSettled(
        entitlements.map((entitlement) => verifyPurchaseReceipt(entitlement))
      );
      const verifiedCount = verificationResults.filter((result) => result.status === 'fulfilled').length;
      let access = await loadAccessState();

      if (access.tier === 'admin' || access.tier === 'monthly' || access.tier === 'annual') {
        setShowUpgradeModal(false);
        return;
      }

      if (verifiedCount === 0) {
        const firstFailure = verificationResults.find((result) => result.status === 'rejected');
        const reason = firstFailure && 'reason' in firstFailure
          ? firstFailure.reason?.context?.message ?? firstFailure.reason?.message ?? String(firstFailure.reason)
          : 'Your previous purchase could not be verified right now.';
        alert(`Restore failed: ${reason}`);
        return;
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        access = await loadAccessState();
        if (access.tier === 'admin' || access.tier === 'monthly' || access.tier === 'annual') {
          setShowUpgradeModal(false);
          return;
        }
      }

      alert('We found your previous purchase, but your account has not updated yet. Please try again in a moment.');
    } catch (error: any) {
      const detail = error?.context?.message ?? error?.message ?? String(error);
      console.error('Restore purchases failed:', detail, error);
      alert(`Restore failed: ${detail}`);
    }
  };

  const onScriptChange = (script: CallScript | null, event: 'INSERT' | 'UPDATE' | 'DELETE', id?: string) => {
    if (event === 'DELETE' && id) {
      setHistory(prev => {
        const next = prev.filter(s => s.id !== id);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    if (!script) return;
    setHistory(prev => {
      const existingIndex = prev.findIndex(s => s.id === script.id);
      if (existingIndex === -1) {
        const next = [script, ...prev];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
        return next;
      }
      const existing = prev[existingIndex];
      if (script.updated_at && existing.updated_at && script.updated_at <= existing.updated_at) return prev;
      const next = [...prev];
      next[existingIndex] = script;
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleExportJSON = async () => {
    const { exportToJSON, downloadFile } = await import('./services/exportImport');
    try {
      await downloadFile(exportToJSON(history, reflections), 'callmate-backup.json', 'application/json');
    } catch (error) {
      console.error('Failed to export all data:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportCSV = async () => {
    const { exportScriptsToCSV, downloadFile } = await import('./services/exportImport');
    try {
      await downloadFile(exportScriptsToCSV(history), 'callmate-scripts.csv', 'text/csv');
    } catch (error) {
      console.error('Failed to export scripts:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImportFile = async (file: File): Promise<ImportPreview | { error: string }> => {
    const { parseImportJSON } = await import('./services/exportImport');
    const text = await file.text();
    return parseImportJSON(text);
  };

  const handleImportConfirm = async (preview: ImportPreview, mode: 'merge' | 'replace') => {
    const { applyImport } = await import('./services/exportImport');
    const result = applyImport(preview, history, mode);
    setHistory(result.scripts);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(result.scripts));
    setReflections(result.reflections);
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(result.reflections));
    if (supabaseUser) {
      const results = await Promise.allSettled(
        result.scripts.map((script) => saveScript(supabaseUser.id, script))
      );
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error(`Failed to sync ${failures.length} script(s) to server during import.`);
      }
    }
  };

  const persistScriptLocally = (scripts: CallScript[]) => {
    setHistory(scripts);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(scripts));
  };

  const persistReflectionsLocally = (items: Reflection[]) => {
    setReflections(items);
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(items));
  };

  const persistRatingsLocally = (ratings: AnxietyRating[]) => {
    setCallAnxietyRatings(ratings);
    localStorage.setItem('callmate_anxiety_ratings', JSON.stringify(ratings));
  };

  const persistPersonasLocally = (items: Persona[]) => {
    setPersonas(items);
    localStorage.setItem('callmate_personas', JSON.stringify(items));
  };

  const persistPersonas = async (items: Persona[]) => {
    persistPersonasLocally(items);
    if (!supabaseUser) return;
    await Promise.all(items.map((persona) => savePersona(supabaseUser.id, persona)));
  };

  const replaceCurrentScript = async (nextScript: CallScript) => {
    setCurrentScript(nextScript);
    const nextHistory = history.map((item) => item.id === nextScript.id ? nextScript : item);
    persistScriptLocally(nextHistory);
    if (supabaseUser) {
      await saveScript(supabaseUser.id, nextScript);
    }
  };

  const clearLocalUserCollections = () => {
    persistScriptLocally([]);
    persistReflectionsLocally([]);
    persistRatingsLocally([]);
    persistPersonasLocally([]);
    setStarredScripts([]);
    setCurrentScript(null);
  };

  const startSignedInRealtimeSync = (user: User) => {
    import('./services/sync').then(({ createSyncSubscriptions }) => {
      channelRef.current.forEach(ch => ch.unsubscribe());
      createSyncSubscriptions(supabase, user, { onScriptChange })
        .then(channels => { channelRef.current = channels; })
        .catch(err => console.error('Failed to create sync subscriptions', err));
    }).catch(err => console.error('Failed to import sync module', err));
  };

  const getInitialSignedInView = (user: User, authIntent: 'signup' | 'login' | null = null) => {
    const cachedName = localStorage.getItem('callmate_user_name')?.trim();
    const isReturningUser = !!cachedName || authIntent === 'login' || (Date.now() - new Date(user.created_at).getTime() > 30000);
    return isReturningUser ? 'home' : 'notifications';
  };

  const warmSignedInSession = (user: User, authIntent: 'signup' | 'login' | null = null) => {
    if (user.email) {
      setUserEmail(user.email);
      localStorage.setItem('callmate_user_email', user.email);
    }

    setSupabaseUser(user);
    setView(getInitialSignedInView(user, authIntent));

    void loadAccessStateSafely().then((access) => {
      if (access) {
        enforceAccessGate(access.tier, access.trialStartedAt);
      }
    });

    void loadUserDataFromSupabase(user.id).catch(err => {
      console.error('Failed to warm signed-in user data', err);
    });

    startSignedInRealtimeSync(user);
  };

  const hydrateSignedInUser = async (user: User, authIntent: 'signup' | 'login' | null = null) => {
    // setSupabaseUser is deferred until after loadAccessStateSafely runs so that
    // the enforceAccessGate useEffect sees the real tier (not the default 'free')
    // when it fires. Setting it here would trigger the effect before the DB resolves.
    if (user.email) {
      setUserEmail(user.email);
      localStorage.setItem('callmate_user_email', user.email);
    }

    const [profile, access] = await Promise.all([
      loadUserDataFromSupabase(user.id).catch(err => {
        console.error('Failed to load user data for signed-in user', err);
        return null;
      }),
      loadAccessStateSafely(),
    ]);

    // Now that tier/trialStartDate are set via applyAccessState inside loadAccessStateSafely,
    // setting supabaseUser here ensures enforceAccessGate useEffect sees the real tier.
    setSupabaseUser(user);

    // Fire-and-forget — does not block navigation
    startSignedInRealtimeSync(user);

    return {
      profile,
      access,
      isReturningUser: !!profile?.name || authIntent === 'login' || (Date.now() - new Date(user.created_at).getTime() > 30000),
    };
  };

  const isTrialPlanAnnual = tier === 'trial' && selectedPlan === 'annual';
  const canUsePracticeMode = tier === 'admin' || tier === 'monthly' || tier === 'annual' || isTrialPlanAnnual;

  const trialDaysRemaining = useMemo(() => {
    if (tier !== 'trial' || !trialStartDate) return null;
    const daysPassed = Math.floor((Date.now() - trialStartDate) / 86400000);
    return Math.max(0, TRIAL_DAYS - daysPassed);
  }, [tier, trialStartDate]);

  useEffect(() => { if (!showUpgradeModal) setUpgradeModalForced(false); }, [showUpgradeModal]);

  useEffect(() => {
    if (!showPersonaModal) return;
    setPersonaDraftName(selectedPersona?.name ?? '');
    setPersonaDraftContext(selectedPersona?.context ?? '');
  }, [showPersonaModal, selectedPersona]);

  useEffect(() => {
    if (view === 'account') {
      // Pre-warm chunks used by Apple/Google Sign In
      void import('./services/native');
    }
  }, [view]);

  useEffect(() => {
    if (supabaseUser) {
      enforceAccessGate();
    }
  }, [supabaseUser, tier]);

  const isTrialActive = tier === 'trial' && (trialDaysRemaining ?? 0) > 0;
  const isPremium = tier === 'admin' || tier === 'monthly' || tier === 'annual' || isTrialActive;
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
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY) ?? localStorage.getItem(HISTORY_STORAGE_LEGACY_KEY);
    if (savedHistory) {
      try {
        const rawParsedHistory = JSON.parse(savedHistory);
        const parsedHistory = sanitizeHistory(rawParsedHistory);
        setHistory(parsedHistory);
        if (!Array.isArray(rawParsedHistory) || rawParsedHistory.length !== parsedHistory.length) {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(parsedHistory));
        }
      } catch {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        localStorage.removeItem(HISTORY_STORAGE_LEGACY_KEY);
        setHistory([]);
      }
    }

    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(THEME_STORAGE_LEGACY_KEY)) as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);

    const savedSpeakerCount = parseInt(localStorage.getItem('callmate_speaker_count') || '0');
    setSpeakerPromptCount(savedSpeakerCount);

    const savedRatings = localStorage.getItem('callmate_anxiety_ratings');
    if (savedRatings) setCallAnxietyRatings(readStoredJson('callmate_anxiety_ratings', []));

    setReflections(readStoredJson(REFLECTIONS_STORAGE_KEY, readStoredJson(REFLECTIONS_STORAGE_LEGACY_KEY, [])));
    setPersonas(readStoredJson('callmate_personas', []));

    const savedStreak = localStorage.getItem('callmate_streak');
    if (savedStreak) setCallStreak(parseInt(savedStreak));

    const savedSeverity = localStorage.getItem('callmate_severity') as AnxietySeverity;
    if (savedSeverity) setAnxietySeverity(savedSeverity);

    const savedTriggers = localStorage.getItem('callmate_triggers');
    if (savedTriggers) try { setAnxietyTriggers(JSON.parse(savedTriggers)); } catch {}
    const savedImpact = localStorage.getItem('callmate_impact');
    if (savedImpact) try { setLifeImpact(JSON.parse(savedImpact)); } catch {}

    const savedName = localStorage.getItem('callmate_user_name');
    if (savedName) setUserName(savedName);
    const savedGender = localStorage.getItem('callmate_user_gender');
    if (savedGender) setUserGender(savedGender);
    const savedAge = localStorage.getItem('callmate_user_age_range');
    if (savedAge) setUserAgeRange(savedAge);
    const savedHeardAboutUs = localStorage.getItem('callmate_heard_about_us');
    if (savedHeardAboutUs) setHeardAboutUs(savedHeardAboutUs);

    const savedLastScript = localStorage.getItem('callmate_last_script_date');
    if (savedLastScript) setLastScriptDate(parseInt(savedLastScript));

    if (localStorage.getItem(HISTORY_STORAGE_LEGACY_KEY) && !localStorage.getItem(HISTORY_STORAGE_KEY)) {
      localStorage.setItem(HISTORY_STORAGE_KEY, localStorage.getItem(HISTORY_STORAGE_LEGACY_KEY) ?? '[]');
    }
    if (localStorage.getItem(REFLECTIONS_STORAGE_LEGACY_KEY) && !localStorage.getItem(REFLECTIONS_STORAGE_KEY)) {
      localStorage.setItem(REFLECTIONS_STORAGE_KEY, localStorage.getItem(REFLECTIONS_STORAGE_LEGACY_KEY) ?? '[]');
    }
    if (localStorage.getItem(THEME_STORAGE_LEGACY_KEY) && !localStorage.getItem(THEME_STORAGE_KEY)) {
      localStorage.setItem(THEME_STORAGE_KEY, localStorage.getItem(THEME_STORAGE_LEGACY_KEY) ?? 'light');
    }
    localStorage.removeItem(HISTORY_STORAGE_LEGACY_KEY);
    localStorage.removeItem(REFLECTIONS_STORAGE_LEGACY_KEY);
    localStorage.removeItem(THEME_STORAGE_LEGACY_KEY);
  }, []);

  const viewRef = React.useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Prevents a stale SIGNED_IN/INITIAL_SESSION event from redirecting
  // the user back to home immediately after they sign out.
  const isSigningOutRef = React.useRef(false);

  // Wrapper passed as the `signOut` prop so the flag is set synchronously
  // before any stale auth events can fire through the JS event loop.
  const handleSignOut = React.useCallback(() => {
    isSigningOutRef.current = true;
    return signOut();
  }, []);

  useEffect(() => {
    const editableSelector = 'input, textarea, select, [contenteditable="true"]';
    const ensureTimers = new Set<number>();
    const originalScrollPositions = new Map<HTMLElement | Window, number>();
    let restoreTimer: number | null = null;

    const applyReturnKeyHint = (element: Element | null) => {
      if (element instanceof HTMLInputElement) {
        const type = (element.type || 'text').toLowerCase();
        if (!['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(type)) {
          element.setAttribute('enterkeyhint', 'done');
        }
        return;
      }
      if (element instanceof HTMLTextAreaElement) {
        element.setAttribute('enterkeyhint', 'done');
      }
    };

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
      document.documentElement.dataset.keyboardOpen = keyboardInset > 0 ? 'true' : 'false';
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
        if (!originalScrollPositions.has(scrollParent)) {
          originalScrollPositions.set(scrollParent, scrollParent.scrollTop);
        }
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

      if (!originalScrollPositions.has(window)) {
        originalScrollPositions.set(window, window.scrollY);
      }
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
      const adjustedRect = target.getBoundingClientRect();
      if (adjustedRect.bottom > visibleBottom) {
        window.scrollBy({ top: adjustedRect.bottom - visibleBottom + 20, behavior });
      } else if (adjustedRect.top < visibleTop) {
        window.scrollBy({ top: adjustedRect.top - visibleTop - 20, behavior });
      }
    };

    const restoreScrollPositions = () => {
      originalScrollPositions.forEach((top, target) => {
        if (target === window) {
          window.scrollTo({ top, behavior: 'smooth' });
          return;
        }
        target.scrollTo({ top, behavior: 'smooth' });
      });
      originalScrollPositions.clear();
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
      if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      applyReturnKeyHint(event.target as Element | null);
      scheduleEnsureVisible(event.target as Element | null);
    };

    const handleFocusOut = () => {
      if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
      }
      restoreTimer = window.setTimeout(() => {
        if (!isEditable(document.activeElement)) {
          restoreScrollPositions();
        }
        restoreTimer = null;
      }, 160);
    };

    const handleViewportChange = () => {
      setViewportMetrics();
      scheduleEnsureVisible(document.activeElement, 'auto');
    };

    const handleEditableKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      const type = (target.type || 'text').toLowerCase();
      if (['checkbox', 'file', 'radio', 'submit'].includes(type)) return;

      window.setTimeout(() => {
        if (document.activeElement === target) {
          target.blur();
        }
      }, 0);
    };

    setViewportMetrics();
    document.querySelectorAll(editableSelector).forEach((element) => applyReturnKeyHint(element));

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('keydown', handleEditableKeyDown, true);
    window.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      ensureTimers.forEach(timer => window.clearTimeout(timer));
      if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('keydown', handleEditableKeyDown, true);
      delete document.documentElement.dataset.keyboardOpen;
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
          new Promise<void>(resolve => setTimeout(resolve, SPLASH_VISIBLE_MS)),
        ]);
        if (session?.user) {
          const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
          localStorage.removeItem(AUTH_INTENT_KEY);
          localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);
          didBootstrapInitialSessionRef.current = true;
          warmSignedInSession(session.user, authIntent);
        } else {
          setIsAccessStateReady(true);
          const hasSeenOnboarding = localStorage.getItem(HAS_SEEN_ONBOARDING_KEY) === 'true';
          if (hasSeenOnboarding) {
            setView('account');
          } else {
            setView('explainer');
          }
        }
      } catch (error) {
        console.error('App init failed', error);
        localStorage.removeItem(AUTH_INTENT_KEY);
        try {
          const { supabase: sb } = await import('./services/supabase');
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) {
            await hydrateSignedInUser(session.user, 'login');
            setView('home');
            return;
          }
        } catch (sessionError) {
          console.error('Session recovery failed after init error', sessionError);
        }
        setSupabaseUser(null);
        setUserEmail('');
        setIsAccessStateReady(true);
        setView('account');
      }
    };
    init();

    // Listen for future auth state changes (login / logout)
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (event === 'INITIAL_SESSION' && didBootstrapInitialSessionRef.current) {
            return;
          }
          const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
          const inferredNewUser = session.user.created_at
            ? Date.now() - new Date(session.user.created_at).getTime() < 30000
            : false;
          const optimisticIsNewUser = authIntent === 'signup' || inferredNewUser;

          if (session.user.email) {
            setUserEmail(session.user.email);
            localStorage.setItem('callmate_user_email', session.user.email);
          }
          setSupabaseUser(session.user);
          localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);

          if (!isSigningOutRef.current && ['splash', 'explainer', 'onboarding', 'reviews', 'account'].includes(viewRef.current)) {
            setView(optimisticIsNewUser ? 'notifications' : 'home');
          }

          let isReturningUser = true;
          let result: Awaited<ReturnType<typeof hydrateSignedInUser>> | null = null;
          try {
            result = await hydrateSignedInUser(session.user, authIntent);
            isReturningUser = result.isReturningUser;
            // AUTH_INTENT_KEY is intentionally NOT removed here.
            // It is removed in handleGoogle/handleApple's finally blocks so it stays set
            // for the full duration of the SSO flow, preventing SIGNED_OUT from
            // calling setView('account') if Supabase replaces the session mid-flow.
            localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);
          } catch (error) {
            console.error('Failed to hydrate user after auth change', error);
          }

          // Only automatically set view if we are currently in an onboarding/auth view
          // This avoids interrupting the user if they are already using the app.
          // isSigningOutRef guard prevents a stale auth event from immediately
          // redirecting the user back to home after they sign out.
          if (!isSigningOutRef.current && ['splash', 'explainer', 'onboarding', 'reviews', 'account', 'setup'].includes(viewRef.current)) {
            if (result?.access?.tier === 'admin' || isReturningUser) {
              setView('home');
            } else {
              setView('notifications');
            }
          }
        }
      } else {
        setSupabaseUser(null);
        setIsAccessStateReady(true);
        if (event === 'SIGNED_OUT') {
          // If AUTH_INTENT_KEY is set, a sign-in is actively in progress.
          // This SIGNED_OUT is fired by supabase.auth.setSession() when it replaces the
          // old session with the new OAuth session — it is NOT a real user sign-out.
          // Skipping the isSigningOutRef flag and setView('account') lets the subsequent
          // SIGNED_IN event (and onComplete) navigate correctly without being blocked.
          const signingInActive = !!localStorage.getItem(AUTH_INTENT_KEY);
          if (!signingInActive) {
            isSigningOutRef.current = true;
            setTimeout(() => { isSigningOutRef.current = false; }, 2000);
          }
          channelRef.current.forEach(ch => ch.unsubscribe());
          channelRef.current = [];
          clearLocalUserCollections();
          resetSignedOutProfileState();
          setTier('free');
          setTrialStartDate(null);
          setTrialScriptsUsed(0);
          setSelectedPlan(null);
          setIsAccessStateReady(false);
          setUserEmail('');
          localStorage.removeItem('callmate_user_email');
          localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);
          if (!signingInActive) {
            setView('account');
          }
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
        const hasPendingOAuthCallback = localStorage.getItem(PENDING_OAUTH_CALLBACK_KEY) === '1';
        if (!authIntent || !hasPendingOAuthCallback) return;
        const { supabase: sb } = await import('./services/supabase');
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) {
            const profile = (await hydrateSignedInUser(session.user, authIntent)).profile;
            localStorage.removeItem(AUTH_INTENT_KEY);
            localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);
            const isReturningUser = profile?.name || authIntent === 'login' || (Date.now() - new Date(session.user.created_at).getTime() > 30000);
            const access = await loadAccessStateSafely();
            if (access?.tier === 'admin' || isReturningUser) {
              setView('home');
            } else {
              setView('notifications');
            }
            return;
          }

          await new Promise(resolve => window.setTimeout(resolve, 250));
        }

        console.error('Pending OAuth session was not available after callback.');
      };

      const handleAuthCallbackUrl = async (url?: string | null) => {
        if (!url?.startsWith('com.trycallmate.app://')) return;
        localStorage.setItem(PENDING_OAUTH_CALLBACK_KEY, '1');
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
            localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);
            return;
          }
          await completePendingAuthIfNeeded();
          return;
        }

        const accessToken = params.get('access_token');
        if (accessToken) {
          const refreshToken = params.get('refresh_token');
          if (refreshToken) {
            const { error } = await sb.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('OAuth token session restore failed', error);
            }
          } else {
            console.warn('OAuth callback missing refresh_token — waiting for onAuthStateChange');
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
    if (view !== 'splash') {
      setShowSplashPulse(false);
      setShowSplashText(false);
      return;
    }

    const pulseTimer = window.setTimeout(() => setShowSplashPulse(true), 260);
    const textTimer = window.setTimeout(() => setShowSplashText(true), 760);

    return () => {
      window.clearTimeout(pulseTimer);
      window.clearTimeout(textTimer);
    };
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
        discovery_source: heardAboutUs,
        call_streak: callStreak,
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
    heardAboutUs,
    callStreak,
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
    setIsHistoryLoading(true);
    try {
    const [remoteScripts, remoteReflections, remoteRatings, remotePersonas, profile] = await Promise.all([
      fetchScripts(userId),
      fetchReflections(userId),
      fetchAnxietyRatings(userId),
      fetchPersonas(userId),
      fetchProfile(userId),
    ]);

    const sanitizedRemoteScripts = sanitizeHistory(remoteScripts);
    persistScriptLocally(sanitizedRemoteScripts);
    persistReflectionsLocally(remoteReflections);
    const mappedRatings = remoteRatings
      .map(r => ({
        id: r.id,
        scriptId: r.script_id,
        rating: r.rating,
        timestamp: r.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    persistRatingsLocally(mappedRatings);
    persistPersonasLocally(remotePersonas);
    if (profile) {
      if (profile.name) { setUserName(profile.name); localStorage.setItem('callmate_user_name', profile.name); }
      if (profile.gender !== undefined && profile.gender !== null) { setUserGender(profile.gender); localStorage.setItem('callmate_user_gender', profile.gender); }
      if (profile.age_range !== undefined && profile.age_range !== null) { setUserAgeRange(profile.age_range); localStorage.setItem('callmate_user_age_range', profile.age_range); }
      if (profile.anxiety_severity) { setAnxietySeverity(profile.anxiety_severity as AnxietySeverity); localStorage.setItem('callmate_severity', profile.anxiety_severity); }
      if (Array.isArray(profile.anxiety_triggers)) { setAnxietyTriggers(profile.anxiety_triggers); localStorage.setItem('callmate_triggers', JSON.stringify(profile.anxiety_triggers)); }
      if (Array.isArray(profile.life_impact)) { setLifeImpact(profile.life_impact); localStorage.setItem('callmate_impact', JSON.stringify(profile.life_impact)); }
      if (profile.discovery_source) { setHeardAboutUs(profile.discovery_source); localStorage.setItem('callmate_heard_about_us', profile.discovery_source); }
      if (typeof profile.call_streak === 'number') { setCallStreak(profile.call_streak); localStorage.setItem('callmate_streak', String(profile.call_streak)); }
      setTheme(profile.dark_mode ? 'dark' : 'light');
    }
    return profile;
    } catch (err) {
      console.error('[loadUserData] failed:', err);
      return null;
    } finally {
      setIsHistoryLoading(false);
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
      await replaceCurrentScript(updated);
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
    void replaceCurrentScript(updated);
  };

  const handleGenerate = async (overrideTone?: Tone, overrideDesc?: string) => {
    const targetTone = overrideTone || tone;
    const targetDescription = overrideDesc || (overrideTone ? currentScript?.description : description) || description;
    
    // Check for limits
    if (!isPremium) {
      console.warn('Generate blocked: user is not premium or trial is inactive.', { tier, trialDaysRemaining });
      setUpgradeModalForced(true);
      setShowUpgradeModal(true);
      return;
    }
    if (tier === 'trial' && trialScriptsUsed >= TRIAL_SCRIPT_LIMIT) {
      console.warn('Generate blocked: trial script limit reached.', { tier, trialScriptsUsed, limit: TRIAL_SCRIPT_LIMIT });
      setUpgradeModalForced(true);
      setShowUpgradeModal(true);
      return;
    }

    const sanitizedDescription = targetDescription.trim().slice(0, 500);
    if (!sanitizedDescription) return;
    setGenerateError(null);
    setGenerateAttempt(0);
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

      // Exponential backoff — up to 3 attempts (0 ms, 1 000 ms, 2 000 ms)
      const DELAYS = [0, 1000, 2000];
      let script = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < DELAYS.length; attempt++) {
        if (attempt > 0) {
          setGenerateAttempt(attempt);
          await new Promise<void>((res) => window.setTimeout(res, DELAYS[attempt]));
        }
        try {
          script = await generateCallScript(sanitizedDescription, targetTone, perspective, selectedPersona || undefined, userProfile);
          break;
        } catch (err) {
          lastError = err;
          console.warn(`Script generation attempt ${attempt + 1} failed`, err);
        }
      }
      if (!script) throw lastError;

      setCurrentScript(script);

      // Auto-save to history for all tiers
      const newHistory = [script, ...history].slice(0, 100);
      persistScriptLocally(newHistory);

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

      hapticSuccess();
      setVoicemailScript(null);
      setEmailFallback(null);
      setShowAddBranch(false);
      setAddBranchInput('');
      setPreviousView('home');
      setView('script');
      if (supabaseUser) {
        void (async () => {
          try {
            await saveScript(supabaseUser.id, script);
          } catch (saveErr) {
            console.warn('Script save failed (offline?), queuing for retry.', saveErr);
            enqueueFailedSave(supabaseUser.id, script);
          }
          await loadAccessStateSafely();
        })();
      }
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
      const message = error instanceof Error ? error.message : 'Connection error. Please try again.';
      setGenerateError(message);
    } finally {
      setLoading(false);
      setIsRewriting(false);
      setGenerateAttempt(0);
    }
  };

  const handleSimulateCall = async () => {
    if (!currentScript) return;
    if (!canUsePracticeMode) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLaunchingSimulator(true);
    try {
      await requestVoiceSimulatorPermissions();
      setSimulatorScenario(buildPracticeScenario(currentScript, perspective));
      setShowCallSimulator(true);
    } catch (error) {
      console.error(error);
      alert('Microphone and Speech Recognition access are required to start the simulated call.');
    } finally {
      setIsLaunchingSimulator(false);
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
    persistReflectionsLocally(newReflections);

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
      persistRatingsLocally(newRatings);

      if (supabaseUser) {
        void syncAnxietyRatings(supabaseUser.id, [newRating]);
      }

      // ── Anxiety trend notification ─────────────────────────────────────────
      // Fire at most once per hour to avoid spamming the user.
      const TREND_NOTIF_KEY = 'callmate_trend_notif_last';
      const lastNotifAt = Number(localStorage.getItem(TREND_NOTIF_KEY) ?? 0);
      const hourMs = 60 * 60 * 1000;
      if (newRatings.length >= 3 && Date.now() - lastNotifAt > hourMs) {
        const last3 = newRatings.slice(-3).map((r) => r.rating);
        const avg = last3.reduce((s, r) => s + r, 0) / 3;
        const isDecreasing = last3[2] < last3[1] && last3[1] <= last3[0];
        if (isDecreasing && avg <= 3) {
          // Consistent improvement — celebrate
          scheduleLocalNotification(
            "You're making real progress! 🎉",
            'Your anxiety scores have been trending down. Keep it up!'
          );
          localStorage.setItem(TREND_NOTIF_KEY, String(Date.now()));
        } else if (avg >= 4) {
          // Consistently high anxiety — encourage practice
          scheduleLocalNotification(
            "A tough stretch — you've got this 💪",
            'Try a quick practice call to build confidence before your next real one.'
          );
          localStorage.setItem(TREND_NOTIF_KEY, String(Date.now()));
        }
      }
      // ──────────────────────────────────────────────────────────────────────

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
      persistScriptLocally([]);
      persistReflectionsLocally([]);
      persistRatingsLocally([]);
      setCurrentScript(null);
      if (supabaseUser) {
        void deleteAllScriptsForUser(supabaseUser.id);
      }
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
    void replaceCurrentScript(updated);
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
    <div className={cn("fixed inset-0 warm-therapeutic-bg flex flex-col items-center justify-center p-6 overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <div className="absolute top-11 left-6 z-10">
        <p className={cn("text-2xl font-semibold tracking-tight", isDark ? "text-[#f2ede3]" : "text-[#22312b]")}>Callmate</p>
      </div>
      <motion.div initial={false} animate={{ opacity: 1, scale: 1 }} className="relative">
        <motion.div
          initial={false}
          animate={showSplashPulse ? { scale: [1, 1.55, 1], opacity: [0.36, 0.05, 0.36] } : { scale: 1, opacity: 0 }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-[3rem] bg-[#709283]/45"
        />
        <motion.div
          initial={false}
          animate={showSplashPulse ? { scale: [1, 1.32, 1], opacity: [0.26, 0.04, 0.26] } : { scale: 1, opacity: 0 }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeOut", delay: 0.75 }}
          className="absolute inset-0 rounded-[3rem] bg-[#b59e7f]/32"
        />
        <motion.div
          initial={false}
          animate={showSplashPulse ? { scale: [1.012, 0.988, 1.012], opacity: [1, 0.97, 1] } : { scale: 1, opacity: 1 }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", delay: 1.55 }}
          className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl relative z-10 ring-1 ring-black/8"
        >
          <img
            src={appIconPng}
            alt="Callmate app icon"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </motion.div>
      <motion.div
        initial={false}
        animate={showSplashText ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <p
          className={cn(
            "mt-8 text-center text-4xl font-semibold tracking-tight leading-[0.95]",
            isDark ? "text-[#f2ede3]" : "text-[#111111]"
          )}
        >
          <span className="block">Phone calls</span>
          <span className="block">made easy</span>
        </p>
        <p className={cn("mt-8 text-center text-base", isDark ? "text-[#e1e8e3]" : "text-[#3f5049]")}>You can handle this call.</p>
      </motion.div>
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
          <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base" onClick={() => setView('reset')}>
            Help me feel steadier <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );

  if (view === 'reset') return (
    <div className={cn("app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>
      <div className="relative z-10 flex-1 flex flex-col justify-between px-7 pt-14 pb-10 max-w-md mx-auto w-full">
        <div className="space-y-8">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isDark ? "text-[#9fc0b0]" : "text-[#5d8a7a]")}
          >
            Your pre-call reset
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <h1 className="text-[3rem] font-semibold tracking-tight leading-[0.92]">
              The best way
              <br />
              to calm before
              <br />
              a call
            </h1>
            <p className={cn("text-base leading-relaxed max-w-[32ch]", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>
              Before most hard calls, do this first. It takes less than 30 seconds and helps take the edge off before you speak.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cn("rounded-[2rem] border p-5 space-y-4", isDark ? "bg-[#202926]/88 border-[#415049]" : "bg-[rgba(255,251,245,0.9)] border-[#d8cdc0]")}
          >
            <div className="flex items-start gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isDark ? "bg-[#2f3c37]" : "bg-[#eef1ed]")}>
                <span className="text-2xl" aria-hidden="true">🫁</span>
              </div>
              <div className="space-y-1">
                <p className={cn("text-sm font-black uppercase tracking-[0.18em]", isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>
                  Before every difficult call
                </p>
                <p className={cn("text-sm leading-relaxed", isDark ? "text-[#dbe3de]" : "text-[#51615b]")}>
                  Slow your breathing, relax your body, and lower the panic spike before the phone even rings.
                </p>
              </div>
            </div>
            <div className={cn("rounded-2xl px-4 py-3", isDark ? "bg-[#171f1d]" : "bg-[#f3eee4]")}>
              <p className={cn("text-sm font-medium leading-relaxed", isDark ? "text-[#c5d0ca]" : "text-[#51615b]")}>
                Try it once now. We&apos;ll build this into Callmate before your hard calls.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3 pt-6">
          <Button
            size="lg"
            variant="primary"
            isDark={isDark}
            className="w-full h-14 font-bold text-base"
            onClick={() => setShowIntroBreathe(true)}
          >
            Try the pre-call reset <ChevronRight className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setView('onboarding')}
            className={cn("w-full text-sm font-medium py-1 transition-colors", isDark ? "text-[#97a59f] hover:text-[#dbe3de]" : "text-[#66756f] hover:text-[#22312b]")}
          >
            Skip for now
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showIntroBreathe && (
          <PreCallCheck
            isDark={isDark}
            mode="breathe"
            onClose={() => {
              setShowIntroBreathe(false);
              setView('onboarding');
            }}
          />
        )}
      </AnimatePresence>
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
        {!showOnboardingDiscovery && !showOnboardingThankYou && (
          <div className="relative z-10 flex items-center justify-center gap-2 pt-10 pb-2 shrink-0">
            {[1, 2, 3, 4, 5].map(s => (
              <motion.div key={s} layout animate={{ width: s === onboardingStep ? 28 : 8 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn("h-1.5 rounded-full", s <= onboardingStep ? "bg-[#7b9d76]" : (isDark ? "bg-[#33403b]" : "bg-[#d8cdc0]"))} />
            ))}
          </div>
        )}

        <div className="keyboard-aware flex-1 flex flex-col px-7 pb-8 max-w-md mx-auto w-full relative z-10 overflow-y-auto">
          {showOnboardingDiscovery ? (
            <OnboardingDiscoveryStep
              isDark={isDark}
              initialValue={heardAboutUs}
              onBack={() => setView('explainer')}
              onContinue={(value) => {
                setHeardAboutUs(value);
                localStorage.setItem('callmate_heard_about_us', value);
                setShowOnboardingDiscovery(false);
                setOnboardingStep(1);
                window.requestAnimationFrame(() => {
                  window.scrollTo({ top: 0, behavior: 'auto' });
                });
              }}
            />
          ) : showOnboardingThankYou ? (
            <OnboardingThankYouStep
              isDark={isDark}
              onBack={() => setShowOnboardingThankYou(false)}
              onContinue={() => {
                localStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
                setSetupNextView('reviews');
                setView('setup');
              }}
            />
          ) : (
          <AnimatePresence mode="wait">

            {onboardingStep === 1 && (
              <OnboardingProfileStep
                isDark={isDark}
                initialName={userName}
                initialGender={userGender}
                initialAgeRange={userAgeRange}
                onContinue={({ name, gender, ageRange }) => {
                  setUserName(name);
                  setUserGender(gender);
                  setUserAgeRange(ageRange);
                  localStorage.setItem('callmate_user_name', name);
                  localStorage.setItem('callmate_user_gender', gender);
                  localStorage.setItem('callmate_user_age_range', ageRange);
                  setOnboardingStep(2);
                }}
              />
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
                  {anxietyTriggers.some(trigger => !TRIGGERS.includes(trigger)) && (
                    <div className={cn("w-full rounded-2xl border p-4 space-y-3", isDark ? "border-[#415049] bg-[#202926]/70" : "border-[#d8cdc0] bg-[rgba(255,251,245,0.88)]")}>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>Your custom answers</p>
                      <div className="flex flex-wrap gap-2">
                        {anxietyTriggers
                          .filter(trigger => !TRIGGERS.includes(trigger))
                          .map(trigger => (
                            <button
                              key={trigger}
                              type="button"
                              onClick={() => {
                                const next = anxietyTriggers.filter(t => t !== trigger);
                                setAnxietyTriggers(next);
                                localStorage.setItem('callmate_triggers', JSON.stringify(next));
                              }}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium border transition-all",
                                isDark
                                  ? "border-[#7b9d76] bg-[#5d8a7a]/15 text-[#dbe8df]"
                                  : "border-[#8fae9e] bg-[#dbe8df] text-[#476f61]"
                              )}
                            >
                              <span>{trigger}</span>
                              <span className="text-xs font-black">×</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
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
                  <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}>
                    <OnboardingDemoDashboard isDark={isDark} />
                  </Suspense>
                </div>
                <div className="shrink-0 pt-4 space-y-2">
                  <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base bg-[#5d8a7a] hover:bg-[#527a6c] shadow-[#5d8a7a]/20" onClick={() => setShowOnboardingThankYou(true)}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                  <p className="text-center text-[10px] text-zinc-500 pt-1">One quick stop before we set up your free trial.</p>
                  <button onClick={() => setOnboardingStep(4)} className="w-full text-center text-zinc-500 text-sm py-1 hover:text-zinc-400 transition-colors">Back</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
          )}
        </div>
      </div>
    );
  }

  if (view === 'account') return <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}><AccountSetup
    isDark={isDark}
    userName={userName}
    tier={tier}
    selectedPlan={selectedPlan}
    trialStartDate={trialStartDate}
    onComplete={async (email, isNewUser) => {
      const { supabase: sb } = await import('./services/supabase');
      let freshSession: Session | null = null;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          freshSession = session;
          break;
        }
        await new Promise(resolve => window.setTimeout(resolve, 250));
      }
      if (!freshSession?.user) {
        throw new Error('No active auth session found.');
      }

      setSupabaseUser(freshSession.user);
      const resolvedEmail = freshSession.user.email ?? email;
      if (resolvedEmail) {
        setUserEmail(resolvedEmail);
        localStorage.setItem('callmate_user_email', resolvedEmail);
      }

      localStorage.removeItem(AUTH_INTENT_KEY);
      localStorage.removeItem(PENDING_OAUTH_CALLBACK_KEY);

      const nextView = isNewUser ? 'notifications' : 'home';
      if (viewRef.current === 'account') {
        setView(nextView);
      }

      void (async () => {
        try {
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
              discoverySource: heardAboutUs,
              callStreak,
              tier,
              trialStartDate,
              darkMode: isDark,
            });
            applyAccessState(await startTrial(selectedPlan ?? 'monthly'));
          } else {
            await loadAccessState();
          }
        } catch (err) {
          console.error('onComplete DB operations failed after navigation', err);
        }
      })();
    }}
  /></Suspense>;

  if (view === 'setup') return <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}><SetupAnimation
    isDark={isDark}
    userName={userName}
    onDone={() => setView(setupNextView)}
  /></Suspense>;

  if (view === 'notifications') return (
    <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}>
      <OnboardingNotificationsStep
        isDark={isDark}
        onContinue={() => {
          void (async () => {
            localStorage.setItem('callmate_notifications_prompt_seen', 'true');
            setView('home');
            try {
              await requestNotificationsAccess();
            } catch (error) {
              console.error('Failed to request notifications', error);
            }
          })();
        }}
      />
    </Suspense>
  );

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
            { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after I hung up.", tag: "Medical / Doctor Call", avatar: reviewAvatar1 },
            { name: "Jenna T.", location: "Austin", quote: "Negotiated my rent down $150/month. The Firm tone was unreal — my landlord didn't even push back.", tag: "Landlord Call", avatar: reviewAvatar2 },
            { name: "Chase K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call", avatar: reviewAvatar3 },
            { name: "Meritas R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing.", tag: "Customer Service", avatar: reviewAvatar4 },
          ].map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-[#202926]/80 border-[#415049]" : "bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]")}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={r.avatar}
                    alt=""
                    aria-hidden="true"
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/20"
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                    <p className={cn("text-[10px]", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>{r.location} · {r.tag}</p>
                  </div>
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
    <div className={cn("h-[100dvh] warm-therapeutic-bg transition-colors duration-500 selection:bg-white/10 relative overflow-hidden flex flex-col overscroll-none", isDark ? "bg-[#161d1b] text-[#f6f2ea]" : "text-[#22312b]")}>

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
        {isOnline && isSyncing && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-emerald-900 text-emerald-200 text-xs font-semibold py-2 px-4"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing saved scripts…
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

      <header className={cn("sticky top-0 z-40 border-b px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] flex items-center justify-between transition-colors", isDark ? "bg-[#161d1b]/95 border-[#33403b]" : "bg-[rgba(243,238,228,0.92)] border-[#d8cdc0]")}>
        <p className={cn("text-2xl font-semibold tracking-tight", isDark ? "text-[#f2ede3]" : "text-[#22312b]")}>
          {view === 'script'
            ? 'Call Script'
            : view === 'dashboard'
              ? 'Your Progress'
              : view === 'history'
                ? 'History'
                : view === 'settings'
                  ? 'Settings'
                  : 'Home'}
        </p>
        <div className="flex items-center gap-3">
          {view !== 'settings' && (
            <button 
              onClick={() => setView('settings')}
              className={cn(
                "p-2 rounded-xl transition-all",
                isDark ? "bg-[#202926] text-[#97a59f] hover:bg-[#293330]" : "bg-[#ece5da] text-[#66756f] hover:bg-[#e3dacd]"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>


      <main className="keyboard-aware flex-1 min-h-0 overflow-y-auto overscroll-contain max-w-2xl mx-auto w-full p-6 pb-48">
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

              <Suspense fallback={<DeferredScreenFallback isDark={isDark} kind="home" />}>
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
                  generateError={generateError}
                  generateAttempt={generateAttempt}
                  handleGenerate={handleGenerate}
                  expandedSafeLineIndex={expandedSafeLineIndex}
                  toggleSafeLine={toggleSafeLine}
                />
              </Suspense>

            </div>
          )}

          {view === 'settings' && (
            <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}>
              <SettingsScreen
                key="settings"
                isDark={isDark}
                activeTab={activeTab}
                setView={setView}
                supabaseUser={supabaseUser}
                userEmail={userEmail}
                userName={userName}
                signOut={handleSignOut}
                setSupabaseUser={setSupabaseUser}
                setUserEmail={setUserEmail}
                isPremium={isPremium}
                setShowUpgradeModal={setShowUpgradeModal}
                setUpgradeModalForced={setUpgradeModalForced}
                setTheme={setTheme}
                personas={personas}
                setSelectedPersona={setSelectedPersona}
                setShowPersonaModal={setShowPersonaModal}
                deletePersona={(personaId) => {
                  const next = personas.filter((persona) => persona.id !== personaId);
                  persistPersonasLocally(next);
                  if (supabaseUser) {
                    void dbDeletePersona(personaId);
                  }
                }}
                tier={tier}
                historyLength={history.length}
                clearHistory={clearHistory}
                onExportJSON={handleExportJSON}
                onExportCSV={handleExportCSV}
                onImportFile={handleImportFile}
                onImportConfirm={(preview, mode) => { void handleImportConfirm(preview, mode); }}
              />
            </Suspense>
          )}

          {view === 'dashboard' && (
            <Suspense fallback={<DeferredScreenFallback isDark={isDark} />}>
              <DashboardScreen
                key="dashboard"
                isDark={isDark}
                historyLength={history.length}
                recoveryScore={recoveryScore}
                callStreak={callStreak}
                callAnxietyRatings={callAnxietyRatings}
                practiceSessions={practiceSessions}
                milestones={MILESTONES}
                unlockedMilestones={unlockedMilestones}
                anxietySeverity={anxietySeverity}
                lifeImpact={lifeImpact}
              />
            </Suspense>
          )}

          {view === 'history' && (
            <Suspense fallback={<DeferredScreenFallback isDark={isDark} kind="history" />}>
              <HistoryScreen
                key="history"
                isDark={isDark}
                currentScript={currentScript}
                setView={setView}
                isPremium={isPremium}
                isLoading={isHistoryLoading && history.length === 0}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredHistory={filteredHistory}
                setCurrentScript={setCurrentScript}
                setPreviousView={setPreviousView}
                toggleStar={toggleStar}
                starredScripts={starredScripts}
              />
            </Suspense>
          )}

          {view === 'script' && currentScript && (
            <Suspense fallback={<DeferredScreenFallback isDark={isDark} kind="script" />}>
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
                handleSimulateCall={handleSimulateCall}
                isLaunchingSimulator={isLaunchingSimulator}
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
                  <Suspense fallback={null}>
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
                  </Suspense>
                }
              />
            </Suspense>
          )}
        </AnimatePresence>
      </main>

      {['home', 'history', 'dashboard', 'settings'].includes(view) && !showPreCallCheck && (
        <div className="fixed bottom-[104px] right-6 z-[65] max-w-2xl mx-auto">
          <motion.button
            type="button"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
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
          </motion.button>
        </div>
      )}

      <Suspense fallback={null}>
        <CallSimulator
          isOpen={showCallSimulator}
          isDark={isDark}
          scenario={simulatorScenario}
          onSessionComplete={(session) => {
            persistPracticeSessions([...practiceSessions, session]);
          }}
          onClose={() => {
            setShowCallSimulator(false);
            setSimulatorScenario(null);
          }}
        />
      </Suspense>

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
                    { name: "Sarah M.", location: "Chicago", quote: "I finally called my doctor after putting it off for 3 years. I literally cried after I hung up.", tag: "Medical / Doctor Call", avatar: reviewAvatar1 },
                    { name: "Jenna T.", location: "Austin", quote: "Negotiated my rent down $150/month. The Firm tone was unreal — my landlord didn't even push back.", tag: "Landlord Call", avatar: reviewAvatar2 },
                    { name: "Chase K.", location: "New York", quote: "I used to let every work call go to voicemail and make up excuses. Not anymore.", tag: "Work Call", avatar: reviewAvatar3 },
                    { name: "Meritas R.", location: "Seattle", quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing. Nothing else comes close.", tag: "Customer Service", avatar: reviewAvatar4 },
                  ].map((r, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl border transition-colors", isDark ? "bg-[#171f1d] border-[#415049]" : "bg-[#fffdf9] border-[#d8cdc0]")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={r.avatar}
                            alt=""
                            aria-hidden="true"
                            className="w-11 h-11 rounded-full object-cover shrink-0 border border-white/20"
                          />
                          <div className="min-w-0">
                            <p className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{r.name}</p>
                            <p className={cn("text-[10px]", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>{r.location} · {r.tag}</p>
                          </div>
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
                      void openInAppBrowser('https://apps.apple.com/us/app/callmate/id6760322838');
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
        {showUpgradeModal && (isAccessStateReady || upgradeModalForced) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              onClick={() => { setShowUpgradeModal(false); if (['notifications', 'reviews', 'setup', 'onboarding', 'explainer'].includes(viewRef.current)) setView('home'); }}
              className="fixed inset-0 bg-transparent z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
              className={cn("fixed inset-0 z-[110] shadow-2xl overflow-y-auto transition-colors", isDark ? "bg-[#202926]" : "bg-[rgba(255,251,245,0.99)]")}
            >
              <header className={cn("sticky top-0 z-10 border-b px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] flex items-center justify-between transition-colors", isDark ? "bg-[#202926]/95 border-[#33403b]" : "bg-[rgba(243,238,228,0.92)] border-[#d8cdc0]")}>
                <div>
                  <p className={cn("text-2xl font-semibold tracking-tight", isDark ? "text-[#f2ede3]" : "text-[#22312b]")}>Subscription</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { void handleRestorePurchases(); }}
                    className={cn("text-sm font-semibold transition-colors", isDark ? "text-[#b7d0c4] hover:text-white" : "text-[#5d8a7a] hover:text-[#22312b]")}
                  >
                    Restore
                  </button>
                  <button onClick={() => { setShowUpgradeModal(false); if (['notifications', 'reviews', 'setup', 'onboarding', 'explainer'].includes(viewRef.current)) setView('home'); }} className={cn("p-2 rounded-xl transition-all", isDark ? "bg-[#171f1d] hover:bg-[#2b3632] text-[#97a59f]" : "bg-[#ece5da] hover:bg-[#e2d8ca] text-[#66756f]")}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>
              <div className="px-6 py-6 pb-10 max-w-2xl mx-auto min-h-full space-y-6">
                <div className="space-y-1">
                  <h2 className={cn("text-2xl font-black leading-tight", isDark ? "text-white" : "text-black")}>
                    {userName ? (
                      <>Hey <span className={cn(isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>{userName}</span>,<br /></>
                    ) : null}
                    Unlock <span className={cn(isDark ? "text-[#b7d0c4]" : "text-[#5d8a7a]")}>Callmate</span> for help with phone anxiety.
                  </h2>
                </div>
                <div className="hidden">
                  <div className="flex items-center gap-3 shrink-0 mt-1">
                    <button
                      onClick={() => { void handleRestorePurchases(); }}
                      className={cn("text-sm font-semibold transition-colors", isDark ? "text-[#b7d0c4] hover:text-white" : "text-[#5d8a7a] hover:text-[#22312b]")}
                    >
                      Restore
                    </button>
                    <button onClick={() => { setShowUpgradeModal(false); if (['notifications', 'reviews', 'setup', 'onboarding', 'explainer'].includes(viewRef.current)) setView('home'); }} className={cn("p-2 rounded-full transition-colors", isDark ? "bg-[#171f1d] hover:bg-[#2b3632]" : "bg-[#ece5da] hover:bg-[#e2d8ca]")}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
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
                    { icon: '📞', text: 'Simulate Call — practice a guided two-way call with AI' },
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
                    onClick={() => { void handleIAPPurchase('monthly'); }}
                    className={cn(
                      "p-5 rounded-2xl border transition-all relative",
                      purchasingPlan ? "cursor-not-allowed" : "cursor-pointer active:scale-[0.99]",
                      purchasingPlan === 'annual' && "opacity-40",
                      tier === 'monthly' ? (isDark ? "bg-[#274136]/45 border-[#7fa091]" : "bg-[#eef5f1] border-[#8fae9e]") : (isDark ? "bg-[#171f1d] border-[#415049] hover:border-[#66756f]" : "bg-[#fffdf9] border-[#d8cdc0] hover:border-[#b7aa96]")
                    )}
                  >
                    {purchasingPlan === 'monthly' && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <Loader2 className={cn("w-6 h-6 animate-spin", isDark ? "text-[#7fa091]" : "text-[#5d8a7a]")} />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Monthly</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest", isDark ? "bg-[#5d8a7a]/20 text-[#b7d0c4]" : "bg-[#dbe8df] text-[#5d8a7a]")}>Popular</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>Billed monthly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>{iapPrices.monthly ?? '$8.99'}<span className={cn("text-sm font-normal", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>/mo</span></p>
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-[#274136]/35 text-[#d7e6df]" : "bg-[#eef5f1] text-[#4d6f62]")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then {iapPrices.monthly ?? '$8.99'}/month · Pay nothing today
                    </div>
                  </div>

                  {/* Annual */}
                  <div
                    onClick={() => { void handleIAPPurchase('annual'); }}
                    className={cn(
                      "p-5 rounded-2xl border transition-all relative",
                      purchasingPlan ? "cursor-not-allowed" : "cursor-pointer active:scale-[0.99]",
                      purchasingPlan === 'monthly' && "opacity-40",
                      tier === 'annual' ? (isDark ? "bg-[#314230]/45 border-[#9bb68f]" : "bg-[#f1f5ea] border-[#a9be97]") : (isDark ? "bg-[#171f1d] border-[#415049] hover:border-[#66756f]" : "bg-[#fffdf9] border-[#d8cdc0] hover:border-[#b7aa96]")
                    )}
                  >
                    {purchasingPlan === 'annual' && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <Loader2 className={cn("w-6 h-6 animate-spin", isDark ? "text-[#9bb68f]" : "text-[#587651]")} />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-black")}>Annual</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest", isDark ? "bg-[#7b9d76]/20 text-[#d3e1cb]" : "bg-[#edf4e8] text-[#6e8f69]")}>Save 35%</span>
                        </div>
                        <p className={cn("text-xs", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>Best value · Billed yearly after trial</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-black tabular-nums", isDark ? "text-white" : "text-black")}>{iapPrices.annual ?? '$69.99'}<span className={cn("text-sm font-normal", isDark ? "text-[#97a59f]" : "text-[#6f7d75]")}>/yr</span></p>
                        {!iapPrices.annual && <p className={cn("text-[10px] font-black", isDark ? "text-[#c6ddb7]" : "text-[#6e8f69]")}>≈ $5.83/mo</p>}
                      </div>
                    </div>
                    <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2", isDark ? "bg-[#314230]/35 text-[#d9e6cf]" : "bg-[#edf4e8] text-[#587651]")}>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      3 days free, then {iapPrices.annual ?? '$69.99'}/year · Cancel anytime
                    </div>
                  </div>
                </div>

                <Suspense fallback={null}>
                  <ReviewSlideshow isDark={isDark} />
                </Suspense>

                <p className={cn("text-center text-xs leading-relaxed", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
                  You won't be charged until your 3-day free trial ends.<br />Cancel anytime before then — no questions asked.
                </p>

                {/* Footer links */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button onClick={() => openInAppBrowser('https://www.trycallmate.app/terms.html')} className={cn("text-xs transition-colors underline underline-offset-2", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#66756f] hover:text-[#4d5d56]")}>Terms of Service</button>
                  <span className={cn("text-xs", isDark ? "text-[#5b6962]" : "text-[#b6a998]")}>·</span>
                  <button onClick={() => openInAppBrowser('https://www.trycallmate.app/privacy.html')} className={cn("text-xs transition-colors underline underline-offset-2", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#66756f] hover:text-[#4d5d56]")}>Privacy Policy</button>
                </div>

                {!purchasingPlan && (
                  <button onClick={() => { setShowUpgradeModal(false); if (['notifications', 'reviews', 'setup', 'onboarding', 'explainer'].includes(viewRef.current)) setView('home'); }} className={cn("w-full text-sm font-medium py-1 transition-colors", isDark ? "text-[#97a59f] hover:text-[#c5d0ca]" : "text-[#87938d] hover:text-[#66756f]")}>Maybe later</button>
                )}
              </div>
            </motion.div>
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
                      value={personaDraftName}
                      onChange={(e) => setPersonaDraftName(e.target.value)}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">How This Version of You Speaks</label>
                    <textarea 
                      placeholder="e.g. I am calm, direct, and respectful. I do not over-explain. I ask clearly for what I need and stay grounded if there is pushback." 
                      value={personaDraftContext}
                      onChange={(e) => setPersonaDraftContext(e.target.value)}
                      className={cn("w-full p-4 rounded-2xl border focus:outline-none h-32 resize-none", isDark ? "bg-black border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-black")}
                    />
                    <p className={cn("text-xs leading-relaxed px-1", isDark ? "text-[#97a59f]" : "text-[#66756f]")}>
                      Describe your stance, boundaries, and energy for this kind of call. Tone still controls whether the script sounds professional, assertive, friendly, or firm.
                    </p>
                  </div>
                </div>
                <Button size="xl" className="w-full" onClick={() => {
                  const name = personaDraftName.trim();
                  const context = personaDraftContext.trim();
                  if (!name || !context) return;
                  
                  const next = selectedPersona
                    ? personas.map(p => p.id === selectedPersona.id ? { ...p, name, context } : p)
                    : [...personas, { id: crypto.randomUUID(), name, context }];
                  void persistPersonas(next);
                  setShowPersonaModal(false);
                  setPersonaDraftName('');
                  setPersonaDraftContext('');
                }}>
                  Save Call Role
                </Button>
              </div>
            </div>
          </>
        )}

        {showPostCallReinforcement && (
          <Suspense fallback={null}>
            <PostCallReinforcement
              isDark={isDark}
              rating={postCallRating}
              onClose={() => { setShowPostCallReinforcement(false); setPostCallRating(undefined); }}
            />
          </Suspense>
        )}

        {showPreCallCheck && (
          <Suspense fallback={null}>
            <PreCallCheck
              isDark={isDark}
              mode={preCallCheckMode}
              onClose={() => setShowPreCallCheck(false)}
            />
          </Suspense>
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

const OnboardingProfileStep = React.memo(function OnboardingProfileStep({
  isDark,
  initialName,
  initialGender,
  initialAgeRange,
  onContinue,
}: {
  isDark: boolean;
  initialName: string;
  initialGender: string;
  initialAgeRange: string;
  onContinue: (profile: { name: string; gender: string; ageRange: string }) => void;
}) {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = React.useState(initialName);
  const [draftGender, setDraftGender] = React.useState(initialGender);
  const [draftAgeRange, setDraftAgeRange] = React.useState(initialAgeRange);
  const [hasName, setHasName] = React.useState(!!initialName);

  React.useEffect(() => {
    setDraftName(initialName);
    setHasName(!!initialName.trim());
  }, [initialName]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const input = nameRef.current;
      // Skip if the user already tapped the field or started typing
      if (!input || document.activeElement === input || input.value.trim()) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }, 320);

    return () => window.clearTimeout(timer);
  }, []);

  return (
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
        <div className="space-y-2">
          <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>First name <span className="text-blue-500">*</span></p>
          <input
            ref={nameRef}
            type="text"
            value={draftName}
            onChange={e => {
              const next = e.target.value;
              setDraftName(next);
              setHasName(!!next.trim());
            }}
            placeholder="e.g. Alex"
            className={cn("w-full px-4 py-3.5 rounded-2xl border text-base font-medium focus:outline-none transition-all", isDark ? "bg-[#202926] border-[#415049] text-white placeholder:text-[#81918a] focus:border-[#7b9d76]" : "bg-[rgba(255,251,245,0.92)] border-[#d8cdc0] text-[#22312b] placeholder:text-[#95a19c] focus:border-[#7b9d76]")}
          />
        </div>
        <div className="space-y-2">
          <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
            Gender <span className={cn("font-normal normal-case tracking-normal text-[11px]", isDark ? "text-zinc-600" : "text-zinc-400")}>· optional</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
              <button
                key={g}
                onClick={() => setDraftGender(g === draftGender ? '' : g)}
                className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  draftGender === g
                    ? "bg-[#5d8a7a] border-[#5d8a7a] text-white"
                    : isDark ? "bg-[#202926] border-[#415049] text-[#c8d2cc] hover:border-[#66756f]" : "bg-[#f6f0e8] border-[#d8cdc0] text-[#66756f] hover:border-[#b7aa96]"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className={cn("text-xs font-bold uppercase tracking-widest px-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
            Age range <span className={cn("font-normal normal-case tracking-normal text-[11px]", isDark ? "text-zinc-600" : "text-zinc-400")}>· optional</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {['18–24', '25–34', '35–44', '45–54', '55+'].map(a => (
              <button
                key={a}
                onClick={() => setDraftAgeRange(a === draftAgeRange ? '' : a)}
                className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  draftAgeRange === a
                    ? "bg-[#5d8a7a] border-[#5d8a7a] text-white"
                    : isDark ? "bg-[#202926] border-[#415049] text-[#c8d2cc] hover:border-[#66756f]" : "bg-[#f6f0e8] border-[#d8cdc0] text-[#66756f] hover:border-[#b7aa96]"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="shrink-0 pt-5">
        <Button
          size="lg"
          variant="primary"
          isDark={isDark}
          className="w-full h-14 font-bold"
          disabled={!hasName}
          onClick={() => onContinue({ name: draftName.trim(), gender: draftGender, ageRange: draftAgeRange })}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});

const DISCOVERY_OPTIONS = [
  { value: 'Facebook', asset: facebookIcon, assetClassName: 'w-[1.05rem] h-[1.05rem]' },
  { value: 'TikTok', asset: tiktokIcon, assetClassName: 'w-[1.05rem] h-[1.05rem]' },
  { value: 'YouTube', asset: youtubeIcon, assetClassName: 'w-[1.15rem] h-[1.15rem]' },
  { value: 'Instagram', asset: instagramIcon, assetClassName: 'w-[1.05rem] h-[1.05rem]' },
  { value: 'X', asset: xIcon, assetClassName: 'w-[1rem] h-[1rem]' },
  { value: 'Google', badge: 'G' },
  { value: 'App Store', asset: appStoreIcon, assetClassName: 'w-[1.15rem] h-[1.15rem]' },
  { value: 'Family or friend', icon: Users },
  { value: 'TV', icon: Tv },
  { value: 'Other', icon: Ellipsis },
] as const;

const OnboardingDiscoveryStep = React.memo(function OnboardingDiscoveryStep({
  isDark,
  initialValue,
  onBack,
  onContinue,
}: {
  isDark: boolean;
  initialValue: string;
  onBack: () => void;
  onContinue: (value: string) => void;
}) {
  const [selection, setSelection] = React.useState(initialValue);

  React.useEffect(() => {
    setSelection(initialValue);
  }, [initialValue]);

  return (
    <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-7">
      <div className="shrink-0 mb-5">
        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={onBack}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
              isDark ? "border-[#415049] bg-[#202926] text-[#f6f2ea]" : "border-[#e8dfd4] bg-[rgba(255,251,245,0.86)] text-[#22312b]"
            )}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-[2.1rem] font-bold tracking-tight leading-[0.95] max-w-[12ch]">Where did you hear about us?</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-3">
        {DISCOVERY_OPTIONS.map(option => {
          const selected = selection === option.value;
          const Icon = 'icon' in option ? option.icon : null;
          const asset = 'asset' in option ? option.asset : null;
          return (
            <button
              key={option.value}
              onClick={() => setSelection(option.value)}
              className={cn(
                "w-full rounded-[1.6rem] border px-4 py-4 text-left transition-all flex items-center gap-4",
                selected
                  ? isDark
                    ? "bg-[#5d8a7a]/18 border-[#7b9d76] text-[#f6f2ea] shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
                    : "bg-[#dbe8df] border-[#8fae9e] text-[#22312b] shadow-[0_18px_40px_rgba(93,138,122,0.12)]"
                  : isDark
                    ? "bg-[#202926] border-[#415049] text-[#f6f2ea] hover:border-[#6a7a73]"
                    : "bg-[rgba(255,251,245,0.86)] border-[#ece5db] text-[#1a241f] hover:border-[#cfc4b5]"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center",
                  selected
                    ? isDark
                      ? "bg-[#466b5f] text-white"
                      : "bg-[#5d8a7a] text-white"
                    : isDark
                      ? "bg-[#2c3833] text-[#d7e0db]"
                      : "bg-[#eef1ed] text-[#5d6c65]"
                )}
              >
                {asset ? (
                  <img
                    src={asset}
                    alt=""
                    aria-hidden="true"
                    className={cn(
                      "object-contain",
                      'assetClassName' in option ? option.assetClassName : undefined,
                      selected && !isDark ? "brightness-0 invert" : selected && isDark ? "brightness-0 invert" : "brightness-0"
                    )}
                  />
                ) : Icon ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <span className="text-[0.95rem] font-black leading-none tracking-[-0.04em] uppercase">{'badge' in option ? option.badge : null}</span>
                )}
              </div>
              <span className="text-lg font-semibold tracking-tight">{option.value}</span>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 pt-4">
        <Button
          size="lg"
          variant="primary"
          isDark={isDark}
          className="w-full h-14 font-bold text-base"
          disabled={!selection}
          onClick={() => onContinue(selection)}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});

const OnboardingThankYouStep = React.memo(function OnboardingThankYouStep({
  isDark,
  onBack,
  onContinue,
}: {
  isDark: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div key="thank-you" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-4">
      <div className="shrink-0 mb-3">
        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={onBack}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
              isDark ? "border-[#415049] bg-[#202926] text-[#f6f2ea]" : "border-[#e8dfd4] bg-[rgba(255,251,245,0.86)] text-[#22312b]"
            )}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="space-y-5">
          <div className={cn(
            "mx-auto w-48 h-48 rounded-full flex items-center justify-center relative overflow-hidden",
            isDark ? "bg-[radial-gradient(circle_at_30%_30%,#33403b,transparent_62%),linear-gradient(135deg,#2a3531,#202926)]" : "bg-[radial-gradient(circle_at_30%_30%,#efe4d7,transparent_62%),linear-gradient(135deg,#f2e7da,#e7ece7)]"
          )}>
            <div className={cn(
              "absolute inset-[16%] rounded-full border",
              isDark ? "border-[#54635d]" : "border-[#d5ccc1]"
            )} />
            <div className={cn(
              "relative z-10 w-28 h-28 rounded-[2rem] flex items-center justify-center text-5xl",
              isDark ? "bg-[#161d1b]/75" : "bg-white/70"
            )}>
              <span aria-hidden="true">🤝</span>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <h2 className={cn("text-4xl font-bold tracking-tight leading-[0.95]", isDark ? "text-[#f6f2ea]" : "text-[#22312b]")}>
              Thank you for
              <br />
              trusting us
            </h2>
          </div>

          <div className={cn(
            "rounded-[1.8rem] border px-5 py-5 text-center",
            isDark ? "bg-[#202926] border-[#415049]" : "bg-[rgba(255,251,245,0.9)] border-[#e6ddd1]"
          )}>
            <div className={cn(
              "mx-auto mb-3 w-10 h-10 rounded-full flex items-center justify-center",
              isDark ? "bg-[#2f3c37] text-[#d7e0db]" : "bg-[#f1e8dd] text-[#5d8a7a]"
            )}>
              <Check className="w-5 h-5" />
            </div>
            <p className={cn("text-xl font-bold leading-tight", isDark ? "text-[#f6f2ea]" : "text-[#22312b]")}>
              Your privacy and security matter to us.
            </p>
            <p className={cn("mt-2 text-sm leading-relaxed", isDark ? "text-[#b7c3bd]" : "text-[#66756f]")}>
              We promise to always keep your personal information private and secure.
            </p>
          </div>
        </div>

        <div className="shrink-0 pt-6">
          <Button size="lg" variant="primary" isDark={isDark} className="w-full h-14 font-bold text-base" onClick={onContinue}>
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});
