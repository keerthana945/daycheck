import { useMemo, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import {
  WEEK_DAYS,
  formatTime12h,
  getDateForWeekday,
  getTodayWeekday,
} from '../data/sampleData';
import type { Task, Weekday } from '../types';

interface WeeklyPlannerProps {
  tasks: Task[];
  onAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function WeeklyPlanner({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: WeeklyPlannerProps) {
  const todayDay = getTodayWeekday();
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

  const weeklyStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const byDay = WEEK_DAYS.map((day) => {
      const dayTasks = tasks
        .filter((t) => t.day === day)
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      const done = dayTasks.filter((t) => t.completed).length;
      return {
        day,
        date: getDateForWeekday(day),
        tasks: dayTasks,
        done,
        total: dayTasks.length,
        pct: dayTasks.length === 0 ? 0 : Math.round((done / dayTasks.length) * 100),
      };
    });

    return { total, completed, pending, rate, byDay };
  }, [tasks]);

  const visibleDays =
    selectedDayFilter === 'All'
      ? weeklyStats.byDay
      : weeklyStats.byDay.filter((d) => d.day === selectedDayFilter);

  const handleInlineAdd = (day: Weekday, e: React.FormEvent) => {
    e.preventDefault();
    const text = (draftByDay[day] || '').trim();
    if (!text) return;
    onAddTask({
      title: text,
      time: '10:00',
      deadline: getDateForWeekday(day),
      priority: 'Medium',
      category: 'Personal',
      day,
    });
    setDraftByDay((prev) => ({ ...prev, [day]: '' }));
  };

  return (
    <div className="space-y-7">
      <header className="pb-5 border-b border-[#E8E1D7]">
        <p className="text-xs font-medium tracking-wide text-[#800020]">
          Seven-Day Overview
        </p>
        <h1 className="mt-1.5 text-3xl sm:text-4xl font-medium tracking-[-0.02em] text-[#292522] text-balance">
          Weekly Planner
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6359]">
          Type directly inside any day below to add a task, or click a task to mark it complete.
        </p>
      </header>

      {/* Weekly Completion Summary */}
      <div className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-5 sm:p-7 shadow-[0_1px_4px_rgba(41,37,34,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-[#6E6359]">Weekly Completion</p>
          <div className="mt-1.5 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold text-[#800020] tabular-nums">
              {weeklyStats.rate}%
            </span>
            <span className="text-xs text-[#6E6359] tabular-nums">
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
              <div className="w-full h-14 rounded-xl bg-[#F8F5F0] border border-[#EFE9E0] flex items-end overflow-hidden">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    d.day === todayDay ? 'bg-[#800020]' : 'bg-[#4A6B53]'
                  }`}
                  style={{ height: d.total === 0 ? '0%' : `${Math.max(15, d.pct)}%` }}
                />
              </div>
              <span
                className={`text-[11px] ${
                  selectedDayFilter === d.day || d.day === todayDay
                    ? 'font-semibold text-[#800020]'
                    : 'text-[#6E6359] group-hover:text-[#292522]'
                }`}
              >
                {d.day}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Day Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] border border-[#E8E1D7] w-fit">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            selectedDayFilter === 'All'
              ? 'bg-[#FFFDF9] text-[#292522] shadow-[0_1px_2px_rgba(41,37,34,0.06)]'
              : 'text-[#6E6359] hover:text-[#292522]'
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
                ? 'bg-[#FFFDF9] text-[#800020] shadow-[0_1px_2px_rgba(41,37,34,0.06)]'
                : 'text-[#6E6359] hover:text-[#292522]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Day Cards (Monday - Sunday) */}
      <div
        className={`grid gap-4 ${
          selectedDayFilter === 'All'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1 max-w-2xl'
        }`}
      >
        {visibleDays.map((col) => {
          const isToday = col.day === todayDay;
          const draft = draftByDay[col.day] || '';
          return (
            <section
              key={col.day}
              aria-label={`${col.day} tasks`}
              className={`rounded-3xl border p-5 flex flex-col justify-between gap-4 shadow-[0_1px_3px_rgba(41,37,34,0.04)] ${
                isToday ? 'bg-[#FFFDF9] border-[#800020]' : 'bg-[#FFFDF9] border-[#E8E1D7]'
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#EFE9E0]">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-sans text-base font-semibold text-[#292522]">{col.day}</h2>
                    {isToday && <span className="text-xs font-medium text-[#800020]">· Today</span>}
                  </div>
                  <span className="text-xs font-mono text-[#6E6359] tabular-nums">
                    {col.done}/{col.total} · {col.date.slice(5)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {col.tasks.length === 0 ? (
                    <p className="py-5 text-xs text-[#8C8278] text-center">No tasks scheduled</p>
                  ) : (
                    col.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start justify-between gap-2 rounded-2xl border px-3.5 py-2.5 transition-colors ${
                          task.completed
                            ? 'bg-[#F8F5F0]/55 border-[#EFE9E0]'
                            : 'bg-[#F8F5F0] border-[#EAE3D9] hover:border-[#CBBFB2]'
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
                                ? 'bg-[#800020] border-[#800020] text-[#FFFDF9]'
                                : 'border-[#CFC5B8] bg-[#FFFDF9]'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-medium leading-snug ${
                                task.completed ? 'line-through text-[#8C8278]' : 'text-[#292522]'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p
                              className={`mt-0.5 text-[11px] font-mono tabular-nums ${
                                task.completed ? 'text-[#A69A8D]' : 'text-[#6E6359]'
                              }`}
                            >
                              {formatTime12h(task.time)} · {task.category}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete "${task.title}"`}
                          className="p-1.5 rounded-lg text-[#6E6359] hover:text-[#800020] shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Instant Inline Quick-Add */}
              <form onSubmit={(e) => handleInlineAdd(col.day, e)} className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) =>
                    setDraftByDay((prev) => ({ ...prev, [col.day]: e.target.value }))
                  }
                  placeholder={`Add task for ${col.day}...`}
                  aria-label={`Add task for ${col.day}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] text-xs text-[#292522] placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label={`Save task for ${col.day}`}
                  className="p-2 rounded-xl bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] disabled:opacity-40 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
