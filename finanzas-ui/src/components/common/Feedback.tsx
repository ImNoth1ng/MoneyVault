import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Cargando HUD...' }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 border-r-pink-500 rounded-full animate-spin shadow-[0_0_20px_rgba(0,243,255,0.5)]" />
        <p className="text-xs font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]">{text}</p>
      </div>
    </div>
  );
};

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({ title = 'Error de Sistema', message, onRetry }: ErrorMessageProps) => {
  return (
    <div className="flex items-start gap-3.5 p-4 bg-rose-950/60 border border-pink-500/50 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(255,0,128,0.25)]">
      <AlertCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-pink-200 text-sm">{title}</h3>
        <p className="text-xs text-pink-300 mt-0.5 font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-bold text-pink-400 hover:text-pink-300 mt-2 underline"
          >
            Reintentar enlace
          </button>
        )}
      </div>
    </div>
  );
};

interface SuccessMessageProps {
  title?: string;
  message: string;
}

export const SuccessMessage = ({ title = 'Operación Exitosa', message }: SuccessMessageProps) => {
  return (
    <div className="flex items-start gap-3.5 p-4 bg-cyan-950/60 border border-cyan-400/50 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(0,243,255,0.25)]">
      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-cyan-200 text-sm">{title}</h3>
        <p className="text-xs text-cyan-300 mt-0.5 font-medium">{message}</p>
      </div>
    </div>
  );
};

interface InfoMessageProps {
  title?: string;
  message: string;
}

export const InfoMessage = ({ title = 'Notificación Cyber', message }: InfoMessageProps) => {
  return (
    <div className="flex items-start gap-3.5 p-4 bg-purple-950/60 border border-purple-400/50 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)]">
      <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-purple-200 text-sm">{title}</h3>
        <p className="text-xs text-purple-300 mt-0.5 font-medium">{message}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  count?: number;
}

export const Skeleton = ({ count = 1 }: SkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-900/80 border border-cyan-500/20 rounded-xl animate-pulse backdrop-blur-md" />
      ))}
    </div>
  );
};
