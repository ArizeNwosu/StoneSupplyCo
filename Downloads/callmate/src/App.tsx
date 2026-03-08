import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tone, CallScript, SAFE_LINES, PANIC_OPTIONS, PanicOption, COMMON_CALL_TYPES, Persona, Reflection, Tier, CallPerspective } from './types';
import { generateCallScript, generatePanicResponse, generateTTS, generateVoicemailScript, generateEmailFallback, generateBranch } from './services/gemini';

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
    primary: isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20' : 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/20',
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
      isDark ? 'bg-zinc-900/60 backdrop-blur-sm border-white/5 hover:border-white/10' : 'bg-white/60 backdrop-blur-sm border-black/5 hover:border-black/10',
      'border rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </motion.div>
);

const RotaryItem = ({ 
  label, 
  index, 
  scrollY, 
  containerHeight, 
  itemHeight,
  onSelect,
  isSelected,
  isDark = true
}: { 
  label: string, 
  index: number, 
  scrollY: any, 
  containerHeight: number, 
  itemHeight: number,
  onSelect: () => void,
  isSelected: boolean,
  isDark?: boolean
}) => {
  const itemOffset = index * itemHeight;
  
  const opacity = useTransform(
    scrollY,
    [itemOffset - itemHeight * 2, itemOffset, itemOffset + itemHeight * 2],
    [0.2, 1, 0.2]
  );

  const scale = useTransform(
    scrollY,
    [itemOffset - itemHeight * 2, itemOffset, itemOffset + itemHeight * 2],
    [0.8, 1.1, 0.8]
  );

  const rotateX = useTransform(
    scrollY,
    [itemOffset - itemHeight * 2, itemOffset, itemOffset + itemHeight * 2],
    [45, 0, -45]
  );

  return (
    <motion.div
      style={{ height: itemHeight, opacity, scale, rotateX }}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-center cursor-pointer transition-all duration-300 relative group",
        isSelected ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400"
      )}
    >
      {isSelected && (
        <motion.div 
          layoutId="rotary-glow"
          className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"
        />
      )}
      <div className="flex items-center gap-3 relative z-10">
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        )}
        <span className={cn(
          "text-lg font-medium tracking-tight text-center px-4 transition-all",
          isSelected && "text-xl font-bold tracking-tighter"
        )}>
          {label}
        </span>
      </div>
    </motion.div>
  );
};

