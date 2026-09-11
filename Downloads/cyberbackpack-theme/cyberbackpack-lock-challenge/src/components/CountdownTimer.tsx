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
