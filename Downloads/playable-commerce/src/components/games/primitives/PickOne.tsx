// src/components/games/primitives/PickOne.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import type { SkinConfig } from '../../../types';
import { MysteryBox } from '../skins/pick_one/MysteryBox';

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

export function PickOne({ config, skin, branding, onResult }: Props) {
  const count = config.count ?? 3;
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const timer1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer1Ref.current !== null) clearTimeout(timer1Ref.current);
      if (timer2Ref.current !== null) clearTimeout(timer2Ref.current);
    };
  }, []);

  const handlePick = useCallback((index: number) => {
    if (selected !== null) return;
    setSelected(index);
    timer1Ref.current = setTimeout(() => {
      setRevealed(true);
      timer2Ref.current = setTimeout(() => onResult(false), 800);
    }, 600);
  }, [selected, onResult]);

  const skinProps = { count, selected, revealed, onPick: handlePick, config, branding };

  if (skin === 'mystery_box') return <MysteryBox {...skinProps} />;

  // Generic fallback
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <p className="text-sm opacity-60" style={{ color: branding.textColor }}>Choose one:</p>
      <div className="flex gap-4">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            className="w-20 h-20 rounded-xl font-bold text-lg border-2 transition-all"
            style={{
              borderColor: selected === i ? branding.primaryColor : branding.primaryColor + '40',
              background: selected === i ? branding.primaryColor + '20' : 'transparent',
              color: branding.textColor,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
