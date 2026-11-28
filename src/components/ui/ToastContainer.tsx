import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ToastMessage } from '../../types/exam';

const iconMap: Record<ToastMessage['variant'], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-[#648BFF] shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 bg-[#151F30] border border-white/[0.1] rounded-xl shadow-[0_12px_36px_rgba(3,7,18,0.6)]"
        >
          <div className="mt-0.5">{iconMap[toast.variant]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F5FC]">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-[#9AA8BD] leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="p-1 rounded-md text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
