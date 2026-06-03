interface BadgeProps {
  plan: 'FREE' | 'PRO' | 'AGENCY';
}

const styles: Record<BadgeProps['plan'], string> = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-purple-100 text-purple-700',
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
