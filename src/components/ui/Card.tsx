import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7',
};

export function Card({
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-[#101827] border border-white/[0.08] rounded-xl shadow-[0_8px_24px_rgba(3,7,18,0.32)] ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
