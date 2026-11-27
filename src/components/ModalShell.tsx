import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  titleId: string;
  children: ReactNode;
}

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  titleId,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#292522]/40 dark:bg-black/70 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-xl font-semibold text-[#292522] dark:text-[#F3EFEA]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#6E6359] dark:text-[#A69E94]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 -mr-1 rounded-xl text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
