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
      className={`bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
