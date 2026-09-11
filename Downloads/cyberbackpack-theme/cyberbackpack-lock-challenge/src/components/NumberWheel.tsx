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
      const digit = Math.round(scrollRef.current.scrollTop / 64) % 10;
      onValueChange?.(digit);
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
