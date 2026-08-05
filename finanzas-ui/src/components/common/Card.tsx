import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card = ({ children, className = '', title, subtitle }: CardProps) => {
  return (
    <div className={`glass-card rounded-2xl p-5 md:p-6 transition-all duration-300 ${className}`}>
      {title && (
        <div className="mb-4 pb-3 border-b border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-cyan-400 rounded-full inline-block" />
              <span>{title}</span>
            </h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium ml-3.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

interface SummaryCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export const SummaryCard = ({
  icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  className = '',
}: SummaryCardProps) => {
  const trendColor = {
    up: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40 shadow-[0_0_12px_rgba(0,243,255,0.2)]',
    down: 'text-pink-300 bg-pink-500/20 border-pink-400/40 shadow-[0_0_12px_rgba(255,0,128,0.2)]',
    neutral: 'text-purple-300 bg-purple-500/20 border-purple-400/40',
  }[trend || 'neutral'];

  return (
    <div className={`glass-card rounded-2xl p-5 relative overflow-hidden group ${className}`}>
      {/* Cyber Glow Accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all" />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 drop-shadow-[0_0_6px_rgba(0,243,255,0.4)]">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 truncate tracking-tight">
            {value}
          </p>
          {subtext && <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>}
          {trendValue && (
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${trendColor}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 rounded-xl shadow-lg ml-3 flex-shrink-0 backdrop-blur-md group-hover:border-pink-500/60 transition">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
