import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import type { ToastItem } from '../types';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'error'
            ? AlertCircle
            : toast.tone === 'info'
              ? Info
              : CheckCircle2;
        const iconColor =
          toast.tone === 'error'
            ? 'text-[#991B1B]'
            : toast.tone === 'info'
              ? 'text-[#6B625B]'
              : 'text-[#2D6A4F]';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl bg-white border border-[#E5DDD2] px-4 py-3 shadow-sm text-sm text-[#1F1A17] transition-all duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
