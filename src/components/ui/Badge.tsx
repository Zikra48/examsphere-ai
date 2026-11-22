import React from 'react';

export type BadgeVariant = 'slate' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose';

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
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
