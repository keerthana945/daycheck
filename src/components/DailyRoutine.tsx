import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Sparkles, Clock3, Clock } from 'lucide-react';
import { formatTime12h, getCurrentTimeHHMM } from '../data/sampleData';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { ConfirmModal } from './ConfirmModal';
import { PageCoverHeader } from './EditorialCovers';
import { ModalShell } from './ModalShell';
import type { RoutineCategory, RoutineItem } from '../types';

interface DailyRoutineProps {
  routine: RoutineItem[];
  onAddRoutine: (input: Omit<RoutineItem, 'id' | 'completed'>) => void;
  onUpdateRoutine: (id: string, updates: Partial<Omit<RoutineItem, 'id'>>) => void;
  onToggleRoutine: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
  onClearCheckmarks: () => void;
  onLoadStarterRoutine: () => void;
}

const ROUTINE_CATEGORIES: RoutineCategory[] = [
  'Morning',
  'Study',
  'Career',
  'Home',
  'Wellness',
  'Evening',
];

function computeDurationLabel(startHHMM: string, nextHHMM?: string): string | null {
  if (!startHHMM || !nextHHMM) return null;
  const [h1, m1] = startHHMM.split(':').map(Number);
  const [h2, m2] = nextHHMM.split(':').map(Number);
  if ([h1, m1, h2, m2].some(Number.isNaN)) return null;
  const diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff <= 0 || diff > 720) return null;
  if (diff < 60) return `${diff}m`;
  const hrs = Math.floor(diff / 60);
  const rem = diff % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

