import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#292522]/40 dark:bg-black/70 backdrop-blur-[2px] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-6 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF3F1] dark:bg-[#2B2023] border border-[#EAD9D8] dark:border-[#493238] flex items-center justify-center shrink-0 text-[#800020] dark:text-[#E58A9B]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="confirm-modal-title"
              className="font-display text-lg font-semibold text-[#292522] dark:text-[#F3EFEA]"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-[#6E6359] dark:text-[#A69E94] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
