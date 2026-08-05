import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`glass-input w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all placeholder-slate-500 ${
              error
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                : 'border-cyan-500/30 focus:border-pink-500'
            } focus:outline-none ${className}`}
            {...props}
          />
          {icon && <div className="absolute right-3.5 top-3 text-cyan-400 pointer-events-none">{icon}</div>}
        </div>
        {error && <p className="text-xs text-rose-400 mt-1 font-bold">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`glass-input w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-[#0a0d24] text-white ${
            error
              ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
              : 'border-cyan-500/30 focus:border-pink-500'
          } focus:outline-none ${className}`}
          {...props}
        >
          {placeholder && <option value="" className="bg-[#0a0d24] text-slate-400">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0a0d24] text-white font-semibold">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400 mt-1 font-bold">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, rows = 4, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 mb-1.5 drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`glass-input w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all resize-none placeholder-slate-500 ${
            error
              ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
              : 'border-cyan-500/30 focus:border-pink-500'
          } focus:outline-none ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 mt-1 font-bold">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
