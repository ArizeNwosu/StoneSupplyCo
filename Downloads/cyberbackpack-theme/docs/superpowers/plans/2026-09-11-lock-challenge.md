# Lock Challenge Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the existing React lock-challenge prototype into the Shopify theme as a fully theme-editor-configurable section with winning combo, Klaviyo integration, and LCP performance fixes.

**Architecture:** Compile the React app (`cyberbackpack-lock-challenge/`) to an IIFE bundle output directly into `assets/`. A new `sections/lock-challenge-popup.liquid` section passes all theme editor settings to the React app via `window.CYBERLOCK_CONFIG`. The React app reads config on mount and handles delay, show-once, page targeting, combo checking, and Klaviyo popup trigger.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, Vite 6, TypeScript, Shopify Liquid

**Spec:** `docs/superpowers/specs/2026-09-11-lock-challenge-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `cyberbackpack-lock-challenge/src/types.ts` | GameState union + CyberlockConfig interface |
| Create | `cyberbackpack-lock-challenge/src/config.ts` | Read `window.CYBERLOCK_CONFIG`, merge with defaults |
| Modify | `cyberbackpack-lock-challenge/src/components/CountdownTimer.tsx` | Accept `initialSeconds` prop |
| Modify | `cyberbackpack-lock-challenge/src/components/NumberWheel.tsx` | Report current digit via `onValueChange` callback |
| Modify | `cyberbackpack-lock-challenge/src/components/CyberLock.tsx` | Aggregate 3 digits, call `onValuesChange` |
| Modify | `cyberbackpack-lock-challenge/src/components/CyberPopup.tsx` | GrantedView, combo check, config-driven copy, Klaviyo claim |
| Modify | `cyberbackpack-lock-challenge/src/main.tsx` | Config-driven mount: delay, show-once, page/login gates |
| Modify | `cyberbackpack-lock-challenge/vite.config.ts` | IIFE build format, output to `../assets/` |
| Create | `assets/lock-challenge.js` | Built bundle (generated — do not edit manually) |
| Create | `assets/lock-challenge.css` | Built styles (generated — do not edit manually) |
| Create | `sections/lock-challenge-popup.liquid` | Shopify section with full schema + config script |
| Modify | `layout/theme.liquid` | Remove duplicate title/meta, defer render-blocking CSS |

---

## Task 1: Update `types.ts` — GameState + CyberlockConfig

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/types.ts`

- [ ] **Replace the entire file contents:**

```typescript
export type GameState =
  | 'intro'
  | 'playing'
  | 'checking'
  | 'granted'
  | 'denied'
  | 'reward';

export interface CyberlockConfig {
  delay: number;
  showOnce: boolean;
  homeOnly: boolean;
  visitorsOnly: boolean;
  currentPage: string;
  isLoggedIn: boolean;
  winCombo: [string, string, string];
  timerSeconds: number;
  headingLine1: string;
  headingLine2: string;
  challengeText: string;
  winRewardText: string;
  loseRewardText: string;
  ctaStart: string;
  ctaClaim: string;
  klaviyoFormId: string;
}

declare global {
  interface Window {
    _klOnsite?: any[];
    CYBERLOCK_CONFIG?: Partial<CyberlockConfig>;
  }
}
```

- [ ] **Verify TypeScript compiles — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors (some errors from other files are fine at this stage; the types file itself should not error).

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/types.ts
git commit -m "feat: add CyberlockConfig type and update GameState"
```

---

## Task 2: Create `src/config.ts` — defaults + window config reader

**Files:**
- Create: `cyberbackpack-lock-challenge/src/config.ts`

- [ ] **Create the file:**

```typescript
import { CyberlockConfig } from './types';

const DEFAULTS: CyberlockConfig = {
  delay: 5,
  showOnce: true,
  homeOnly: true,
  visitorsOnly: true,
  currentPage: 'index',
  isLoggedIn: false,
  winCombo: ['3', '1', '4'],
  timerSeconds: 10,
  headingLine1: 'BREAK INTO',
  headingLine2: 'THE BACKPACK',
  challengeText: 'Think you can crack our TSA combination lock?',
  winRewardText: 'FREE SHIPPING!',
  loseRewardText: 'FREE SHIPPING!',
  ctaStart: 'START MISSION',
  ctaClaim: 'CLAIM FREE SHIPPING',
  klaviyoFormId: '',
};

