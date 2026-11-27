import { useMemo, useState } from 'react';
import {
  Plus,
  Check,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import {
  WEEK_DAYS,
  formatTime12h,
  getDateForWeekday,
  getTodayDateISO,
  getTodayWeekday,
} from '../data/sampleData';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { PageCoverHeader } from './EditorialCovers';
import type { Task, Weekday } from '../types';

interface WeeklyPlannerProps {
  tasks: Task[];
  focusCategories: string[];
  onAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onMoveTaskToDay: (id: string, day: Weekday, deadline?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function WeeklyPlanner({
  tasks,
  focusCategories,
  onAddTask,
  onMoveTaskToDay,
  onToggleTask,
  onDeleteTask,
}: WeeklyPlannerProps) {
  const { companion } = useCompanionStore();
  const { startTaskFocus } = useFocusTimer();

  const todayISO = getTodayDateISO();
  const todayDay = getTodayWeekday();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayFilter, setSelectedDayFilter] = useState<'All' | Weekday>('All');
  const [draftByDay, setDraftByDay] = useState<Record<Weekday, string>>({
    Mon: '',
    Tue: '',
    Wed: '',
    Thu: '',
    Fri: '',
    Sat: '',
    Sun: '',
  });

  const defaultCat = focusCategories[0] || 'Personal';

  const weeklyStats = useMemo(() => {
    const byDay = WEEK_DAYS.map((day) => {
      const targetDate = getDateForWeekday(day, weekOffset);
      // Match tasks either assigned to that exact date OR, for current week, legacy tasks matching weekday inside the current week range
      const weekStart = getDateForWeekday('Mon', 0);
      const weekEnd = getDateForWeekday('Sun', 0);

      const dayTasks = tasks
        .filter((t) => {
          if (t.deadline === targetDate) return true;
          if (weekOffset === 0 && t.day === day) {
            if (!t.deadline) return true;
            return t.deadline >= weekStart && t.deadline <= weekEnd;
          }
          return false;
        })
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

      const done = dayTasks.filter((t) => t.completed).length;
      return {
        day,
        date: targetDate,
        isToday: targetDate === todayISO,
        tasks: dayTasks,
        done,
        total: dayTasks.length,
        pct: dayTasks.length === 0 ? 0 : Math.round((done / dayTasks.length) * 100),
      };
    });

    const total = byDay.reduce((s, d) => s + d.total, 0);
    const completed = byDay.reduce((s, d) => s + d.done, 0);
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, pending, rate, byDay };
  }, [tasks, weekOffset, todayISO]);

  const weekRangeLabel = useMemo(() => {
    const mon = getDateForWeekday('Mon', weekOffset);
    const sun = getDateForWeekday('Sun', weekOffset);
    const fmt = (iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    return `${fmt(mon)} – ${fmt(sun)}`;
  }, [weekOffset]);

  // Balanced layout when viewing all 7 days: spotlight card (today when viewing current week, otherwise Mon) + 6 cards in 3x2 grid
  const spotlightDay =
    selectedDayFilter === 'All'
      ? weeklyStats.byDay.find((d) => d.isToday) ?? weeklyStats.byDay[0]
      : null;

  const remainingDays =
    selectedDayFilter === 'All' && spotlightDay
      ? weeklyStats.byDay.filter((d) => d.day !== spotlightDay.day)
      : weeklyStats.byDay.filter((d) => d.day === selectedDayFilter);

  const handleInlineAdd = (day: Weekday, targetDate: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (draftByDay[day] || '').trim();
    if (!text) return;
    onAddTask({
      title: text,
      time: '10:00',
      deadline: targetDate,
      priority: 'Medium',
      category: defaultCat,
      day,
    });
    setDraftByDay((prev) => ({ ...prev, [day]: '' }));
  };

  const renderDayCard = (col: (typeof weeklyStats.byDay)[number], featured = false) => {
    const draft = draftByDay[col.day] || '';
    const prettyDate = new Date(`${col.date}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return (
      <section
        key={col.day}
        aria-label={`${col.day} tasks`}
        className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none ${
          col.isToday
            ? 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#800020] dark:border-[#C89B54] ring-1 ring-[#800020]/15 dark:ring-[#C89B54]/20'
            : 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#E6DFD5] dark:border-[#2E2C29]'
        }`}
      >
        <div>
          <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#EFE9E0] dark:border-[#2A2825]">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                {col.day}
              </h2>
              {col.isToday && (
                <span className="text-xs font-medium text-[#800020] dark:text-[#D4A85E]">
                  · today
                </span>
              )}
              {featured && (
                <span className="text-xs text-[#6E6359] dark:text-[#A69E94]">
                  · featured focus day
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-[#6E6359] dark:text-[#A69E94] tabular-nums">
              {col.done}/{col.total} · {prettyDate}
            </span>
          </div>

          <div className="mt-2.5 h-1 w-full rounded-full bg-[#EFE9E0] dark:bg-[#2A2825] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B5853B] dark:bg-[#C89B54] transition-all duration-300"
              style={{ width: `${col.pct}%` }}
            />
          </div>

          <div className={`mt-3 ${featured ? 'grid grid-cols-1 md:grid-cols-2 gap-2' : 'space-y-2'}`}>
            {col.tasks.length === 0 ? (
              <p className={`py-5 text-xs text-[#8C8278] dark:text-[#78716A] text-center ${featured ? 'md:col-span-2' : ''}`}>
                Open day — add an intention below
              </p>
            ) : (
              col.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                    task.completed
                      ? 'bg-[#F8F5F0]/55 dark:bg-[#161616]/60 border-[#EAE3D9] dark:border-[#262422]'
                      : 'bg-[#F8F5F0] dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2A2825] hover:border-[#CBBFB2] dark:hover:border-[#49443E]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-start gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <span
                      className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                          : 'border-[#CFC5B8] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#1E1E1E]'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          task.completed ? 'line-through text-[#8C8278] dark:text-[#7D766E]' : 'text-[#292522] dark:text-[#F3EFEA]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-mono tabular-nums ${
                          task.completed ? 'text-[#A69A8D] dark:text-[#6E6760]' : 'text-[#6E6359] dark:text-[#A69E94]'
                        }`}
                      >
                        {formatTime12h(task.time)} · {task.category}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => startTaskFocus(task.id, task.title)}
                        aria-label={`Focus on "${task.title}"`}
                        title="Start 25m focus"
                        className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#D4A85E]"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    <select
                      value={col.day}
                      onChange={(e) => {
                        const target = e.target.value as Weekday;
                        onMoveTaskToDay(task.id, target, getDateForWeekday(target, weekOffset));
                      }}
                      aria-label={`Move "${task.title}" to another day`}
                      className="px-1 py-1 rounded-md bg-transparent text-[11px] font-mono text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] focus:outline-none"
                    >
                      {WEEK_DAYS.map((d) => (
                        <option key={d} value={d} className="bg-[#FFFDF9] dark:bg-[#1E1E1E]">
                          {d}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#E58A9B]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instant Inline Quick-Add */}
        <form onSubmit={(e) => handleInlineAdd(col.day, col.date, e)} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) =>
              setDraftByDay((prev) => ({ ...prev, [col.day]: e.target.value }))
            }
            placeholder={`Add task for ${col.day}...`}
            aria-label={`Add task for ${col.day}`}
            className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label={`Save task for ${col.day}`}
            className="min-h-[38px] p-2.5 rounded-xl bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <PageCoverHeader
        mood={companion.bannerMood}
        variant="weekly"
        eyebrow="seven-day overview"
        title="weekly planner"
        subtitle="Plan across weeks effortlessly. Add tasks directly under any day or move tasks across days anytime."
        icon={<CalendarDays className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-1.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-1">
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Previous week"
              className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#FFFDF9] dark:hover:bg-[#262523]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:bg-[#FFFDF9] dark:hover:bg-[#262523] whitespace-nowrap tabular-nums"
            >
              {weekOffset === 0 ? `This Week · ${weekRangeLabel}` : weekRangeLabel}
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Next week"
              className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#FFFDF9] dark:hover:bg-[#262523]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Weekly Completion Summary */}
      <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-5 sm:p-6 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">
            {weekOffset === 0 ? 'This Week’s Rhythm' : `Week of ${weekRangeLabel}`}
          </p>
          <div className="mt-1.5 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold text-[#800020] dark:text-[#D4A85E] tabular-nums">
              {weeklyStats.rate}%
            </span>
            <span className="text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
              {weeklyStats.completed} completed · {weeklyStats.pending} pending
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2.5 flex-1 max-w-md">
          {weeklyStats.byDay.map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() =>
                setSelectedDayFilter((prev) => (prev === d.day ? 'All' : d.day))
              }
              className="flex flex-col items-center gap-1.5 group"
              title={`Filter ${d.day}: ${d.done}/${d.total} completed`}
            >
              <div className="w-full h-14 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] flex items-end overflow-hidden">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    d.isToday
                      ? 'bg-[#800020] dark:bg-[#C89B54]'
                      : 'bg-[#B5853B]/75 dark:bg-[#8AB896]/75'
                  }`}
                  style={{ height: d.total === 0 ? '0%' : `${Math.max(15, d.pct)}%` }}
                />
              </div>
              <span
                className={`text-[11px] ${
                  selectedDayFilter === d.day || d.isToday
                    ? 'font-semibold text-[#800020] dark:text-[#D4A85E]'
                    : 'text-[#6E6359] dark:text-[#A69E94] group-hover:text-[#292522] dark:group-hover:text-[#F3EFEA]'
                }`}
              >
                {d.day}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Day Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] w-fit">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            selectedDayFilter === 'All'
              ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
              : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
          }`}
        >
          All 7 Days
        </button>
        {WEEK_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDayFilter(d)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedDayFilter === d
                ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#800020] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
            }`}
          >
            {d}{weekOffset === 0 && d === todayDay ? ' ·' : ''}
          </button>
        ))}
      </div>

      {/* Balanced Day Cards: Featured Spotlight + 3x2 Grid */}
      {spotlightDay && renderDayCard(spotlightDay, true)}

      <div
        className={`grid gap-4 ${
          selectedDayFilter === 'All'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1 max-w-2xl'
        }`}
      >
        {remainingDays.map((col) => renderDayCard(col, false))}
      </div>
    </div>
  );
}
