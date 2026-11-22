import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ToastMessage } from '../../types/exam';

const iconMap: Record<ToastMessage['variant'], React.ReactNode> = {
  info: <Info className="w-4 h-4 text-indigo-600 shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
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
          className="pointer-events-auto flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-lg"
        >
          <div className="mt-0.5">{iconMap[toast.variant]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
