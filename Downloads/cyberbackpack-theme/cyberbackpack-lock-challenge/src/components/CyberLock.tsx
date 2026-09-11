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
