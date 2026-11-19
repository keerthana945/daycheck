import { useMemo, useState } from 'react';
import { ArrowRight, Check, Plus, RefreshCw, X } from 'lucide-react';
import {
  MOTIVATIONAL_QUOTES,
  formatTime12h,
  getTodayDateISO,
  getTodayWeekday,
} from '../data/sampleData';
import type { AppTab, Habit, RoutineItem, Task } from '../types';

interface DashboardProps {
  tasks: Task[];
  routine: RoutineItem[];
  habits: Habit[];
  showGuide: boolean;
  onDismissGuide: () => void;
  onQuickAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onToggleRoutine: (id: string) => void;
  onNavigate: (tab: AppTab) => void;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({
  tasks,
  routine,
  habits,
  showGuide,
  onDismissGuide,
  onQuickAddTask,
  onToggleTask,
  onToggleRoutine,
  onNavigate,
}: DashboardProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const todayDay = getTodayWeekday();
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.day === todayDay)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.time || '99:99').localeCompare(b.time || '99:99');
        }),
    [tasks, todayDay],
  );

  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTasks = todayTasks.length - completedTasks;

  const sortedRoutine = useMemo(
    () => [...routine].sort((a, b) => a.time.localeCompare(b.time)),
    [routine],
  );
  const completedRoutine = routine.filter((r) => r.completed).length;
  const nextRoutineItem = sortedRoutine.find((r) => !r.completed) || null;
  const previewRoutine = useMemo(() => {
    const pending = sortedRoutine.filter((r) => !r.completed);
    return (pending.length > 0 ? pending : sortedRoutine).slice(0, 5);
  }, [sortedRoutine]);

  const totalItems = todayTasks.length + routine.length;
  const completedItems = completedTasks + completedRoutine;
  const progressPct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const habitsMetToday = habits.filter((h) => h.todayValue >= h.targetValue).length;

  const quote = MOTIVATIONAL_QUOTES[quoteIdx % MOTIVATIONAL_QUOTES.length];

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onQuickAddTask({
      title: quickTaskTitle.trim(),
      time: '10:00',
      deadline: getTodayDateISO(),
      priority: 'Medium',
      category: 'Personal',
      day: todayDay,
    });
    setQuickTaskTitle('');
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#6D1D2C]">{formattedDate}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-[#1F1A17] text-balance">
            {getTimeGreeting()}.
          </h1>
          <p className="mt-1 text-sm text-[#5C534D]">
            {nextRoutineItem
              ? `Up next in your routine: ${nextRoutineItem.title} at ${formatTime12h(nextRoutineItem.time)}.`
              : 'All routine blocks for today are complete.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('routine')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <span>View Full Routine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dismissible Quick Guide */}
      {showGuide && (
        <section
          aria-label="How My Day works"
          className="rounded-2xl bg-[#F2ECE3] border border-[#E6DDD0] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#1F1A17]">
                How My Day works
              </h2>
              <p className="mt-0.5 text-xs text-[#5C534D]">
                Everything saves automatically in your browser—just tap to check off or type to add.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissGuide}
              aria-label="Dismiss guide"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#5C534D] hover:text-[#1F1A17] hover:bg-[#E7DDD0] transition-colors shrink-0"
            >
              <span>Got it</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <button
              type="button"
              onClick={() => onNavigate('routine')}
              className="text-left rounded-xl bg-white/85 border border-[#E6DDD0] p-4 hover:border-[#6D1D2C]/50 transition-colors"
            >
              <p className="text-xs font-semibold text-[#6D1D2C]">1. Follow your Routine</p>
              <p className="mt-1 text-xs text-[#4A433E] leading-relaxed">
                Tap any block in your 9 AM – 10:30 PM timetable to mark it done or edit the time.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('todos')}
              className="text-left rounded-xl bg-white/85 border border-[#E6DDD0] p-4 hover:border-[#6D1D2C]/50 transition-colors"
            >
              <p className="text-xs font-semibold text-[#6D1D2C]">2. Add To-Dos Anywhere</p>
              <p className="mt-1 text-xs text-[#4A433E] leading-relaxed">
                Tasks you add here or in To-Do List automatically appear in your Weekly Planner.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('habits')}
              className="text-left rounded-xl bg-white/85 border border-[#E6DDD0] p-4 hover:border-[#6D1D2C]/50 transition-colors"
            >
              <p className="text-xs font-semibold text-[#6D1D2C]">3. Track 5 Daily Habits</p>
              <p className="mt-1 text-xs text-[#4A433E] leading-relaxed">
                Tap + or Done on Water, Exercise, Studying, Reading, and English Practice.
              </p>
            </button>
          </div>
        </section>
      )}

      {/* Unified Today Summary & Progress */}
      <section
        aria-label="Daily progress summary"
        className="rounded-2xl bg-white border border-[#E6DDD0] p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1F1A17]">Today&apos;s Progress</p>
            <p className="mt-0.5 text-xs text-[#5C534D] tabular-nums">
              {completedTasks} of {todayTasks.length} tasks done ({pendingTasks} left) ·{' '}
              {completedRoutine} of {routine.length} routine blocks · {habitsMetToday}/
              {habits.length} habits reached
            </p>
          </div>
          <span className="font-mono text-2xl font-medium text-[#6D1D2C] tabular-nums">
            {progressPct}%
          </span>
        </div>

        <div className="mt-4 h-2.5 w-full rounded-full bg-[#F2ECE3] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#6D1D2C] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      {/* Two Calm Columns: Today's Schedule + Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Today's Routine */}
        <section
          aria-label="Today's Schedule"
          className="rounded-2xl bg-white border border-[#E6DDD0] p-6"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EFE9E0]">
            <h2 className="text-lg font-semibold text-[#1F1A17]">Today&apos;s Schedule</h2>
            <button
              type="button"
              onClick={() => onNavigate('routine')}
              className="text-xs font-medium text-[#6D1D2C] hover:underline whitespace-nowrap"
            >
              Customize
            </button>
          </div>

          {previewRoutine.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5C534D]">
              No routine blocks yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F2ECE3]">
              {previewRoutine.map((item) => {
                const isUpNext = nextRoutineItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleRoutine(item.id)}
                    className={`w-full py-3.5 flex items-center gap-3.5 text-left group transition-opacity ${
                      item.completed ? 'opacity-55' : ''
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        item.completed
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                          : 'border-[#CFC5B8] bg-white group-hover:border-[#6D1D2C]'
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-mono text-xs text-[#6D1D2C] w-16 shrink-0 tabular-nums">
                      {formatTime12h(item.time)}
                    </span>
                    <span
                      className={`text-sm font-medium truncate flex-1 ${
                        item.completed ? 'line-through text-[#5C534D]' : 'text-[#1F1A17]'
                      }`}
                    >
                      {item.title}
                    </span>
                    {isUpNext && (
                      <span className="text-[11px] font-medium text-[#6D1D2C] shrink-0">
                        Up next
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Today's Tasks with Instant Quick-Add */}
        <section
          aria-label="Today's Tasks"
          className="rounded-2xl bg-white border border-[#E6DDD0] p-6"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EFE9E0]">
            <h2 className="text-lg font-semibold text-[#1F1A17]">
              Today&apos;s To-Dos ({todayDay})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('todos')}
              className="text-xs font-medium text-[#6D1D2C] hover:underline whitespace-nowrap"
            >
              See All
            </button>
          </div>

          <form onSubmit={handleQuickTaskSubmit} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Quick add a task for today..."
              aria-label="Quick add task for today"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#7D736B] focus:outline-none focus:border-[#6D1D2C]"
            />
            <button
              type="submit"
              disabled={!quickTaskTitle.trim()}
              aria-label="Add quick task"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] disabled:opacity-45 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {todayTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#5C534D]">
              No tasks for {todayDay} yet. Type above to add one!
            </p>
          ) : (
            <div className="mt-2 divide-y divide-[#F2ECE3]">
              {todayTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`w-full py-3.5 flex items-start gap-3.5 text-left group transition-opacity ${
                    task.completed ? 'opacity-55' : ''
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      task.completed
                        ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                        : 'border-[#CFC5B8] bg-white group-hover:border-[#6D1D2C]'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed ? 'line-through text-[#5C534D]' : 'text-[#1F1A17]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[#5C534D] tabular-nums">
                      {formatTime12h(task.time)} · {task.category} · {task.priority}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Calm Quote Footer Card */}
      <section
        aria-label="Daily quote"
        className="rounded-2xl bg-[#F2ECE3] border border-[#E6DDD0] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <p className="font-display text-base sm:text-lg text-[#1F1A17] leading-relaxed">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-1 text-xs text-[#5C534D]">— {quote.author}</p>
        </div>
        <button
          type="button"
          onClick={() => setQuoteIdx((prev) => prev + 1)}
          aria-label="Show another motivational quote"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5C534D] bg-white/80 border border-[#E6DDD0] hover:text-[#1F1A17] transition-colors shrink-0 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New quote</span>
        </button>
      </section>
    </div>
  );
}
