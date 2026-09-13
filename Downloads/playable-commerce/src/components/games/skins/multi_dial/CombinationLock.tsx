// src/components/games/skins/multi_dial/CombinationLock.tsx
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SkinConfig } from '../../../../types';
import type { DialPhase } from '../../primitives/MultiDial';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  values: number[];
  phase: DialPhase;
  onDigitChange: (index: number, delta: number) => void;
  onSubmit: () => void;
  config: SkinConfig;
  branding: BrandingColors;
}

export function CombinationLock({ values, phase, onDigitChange, onSubmit, branding }: Props) {
  const dragStartY = useRef<Record<number, number>>({});

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    dragStartY.current[index] = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (index: number, e: React.PointerEvent) => {
    if (dragStartY.current[index] === undefined) return;
    const delta = e.clientY - dragStartY.current[index];
    if (Math.abs(delta) >= 40) {
      onDigitChange(index, delta > 0 ? 1 : -1);
      dragStartY.current[index] = e.clientY;
    }
  };

  const handlePointerUp = (index: number) => {
    delete dragStartY.current[index];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs tracking-widest opacity-50 mb-1" style={{ color: branding.textColor }}>
          DRAG UP/DOWN TO CHANGE
        </p>
      </div>

      {/* Dials */}
      <div
        className="flex gap-3 p-4 rounded-2xl border"
        style={{ borderColor: branding.primaryColor + '40', background: branding.backgroundColor }}
      >
        {values.map((v, i) => (
          <div
            key={i}
            className="relative w-16 h-24 rounded-xl overflow-hidden flex items-center justify-center cursor-ns-resize select-none border"
            style={{
              borderColor: branding.primaryColor + '60',
              background: branding.textColor + '08',
            }}
            onPointerDown={(e) => handlePointerDown(i, e)}
            onPointerMove={(e) => handlePointerMove(i, e)}
            onPointerUp={() => handlePointerUp(i)}
            onPointerCancel={() => handlePointerUp(i)}
          >
            {/* Prev */}
            <span
              className="absolute top-1 text-xl font-black opacity-20"
              style={{ color: branding.accentColor }}
            >
              {(v + 9) % 10}
            </span>
            {/* Current */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={v}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-4xl font-black z-10"
                style={{ color: branding.accentColor }}
              >
                {v}
              </motion.span>
            </AnimatePresence>
            {/* Next */}
            <span
              className="absolute bottom-1 text-xl font-black opacity-20"
              style={{ color: branding.accentColor }}
            >
              {(v + 1) % 10}
            </span>
            {/* Checking spin overlay */}
            {phase === 'checking' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: branding.primaryColor + '20' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Unlock button */}
      <button
        onClick={onSubmit}
        disabled={phase !== 'playing'}
        className="w-48 py-4 rounded-xl font-black tracking-widest text-base transition-all active:scale-95 disabled:opacity-50"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {phase === 'checking' ? 'CHECKING...' : 'UNLOCK'}
      </button>

      <p className="text-xs opacity-30 tracking-widest" style={{ color: branding.textColor }}>
        {values.join('-')}
      </p>
    </div>
  );
}