export function DailyRoutine({
  routine,
  onAddRoutine,
  onUpdateRoutine,
  onToggleRoutine,
  onDeleteRoutine,
  onClearCheckmarks,
  onLoadStarterRoutine,
}: DailyRoutineProps) {
  const { companion } = useCompanionStore();
  const [quickTime, setQuickTime] = useState('09:00');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState<RoutineCategory>('Morning');

  const [confirmTemplateOpen, setConfirmTemplateOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('Morning');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const sortedRoutine = useMemo(
    () => [...routine].sort((a, b) => a.time.localeCompare(b.time)),
    [routine],
  );

  // Real-time Up Next calculation comparing against current clock time
  const nextBlockId = useMemo(() => {
    const nowHHMM = getCurrentTimeHHMM();
    const upcomingIncomplete = sortedRoutine.find((r) => !r.completed && r.time >= nowHHMM);
    return (upcomingIncomplete ?? sortedRoutine.find((r) => !r.completed))?.id ?? null;
  }, [sortedRoutine]);

  const completedCount = routine.filter((r) => r.completed).length;
  const pct = routine.length === 0 ? 0 : Math.round((completedCount / routine.length) * 100);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickTime) return;
    onAddRoutine({
      time: quickTime,
      title: quickTitle.trim(),
      category: quickCat,
    });
    setQuickTitle('');
  };

  const handleStarterTemplateRequest = () => {
    if (routine.length > 0) {
      setConfirmTemplateOpen(true);
    } else {
      onLoadStarterRoutine();
    }
  };

  const openEditModal = (item: RoutineItem) => {
    setEditingItem(item);
    setTime(item.time);
    setTitle(item.title);
    setCategory(item.category);
    setNotes(item.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter an activity name.');
      return;
    }
    if (!time) {
      setFormError('Please select a time.');
      return;
    }

    const payload = {
      time,
      title: title.trim(),
      category,
      notes: notes.trim() || undefined,
    };

    if (editingItem) {
      onUpdateRoutine(editingItem.id, payload);
    } else {
      onAddRoutine(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageCoverHeader
        mood={companion.bannerMood}
        variant="routine"
        eyebrow="chronological flow"
        title="daily routine"
        subtitle="Build your personal rhythm block by block. Checkmarks automatically reset fresh every new morning."
        icon={<Clock className="w-6 h-6" />}
        actions={
          <>
            <button
              type="button"
              onClick={onClearCheckmarks}
              disabled={completedCount === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0] dark:bg-[#161616] text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap"
            >
              Uncheck All
            </button>
            <button
              type="button"
              onClick={handleStarterTemplateRequest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Starter Template</span>
            </button>
          </>
        }
      />

      {/* Inline Quick-Add Routine Activity */}
      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="time"
          value={quickTime}
          onChange={(e) => setQuickTime(e.target.value)}
          aria-label="Activity time"
          className="min-h-[42px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a routine block (e.g., Morning walk, Deep study)..."
          aria-label="New routine activity"
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        />
        <div className="flex items-center gap-2">
          <select
            value={quickCat}
            onChange={(e) => setQuickCat(e.target.value as RoutineCategory)}
            aria-label="Activity category"
            className="flex-1 sm:flex-none min-h-[42px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          >
            {ROUTINE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Progress Line */}
      {routine.length > 0 && (
        <div className="flex items-center gap-3.5 px-1">
          <div className="w-full max-w-xs h-2 rounded-full bg-[#EAE2D6] dark:bg-[#2A2825] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B5853B] dark:bg-[#C89B54] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#6E6359] dark:text-[#A69E94] tabular-nums">
            {completedCount}/{routine.length} completed ({pct}%)
          </span>
        </div>
      )}

      {/* Editorial Timeline Timetable */}
      <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-6 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none">
        {sortedRoutine.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FAF3F1] dark:bg-[#262320] border border-[#EAD9D8] dark:border-[#493E33] flex items-center justify-center text-[#800020] dark:text-[#D4A85E]">
              <Clock3 className="w-5 h-5" />
            </div>
            <h2 className="mt-3.5 font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
              Design your ideal daily flow
            </h2>
            <p className="mt-1.5 text-sm text-[#6E6359] dark:text-[#A69E94] max-w-md mx-auto">
              Add your first morning, work, or wind-down block above, or start from a gentle 7-block template and customize it.
            </p>
            <button
              type="button"
              onClick={onLoadStarterRoutine}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Gentle Starter Routine</span>
            </button>
          </div>
        ) : (
          <div>
            {sortedRoutine.map((item, idx) => {
              const isUpNext = item.id === nextBlockId;
              const isLast = idx === sortedRoutine.length - 1;
              const duration = computeDurationLabel(item.time, sortedRoutine[idx + 1]?.time);
              return (
                <div
                  key={item.id}
                  className={`relative flex items-start justify-between gap-3 rounded-2xl px-3 py-3 transition-colors ${
                    isUpNext
                      ? 'bg-[#FAF3F1]/85 dark:bg-[#26211E] border border-[#EAD9D8] dark:border-[#C89B54]/35'
                      : 'hover:bg-[#F8F5F0]/75 dark:hover:bg-[#262523]'
                  }`}
                >
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[21px] top-9 -bottom-2 w-px bg-[#E6DFD5] dark:bg-[#2E2C29]"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleRoutine(item.id)}
                    className="flex items-start gap-3.5 min-w-0 flex-1 text-left group"
                  >
                    <span
                      className={`relative z-10 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        item.completed
                          ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                          : isUpNext
                            ? 'border-[#800020] dark:border-[#D4A85E] bg-[#FFFDF9] dark:bg-[#161616] ring-3 ring-[#800020]/10 dark:ring-[#D4A85E]/15'
                            : 'border-[#CFC5B8] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#161616] group-hover:border-[#800020] dark:group-hover:border-[#D4A85E]'
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span
                          className={`font-mono text-xs sm:text-sm font-medium w-20 shrink-0 tabular-nums ${
                            item.completed ? 'text-[#8C8278] dark:text-[#7D766E]' : 'text-[#800020] dark:text-[#D4A85E]'
                          }`}
                        >
                          {formatTime12h(item.time)}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-medium ${
                            item.completed ? 'line-through text-[#8C8278] dark:text-[#7D766E]' : 'text-[#292522] dark:text-[#F3EFEA]'
                          }`}
                        >
                          {item.title}
                        </span>
                        {isUpNext && (
                          <span className="text-xs font-medium text-[#800020] dark:text-[#D4A85E]">
                            · up next
                          </span>
                        )}
                      </div>
                      {(item.notes || item.category || duration) && (
                        <p
                          className={`mt-0.5 sm:pl-[92px] text-xs ${
                            item.completed ? 'text-[#A69A8D] dark:text-[#6E6760]' : 'text-[#6E6359] dark:text-[#A69E94]'
                          }`}
                        >
                          <span>{item.category}</span>
                          {duration && (
                            <>
                              <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                              <span className="font-mono">{duration}</span>
                            </>
                          )}
                          {item.notes && (
                            <>
                              <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                              <span>{item.notes}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      aria-label={`Edit "${item.title}"`}
                      className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoutine(item.id)}
                      aria-label={`Delete "${item.title}"`}
                      className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#E58A9B] hover:bg-[#FAF3F1] dark:hover:bg-[#291C1F] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ModalShell
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Routine Block"
        titleId="routine-modal-title"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rt-title" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
              Activity
            </label>
            <input
              id="rt-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rt-time" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                Time
              </label>
              <input
                id="rt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              />
            </div>
            <div>
              <label htmlFor="rt-cat" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                Category
              </label>
              <select
                id="rt-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as RoutineCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              >
                {ROUTINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rt-notes" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
              Notes (optional)
            </label>
            <input
              id="rt-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
            />
          </div>

          {formError && <p className="text-xs text-[#800020] dark:text-[#E58A9B]">{formError}</p>}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </ModalShell>

      <ConfirmModal
        open={confirmTemplateOpen}
        title="Replace Current Routine?"
        description="Loading the gentle starter routine will replace your existing routine blocks. Your tasks, habits, and notes will not be affected."
        confirmLabel="Load Starter Routine"
        onCancel={() => setConfirmTemplateOpen(false)}
        onConfirm={() => {
          onLoadStarterRoutine();
          setConfirmTemplateOpen(false);
        }}
      />
    </div>
  );
}
