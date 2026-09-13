// src/components/games/primitives/PrecisionStop.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import type { SkinConfig } from '../../../types';
import { PourDrink } from '../skins/precision_stop/PourDrink';

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
  onResult: (success: boolean, value?: number) => void;
}

const SPEEDS = { slow: 12000, medium: 7000, fast: 3500 };
const DEFAULT_TOLERANCE = 8; // ± percent of maxValue

export function PrecisionStop({ config, skin, branding, onResult }: Props) {
  const maxValue = config.maxValue ?? 100;
  const targetValue = config.targetValue ?? 50;
  const speed = config.speed ?? 'medium';
  const duration = SPEEDS[speed];
  const tolerance = DEFAULT_TOLERANCE;

  const [currentValue, setCurrentValue] = useState(0);
  const [stopped, setStopped] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const tick = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      // oscillate back and forth
      const fullCycle = duration * 2;
      const pos = elapsed % fullCycle;
      let value: number;
      if (pos < duration) {
        value = (pos / duration) * maxValue;
      } else {
        value = maxValue - ((pos - duration) / duration) * maxValue;
      }
      setCurrentValue(Math.round(value));
      rafRef.current = requestAnimationFrame(tick);
    },
    [duration, maxValue],
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  const handleStop = useCallback(() => {
    if (stopped) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStopped(true);
    const success = Math.abs(currentValue - targetValue) <= tolerance;
    setTimeout(() => onResult(success, currentValue), 400);
  }, [stopped, currentValue, targetValue, tolerance, onResult]);

  const skinProps = { currentValue, maxValue, targetValue, stopped, onStop: handleStop, config, branding };

  if (skin === 'pour_drink') return <PourDrink {...skinProps} />;

  // Generic fallback for other precision_stop skins
  const pct = (currentValue / maxValue) * 100;
  const targetPct = (targetValue / maxValue) * 100;
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      <div className="text-4xl font-black" style={{ color: branding.accentColor }}>
        {currentValue}
        {config.unit ?? ''}
      </div>
      <div className="w-full h-6 rounded-full bg-white/10 relative">
        <div
          className="h-full rounded-full transition-none"
          style={{ width: `${pct}%`, background: branding.primaryColor }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: `${targetPct}%` }} />
      </div>
      <button
        onClick={handleStop}
        disabled={stopped}
        className="px-8 py-4 rounded-lg font-bold tracking-widest text-sm disabled:opacity-50"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        STOP
      </button>
    </div>
  );
}
