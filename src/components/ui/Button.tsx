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
    'bg-[#648BFF] text-[#080D19] font-semibold hover:bg-[#7A9CFF] border border-[#648BFF]/20 shadow-[0_1px_2px_rgba(8,13,25,0.45)]',
  secondary:
    'bg-[#151F30] text-[#F1F5FC] hover:bg-[#1C2940] border border-white/[0.1] hover:border-[#648BFF]/35',
  ghost:
    'bg-transparent text-[#9AA8BD] hover:bg-white/[0.06] hover:text-[#F1F5FC] border border-transparent',
  danger:
    'bg-rose-600/90 text-white hover:bg-rose-500 border border-rose-400/20',
  violet:
    'bg-[#9275F5] text-[#080D19] font-semibold hover:bg-[#A48BF7] border border-[#9275F5]/25',
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
      className={`inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#648BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D19] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
