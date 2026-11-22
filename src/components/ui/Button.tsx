import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-indigo-900 text-white hover:bg-indigo-600 border border-transparent shadow-xs',
  secondary:
    'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-xs',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 border border-transparent shadow-xs',
  violet:
    'bg-violet-600 text-white hover:bg-violet-700 border border-transparent shadow-xs',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
