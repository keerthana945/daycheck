import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { ModalShell } from './ModalShell';
import type { CompanionState } from '../hooks/useCompanionStore';
import type { MyDayState } from '../types';
import { getTodayDateISO } from '../data/sampleData';

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  state: MyDayState;
  companion: CompanionState;
  onRestore: (payload: {
    state?: Partial<MyDayState>;
    companion?: Partial<CompanionState>;
  }) => void;
  onNotify: (message: string, tone?: 'success' | 'info' | 'error') => void;
}

export function BackupModal({
  open,
  onClose,
  state,
  companion,
  onRestore,
  onNotify,
}: BackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleExport = () => {
    const bundle = {
      app: 'DayEase',
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
      companion,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayease-backup-${getTodayDateISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'ok', text: 'Backup file downloaded.' });
    onNotify('DayEase backup downloaded.', 'success');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        app?: string;
        state?: Partial<MyDayState>;
        companion?: Partial<CompanionState>;
      };

      if (!parsed || (!parsed.state && !parsed.companion)) {
        setStatusMsg({
          type: 'err',
          text: 'This JSON file does not contain DayEase backup data.',
        });
        return;
      }

      onRestore({ state: parsed.state, companion: parsed.companion });
      setStatusMsg({ type: 'ok', text: 'Backup restored successfully.' });
      onNotify('DayEase data restored from backup.', 'success');
    } catch {
      setStatusMsg({
        type: 'err',
        text: 'Could not read that file. Please choose a valid DayEase JSON backup.',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Backup & Restore"
      subtitle="Your workspace lives in this browser. Export a snapshot anytime or restore a saved file."
      titleId="backup-modal-title"
      maxWidthClass="max-w-md"
    >
      <div className="mt-5 space-y-4">
        <div className="rounded-2xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 space-y-2">
          <p className="text-xs font-medium text-[#292522] dark:text-[#F3EFEA]">
            Included in backup
          </p>
          <p className="text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
            {state.tasks.length} tasks · {state.routine.length} routine blocks · {state.habits.length} habits · {state.notes.length} notes · {companion.journalEntries.length} journal entries
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#FFFDF9] dark:bg-[#161616] text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restore JSON</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
          aria-label="Choose DayEase backup JSON file"
        />

        {statusMsg && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${
              statusMsg.type === 'ok'
                ? 'bg-[#F5F9F6] dark:bg-[#19231D] text-[#3B5743] dark:text-[#8AB896] border border-[#C5DBC9] dark:border-[#344D3D]'
                : 'bg-[#FAF3F1] dark:bg-[#291C1F] text-[#800020] dark:text-[#E58A9B] border border-[#EAD9D8] dark:border-[#493238]'
            }`}
          >
            {statusMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
