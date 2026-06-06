interface BadgeProps {
  plan: 'FREE' | 'PRO' | 'AGENCY';
}

const styles: Record<BadgeProps['plan'], string> = {
  FREE: 'bg-slate-100 text-slate-600',
  PRO: 'bg-cyan-100 text-cyan-800',
  AGENCY: 'bg-amber-100 text-amber-700',
};

export function Badge({ plan }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[plan]}`}
    >
      {plan}
    </span>
  );
}
