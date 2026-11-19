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
            ? 'text-[#800020] dark:text-[#E58A9B]'
            : toast.tone === 'info'
              ? 'text-[#6E6359] dark:text-[#B5A89C]'
              : 'text-[#4A6B53] dark:text-[#8AB896]';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E8E1D7] dark:border-[#2E2C29] px-4 py-3 shadow-[0_6px_20px_rgba(41,37,34,0.08)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.45)] text-sm text-[#292522] dark:text-[#F3EFEA] transition-all duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