export function getConfig(): CyberlockConfig {
  return { ...DEFAULTS, ...(window.CYBERLOCK_CONFIG ?? {}) };
}
```

- [ ] **Verify — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors in `config.ts`.

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/config.ts
git commit -m "feat: add getConfig() with defaults and window.CYBERLOCK_CONFIG merge"
```

---

## Task 3: Update `CountdownTimer.tsx` — accept `initialSeconds` prop

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/components/CountdownTimer.tsx`

- [ ] **Replace the entire file:**

```typescript
import { useEffect, useState, useRef } from 'react';

export const CountdownTimer = ({
  isPlaying,
  onZero,
  initialSeconds = 10,
}: {
  isPlaying: boolean;
  onZero: () => void;
  initialSeconds?: number;
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds * 1000);
  const endTimeRef = useRef<number | null>(null);
  const onZeroRef = useRef(onZero);

  useEffect(() => {
    onZeroRef.current = onZero;
  }, [onZero]);

  useEffect(() => {
    if (!isPlaying) return;

    endTimeRef.current = Date.now() + timeLeft;
    let rafId: number;
    let hasTriggeredZero = false;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTimeRef.current! - now);

      setTimeLeft(remaining);

      if (remaining > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        if (!hasTriggeredZero) {
          hasTriggeredZero = true;
          onZeroRef.current();
        }
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const seconds = Math.floor(timeLeft / 1000);
  const tenths = Math.floor((timeLeft % 1000) / 100);

  return (
    <div
      className="font-mono text-5xl font-bold tracking-tight text-red-500 flex justify-center items-baseline gap-1"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <span className="w-16 text-right">{seconds.toString().padStart(2, '0')}</span>
      <span className="text-red-500 text-4xl">.</span>
      <span className="w-8 text-left">{tenths}</span>
    </div>
  );
};
```

- [ ] **Verify — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/components/CountdownTimer.tsx
git commit -m "feat: add initialSeconds prop to CountdownTimer"
```

---

## Task 4: Update `NumberWheel.tsx` — report current digit via callback

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/components/NumberWheel.tsx`

The current digit is derived from `scrollTop`: each item is 64px tall, so `digit = Math.round(scrollTop / 64) % 10`.

- [ ] **Replace the entire file:**

```typescript
import { useEffect, useRef } from 'react';

export const NumberWheel = ({
  disabled,
  onValueChange,
}: {
  disabled: boolean;
  onValueChange?: (digit: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 500 * 64 - 64;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current || !onValueChange) return;
    const digit = Math.round(scrollRef.current.scrollTop / 64) % 10;
    onValueChange(digit);
  };

  return (
    <div
      className={`relative h-[192px] w-14 sm:w-16 overflow-hidden bg-[#000] rounded-lg border border-zinc-800/80 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] ${disabled ? 'pointer-events-none opacity-50 grayscale' : ''}`}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar flex flex-col"
        style={{ scrollBehavior: 'auto' }}
      >
        {Array.from({ length: 1000 }).map((_, i) => (
          <div
            key={i}
            className="h-[64px] min-h-[64px] flex items-center justify-center snap-center text-3xl sm:text-4xl font-mono text-white font-semibold select-none"
          >
            {i % 10}
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-10 flex justify-center pt-2">
        <div className="w-2 h-1 bg-zinc-800 rounded-full" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10 flex justify-center pb-2 items-end">
        <div className="w-2 h-1 bg-zinc-800 rounded-full" />
      </div>

      {/* Center Highlight Brackets */}
      <div className="absolute top-1/2 left-0 right-0 h-[64px] -translate-y-1/2 pointer-events-none z-10 box-border border-y-2 border-zinc-800/80 bg-white/5" />

      {/* Left and right inner shadows */}
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </div>
  );
};
```

- [ ] **Verify — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/components/NumberWheel.tsx
git commit -m "feat: report current digit from NumberWheel via onValueChange callback"
```

---

## Task 5: Update `CyberLock.tsx` — aggregate 3 digits, expose via `onValuesChange`

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/components/CyberLock.tsx`

- [ ] **Replace the entire file:**

```typescript
import { useRef } from 'react';
import { motion } from 'motion/react';
import { NumberWheel } from './NumberWheel';

export const CyberLock = ({
  isChecking,
  disabled,
  onValuesChange,
}: {
  isChecking: boolean;
  disabled: boolean;
  onValuesChange?: (digits: [number, number, number]) => void;
}) => {
  const digits = useRef<[number, number, number]>([0, 0, 0]);

  const handleDigitChange = (index: 0 | 1 | 2) => (digit: number) => {
    digits.current[index] = digit;
    onValuesChange?.([...digits.current] as [number, number, number]);
  };

  return (
    <motion.div
      className="relative bg-zinc-950 p-6 rounded-3xl border border-zinc-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col items-center w-full max-w-[280px] mx-auto"
      animate={isChecking ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
      transition={{ duration: 0.4, repeat: isChecking ? Infinity : 0, ease: 'linear' }}
    >
      {/* Lock branding/details */}
      <div className="w-full flex justify-between items-start mb-6 px-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-[inset_0_2px_5px_rgba(0,0,0,1)]">
            <div className="w-1.5 h-3 bg-zinc-950 rounded-[1px]"></div>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold tracking-widest rotate-90 absolute left-3 top-20 transform origin-left opacity-50">
            TSA007
          </span>
        </div>

        <div className="flex items-center justify-center w-8 h-8">
          {isChecking ? (
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]" />
          )}
        </div>
      </div>

      <div className="flex gap-2 bg-[#111] p-3 rounded-2xl border border-zinc-800/50 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <NumberWheel disabled={disabled} onValueChange={handleDigitChange(0)} />
        <NumberWheel disabled={disabled} onValueChange={handleDigitChange(1)} />
        <NumberWheel disabled={disabled} onValueChange={handleDigitChange(2)} />

        {/* Scan line effect during checking */}
        {isChecking && (
          <motion.div
            className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] z-20 pointer-events-none"
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
};
```

- [ ] **Verify — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/components/CyberLock.tsx
git commit -m "feat: expose current digit values from CyberLock via onValuesChange"
```

---

## Task 6: Update `CyberPopup.tsx` — GrantedView, combo check, config copy, Klaviyo

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/components/CyberPopup.tsx`

- [ ] **Replace the entire file:**

```typescript
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldAlert, Truck, Trophy } from 'lucide-react';
import { GameState } from '../types';
import { getConfig } from '../config';
import { CountdownTimer } from './CountdownTimer';
import { CyberLock } from './CyberLock';

const config = getConfig();

const IntroView = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex flex-col items-center text-center px-4 w-full"
  >
    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
      <Lock className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight uppercase">
      {config.headingLine1}
      <br />
      <span className="text-red-500">{config.headingLine2}</span>
    </h2>
    <p className="text-zinc-400 text-lg mb-8 max-w-[260px]">{config.challengeText}</p>

    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-8 w-full max-w-[280px] flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <Lock className="w-4 h-4 text-red-500" />
      </div>
      <div className="text-left">
        <p className="text-white font-bold text-sm tracking-wide">HACKER CHALLENGE</p>
        <p className="text-red-400 text-sm">You have {config.timerSeconds} seconds.</p>
      </div>
    </div>

    <button
      onClick={onStart}
      className="w-full max-w-[280px] bg-gradient-to-b from-red-600 to-red-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-[0.98] border border-red-500/50 tracking-wider"
    >
      {config.ctaStart}
    </button>
  </motion.div>
);

const GameView = ({
  state,
  onTimeout,
  onUnlock,
  onValuesChange,
}: {
  state: 'playing' | 'checking';
  onTimeout: () => void;
  onUnlock: () => void;
  onValuesChange: (digits: [number, number, number]) => void;
}) => {
  const isChecking = state === 'checking';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center w-full"
    >
      <div className="mb-6 text-center">
        <h3 className="text-sm font-bold text-red-500 tracking-widest uppercase mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          {isChecking ? 'BREACHING SYSTEM...' : 'TIME LEFT'}
        </h3>
        <CountdownTimer
          isPlaying={state === 'playing'}
          onZero={onTimeout}
          initialSeconds={config.timerSeconds}
        />
      </div>

      <CyberLock disabled={isChecking} isChecking={isChecking} onValuesChange={onValuesChange} />

      <p className="text-xs text-zinc-500 mt-6 mb-6 flex items-center gap-2">
        <span className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[8px] font-bold">
          i
        </span>
        Swipe up or down to change numbers
      </p>

      <button
        onClick={onUnlock}
        disabled={isChecking}
        className={`w-full max-w-[280px] font-bold py-4 rounded-xl transition-all active:scale-[0.98] border tracking-wider ${
          isChecking
            ? 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed'
            : 'bg-white text-black hover:bg-zinc-200 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
        }`}
      >
        {isChecking ? 'CHECKING...' : 'UNLOCK'}
      </button>
    </motion.div>
  );
};

const GrantedView = ({ onClaim }: { onClaim: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full min-h-[300px] w-full"
  >
    <div className="w-28 h-28 rounded-full bg-green-950/50 border border-green-500/50 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)] relative">
      <motion.div
        className="absolute inset-0 rounded-full border border-green-500"
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <Trophy className="w-12 h-12 text-green-500" />
    </div>
    <h2 className="text-4xl sm:text-5xl font-black text-green-500 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] mb-4 text-center">
      ACCESS
      <br />
      GRANTED
    </h2>
    <p className="text-zinc-400 text-center text-lg max-w-[240px] mb-4">
      You cracked it! You unlocked
    </p>
    <h3 className="text-3xl font-black text-white mb-8 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
      {config.winRewardText}
    </h3>
    <button
      onClick={onClaim}
      className="w-full max-w-[280px] bg-gradient-to-b from-green-600 to-green-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all active:scale-[0.98] border border-green-500/50 tracking-wider"
    >
      {config.ctaClaim}
    </button>
  </motion.div>
);

const DeniedView = () => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full min-h-[300px] w-full"
  >
    <motion.div
      animate={{ x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="flex flex-col items-center"
    >
      <div className="w-28 h-28 rounded-full bg-red-950/50 border border-red-500/50 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.4)] relative">
        <motion.div
          className="absolute inset-0 rounded-full border border-red-500"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <ShieldAlert className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-4 text-center">
        ACCESS
        <br />
        DENIED
      </h2>
      <p className="text-zinc-400 text-center text-lg max-w-[240px]">
        Nice try, hacker. The lock is stronger than you.
      </p>
    </motion.div>
  </motion.div>
);

const RewardView = ({ onClaim }: { onClaim: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center text-center px-4 w-full"
  >
    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
      <Truck className="w-10 h-10 text-white" />
    </div>
    <p className="text-zinc-400 text-sm tracking-widest uppercase mb-2">But you did unlock</p>
    <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
      {config.loseRewardText}
    </h2>
    <div className="h-[1px] w-12 bg-zinc-800 mb-6" />
    <button
      onClick={onClaim}
      className="w-full max-w-[280px] bg-gradient-to-b from-red-600 to-red-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-[0.98] border border-red-500/50 tracking-wider"
    >
      {config.ctaClaim}
    </button>
  </motion.div>
);

export const CyberPopup = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const currentDigits = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setGameState('intro'), 500);
    }
  }, [isOpen]);

  const handleUnlock = () => {
    setGameState('checking');

    setTimeout(() => {
      const [d0, d1, d2] = currentDigits.current;
      const [w0, w1, w2] = config.winCombo;

      const won = String(d0) === w0 && String(d1) === w1 && String(d2) === w2;

      if (won) {
        setGameState('granted');
      } else {
        setGameState('denied');
        setTimeout(() => setGameState('reward'), 1200);
      }
    }, 1400);
  };

  const handleClaim = () => {
    if (window._klOnsite && config.klaviyoFormId) {
      window._klOnsite.push(['openForm', config.klaviyoFormId]);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-zinc-800/80 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden flex flex-col items-center"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -10px rgba(0,0,0,1)',
        }}
      >
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="pt-8 pb-2 flex justify-center w-full z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg rotate-45 border border-zinc-700 shadow-inner">
              <div className="w-4 h-4 border-2 border-black -rotate-45" />
            </div>
            <span className="text-white font-medium tracking-[0.2em] text-sm uppercase">
              CYBERBACKPACK
            </span>
          </div>
        </div>

        <div className="w-full relative min-h-[500px] flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {gameState === 'intro' && <IntroView key="intro" onStart={() => setGameState('playing')} />}

            {(gameState === 'playing' || gameState === 'checking') && (
              <GameView
                key="game"
                state={gameState}
                onTimeout={handleUnlock}
                onUnlock={handleUnlock}
                onValuesChange={(digits) => { currentDigits.current = digits; }}
              />
            )}

            {gameState === 'granted' && <GrantedView key="granted" onClaim={handleClaim} />}

            {gameState === 'denied' && <DeniedView key="denied" />}

            {gameState === 'reward' && <RewardView key="reward" onClaim={handleClaim} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
```

- [ ] **Run dev server and verify visually:**

```bash
cd cyberbackpack-lock-challenge && npm run dev
```

Open http://localhost:3000. Click "Trigger Security Challenge". Walk through all states:
1. Intro page shows correct default copy
2. Timer counts down from 10
3. Scroll wheels respond to touch/drag
4. UNLOCK with wrong combo → checking animation → denied → reward with lose text
5. UNLOCK with digits `3`, `1`, `4` (defaults) → checking → green ACCESS GRANTED → win text
6. Claim button on both paths calls `onClose` (popup closes — Klaviyo won't fire in dev since `_klOnsite` isn't loaded)

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/components/CyberPopup.tsx
git commit -m "feat: add GrantedView, combo check, config-driven copy, Klaviyo claim"
```

---

## Task 7: Update `main.tsx` — config-driven mount with gates

**Files:**
- Modify: `cyberbackpack-lock-challenge/src/main.tsx`

- [ ] **Replace the entire file:**

```typescript
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getConfig } from './config';
import { CyberPopup } from './components/CyberPopup';
import App from './App';
import './index.css';

const config = getConfig();

const productionRoot = document.getElementById('cyberlock-root');

if (productionRoot) {
  // Production: running inside Shopify theme
  const shouldSkip =
    (config.homeOnly && config.currentPage !== 'index') ||
    (config.visitorsOnly && config.isLoggedIn) ||
    (config.showOnce && localStorage.getItem('cyberlock_shown') === '1');

  if (!shouldSkip) {
    const PopupWrapper = () => {
      const [isOpen, setIsOpen] = useState(true);
      return <CyberPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />;
    };

    setTimeout(() => {
      if (config.showOnce) {
        localStorage.setItem('cyberlock_shown', '1');
      }
      createRoot(productionRoot).render(
        <StrictMode>
          <PopupWrapper />
        </StrictMode>
      );
    }, config.delay * 1000);
  }
} else {
  // Dev: standalone demo via index.html → <div id="root">
  const devRoot = document.getElementById('root');
  if (devRoot) {
    createRoot(devRoot).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
```

- [ ] **Verify TypeScript — run:**

```bash
cd cyberbackpack-lock-challenge && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Verify dev still works:**

```bash
npm run dev
```

Open http://localhost:3000. The demo page with the "Trigger Security Challenge" button should still work (it mounts via `#root`).

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/src/main.tsx
git commit -m "feat: production mount with delay, show-once, page and login gates"
```

---

## Task 8: Update `vite.config.ts` — IIFE build output to `../assets/`

**Files:**
- Modify: `cyberbackpack-lock-challenge/vite.config.ts`

- [ ] **Replace the entire file:**

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/main.tsx'),
        name: 'CyberLockChallenge',
        formats: ['iife'],
        fileName: () => 'lock-challenge',
      },
      rollupOptions: {
        output: {
          entryFileNames: 'lock-challenge.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'lock-challenge.css';
            return assetInfo.name ?? '[name][extname]';
          },
        },
      },
      outDir: path.resolve(__dirname, '../assets'),
      emptyOutDir: false,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

- [ ] **Run the build:**

```bash
cd cyberbackpack-lock-challenge && npm run build
```

Expected output (last few lines):
```
dist/lock-challenge.js   xxx kB
dist/lock-challenge.css   xx kB
```

Wait — `outDir` is `../assets` so files go to `assets/lock-challenge.js` and `assets/lock-challenge.css`. Confirm they exist:

```bash
ls ../assets/lock-challenge.*
```

Expected:
```
../assets/lock-challenge.css
../assets/lock-challenge.js
```

- [ ] **Commit:**

```bash
git add cyberbackpack-lock-challenge/vite.config.ts assets/lock-challenge.js assets/lock-challenge.css
git commit -m "feat: build lock challenge to IIFE bundle in assets/"
```

---

## Task 9: Create `sections/lock-challenge-popup.liquid`

**Files:**
- Create: `sections/lock-challenge-popup.liquid`

- [ ] **Create the file:**

```liquid
{%- if section.settings.enable -%}
  {%- assign should_show = true -%}

  {%- if section.settings.show_only_on_index and request.page_type != 'index' -%}
    {%- assign should_show = false -%}
  {%- endif -%}

  {%- if section.settings.show_only_for_visitors and customer -%}
    {%- assign should_show = false -%}
  {%- endif -%}

  {%- if should_show -%}
    <script>
      window.CYBERLOCK_CONFIG = {
        delay: {{ section.settings.apparition_delay }},
        showOnce: {{ section.settings.show_only_once }},
        homeOnly: {{ section.settings.show_only_on_index }},
        visitorsOnly: {{ section.settings.show_only_for_visitors }},
        currentPage: '{{ request.page_type }}',
        isLoggedIn: {{ customer != blank }},
        winCombo: ['{{ section.settings.combo_d1 }}', '{{ section.settings.combo_d2 }}', '{{ section.settings.combo_d3 }}'],
        timerSeconds: {{ section.settings.timer_seconds }},
        headingLine1: '{{ section.settings.heading_line1 | escape }}',
        headingLine2: '{{ section.settings.heading_line2 | escape }}',
        challengeText: '{{ section.settings.challenge_text | escape }}',
        winRewardText: '{{ section.settings.win_reward_text | escape }}',
        loseRewardText: '{{ section.settings.lose_reward_text | escape }}',
        ctaStart: '{{ section.settings.cta_start | escape }}',
        ctaClaim: '{{ section.settings.cta_claim | escape }}',
        klaviyoFormId: '{{ section.settings.klaviyo_form_id | escape }}'
      };
    </script>
    <div id="cyberlock-root"></div>
    {{ 'lock-challenge.css' | asset_url | stylesheet_tag }}
    <script src="{{ 'lock-challenge.js' | asset_url }}" defer></script>
  {%- endif -%}
{%- endif -%}

{% schema %}
{
  "name": "Lock Challenge Popup",
  "class": "shopify-section--lock-challenge",
  "settings": [
    {
      "type": "paragraph",
      "content": "A gamified combination lock popup that captures emails via Klaviyo. Add your Klaviyo Form ID below and enable when ready."
    },
    {
      "type": "checkbox",
      "id": "enable",
      "label": "Enable",
      "default": false
    },
    {
      "type": "range",
      "id": "apparition_delay",
      "min": 0,
      "max": 30,
      "step": 1,
      "unit": "sec",
      "label": "Delay until the popup appears",
      "default": 5
    },
    {
      "type": "checkbox",
      "id": "show_only_on_index",
      "label": "Show only on home page",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_only_for_visitors",
      "label": "Disable for account holders",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "show_only_once",
      "label": "Show once per visitor",
      "default": true
    },
    {
      "type": "header",
      "content": "Lock Challenge"
    },
    {
      "type": "select",
      "id": "combo_d1",
      "label": "Winning combo — digit 1",
      "options": [
        { "value": "0", "label": "0" },
        { "value": "1", "label": "1" },
        { "value": "2", "label": "2" },
        { "value": "3", "label": "3" },
        { "value": "4", "label": "4" },
        { "value": "5", "label": "5" },
        { "value": "6", "label": "6" },
        { "value": "7", "label": "7" },
        { "value": "8", "label": "8" },
        { "value": "9", "label": "9" }
      ],
      "default": "3"
    },
    {
      "type": "select",
      "id": "combo_d2",
      "label": "Winning combo — digit 2",
      "options": [
        { "value": "0", "label": "0" },
        { "value": "1", "label": "1" },
        { "value": "2", "label": "2" },
        { "value": "3", "label": "3" },
        { "value": "4", "label": "4" },
        { "value": "5", "label": "5" },
        { "value": "6", "label": "6" },
        { "value": "7", "label": "7" },
        { "value": "8", "label": "8" },
        { "value": "9", "label": "9" }
      ],
      "default": "1"
    },
    {
      "type": "select",
      "id": "combo_d3",
      "label": "Winning combo — digit 3",
      "options": [
        { "value": "0", "label": "0" },
        { "value": "1", "label": "1" },
        { "value": "2", "label": "2" },
        { "value": "3", "label": "3" },
        { "value": "4", "label": "4" },
        { "value": "5", "label": "5" },
        { "value": "6", "label": "6" },
        { "value": "7", "label": "7" },
        { "value": "8", "label": "8" },
        { "value": "9", "label": "9" }
      ],
      "default": "4"
    },
    {
      "type": "range",
      "id": "timer_seconds",
      "min": 5,
      "max": 30,
      "step": 1,
      "unit": "sec",
      "label": "Timer duration",
      "default": 10
    },
    {
      "type": "header",
      "content": "Copy"
    },
    {
      "type": "text",
      "id": "heading_line1",
      "label": "Heading — line 1",
      "default": "BREAK INTO"
    },
    {
      "type": "text",
      "id": "heading_line2",
      "label": "Heading — line 2",
      "default": "THE BACKPACK"
    },
    {
      "type": "text",
      "id": "challenge_text",
      "label": "Challenge description",
      "default": "Think you can crack our TSA combination lock?"
    },
    {
      "type": "text",
      "id": "win_reward_text",
      "label": "Win reward text",
      "info": "Shown when visitor enters the correct combo",
      "default": "FREE SHIPPING!"
    },
    {
      "type": "text",
      "id": "lose_reward_text",
      "label": "Lose reward text",
      "info": "Consolation prize shown when visitor fails or timer runs out",
      "default": "FREE SHIPPING!"
    },
    {
      "type": "text",
      "id": "cta_start",
      "label": "Start button text",
      "default": "START MISSION"
    },
    {
      "type": "text",
      "id": "cta_claim",
      "label": "Claim button text",
      "default": "CLAIM FREE SHIPPING"
    },
    {
      "type": "header",
      "content": "Klaviyo"
    },
    {
      "type": "text",
      "id": "klaviyo_form_id",
      "label": "Klaviyo Form ID",
      "info": "Found in your Klaviyo form embed code. Example: XxXxXx. Leave blank to skip Klaviyo."
    }
  ]
}
{% endschema %}
```

- [ ] **Verify the section file is valid JSON schema — paste the `{% schema %}` block into:**

```bash
node -e "JSON.parse(require('fs').readFileSync('sections/lock-challenge-popup.liquid','utf8').match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/)[1]); console.log('Valid JSON')"
```

Expected: `Valid JSON`

- [ ] **Commit:**

```bash
git add sections/lock-challenge-popup.liquid
git commit -m "feat: add lock-challenge-popup Shopify section with full theme editor schema"
```

---

## Task 10: Fix `layout/theme.liquid` — remove duplicate tags, defer render-blocking CSS

**Files:**
- Modify: `layout/theme.liquid`

There are two `<title>` tags and two `<meta name="description">` tags, plus a render-blocking `scrolling.scss.css` stylesheet.

- [ ] **Remove the second (duplicate) title and meta description block. Find these exact lines (around line 22–26):**

```html
<title>{{ page_title }} | {{ shop.name }}</title>

{% if page_description %}
<meta name="description" content="{{ page_description }}" />
{% endif %}
```

Delete those 5 lines entirely. The correct title block at line 14 remains:

```html
<title>{% if page_title == blank %}{{ shop.name }}{% else %}{{ page_title }}{% if current_page != 1 %} &ndash; {{ 'general.meta.page' | t: page: current_page }}{% endif %}{% endif %}</title>
```

- [ ] **Defer the render-blocking scrolling stylesheet. Find this line (around line 42):**

```html
    <link rel="stylesheet" href="{{ 'scrolling.scss.css' | asset_url }}">
```

Replace it with:

```html
    <link rel="stylesheet" href="{{ 'scrolling.scss.css' | asset_url }}" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="{{ 'scrolling.scss.css' | asset_url }}"></noscript>
```

- [ ] **Verify the head section looks correct — confirm only one `<title>` and one `<meta name="description">` block:**

```bash
grep -n "<title>" layout/theme.liquid
grep -n "page_description" layout/theme.liquid
```

Expected: each grep returns exactly one match.

- [ ] **Commit:**

```bash
git add layout/theme.liquid
git commit -m "perf: remove duplicate title/meta tags and defer render-blocking scrolling CSS"
```

---

## Self-Review Notes

- All 6 components in `types.ts` GameState are implemented in tasks 1–6 ✅  
- `getConfig()` is called once at module level in `CyberPopup.tsx` — config is stable for the lifetime of the popup ✅  
- `winCombo` digits are strings (`'3'`, `'1'`, `'4'`) from Liquid and are compared to `String(digit)` in `handleUnlock` — types match ✅  
- `emptyOutDir: false` in vite build prevents wiping other assets ✅  
- Liquid section gates (`should_show`) duplicate the JS gates in `main.tsx` — belt-and-suspenders, correct ✅  
- `defer` on the script tag means the bundle never blocks LCP ✅
- The `claim` state is removed from GameState — `RewardView` and `GrantedView` call `handleClaim()` directly from the claim button ✅
