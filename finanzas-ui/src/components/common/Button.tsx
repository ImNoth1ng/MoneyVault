import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-black rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide';

    const variantStyles = {
      primary:
        'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 text-slate-950 font-black uppercase shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,128,0.6)] border border-cyan-300/50 hover:scale-[1.02] active:scale-[0.98]',
      secondary:
        'bg-slate-900/80 text-cyan-300 border border-cyan-500/40 hover:bg-slate-800 hover:border-pink-500/60 shadow-[0_0_15px_rgba(0,243,255,0.15)] backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]',
      danger:
        'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/35 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]',
      ghost:
        'bg-transparent text-slate-300 hover:text-cyan-400 hover:bg-white/5 backdrop-blur-sm hover:scale-[1.02] active:scale-[0.98]',
    }[variant];

    const sizeStyles = {
      sm: 'px-3.5 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
