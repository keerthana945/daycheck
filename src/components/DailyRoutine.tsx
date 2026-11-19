import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, RotateCcw, X, Clock3 } from 'lucide-react';
import { formatTime12h } from '../data/sampleData';
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1F1A17] text-balance">
            Daily Routine
          </h1>
          <p className="mt-1 text-sm text-[#6B625B]">
            Your editable daily timetable. Tap any row to check it off, or customize times to fit your day.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearCheckmarks}
            disabled={completedCount === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DDD0] bg-white text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap"
          >
            Uncheck All
          </button>
          <button
            type="button"
            onClick={onResetDefaultRoutine}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DDD0] bg-white text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Default Routine</span>
          </button>
        </div>
      </div>

      {/* Inline Quick-Add Routine Activity */}
      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl bg-white border border-[#E6DDD0] p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="time"
          value={quickTime}
          onChange={(e) => setQuickTime(e.target.value)}
          aria-label="Activity time"
          className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
        />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add an activity to your timetable..."
          aria-label="New routine activity"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#9A9086] focus:outline-none focus:border-[#6D1D2C]"
        />
        <select
          value={quickCat}
          onChange={(e) => setQuickCat(e.target.value as RoutineCategory)}
          aria-label="Activity category"
          className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] disabled:opacity-45 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Progress Line */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-full max-w-xs h-2 rounded-full bg-[#E6DDD0] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#6D1D2C] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-mono text-[#6B625B] tabular-nums">
          {completedCount}/{routine.length} completed ({pct}%)
        </span>
      </div>

      {/* Timetable */}
      <div className="rounded-2xl bg-white border border-[#E6DDD0] divide-y divide-[#F2ECE3] overflow-hidden">
        {sortedRoutine.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-[#F2ECE3] flex items-center justify-center text-[#6D1D2C]">
              <Clock3 className="w-5 h-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-[#1F1A17]">Timetable is empty</h2>
            <p className="mt-1 text-sm text-[#6B625B]">
              Add activities above or restore the default 9:00 AM – 10:30 PM routine.
            </p>
            <button
              type="button"
              onClick={onResetDefaultRoutine}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] transition-colors"
            >
              Restore Default Routine
            </button>
          </div>
        ) : (
          sortedRoutine.map((item) => {
            const isUpNext = item.id === nextBlockId;
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors ${
                  isUpNext ? 'bg-[#FAF7F2]' : 'hover:bg-[#FAF7F2]/60'
                } ${item.completed ? 'opacity-55' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => onToggleRoutine(item.id)}
                  className="flex items-start gap-3.5 min-w-0 flex-1 text-left group"
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      item.completed
                        ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                        : 'border-[#CFC5B8] bg-white group-hover:border-[#6D1D2C]'
                    }`}
                  >
                    {item.completed && <Check className="w-3.5 h-3.5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="font-mono text-sm font-medium text-[#6D1D2C] w-20 shrink-0 tabular-nums">
                        {formatTime12h(item.time)}
                      </span>
                      <span
                        className={`text-sm sm:text-base font-medium ${
                          item.completed ? 'line-through text-[#6B625B]' : 'text-[#1F1A17]'
                        }`}
                      >
                        {item.title}
                      </span>
                      {isUpNext && (
                        <span className="text-xs font-medium text-[#6D1D2C]">· Up next</span>
                      )}
                    </div>
                    {(item.notes || item.category) && (
                      <p className="mt-0.5 sm:pl-23 text-xs text-[#6B625B]">
                        <span>{item.category}</span>
                        {item.notes && (
                          <>
                            <span aria-hidden="true"> · </span>
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
                    className="p-2 rounded-lg text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRoutine(item.id)}
                    aria-label={`Delete "${item.title}"`}
                    className="p-2 rounded-lg text-[#6B625B] hover:text-[#991B1B] hover:bg-[#F7ECEE] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1A17]/35 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routine-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E6DDD0] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <h2 id="routine-modal-title" className="text-lg font-semibold text-[#1F1A17]">
                Edit Routine Block
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label htmlFor="rt-title" className="block text-xs font-medium text-[#4A433E] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rt-time" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Time
                  </label>
                  <input
                    id="rt-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  />
                </div>
                <div>
                  <label htmlFor="rt-cat" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Category
                  </label>
                  <select
                    id="rt-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RoutineCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
                <label htmlFor="rt-notes" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                  Notes (optional)
                </label>
                <input
                  id="rt-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                />
              </div>

              {formError && <p className="text-xs text-[#991B1B]">{formError}</p>}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DDD0] text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] transition-colors"
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
