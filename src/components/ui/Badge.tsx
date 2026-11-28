import React from 'react';

export type BadgeVariant = 'slate' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose';

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  slate: 'bg-[#151F30] text-[#9AA8BD] border-white/[0.1]',
  indigo: 'bg-[#648BFF]/15 text-[#9BB6FF] border-[#648BFF]/30',
  violet: 'bg-[#9275F5]/15 text-[#C1B0FF] border-[#9275F5]/30',
  emerald: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  amber: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  rose: 'bg-rose-500/12 text-rose-300 border-rose-500/25',
};

export function Badge({ variant = 'slate', icon, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
