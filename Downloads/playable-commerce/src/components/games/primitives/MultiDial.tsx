// src/components/games/primitives/MultiDial.tsx
import { useState, useCallback } from 'react';
import type { SkinConfig } from '../../../types';
import { CombinationLock } from '../skins/multi_dial/CombinationLock';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  config: SkinConfig;
  skin: string;
  branding: BrandingColors;
  onResult: (success: boolean) => void;
}

export type DialPhase = 'playing' | 'checking' | 'done';

export function MultiDial({ config, skin, branding, onResult }: Props) {
  const digits = config.digits ?? 3;
  const [values, setValues] = useState<number[]>(Array(digits).fill(0));
  const [phase, setPhase] = useState<DialPhase>('playing');

  const handleChange = useCallback((index: number, delta: number) => {
    if (phase !== 'playing') return;
    setValues(prev => {
      const next = [...prev];
      next[index] = ((next[index] + delta + 10) % 10);
      return next;
    });
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('checking');
    // Always fails — combination is secret, player never knows it
    setTimeout(() => {
      setPhase('done');
      onResult(false);
    }, 1800);
  }, [phase, onResult]);

  const skinProps = { values, phase, onDigitChange: handleChange, onSubmit: handleSubmit, config, branding };

  if (skin === 'combination_lock') return <CombinationLock {...skinProps} />;

  // Generic fallback
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="flex gap-4">
        {values.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button onClick={() => handleChange(i, -1)} className="text-2xl" style={{ color: branding.textColor }}>▲</button>
            <span className="text-4xl font-black w-12 text-center" style={{ color: branding.accentColor }}>{v}</span>
            <button onClick={() => handleChange(i, 1)} className="text-2xl" style={{ color: branding.textColor }}>▼</button>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={phase !== 'playing'}
        className="px-8 py-4 rounded-lg font-bold tracking-widest"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {phase === 'checking' ? 'CHECKING...' : 'UNLOCK'}
      </button>
    </div>
  );
}
