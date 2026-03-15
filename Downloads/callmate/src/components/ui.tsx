import React from 'react';
import { motion } from 'motion/react';

type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(' ');
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'glass' | 'accent';
  size?: 'sm' | 'lg' | 'xl';
  isDark?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  size = 'lg',
  isDark = false,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? isDark
        ? 'bg-[linear-gradient(135deg,#7ea18d_0%,#5d8a7a_52%,#466b5f_100%)] text-white shadow-[0_18px_40px_rgba(93,138,122,0.34)] hover:brightness-[1.03]'
        : 'bg-[linear-gradient(135deg,#22312b_0%,#31463d_100%)] text-white shadow-[0_18px_36px_rgba(34,49,43,0.18)] hover:brightness-[1.03]'
      : variant === 'accent'
      ? 'bg-[linear-gradient(135deg,#d8b278_0%,#c78d4f_100%)] text-[#20160d] shadow-[0_18px_44px_rgba(199,141,79,0.28)] hover:brightness-[1.03]'
      : variant === 'outline'
      ? isDark
        ? 'border border-[#4a5a53] bg-[#1b2321] text-[#f6f2ea] hover:bg-[#222c29] hover:border-[#65756d]'
        : 'border border-[#d8cdc0] bg-[rgba(255,252,247,0.8)] text-[#22312b] hover:bg-[#f5efe6] hover:border-[#c9bda7]'
      : variant === 'glass'
      ? 'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/15'
      : isDark
      ? 'text-[#f6f2ea] hover:bg-white/5'
      : 'text-[#22312b] hover:bg-black/5';

  const sizeClass =
    size === 'sm'
      ? 'h-9 px-3.5 text-sm rounded-xl'
      : size === 'xl'
      ? 'h-14 px-6 text-base rounded-[1.35rem]'
      : 'h-12 px-5 text-sm rounded-[1.1rem]';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    />
  );
}

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  isDark?: boolean;
};

export function Card({ className, isDark = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.8rem] border transition-colors relative overflow-hidden',
        isDark
          ? 'bg-[linear-gradient(180deg,rgba(33,42,39,0.96)_0%,rgba(24,31,29,0.94)_100%)] border-[#415049] shadow-[0_20px_50px_rgba(0,0,0,0.22)]'
          : 'bg-[linear-gradient(180deg,rgba(255,252,247,0.96)_0%,rgba(245,239,230,0.96)_100%)] border-[#d8cdc0] shadow-[0_18px_38px_rgba(93,116,104,0.08)]',
        className
      )}
      {...props}
    />
  );
}

// ─── Skeleton / Shimmer ───────────────────────────────────────────────────────

type SkeletonProps = { className?: string; isDark?: boolean; style?: React.CSSProperties };

export function Skeleton({ className, isDark = false, style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-2xl overflow-hidden relative',
        isDark ? 'bg-[#202926]' : 'bg-[#e8e0d4]',
        className
      )}
    >
      <motion.div
        className={cn(
          'absolute inset-0',
          isDark
            ? 'bg-gradient-to-r from-transparent via-white/[0.04] to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'
        )}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/** Skeleton shaped like a script history card */
export function ScriptCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <Card isDark={isDark} className="p-5 space-y-3">
      <Skeleton isDark={isDark} className="h-4 w-2/3" />
      <Skeleton isDark={isDark} className="h-3 w-1/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton isDark={isDark} className="h-7 w-20 rounded-full" />
        <Skeleton isDark={isDark} className="h-7 w-16 rounded-full" />
      </div>
    </Card>
  );
}

/** Skeleton shaped like the script sections (opening / mainAsk / branches) */
export function ScriptViewSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <div className="space-y-4">
      {[110, 80, 90, 75, 70].map((h, i) => (
        <Card key={i} isDark={isDark} className="p-5 space-y-3">
          <Skeleton isDark={isDark} className="h-3 w-24" />
          <Skeleton isDark={isDark} className={`h-${Math.floor(h / 20)} w-full`} style={{ height: h }} />
        </Card>
      ))}
    </div>
  );
}

type CallTypeGridProps = {
  items: string[];
  onSelect: (value: string) => void;
  selectedItem: string;
  isDark?: boolean;
};

export function CallTypeGrid({ items, onSelect, selectedItem, isDark = false }: CallTypeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {items.map((item) => {
        const selected = item === selectedItem;
        return (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={cn(
              'rounded-[1.35rem] border px-4 py-3.5 text-left text-sm font-medium leading-snug transition-all duration-200',
              selected
                ? isDark
                  ? 'bg-[linear-gradient(135deg,#f3eee4_0%,#d8cdbf_100%)] border-[#f3eee4] text-[#22312b] shadow-[0_12px_26px_rgba(243,238,228,0.12)]'
                  : 'bg-[linear-gradient(135deg,#22312b_0%,#385046_100%)] border-[#22312b] text-white shadow-[0_14px_28px_rgba(34,49,43,0.16)]'
                : isDark
                ? 'bg-[linear-gradient(180deg,#202926_0%,#19211f_100%)] border-[#415049] text-[#dbe3de] hover:border-[#66756f] hover:-translate-y-[1px]'
                : 'bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(247,241,233,0.96)_100%)] border-[#d8cdc0] text-[#22312b] hover:border-[#b7aa96] hover:-translate-y-[1px]'
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
