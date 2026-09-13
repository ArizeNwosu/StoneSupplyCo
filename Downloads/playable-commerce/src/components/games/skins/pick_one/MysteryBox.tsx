// src/components/games/skins/pick_one/MysteryBox.tsx
import { motion, AnimatePresence } from 'motion/react';
import type { SkinConfig } from '../../../../types';

interface BrandingColors {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  tone: string;
}

interface Props {
  count: number;
  selected: number | null;
  revealed: boolean;
  onPick: (index: number) => void;
  config: SkinConfig;
  branding: BrandingColors;
}

const BOX_EMOJIS = ['📦', '🎁', '🎀'];

export function MysteryBox({ count, selected, revealed, onPick, config, branding }: Props) {
  const labels = config.box_labels ?? Array.from({ length: count }, (_, i) => `Box ${i + 1}`);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
      <p className="text-sm opacity-60 tracking-widest" style={{ color: branding.textColor }}>
        PICK ONE
      </p>
      <div className="flex gap-4">
        {Array.from({ length: count }, (_, i) => (
          <motion.button
            key={i}
            onClick={() => onPick(i)}
            disabled={selected !== null}
            whileHover={{ y: selected === null ? -4 : 0 }}
            whileTap={{ scale: 0.95 }}
            animate={selected === i && revealed ? { rotateY: 180 } : {}}
            className="w-24 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-colors disabled:cursor-default"
            style={{
              borderColor: selected === i ? branding.primaryColor : branding.primaryColor + '30',
              background: selected === i ? branding.primaryColor + '15' : branding.textColor + '05',
            }}
          >
            <span className="text-3xl">{BOX_EMOJIS[i % BOX_EMOJIS.length]}</span>
            <span className="text-xs font-bold tracking-wide" style={{ color: branding.textColor }}>
              {labels[i]}
            </span>
            <AnimatePresence>
              {selected === i && revealed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-xl"
                >
                  🎉
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      {selected === null && (
        <p className="text-xs opacity-40" style={{ color: branding.textColor }}>
          One box holds your reward
        </p>
      )}
    </div>
  );
}