const RotarySelector = ({ 
  items, 
  onSelect, 
  selectedItem,
  isDark = true
}: { 
  items: string[], 
  onSelect: (item: string) => void,
  selectedItem?: string,
  isDark?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 50;
  
  const { scrollY } = useScroll({
    container: containerRef
  });

  return (
    <div className={cn("relative h-[250px] w-full overflow-hidden rounded-3xl border transition-colors", isDark ? "bg-black border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
      <div className={cn("absolute inset-0 pointer-events-none z-10 opacity-90 transition-colors", isDark ? "bg-gradient-to-b from-black via-transparent to-black" : "bg-gradient-to-b from-zinc-50 via-transparent to-zinc-50")} />
      <div className={cn("absolute top-1/2 left-0 right-0 h-[50px] -translate-y-1/2 border-y pointer-events-none z-0 transition-colors", isDark ? "border-white/5" : "border-black/5")} />
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory py-[100px]"
      >
        {items.map((item, i) => (
          <div key={i} className="snap-center">
            <RotaryItem 
              label={item}
              index={i}
              scrollY={scrollY}
              containerHeight={250}
              itemHeight={itemHeight}
              onSelect={() => onSelect(item)}
              isSelected={selectedItem === item}
              isDark={isDark}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

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

export default function App() {
  const [view, setView] = useState<'splash' | 'onboarding' | 'home' | 'history' | 'script' | 'settings'>('splash');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [description, setDescription] = useState('');
  const [perspective, setPerspective] = useState<CallPerspective>('outgoing');
  const [tone, setTone] = useState<Tone>('Professional');
  const [loading, setLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [currentScript, setCurrentScript] = useState<CallScript | null>(null);
  const [history, setHistory] = useState<CallScript[]>([]);
  const [credits, setCredits] = useState(10);
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    opening: true, mainAsk: true, branchX: true, branchY: true, close: true
  });

  const isDark = theme === 'dark';
  const isPremium = tier !== 'free';

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

  useEffect(() => {
    const savedHistory = localStorage.getItem('ringtone_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedTheme = localStorage.getItem('ringtone_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
    
    const savedTier = localStorage.getItem('ringtone_tier') as Tier;
    if (savedTier) setTier(savedTier);
    
    const savedCredits = localStorage.getItem('ringtone_credits');
    setCredits(savedCredits !== null ? parseInt(savedCredits) : 3);
    if (savedCredits === null) localStorage.setItem('ringtone_credits', '3');

    const savedSpeakerCount = parseInt(localStorage.getItem('callmate_speaker_count') || '0');
    setSpeakerPromptCount(savedSpeakerCount);

    const timer = setTimeout(() => { if (view === 'splash') setView('onboarding'); }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
    
    // Check for premium limits
    if (tier === 'free' && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    if (!targetDescription.trim()) return;
    if (overrideTone) setIsRewriting(true); else setLoading(true);
    try {
      const script = await generateCallScript(targetDescription, targetTone, perspective, selectedPersona || undefined);
      setCurrentScript(script);
      
      // Free tier has "no history" according to the new table
      if (tier !== 'free') {
        const newHistory = [script, ...history].slice(0, 100);
        setHistory(newHistory);
        localStorage.setItem('ringtone_history', JSON.stringify(newHistory));
      }
      
      if (tier === 'free') {
        setCredits(prev => {
          const next = prev - 1;
          localStorage.setItem('ringtone_credits', next.toString());
          return next;
        });
      }

      setVoicemailScript(null);
      setEmailFallback(null);
      setShowAddBranch(false);
      setAddBranchInput('');
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

  const saveReflection = (feedback: string) => {
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
    setShowReflectionPrompt(false);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all call history?')) {
      setHistory([]);
      localStorage.removeItem('ringtone_history');
    }
  };

  const resetCredits = () => {
    setCredits(3);
    localStorage.setItem('ringtone_credits', '3');
    alert('Credits reset to 3!');
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
    if (tier !== 'free') {
      const newHistory = history.map(h => h.id === updated.id ? updated : h);
      setHistory(newHistory);
      localStorage.setItem('ringtone_history', JSON.stringify(newHistory));
    }
  };

  if (view === 'splash') return (
    <div className={cn("h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Splash Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"
      />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl bg-black relative z-10">
          <Logo className="w-18 h-18 text-white" />
        </div>
      </motion.div>
      <h1 className="text-5xl font-bold tracking-tighter mt-8 relative z-10">CALLMATE</h1>
      <p className="text-zinc-500 italic mt-2 relative z-10">Say exactly what you need to say.</p>
    </div>
  );

  if (view === 'onboarding') return (
    <div className={cn("h-screen flex flex-col p-8 transition-colors duration-500 relative overflow-hidden", isDark ? "bg-black text-white" : "bg-white text-black")}>
      {/* Onboarding Blobs */}
      <motion.div 
        animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"
      />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        <h2 className="text-4xl font-bold mb-6 tracking-tight">
          What's a call you've been<br /><RotatingText />
        </h2>
        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">Callmate writes your branching phone call script so you never freeze again.</p>

        {/* Apple Intelligence differentiation */}
        <div className={cn("rounded-2xl border p-4 mb-8 transition-colors", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")}>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Why not just use ChatGPT or Apple Intelligence?</p>
          <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>
            ChatGPT rewrites text. <span className={cn("font-bold", isDark ? "text-white" : "text-black")}>Callmate scripts your entire conversation</span> — with comebacks for what they'll actually say — formatted to hold on screen during a live call.
          </p>
        </div>

        <Button size="xl" variant="glass" isDark={isDark} className="w-full h-16 rounded-2xl" onClick={() => setView('home')}>
          Get Started <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-zinc-600 text-xs mt-4">3 free scripts · No account needed</p>
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
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold transition-colors", isDark ? "bg-white/10 text-zinc-400" : "bg-black/5 text-zinc-500")}>{credits} CREDITS</div>
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

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Call Type</h2>
                  <div className={cn("flex p-1 rounded-full border transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200")}>
                    {['Random', 'A-Z'].map((m) => (
                      <button key={m} onClick={() => setSortMode(m as any)} className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all", sortMode === m ? (isDark ? "bg-white text-black" : "bg-black text-white") : "text-zinc-500")}>{m}</button>
                    ))}
                  </div>
                </div>
                <RotarySelector items={sortedCallTypes} onSelect={(item) => setDescription(item)} selectedItem={description} isDark={isDark} />
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

                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                  {perspective === 'outgoing' ? 'Describe Your Call' : 'Who is calling and why?'}
                </h2>
                <Card isDark={isDark} className="p-0 overflow-hidden">
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder={perspective === 'outgoing' ? "I need to call my landlord..." : "My bank is calling about a suspicious charge..."} 
                    className={cn("w-full h-32 p-6 text-xl bg-transparent focus:outline-none resize-none transition-colors", isDark ? "placeholder:text-zinc-700" : "placeholder:text-zinc-300")} 
                  />
                  <div className={cn("p-4 border-t flex flex-wrap gap-2 transition-colors", isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50/40 border-zinc-200")}>
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
                <Button size="xl" variant="glass" isDark={isDark} className="w-full mt-4" disabled={!description.trim() || loading} onClick={() => handleGenerate()}>
                  {loading ? <Loader2 className="animate-spin" /> : "Generate Script"}
                </Button>
              </section>

              {/* Incoming Call Kit — always visible, zero AI generation time */}
              <section>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Incoming Call Kit</h2>
                <div className="grid grid-cols-1 gap-2">
                  {SAFE_LINES.map((line, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigator.clipboard?.writeText(line.line)}
                      className={cn(
                        "text-left p-4 rounded-2xl border transition-all",
                        isDark ? "bg-zinc-900/60 border-white/5 hover:border-white/15 hover:bg-zinc-900" : "bg-zinc-100/60 border-black/5 hover:border-black/15 hover:bg-zinc-100"
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{line.situation}</p>
                      <p className={cn("text-sm font-medium italic leading-snug", isDark ? "text-zinc-200" : "text-zinc-800")}>"{line.line}"</p>
                    </motion.button>
                  ))}
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
                    {tier === 'free' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">Available Credits</p>
                          <p className="text-zinc-500 text-sm">Used for generating new scripts</p>
                        </div>
                        <div className="text-2xl font-mono font-bold">{credits}</div>
                      </div>
                    )}
                    <Button variant="outline" isDark={isDark} className="w-full" onClick={resetCredits}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset Credits (Dev Mode)
                    </Button>
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

          {view === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-[-140px] pt-4">
              <div className="flex flex-col gap-6 mb-12 px-2 relative z-[100]">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight">History</h2>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <ChevronDown className="w-6 h-6" />
                  </div>
                </div>
                
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
              
              {!isPremium ? (
                <div className={cn("py-20 px-8 text-center space-y-6 rounded-[2.5rem] border relative z-10 transition-colors", isDark ? "bg-zinc-900/30 border-zinc-800/50" : "bg-zinc-100/50 border-zinc-200")}>
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors", isDark ? "bg-zinc-900" : "bg-zinc-200")}>
                    <History className="w-8 h-8 text-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">History is a Premium Feature</p>
                    <p className="text-zinc-500 text-sm">Upgrade to Monthly or Annual to save and search your call scripts.</p>
                  </div>
                  <Button variant="outline" isDark={isDark} className="mx-auto" onClick={() => setShowUpgradeModal(true)}>
                    View Plans
                  </Button>
                </div>
              ) : filteredHistory.length === 0 ? (
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
                      onClick={() => { setCurrentScript(s); setView('script'); }}
                      className={cn(
                        "relative p-8 rounded-[2.5rem] cursor-pointer shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-all hover:translate-y-[-20px] active:scale-[0.98] group min-h-[220px]",
                        bgColor,
                        "text-black"
                      )}
                      style={{ zIndex: i + 1 }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 flex-1">
                          <h3 className="text-2xl font-bold tracking-tight leading-none">
                            {s.tone} Call
                          </h3>
                          <p className="text-black/50 font-medium line-clamp-1 text-sm mt-1">
                            {s.description}
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
                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                          <Star className="w-5 h-5 text-black/40" />
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

              {/* Session 1 nudge — burn 2nd credit while engaged */}
              <AnimatePresence>
                {sessionScriptCount === 1 && tier === 'free' && credits > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn("rounded-2xl border p-4 flex items-center justify-between gap-3 transition-colors", isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200")}
                  >
                    <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-0.5">You have {credits} script{credits !== 1 ? 's' : ''} left</p>
                      <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-600")}>Make another while you're here.</p>
                    </div>
                    <Button size="sm" variant="outline" isDark={isDark} onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}>
                      Generate <ChevronRight className="w-3 h-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" isDark={isDark} onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }}><ArrowLeft className="w-4 h-4" /> Home</Button>
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
                  <Button variant="outline" size="sm" isDark={isDark}><Star className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" isDark={isDark}><Share2 className="w-4 h-4" /></Button>
                </div>
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
              <div className={cn("space-y-4 pb-32 transition-opacity", isRewriting && "opacity-50")}>
                <ScriptSection title="Opening" content={currentScript.opening} isExpanded={expandedSections.opening} onToggle={() => setExpandedSections(p => ({...p, opening: !p.opening}))} isDark={isDark} color="blue" />
                <ScriptSection title="Main Ask" content={currentScript.mainAsk} isExpanded={expandedSections.mainAsk} onToggle={() => setExpandedSections(p => ({...p, mainAsk: !p.mainAsk}))} isDark={isDark} color="purple" />
                <ScriptSection title={`If they say: "${currentScript.branchX.condition}"`} content={currentScript.branchX.response} isBranch isExpanded={expandedSections.branchX} onToggle={() => setExpandedSections(p => ({...p, branchX: !p.branchX}))} isDark={isDark} color="emerald" />
                <ScriptSection title={`If they say: "${currentScript.branchY.condition}"`} content={currentScript.branchY.response} isBranch isExpanded={expandedSections.branchY} onToggle={() => setExpandedSections(p => ({...p, branchY: !p.branchY}))} isDark={isDark} color="amber" />
                {/* Extra branches (manually added or auto-saved from panic) */}
                {currentScript.extraBranches?.map((branch, i) => (
                  <ScriptSection
                    key={`extra-${i}`}
                    title={`If they say: "${branch.condition}"`}
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

                <ScriptSection title="Close" content={currentScript.close} isExpanded={expandedSections.close} onToggle={() => setExpandedSections(p => ({...p, close: !p.close}))} isDark={isDark} color="rose" />
              </div>
              <div className="fixed bottom-24 left-0 right-0 px-6 max-w-2xl mx-auto z-50 flex flex-col gap-3">
                {isPremium && (
                  <Button 
                    variant="accent" 
                    size="lg" 
                    className="w-full h-14 rounded-2xl shadow-xl"
                    onClick={() => setShowReflectionPrompt(true)}
                  >
                    <Check className="w-5 h-5" /> Finished Call
                  </Button>
                )}
                <Button 
                  variant="danger" 
                  size="xl" 
                  className={cn(
                    "w-full h-20 rounded-[2rem] shadow-2xl border-4 transition-all", 
                    isDark 
                      ? "border-black shadow-red-500/20 hover:shadow-red-500/40" 
                      : "border-white shadow-red-500/20 hover:shadow-red-500/40"
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

      <nav className={cn("fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-6 py-3 pb-8 z-50 flex items-center justify-around max-w-2xl mx-auto shadow-2xl transition-colors", isDark ? "bg-black/80 border-white/5" : "bg-white/80 border-black/5")}>
        <button 
          onClick={() => { setCurrentScript(null); setActiveTab('home'); setView('home'); }} 
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'home' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-all duration-300 relative", 
            activeTab === 'home' ? (isDark ? "bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]" : "bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]") : "group-hover:bg-zinc-800/50"
          )}>
            <Plus className={cn("w-6 h-6 transition-transform group-hover:scale-110", activeTab === 'home' ? (isDark ? "text-blue-400" : "text-blue-600") : "")} />
            {activeTab === 'home' && (
              <motion.div layoutId="nav-glow" className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Call</span>
        </button>
        <button 
          onClick={() => { setActiveTab('history'); setView('history'); }} 
          className={cn("flex flex-col items-center gap-1 transition-all relative group", activeTab === 'history' ? (isDark ? "text-white" : "text-black") : "text-zinc-500 hover:text-zinc-400")}
        >
          <div className={cn(
            "p-2 rounded-2xl transition-all duration-300 relative", 
            activeTab === 'history' ? (isDark ? "bg-purple-600/20 shadow-[0_0_20px_rgba(147,51,234,0.2)]" : "bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]") : "group-hover:bg-zinc-800/50"
          )}>
            <History className={cn("w-6 h-6 transition-transform group-hover:scale-110", activeTab === 'history' ? (isDark ? "text-purple-400" : "text-purple-600") : "")} />
            {activeTab === 'history' && (
              <motion.div layoutId="nav-glow" className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">History</span>
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
        {showUpgradeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpgradeModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn("fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[110] shadow-2xl border-t max-w-2xl mx-auto max-h-[92dvh] overflow-y-auto transition-colors", isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5")}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-300")} />
              </div>

              <div className="px-6 pb-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                    <p className="text-zinc-500 text-sm mt-0.5">Master every call with advanced AI tools.</p>
                  </div>
                  <button onClick={() => setShowUpgradeModal(false)} className={cn("p-2 rounded-full", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Free Tier */}
                  <div className={cn("p-5 rounded-2xl border text-left transition-all", tier === 'free' ? (isDark ? "bg-zinc-800 border-zinc-500" : "bg-zinc-100 border-zinc-400") : (isDark ? "bg-black/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"))}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-bold text-base">Free</h3>
                        <p className="text-zinc-500 text-xs">Basic preparation</p>
                      </div>
                      <span className="text-lg font-bold">$0</span>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-xs text-zinc-500 flex items-center gap-2"><Check className="w-3 h-3" /> 3 scripts / month</li>
                      <li className="text-xs text-zinc-500 flex items-center gap-2"><X className="w-3 h-3" /> No history</li>
                    </ul>
                  </div>

                  {/* Monthly Tier */}
                  <div
                    onClick={() => { setTier('monthly'); localStorage.setItem('ringtone_tier', 'monthly'); setShowUpgradeModal(false); }}
                    className={cn(
                      "p-5 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden",
                      tier === 'monthly' ? (isDark ? "bg-zinc-800 border-purple-500" : "bg-purple-50 border-purple-400") : (isDark ? "bg-black/40 border-zinc-800" : "bg-zinc-50 border-zinc-200")
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-bold text-base text-purple-500 flex items-center gap-2">
                          Monthly
                          <span className="text-[10px] bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Popular</span>
                        </h3>
                        <p className="text-zinc-500 text-xs">Power user</p>
                      </div>
                      <span className="text-lg font-bold">$4.99<span className="text-xs font-normal text-zinc-500">/mo</span></span>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-xs flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Unlimited scripts</li>
                      <li className="text-xs flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Saved history</li>
                      <li className="text-xs flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Custom personas</li>
                    </ul>
                  </div>

                  {/* Annual Tier */}
                  <div
                    onClick={() => { setTier('annual'); localStorage.setItem('ringtone_tier', 'annual'); setShowUpgradeModal(false); }}
                    className={cn(
                      "p-5 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden",
                      tier === 'annual' ? (isDark ? "bg-zinc-800 border-emerald-500" : "bg-emerald-50 border-emerald-400") : (isDark ? "bg-black/40 border-zinc-800" : "bg-zinc-50 border-zinc-200")
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-bold text-base text-emerald-500 flex items-center gap-2">
                          Annual
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Best Value</span>
                        </h3>
                        <p className="text-zinc-500 text-xs">The full experience</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">$39.99<span className="text-xs font-normal text-zinc-500">/yr</span></span>
                        <p className="text-[10px] text-emerald-500 font-bold">SAVE 33%</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-xs flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> All Monthly features</li>
                      <li className="text-xs flex items-center gap-2 font-bold text-emerald-500"><Check className="w-3 h-3" /> Practice Mode (AI reads script aloud)</li>
                    </ul>
                  </div>
                </div>

                <button onClick={() => setShowUpgradeModal(false)} className="w-full text-zinc-500 text-sm font-medium py-2">Maybe later</button>
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

        {showReflectionPrompt && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReflectionPrompt(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={cn("fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md p-8 rounded-[2.5rem] z-[110] shadow-2xl border transition-colors", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}>
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">How did it go?</h2>
                  <p className="text-zinc-500">Reflect on your call to improve for next time.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nailed it!", icon: "🚀" },
                    { label: "Went okay", icon: "👍" },
                    { label: "Could be better", icon: "🤔" },
                    { label: "It was rough", icon: "😅" }
                  ].map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => saveReflection(opt.label)}
                      className={cn("p-4 rounded-2xl border text-center hover:scale-105 transition-all", isDark ? "bg-black border-zinc-800" : "bg-zinc-50 border-zinc-200")}
                    >
                      <div className="text-2xl mb-1">{opt.icon}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">{opt.label}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowReflectionPrompt(false)} className="text-zinc-500 text-sm font-medium">Skip reflection</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScriptSection({ 
  title, 
  content, 
  isBranch = false, 
  isExpanded, 
  onToggle, 
  isDark = true,
  color = 'zinc'
}: { 
  title: string, 
  content: string, 
  isBranch?: boolean, 
  isExpanded: boolean, 
  onToggle: () => void, 
  isDark?: boolean,
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'zinc'
}) {
  const colorClasses = {
    blue: { text: isDark ? 'text-blue-400' : 'text-blue-600', border: 'border-l-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-500/5', icon: Volume2 },
    purple: { text: isDark ? 'text-purple-400' : 'text-purple-600', border: 'border-l-purple-500', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-500/5', icon: Star },
    emerald: { text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: 'border-l-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5', icon: Check },
    amber: { text: isDark ? 'text-amber-400' : 'text-amber-600', border: 'border-l-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-500/5', icon: AlertCircle },
    rose: { text: isDark ? 'text-rose-400' : 'text-rose-600', border: 'border-l-rose-500', bg: isDark ? 'bg-rose-500/10' : 'bg-rose-500/5', icon: Phone },
    zinc: { text: isDark ? 'text-zinc-500' : 'text-zinc-500', border: 'border-l-zinc-500', bg: isDark ? 'bg-zinc-500/10' : 'bg-zinc-500/5', icon: ChevronRight }
  };

  const Icon = colorClasses[color].icon;

  return (
    <Card isDark={isDark} className={cn("p-0 overflow-hidden border-l-4", colorClasses[color].border, isBranch && (isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"))}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left group">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl transition-colors", colorClasses[color].bg)}>
            <Icon className={cn("w-4 h-4", colorClasses[color].text)} />
          </div>
          <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", colorClasses[color].text)}>{title}</h3>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-5 pb-6">
              <p className={cn("text-2xl font-medium leading-relaxed italic transition-colors", isDark ? "text-zinc-200" : "text-zinc-800")}>"{content}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
