import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Moon, Sun } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { getOffsetDateISO, getTodayDateISO, WEEK_DAYS, getTodayWeekdayIndex } from '../data/sampleData';
import type { Task, Weekday } from '../types';

export type RitualMode = 'morning' | 'evening' | null;

interface RitualModalProps {
  mode: RitualMode;
  onClose: () => void;
  overdueTasks: Task[];
  todayTasksPending: Task[];
  completedTodayCount: number;
  habitsMetToday: number;
  totalHabits: number;
  todayFocusMinutes: number;
  existingMorningIntention?: string;
  existingEveningHighlight?: string;
  existingEveningGratitude?: string;
  onRollOverOverdueToToday: () => number;
  onMoveTasksToTomorrow: (ids: string[], tomorrowDay: Weekday, tomorrowISO: string) => void;
  onSaveMorningReset: (input: { intention: string; rolledOverCount: number }) => void;
  onSaveEveningReflection: (input: { highlight: string; gratitude: string }) => void;
  onNotify: (message: string, tone?: 'success' | 'info' | 'error') => void;
}

export function RitualModal({
  mode,
  onClose,
  overdueTasks,
  todayTasksPending,
  completedTodayCount,
  habitsMetToday,
  totalHabits,
  todayFocusMinutes,
  existingMorningIntention = '',
  existingEveningHighlight = '',
  existingEveningGratitude = '',
  onRollOverOverdueToToday,
  onMoveTasksToTomorrow,
  onSaveMorningReset,
  onSaveEveningReflection,
  onNotify,
}: RitualModalProps) {
  const [intention, setIntention] = useState(existingMorningIntention);
  const [highlight, setHighlight] = useState(existingEveningHighlight);
  const [gratitude, setGratitude] = useState(existingEveningGratitude);
  const [rolledOverCount, setRolledOverCount] = useState(0);
  const [movedTomorrowDone, setMovedTomorrowDone] = useState(false);

  useEffect(() => {
    setIntention(existingMorningIntention);
    setHighlight(existingEveningHighlight);
    setGratitude(existingEveningGratitude);
    setRolledOverCount(0);
    setMovedTomorrowDone(false);
  }, [mode, existingMorningIntention, existingEveningHighlight, existingEveningGratitude]);

  const tomorrowIdx = (getTodayWeekdayIndex() + 1) % 7;
  const tomorrowDay = WEEK_DAYS[tomorrowIdx];
  const tomorrowISO = getOffsetDateISO(1);

  const handleMorningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMorningReset({ intention, rolledOverCount });
    onNotify('Morning reset saved. Have a steady, unhurried day.', 'success');
    onClose();
  };

  const handleEveningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEveningReflection({ highlight, gratitude });
    onNotify('Evening reflection saved to your journal.', 'success');
    onClose();
  };

  return (
    <ModalShell
      open={mode !== null}
      onClose={onClose}
      title={mode === 'morning' ? 'Guided Morning Reset' : 'Evening Wind-Down'}
      subtitle={
        mode === 'morning'
          ? `Set today’s intention (${getTodayDateISO()}) and bring forward anything unfinished.`
          : 'Celebrate what you moved forward today and close the day gently.'
      }
      titleId="ritual-modal-title"
      maxWidthClass="max-w-lg"
    >
      {mode === 'morning' && (
        <form onSubmit={handleMorningSubmit} className="mt-5 space-y-5">
          <div className="rounded-2xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292522] dark:text-[#F3EFEA]">
                <Sun className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E]" />
                <span>Unfinished tasks from earlier days</span>
              </div>
              <span className="font-mono text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                {overdueTasks.length}
              </span>
            </div>

            {overdueTasks.length === 0 ? (
              <p className="text-xs text-[#6E6359] dark:text-[#A69E94] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6B53] dark:text-[#8AB896]" />
                <span>Clean slate — no overdue tasks waiting.</span>
              </p>
            ) : (
              <>
                <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                  {overdueTasks.map((t) => (
                    <li
                      key={t.id}
                      className="text-xs text-[#4F4740] dark:text-[#CFC7BE] flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="font-mono text-[11px] text-[#800020] dark:text-[#E58A9B] shrink-0">
                        {t.deadline}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    const count = onRollOverOverdueToToday();
                    setRolledOverCount(count);
                    if (count > 0) {
                      onNotify(`Moved ${count} overdue ${count === 1 ? 'task' : 'tasks'} to today.`, 'info');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#FAF3F1] dark:bg-[#2A2224] text-[#800020] dark:text-[#D4A85E] border border-[#EAD9D8] dark:border-[#493E33] hover:opacity-90 transition-opacity"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Move all to today</span>
                </button>
              </>
            )}
          </div>

          <div>
            <label
              htmlFor="morning-intention"
              className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5"
            >
              One intention for today
            </label>
            <input
              id="morning-intention"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g., Move at an unhurried pace and finish my top creative block."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA]"
            >
              Skip
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
            >
              Start My Day
            </button>
          </div>
        </form>
      )}

      {mode === 'evening' && (
        <form onSubmit={handleEveningSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-3 text-center">
              <p className="font-mono text-lg font-semibold text-[#800020] dark:text-[#D4A85E] tabular-nums">
                {completedTodayCount}
              </p>
              <p className="text-[11px] text-[#6E6359] dark:text-[#A69E94]">Tasks done</p>
            </div>
            <div className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-3 text-center">
              <p className="font-mono text-lg font-semibold text-[#4A6B53] dark:text-[#8AB896] tabular-nums">
                {habitsMetToday}/{totalHabits}
              </p>
              <p className="text-[11px] text-[#6E6359] dark:text-[#A69E94]">Habits met</p>
            </div>
            <div className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-3 text-center">
              <p className="font-mono text-lg font-semibold text-[#292522] dark:text-[#F3EFEA] tabular-nums">
                {todayFocusMinutes}m
              </p>
              <p className="text-[11px] text-[#6E6359] dark:text-[#A69E94]">Focused</p>
            </div>
          </div>

          <div>
            <label
              htmlFor="evening-win"
              className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5"
            >
              One win or steady step today
            </label>
            <input
              id="evening-win"
              type="text"
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder="What felt meaningful or moved forward today?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="evening-gratitude"
              className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5"
            >
              One quiet gratitude
            </label>
            <input
              id="evening-gratitude"
              type="text"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Something small you appreciated today..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
            />
          </div>

          {todayTasksPending.length > 0 && !movedTomorrowDone && (
            <div className="rounded-2xl bg-[#FAF3F1] dark:bg-[#241E20] border border-[#EAD9D8] dark:border-[#3D2E32] p-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#4F4740] dark:text-[#D5CFC7]">
                {todayTasksPending.length} remaining {todayTasksPending.length === 1 ? 'task' : 'tasks'} today
              </span>
              <button
                type="button"
                onClick={() => {
                  onMoveTasksToTomorrow(
                    todayTasksPending.map((t) => t.id),
                    tomorrowDay,
                    tomorrowISO,
                  );
                  setMovedTomorrowDone(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#EAD9D8] dark:border-[#493E33] text-[#800020] dark:text-[#D4A85E]"
              >
                <Moon className="w-3 h-3" />
                <span>Roll over to {tomorrowDay}</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
            >
              Save Reflection
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
