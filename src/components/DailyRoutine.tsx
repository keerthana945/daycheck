import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, RotateCcw, X, Clock3, Clock } from 'lucide-react';
import { formatTime12h } from '../data/sampleData';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { PageCoverHeader } from './EditorialCovers';
import type { RoutineCategory, RoutineItem } from '../types';

interface DailyRoutineProps {
  routine: RoutineItem[];
  onAddRoutine: (input: Omit<RoutineItem, 'id' | 'completed'>) => void;
  onUpdateRoutine: (id: string, updates: Partial<Omit<RoutineItem, 'id'>>) => void;
  onToggleRoutine: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
  onClearCheckmarks: () => void;
  onResetDefaultRoutine: () => void;
}

const ROUTINE_CATEGORIES: RoutineCategory[] = [
  'Morning',
  'Study',
  'Career',
  'Home',
  'Wellness',
  'Evening',
];

export function DailyRoutine({
  routine,
  onAddRoutine,
  onUpdateRoutine,
  onToggleRoutine,
  onDeleteRoutine,
  onClearCheckmarks,
  onResetDefaultRoutine,
}: DailyRoutineProps) {
  const { companion } = useCompanionStore();
  const [quickTime, setQuickTime] = useState('14:00');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState<RoutineCategory>('Study');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('Study');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const sortedRoutine = useMemo(
    () => [...routine].sort((a, b) => a.time.localeCompare(b.time)),
    [routine],
  );

  const nextBlockId = useMemo(
    () => sortedRoutine.find((r) => !r.completed)?.id ?? null,
    [sortedRoutine],
  );

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
        eyebrow="chronological flow"
        title="daily routine"
        subtitle="Your editable daily timetable. Tap any block to check it off, or adjust times to fit your rhythm."
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
              onClick={onResetDefaultRoutine}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Default Routine</span>
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
          className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add an activity to your timetable..."
          aria-label="New routine activity"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        />
        <select
          value={quickCat}
          onChange={(e) => setQuickCat(e.target.value as RoutineCategory)}
          aria-label="Activity category"
          className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Progress Line */}
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

      {/* Editorial Timeline Timetable */}
      <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-6 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none">
        {sortedRoutine.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-11 h-11 rounded-2xl bg-[#FAF3F1] dark:bg-[#262320] border border-[#EAD9D8] dark:border-[#493E33] flex items-center justify-center text-[#800020] dark:text-[#D4A85E]">
              <Clock3 className="w-5 h-5" />
            </div>
            <h2 className="mt-3 text-base font-medium text-[#292522] dark:text-[#F3EFEA]">Timetable is empty</h2>
            <p className="mt-1 text-sm text-[#6E6359] dark:text-[#A69E94]">
              Add activities above or restore the default 9:00 AM – 10:30 PM routine.
            </p>
            <button
              type="button"
              onClick={onResetDefaultRoutine}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
            >
              Restore Default Routine
            </button>
          </div>
        ) : (
          <div>
            {sortedRoutine.map((item, idx) => {
              const isUpNext = item.id === nextBlockId;
              const isLast = idx === sortedRoutine.length - 1;
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
                          <span className="text-xs font-medium text-[#800020] dark:text-[#D4A85E]">· up next</span>
                        )}
                      </div>
                      {(item.notes || item.category) && (
                        <p
                          className={`mt-0.5 sm:pl-[92px] text-xs ${
                            item.completed ? 'text-[#A69A8D] dark:text-[#6E6760]' : 'text-[#6E6359] dark:text-[#A69E94]'
                          }`}
                        >
                          <span>{item.category}</span>
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
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#292522]/35 dark:bg-black/65 backdrop-blur-[2px] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routine-modal-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="routine-modal-title" className="text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                Edit Routine Block
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

              <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
