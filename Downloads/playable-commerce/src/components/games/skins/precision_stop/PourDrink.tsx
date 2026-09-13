// src/components/games/skins/precision_stop/PourDrink.tsx
import { motion } from 'motion/react';
import type { SkinConfig } from '../../../../types';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  currentValue: number;
  maxValue: number;
  targetValue: number;
  stopped: boolean;
  onStop: () => void;
  config: SkinConfig;
  branding: BrandingColors;
}

export function PourDrink({ currentValue, maxValue, targetValue, stopped, onStop, config, branding }: Props) {
  const fillPct = (currentValue / maxValue) * 100;
  const targetPct = (targetValue / maxValue) * 100;
  const unit = config.unit ?? '%';

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Flask */}
      <div className="relative w-32 h-56 flex flex-col justify-end">
        {/* Flask outline */}
        <div
          className="absolute inset-0 rounded-b-3xl rounded-t-lg border-2"
          style={{ borderColor: branding.primaryColor + '60' }}
        />
        {/* Target line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed z-10 flex items-center"
          style={{
            bottom: `${targetPct}%`,
            borderColor: branding.accentColor,
          }}
        >
          <span className="absolute -right-10 text-xs font-bold" style={{ color: branding.accentColor }}>
            {targetValue}
            {unit}
          </span>
        </div>
        {/* Liquid fill */}
        <motion.div
          className="rounded-b-3xl rounded-t-none absolute bottom-0 left-0 right-0"
          style={{ background: branding.primaryColor + 'CC' }}
          animate={{ height: `${fillPct}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
        {/* Current value overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center z-20 text-2xl font-black"
          style={{ color: branding.textColor }}
        >
          {currentValue}
          {unit}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm opacity-60 text-center" style={{ color: branding.textColor }}>
        Stop the pour at {targetValue}
        {unit}
      </p>

      {/* Stop button */}
      <button
        onClick={onStop}
        disabled={stopped}
        className="w-48 py-4 rounded-xl font-black tracking-widest text-base transition-all active:scale-95 disabled:opacity-40"
        style={{ background: branding.primaryColor, color: branding.backgroundColor }}
      >
        {stopped ? 'STOPPED' : 'STOP'}
      </button>
    </div>
  );
}
