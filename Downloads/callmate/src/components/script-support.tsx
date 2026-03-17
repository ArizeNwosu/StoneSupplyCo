import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';
import { cn } from './ui';
import { hapticLight, vibrate } from '../services/native';
import breatheAudio from '../../breathe.mp3';

const BREATHE_SOUND_KEY = 'callmate_breathe_sound_enabled';
const BREATHE_VIBRATION_KEY = 'callmate_breathe_vibration_enabled';

const SLIDESHOW_REVIEWS = [
  { name: 'Sarah M.', location: 'Chicago', quote: 'I finally called my doctor after putting it off for 3 years. I literally cried after.', tag: 'Medical Call' },
  { name: 'James T.', location: 'Austin', quote: "Negotiated my rent down $150/month. My landlord didn't even push back.", tag: 'Landlord Call' },
  { name: 'Priya K.', location: 'New York', quote: 'I used to let every work call go to voicemail and make up excuses. Not anymore.', tag: 'Work Call' },
  { name: 'Marcus R.', location: 'Seattle', quote: "I'm autistic and phone calls are my nightmare. This app is genuinely life-changing.", tag: 'Customer Service' },
];

export function ReviewSlideshow({ isDark }: { isDark: boolean }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % SLIDESHOW_REVIEWS.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  const review = SLIDESHOW_REVIEWS[index];

  return (
    <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-[#171f1d] border-[#415049]' : 'bg-[#fffdf9] border-[#d8cdc0]')}>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="space-y-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, starIndex) => <Star key={starIndex} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#dbe3de]' : 'text-[#51615b]')}>"{review.quote}"</p>
          <p className={cn('text-[11px]', isDark ? 'text-[#97a59f]' : 'text-[#6f7d75]')}>
            {review.name} · {review.location} · {review.tag}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1.5 mt-3">
        {SLIDESHOW_REVIEWS.map((_, itemIndex) => (
          <div key={itemIndex} className={cn('h-1 rounded-full transition-all duration-300', itemIndex === index ? 'w-5 bg-[#d8b278]' : isDark ? 'w-1.5 bg-[#5b6962]' : 'w-1.5 bg-[#cdbfae]')} />
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
  const START_DELAY = 1000;
  const PAUSE_BETWEEN = 4000;
  const INHALE = 5000;
  const HOLD = 6000;
  const EXHALE = 9000;
  const ACTIVE_CYCLE = INHALE + HOLD + EXHALE;

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => { setPhase('inhale'); setCycle(0); }, START_DELAY));

    for (let cycleIndex = 0; cycleIndex < TOTAL; cycleIndex += 1) {
      const base = START_DELAY + cycleIndex * (ACTIVE_CYCLE + PAUSE_BETWEEN);
      timers.push(setTimeout(() => setPhase('hold'), base + INHALE));
      timers.push(setTimeout(() => setPhase('exhale'), base + INHALE + HOLD));
      if (cycleIndex < TOTAL - 1) {
        timers.push(setTimeout(() => setPhase('ready'), base + ACTIVE_CYCLE));
        timers.push(setTimeout(() => { setPhase('inhale'); setCycle(cycleIndex + 1); }, base + ACTIVE_CYCLE + PAUSE_BETWEEN));
      }
    }

    timers.push(setTimeout(() => setPhase('done'), START_DELAY + TOTAL * ACTIVE_CYCLE + (TOTAL - 1) * PAUSE_BETWEEN));
    return () => timers.forEach(clearTimeout);
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

  React.useEffect(() => () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
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
      if (audio.paused) void audio.play().catch(() => {});
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
        void vibrate({ duration: phase === 'hold' ? 400 : phase === 'inhale' ? 300 : 350 });
      }
    };

    playPulse();

    const pulseInterval = window.setInterval(
      playPulse,
      phase === 'hold' ? 900 : phase === 'inhale' ? 1200 : 1400,
    );

    return () => window.clearInterval(pulseInterval);
  }, [phase, vibrationEnabled]);

  const cfg: Record<Phase, { label: string; sub: string; color: string; scale: number; dur: number }> = {
    ready: { label: 'Settle in', sub: 'Find a comfortable position', color: '#7b9d76', scale: 0.38, dur: 0.5 },
    inhale: { label: 'Breathe In', sub: 'Slowly inhale through your nose', color: '#7b9d76', scale: 1.0, dur: INHALE / 1000 },
    hold: { label: 'Hold', sub: 'Hold it gently', color: '#d8c5a6', scale: 1.0, dur: HOLD / 1000 },
    exhale: { label: 'Breathe Out', sub: 'Slowly exhale through your mouth', color: '#5d8a7a', scale: 0.38, dur: EXHALE / 1000 },
    done: { label: 'You are steady', sub: 'Your body is calmer now.', color: '#5d8a7a', scale: 0.38, dur: 0.5 },
  };
  const darkPrimaryButtonClass = 'bg-[linear-gradient(135deg,#22312b_0%,#31463d_100%)] text-white shadow-[0_18px_36px_rgba(34,49,43,0.18)] hover:brightness-[1.03]';
  const current = cfg[phase];

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <motion.div className="absolute inset-0 rounded-full" animate={{ scale: current.scale * 1.5, opacity: 0.06, backgroundColor: current.color }} transition={{ duration: current.dur, ease: 'easeInOut' }} />
        <motion.div className="absolute inset-0 rounded-full" animate={{ scale: current.scale * 1.18, opacity: 0.12, backgroundColor: current.color }} transition={{ duration: current.dur, ease: 'easeInOut' }} />
        <motion.div className="absolute inset-0 rounded-full" animate={{ scale: current.scale * 1.05, opacity: 0.22, backgroundColor: current.color }} transition={{ duration: current.dur, ease: 'easeInOut' }} />
        <motion.div className="absolute inset-0 rounded-full" animate={{ scale: current.scale, opacity: 0.88, backgroundColor: current.color }} transition={{ duration: current.dur, ease: 'easeInOut' }} />
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
              {current.label}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={`${phase}-sub`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-[#66756f] text-sm text-center"
        >
          {current.sub}
        </motion.p>
      </AnimatePresence>

      {phase !== 'done' && phase !== 'ready' && (
        <div className="flex gap-2">
          {Array.from({ length: TOTAL }).map((_, itemIndex) => (
            <motion.div
              key={itemIndex}
              className={cn('h-1.5 rounded-full transition-all duration-500', itemIndex < cycle ? 'bg-[#7b9d76] w-4' : itemIndex === cycle ? 'bg-[#5d8a7a] w-6' : 'bg-[#d8cdc0] w-1.5')}
            />
          ))}
        </div>
      )}

      {phase === 'done' && (
        <button onClick={onComplete} className={cn('mt-1 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]', darkPrimaryButtonClass)}>
          Continue
        </button>
      )}
    </div>
  );
}

export function PreCallCheck({
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
  const darkPrimaryButtonClass = 'bg-[linear-gradient(135deg,#22312b_0%,#31463d_100%)] text-white shadow-[0_18px_36px_rgba(34,49,43,0.18)] hover:brightness-[1.03]';

  React.useEffect(() => {
    localStorage.setItem(BREATHE_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  React.useEffect(() => {
    localStorage.setItem(BREATHE_VIBRATION_KEY, String(vibrationEnabled));
  }, [vibrationEnabled]);

  return (
    <div className={cn('fixed inset-0 z-[130] flex flex-col warm-therapeutic-bg transition-colors', isDark ? 'bg-[#161d1b] text-[#f6f2ea]' : 'text-[#22312b]')}>
      <div className="flex items-center justify-between px-6 pt-12 pb-5 shrink-0">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ width: index === step ? 28 : 8, opacity: index <= step ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn('h-1.5 rounded-full', index <= step ? 'bg-[#5d8a7a]' : isDark ? 'bg-[#33403b]' : 'bg-[#d8cdc0]')}
            />
          ))}
        </div>
        <button onClick={onClose} className={cn('text-sm font-semibold transition-colors', isDark ? 'text-[#97a59f] hover:text-[#dbe3de]' : 'text-[#66756f] hover:text-[#22312b]')}>
          Skip
        </button>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className={cn('rounded-2xl border p-3 space-y-3', isDark ? 'bg-[#202926]/88 border-[#415049]' : 'bg-[rgba(255,251,245,0.92)] border-[#d8cdc0]')}>
          <div className="min-w-0">
            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
              {mode === 'breathe' ? 'Breathe' : 'Pre-Call Check'}
            </p>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#c5d0ca]' : 'text-[#51615b]')}>
              Use sound and vibration cues if they help you settle.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSoundEnabled((value) => !value)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors',
                soundEnabled
                  ? isDark ? 'bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#dbe8df]' : 'bg-[#dbe8df] border-[#8fae9e] text-[#476f61]'
                  : isDark ? 'bg-[#171f1d] border-[#415049] text-[#97a59f]' : 'bg-[#f3eee4] border-[#d8cdc0] text-[#66756f]',
              )}
            >
              Sound {soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => setVibrationEnabled((value) => !value)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-colors',
                vibrationEnabled
                  ? isDark ? 'bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#dbe8df]' : 'bg-[#dbe8df] border-[#8fae9e] text-[#476f61]'
                  : isDark ? 'bg-[#171f1d] border-[#415049] text-[#97a59f]' : 'bg-[#f3eee4] border-[#d8cdc0] text-[#66756f]',
              )}
            >
              Vibration {vibrationEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 keyboard-aware">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="smile" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">😊</div>
              <div>
                <p className={cn('text-xs font-black uppercase tracking-widest mb-2', isDark ? 'text-[#b7d0c4]' : 'text-[#5d8a7a]')}>Step 1 of 3 · Soften</p>
                <h2 className={cn('text-2xl font-black leading-tight mb-3', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>Let your face soften before the call starts.</h2>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#c5d0ca]' : 'text-[#51615b]')}>
                  Smiling — even a small, deliberate one — triggers a real biological response. It activates your parasympathetic nervous system, lowers cortisol, and shifts your brain&apos;s perception of the situation from threat to manageable.
                </p>
              </div>
              <div className={cn('w-full rounded-2xl border p-4 text-left warm-panel', isDark ? 'bg-[#202926]/88 border-[#415049]' : '')}>
                <p className={cn('text-xs font-black uppercase tracking-widest mb-2', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Try this right now</p>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#dbe3de]' : 'text-[#51615b]')}>
                  Take a small real smile for 5 seconds. Notice your jaw unclench and your shoulders drop a little. Keep that softness when the call begins.
                </p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="breath" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-4">
              <div>
                <p className={cn('text-xs font-black uppercase tracking-widest mb-2', isDark ? 'text-[#b7d0c4]' : 'text-[#5d8a7a]')}>Step 2 of 3 · Breathe</p>
                <h2 className={cn('text-2xl font-black leading-tight mb-1', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>Take three slower breaths.</h2>
                <p className={cn('text-sm', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Follow the circle and let your pace come down.</p>
              </div>
              <BreathingGuide onComplete={() => setStep(2)} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="mindset" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex flex-col items-center text-center pt-4 pb-6 gap-5">
              <div className="text-7xl">🧠</div>
              <div>
                <p className={cn('text-xs font-black uppercase tracking-widest mb-2', isDark ? 'text-[#b7d0c4]' : 'text-[#5d8a7a]')}>Step 3 of 3 · Reframe</p>
                <h2 className={cn('text-2xl font-black leading-tight mb-3', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>This call does not need to be perfect.</h2>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#c5d0ca]' : 'text-[#51615b]')}>
                  The person on the other end is focused on their own day, their own tasks. They&apos;re not analyzing your voice, judging your words, or waiting for you to stumble. Most people are understanding — they just want to resolve the same thing you do.
                </p>
              </div>
              <div className={cn('w-full rounded-2xl border p-5 text-left warm-panel', isDark ? 'bg-[#202926]/88 border-[#415049]' : '')}>
                <p className={cn('text-xs font-black uppercase tracking-widest mb-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Tap this reminder 5 times</p>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    void hapticLight();
                    setMantraTaps((value) => Math.min(value + 1, 5));
                  }}
                  className={cn(
                    'w-full py-4 rounded-2xl text-center font-black text-base transition-all border-2',
                    mantraTaps >= 5
                      ? isDark ? 'bg-[#5d8a7a]/15 border-[#7b9d76]/40 text-[#b7d0c4]' : 'bg-[#dbe8df] border-[#8fae9e] text-[#476f61]'
                      : isDark ? 'bg-[#5d8a7a]/10 border-[#5d8a7a]/30 text-[#dbe8df] hover:bg-[#5d8a7a]/15' : 'bg-[#f3eee4] border-[#d8cdc0] text-[#476f61] hover:bg-[#ece5da]',
                  )}
                >
                  {mantraTaps >= 5 ? '✓ I only need to be clear, not perfect.' : '"I only need to be clear, not perfect."'}
                </motion.button>
                <div className="flex justify-center gap-2 mt-3">
                  {Array.from({ length: 5 }).map((_, itemIndex) => (
                    <motion.div
                      key={itemIndex}
                      animate={{ scale: itemIndex < mantraTaps ? 1 : 0.7, opacity: itemIndex < mantraTaps ? 1 : 0.25 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={cn('w-2.5 h-2.5 rounded-full', itemIndex < mantraTaps ? 'bg-[#5d8a7a]' : isDark ? 'bg-[#415049]' : 'bg-[#d8cdc0]')}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10 shrink-0 pt-3">
        {step < 2 ? (
          <button
            onClick={() => setStep((value) => value + 1)}
            disabled={step === 1}
            className={cn('w-full py-4 rounded-2xl font-bold text-base transition-all', step === 1 ? cn(darkPrimaryButtonClass, 'opacity-45 cursor-not-allowed') : cn(darkPrimaryButtonClass, 'active:scale-[0.99]'))}
          >
            {step === 1 ? 'Follow the breathing guide above' : 'Next'}
          </button>
        ) : (
          <button onClick={onClose} className={cn('w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.99]', darkPrimaryButtonClass)}>
            {mode === 'breathe' ? 'Back to App' : "I'm Ready to Start the Call"}
          </button>
        )}
      </div>
    </div>
  );
}

export function PostCallReinforcement({ isDark, rating, onClose }: { isDark: boolean; rating: number | undefined; onClose: () => void }) {
  const resolvedRating = rating ?? 3;
  const isCalm = resolvedRating <= 2;
  const isHard = resolvedRating >= 4;

  const emoji = isCalm ? '🌟' : isHard ? '💪' : '✅';
  const headline = isCalm ? 'You handled that beautifully.' : isHard ? 'You showed up. That takes real courage.' : 'Call complete. You did it.';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center px-8">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 6, repeat: Infinity }}
        className={cn('absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] pointer-events-none', isCalm ? 'bg-emerald-500' : isHard ? 'bg-orange-500' : 'bg-indigo-500')}
      />

      <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }} className="relative z-10 flex flex-col items-center text-center max-w-sm gap-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 14, delay: 0.2 }} className="text-6xl">
          {emoji}
        </motion.div>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Post-Call</p>
          <h2 className="text-2xl font-black text-white leading-tight mb-3">{headline}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Take a deep breath — it&apos;s over. They&apos;ve already moved on to their next call and they are not thinking about you. Don&apos;t spend one more second of your energy on it.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Your post-call ritual</p>
          {[
            { icon: '🌬️', text: 'Take one long, slow breath out.' },
            { icon: '🎉', text: 'Give yourself actual credit — out loud if you can. "I did that."' },
            { icon: '📈', text: 'Every call you face makes the next one easier. This one counts.' },
          ].map(({ icon, text }, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + index * 0.1 }} className="flex items-start gap-3">
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

export function ScriptSection({
  title,
  content,
  condition,
  step,
  isBranch = false,
  isExpanded,
  onToggle,
  onDelete,
  isDark = true,
  color = 'zinc',
}: {
  title: string;
  content: string;
  condition?: string;
  step?: number;
  isBranch?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  isDark?: boolean;
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'zinc';
}) {
  const palette: Record<string, { solid: string; tint: string; text: string; border: string }> = {
    blue: { solid: 'bg-blue-500', tint: isDark ? 'bg-blue-950/60' : 'bg-blue-50', text: isDark ? 'text-blue-400' : 'text-blue-600', border: isDark ? 'border-blue-500/25' : 'border-blue-200' },
    purple: { solid: 'bg-purple-500', tint: isDark ? 'bg-purple-950/60' : 'bg-purple-50', text: isDark ? 'text-purple-400' : 'text-purple-600', border: isDark ? 'border-purple-500/25' : 'border-purple-200' },
    emerald: { solid: 'bg-emerald-600', tint: isDark ? 'bg-emerald-950/60' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-500/25' : 'border-emerald-200' },
    amber: { solid: 'bg-amber-500', tint: isDark ? 'bg-amber-950/60' : 'bg-amber-50', text: isDark ? 'text-amber-400' : 'text-amber-600', border: isDark ? 'border-amber-500/25' : 'border-amber-200' },
    rose: { solid: 'bg-rose-600', tint: isDark ? 'bg-rose-950/60' : 'bg-rose-50', text: isDark ? 'text-rose-400' : 'text-rose-600', border: isDark ? 'border-rose-500/25' : 'border-rose-200' },
    zinc: { solid: 'bg-zinc-600', tint: isDark ? 'bg-zinc-900' : 'bg-zinc-50', text: isDark ? 'text-zinc-400' : 'text-zinc-600', border: isDark ? 'border-zinc-700' : 'border-zinc-200' },
  };
  const selectedPalette = palette[color];

  if (isBranch) {
    return (
      <div className={cn('rounded-3xl border overflow-hidden transition-all', selectedPalette.tint, selectedPalette.border)}>
        <button onClick={onToggle} className="w-full text-left p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={cn('inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3', selectedPalette.text)}>
                <span className="text-sm">💬</span> If they say...
              </span>
              {condition && (
                <div className={cn('rounded-2xl px-4 py-3 border', isDark ? 'bg-black/30 border-white/[0.07]' : 'bg-white/80 border-black/10')}>
                  <p className={cn('text-sm font-medium leading-snug', isDark ? 'text-zinc-200' : 'text-zinc-800')}>"{condition}"</p>
                </div>
              )}
            </div>
            <div className="shrink-0 pt-1 flex items-center gap-2">
              {onDelete && (
                <button onClick={(event) => { event.stopPropagation(); onDelete(); }} className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete branch">
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
                  <div className={cn('flex-1 h-px', isDark ? 'bg-white/8' : 'bg-black/8')} />
                  <span className={cn('text-[9px] font-black uppercase tracking-[0.3em]', selectedPalette.text)}>Then say</span>
                  <div className={cn('flex-1 h-px', isDark ? 'bg-white/8' : 'bg-black/8')} />
                </div>
                <p className={cn('text-xl font-semibold leading-relaxed', isDark ? 'text-zinc-50' : 'text-zinc-900')}>{content}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl border overflow-hidden transition-all', selectedPalette.tint, selectedPalette.border)}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-4">
          {step !== undefined && (
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0', selectedPalette.solid)}>
              {step}
            </div>
          )}
          <div>
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', selectedPalette.text)}>{step !== undefined ? `Step ${step}` : 'Section'}</p>
            <h3 className={cn('text-base font-bold mt-0.5', isDark ? 'text-white' : 'text-black')}>{title}</h3>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-5 pb-6">
              <p className={cn('text-xl font-semibold leading-relaxed', isDark ? 'text-zinc-50' : 'text-zinc-900')}>{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
