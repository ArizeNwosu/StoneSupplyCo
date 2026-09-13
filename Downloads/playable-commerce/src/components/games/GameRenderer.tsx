// src/components/games/GameRenderer.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameSpec } from '../../types';
import { PrecisionStop } from './primitives/PrecisionStop';
import { MultiDial } from './primitives/MultiDial';
import { PickOne } from './primitives/PickOne';

type Phase = 'intro' | 'playing' | 'result' | 'reward';

interface GameRendererProps {
  spec: GameSpec;
  onComplete?: () => void;
}

export function GameRenderer({ spec, onComplete }: GameRendererProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { branding, intro, result, reward, conversion, mechanic } = spec;

  const bg = branding.backgroundColor;
  const text = branding.textColor;
  const primary = branding.primaryColor;
  const accent = branding.accentColor;
  const fontClass =
    branding.fontStyle === 'mono'
      ? 'font-mono'
      : branding.fontStyle === 'serif'
        ? 'font-serif'
        : 'font-sans';

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleGameResult = useCallback(
    (success: boolean) => {
      setIsSuccess(success);
      setPhase('result');
      timerRef.current = setTimeout(() => setPhase('reward'), result.delayMs + 1500);
    },
    [result.delayMs],
  );

  const handleKlaviyo = useCallback(() => {
    const formId = isSuccess ? conversion.winnerFormId : conversion.standardFormId;
    if (formId && conversion.provider === 'klaviyo') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._klOnsite = (window as any)._klOnsite || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._klOnsite.push(['openForm', formId]);
    }
    onComplete?.();
  }, [isSuccess, conversion, onComplete]);

  const renderPrimitive = () => {
    switch (mechanic.primitive) {
      case 'precision_stop':
        return (
          <PrecisionStop
            config={mechanic.config}
            skin={mechanic.skin}
            branding={branding}
            onResult={handleGameResult}
          />
        );
      case 'multi_dial':
        return (
          <MultiDial
            config={mechanic.config}
            skin={mechanic.skin}
            branding={branding}
            onResult={handleGameResult}
          />
        );
      case 'pick_one':
        return (
          <PickOne
            config={mechanic.config}
            skin={mechanic.skin}
            branding={branding}
            onResult={handleGameResult}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-48">
            <p style={{ color: text }} className="opacity-50 text-sm">
              {mechanic.primitive} / {mechanic.skin}
            </p>
            <button
              onClick={() => handleGameResult(false)}
              className="mt-4 px-6 py-3 rounded-lg font-bold text-sm"
              style={{ background: primary, color: bg }}
            >
              PLAY (DEMO)
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-between ${fontClass} overflow-hidden relative`}
      style={{ background: bg, color: text }}
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <h1
              className="text-3xl font-black tracking-tight mb-3 leading-tight"
              style={{ color: accent }}
            >
              {intro.headline}
            </h1>
            <p className="text-sm opacity-70 max-w-xs leading-relaxed mb-10">{intro.body}</p>
            <button
              onClick={() => setPhase('playing')}
              className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm transition-all active:scale-95"
              style={{ background: primary, color: bg }}
            >
              {intro.cta}
            </button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
          >
            {renderPrimitive()}
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.h1
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className="text-4xl font-black tracking-widest mb-4"
              style={{ color: result.type === 'deny' ? '#EF4444' : accent }}
            >
              {result.headline}
            </motion.h1>
            <p className="text-sm opacity-70 max-w-xs leading-relaxed">{result.body}</p>
          </motion.div>
        )}

        {phase === 'reward' && (
          <motion.div
            key="reward"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl"
              style={{ background: primary + '22', color: primary }}
            >
              🎁
            </div>
            <h2 className="text-2xl font-black mb-3" style={{ color: accent }}>
              YOU UNLOCKED IT
            </h2>
            <p className="text-base opacity-90 max-w-xs leading-relaxed mb-8">{reward.message}</p>
            <button
              onClick={handleKlaviyo}
              className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm transition-all active:scale-95"
              style={{ background: primary, color: bg }}
            >
              CLAIM MY REWARD
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
