import { useMemo, useState } from 'react';
import {
  Plus,
  Check,
  Pencil,
  Trash2,
  Search,
  X,
  CheckSquare,
} from 'lucide-react';
import {
  WEEK_DAYS,
  formatTime12h,
  getDateForWeekday,
  getTodayDateISO,
  getTodayWeekday,
} from '../data/sampleData';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { FocusCategoryCover, PageCoverHeader } from './EditorialCovers';
import type { Priority, Task, TaskCategory, TaskFilter, Weekday } from '../types';

interface TodoListProps {
  tasks: Task[];
  onAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
}

const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
const CATEGORIES: TaskCategory[] = ['Study', 'UX Design', 'Career', 'Personal', 'Home', 'Health'];
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const FILTERS: TaskFilter[] = ['All', 'Pending', 'Completed', 'High Priority'];

function getPriorityTextClass(priority: Priority): string {
  if (priority === 'High') return 'text-[#800020] dark:text-[#D4A85E] font-medium';
  if (priority === 'Medium') return 'text-[#5C534D] dark:text-[#CFC4B8] font-medium';
  return 'text-[#6E6359] dark:text-[#A69E94]';
}

export function TodoList({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}: TodoListProps) {
  const { companion } = useCompanionStore();
  const todayDay = getTodayWeekday();
  const [dayScope, setDayScope] = useState<'today' | 'all'>('today');
  const [filter, setFilter] = useState<TaskFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | TaskCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick-add inline bar
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickPriority, setQuickPriority] = useState<Priority>('Medium');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Study');

  // Detailed modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');
  const [deadline, setDeadline] = useState(getTodayDateISO());
  const [priority, setPriority] = useState<Priority>('Medium');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [day, setDay] = useState<Weekday>(todayDay);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const scopedTasks = useMemo(
    () => (dayScope === 'today' ? tasks.filter((t) => t.day === todayDay) : tasks),
    [tasks, dayScope, todayDay],
  );

  const completedCount = scopedTasks.filter((t) => t.completed).length;
  const totalCompletedOverall = tasks.filter((t) => t.completed).length;
  const completionPct =
    scopedTasks.length === 0 ? 0 : Math.round((completedCount / scopedTasks.length) * 100);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...scopedTasks]
      .filter((t) => {
        if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
        if (filter === 'Pending' && t.completed) return false;
        if (filter === 'Completed' && !t.completed) return false;
        if (filter === 'High Priority' && t.priority !== 'High') return false;
        if (q) {
          const hay = `${t.title} ${t.category} ${t.notes || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      });
  }, [scopedTasks, categoryFilter, filter, searchQuery]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
      title: quickTitle.trim(),
      time: quickTime,
      deadline: getTodayDateISO(),
      priority: quickPriority,
      category: quickCategory,
      day: todayDay,
    });
    setQuickTitle('');
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setTime('10:00');
    setDeadline(getTodayDateISO());
    setPriority('Medium');
    setCategory(categoryFilter === 'All' ? 'Study' : categoryFilter);
    setDay(todayDay);
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setTime(task.time);
    setDeadline(task.deadline);
    setPriority(task.priority);
    setCategory(task.category);
    setDay(task.day);
    setNotes(task.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Please enter a task title.');
      return;
    }

    const payload = {
      title: cleanTitle,
      time,
      deadline: deadline || getDateForWeekday(day),
      priority,
      category,
      day,
      notes: notes.trim() || undefined,
    };

    if (editingTask) {
      onUpdateTask(editingTask.id, payload);
    } else {
      onAddTask(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageCoverHeader
        mood={companion.bannerMood}
        eyebrow={`planning space · ${todayDay}`}
        title="to-do list"
        subtitle="Capture daily tasks with times, priorities, and focus areas. Everything syncs across your Dashboard and Weekly Planner."
        icon={<CheckSquare className="w-6 h-6" />}
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Detailed Task</span>
          </button>
        }
      />

      {/* Focus Spaces Swatch Filter */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {CATEGORIES.map((cat) => {
          const active = categoryFilter === cat;
          const catCount = scopedTasks.filter((t) => t.category === cat && !t.completed).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter((prev) => (prev === cat ? 'All' : cat))}
              className={`group rounded-2xl overflow-hidden border text-left transition-all bg-[#FFFDF9] dark:bg-[#1E1E1E] ${
                active
                  ? 'border-[#800020] dark:border-[#D4A85E] ring-2 ring-[#800020]/15 dark:ring-[#D4A85E]/20'
                  : 'border-[#E6DFD5] dark:border-[#2E2C29] hover:border-[#CBBFB2] dark:hover:border-[#4A4640]'
              }`}
            >
              <div className="h-10 w-full overflow-hidden">
                <FocusCategoryCover category={cat} />
              </div>
              <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[#292522] dark:text-[#F3EFEA] truncate">
                  {cat}
                </span>
                <span className="font-mono text-[10px] text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                  {catCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick-Add Composer Card */}
      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none focus-within:border-[#A69A8D] dark:focus-within:border-[#4A4640] transition-colors flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="What deserves your focus today?"
          aria-label="Quick add task title"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E] transition-colors"
        />
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <input
            type="time"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            aria-label="Task time"
            className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          />
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            aria-label="Task category"
            className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as Priority)}
            aria-label="Task priority"
            className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="ml-auto sm:ml-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Progress & Scope Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3.5 flex-1">
          <div className="w-full max-w-xs h-2 rounded-full bg-[#EAE2D6] dark:bg-[#2A2825] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B5853B] dark:bg-[#C89B54] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#6E6359] dark:text-[#A69E94] tabular-nums whitespace-nowrap">
            {completedCount}/{scopedTasks.length} done ({completionPct}%)
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] w-fit">
          <button
            type="button"
            onClick={() => setDayScope('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              dayScope === 'today'
                ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
            }`}
          >
            Today ({todayDay})
          </button>
          <button
            type="button"
            onClick={() => setDayScope('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              dayScope === 'all'
                ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
            }`}
          >
            All Week ({tasks.length})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] w-fit">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === f
                    ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                    : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {categoryFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('All')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#FAF3F1] dark:bg-[#262320] text-[#800020] dark:text-[#D4A85E] border border-[#EAD9D8] dark:border-[#493E33] whitespace-nowrap"
            >
              <span>{categoryFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[#6E6359] dark:text-[#A69E94] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search intentions..."
              aria-label="Search tasks"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClearCompleted}
            disabled={totalCompletedOverall === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#FFFDF9] dark:bg-[#1E1E1E] text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            Clear Done
          </button>
        </div>
      </div>

      {/* Individual Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-6 py-12 text-center shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-[#FAF3F1] dark:bg-[#262320] border border-[#EAD9D8] dark:border-[#493E33] flex items-center justify-center text-[#800020] dark:text-[#D4A85E]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h2 className="mt-3 text-base font-medium text-[#292522] dark:text-[#F3EFEA]">No tasks here yet</h2>
          <p className="mt-1 text-sm text-[#6E6359] dark:text-[#A69E94]">
            Use the quick composer above to add a task or adjust your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <article
              key={task.id}
              className={`group rounded-2xl border px-4 sm:px-5 py-4 transition-all duration-150 flex items-start justify-between gap-4 ${
                task.completed
                  ? 'bg-[#FFFDF9]/70 dark:bg-[#1E1E1E]/60 border-[#EAE3D9] dark:border-[#262422]'
                  : 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#E6DFD5] dark:border-[#2E2C29] shadow-[0_1px_2px_rgba(41,37,34,0.03)] dark:shadow-none hover:border-[#CBBFB2] dark:hover:border-[#4A4640] hover:shadow-[0_4px_14px_rgba(41,37,34,0.06)] dark:hover:shadow-none hover:-translate-y-[1px]'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                className="flex items-start gap-3.5 min-w-0 flex-1 text-left"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                      : 'border-[#CFC5B8] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#161616] group-hover:border-[#800020] dark:group-hover:border-[#D4A85E]'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm sm:text-base font-medium leading-snug ${
                      task.completed ? 'line-through text-[#8C8278] dark:text-[#7D766E]' : 'text-[#292522] dark:text-[#F3EFEA]'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.notes && (
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        task.completed ? 'text-[#A69A8D] dark:text-[#6E6760]' : 'text-[#6E6359] dark:text-[#A69E94]'
                      }`}
                    >
                      {task.notes}
                    </p>
                  )}
                  <p
                    className={`mt-1.5 text-xs tabular-nums ${
                      task.completed ? 'text-[#8C8278] dark:text-[#7D766E]' : 'text-[#6E6359] dark:text-[#A69E94]'
                    }`}
                  >
                    <span className="font-mono">{formatTime12h(task.time)}</span>
                    <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                    <span>{task.category}</span>
                    <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                    <span className={task.completed ? 'text-[#8C8278] dark:text-[#7D766E]' : getPriorityTextClass(task.priority)}>
                      {task.priority} priority
                    </span>
                    {dayScope === 'all' && (
                      <>
                        <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                        <span>{task.day}</span>
                      </>
                    )}
                    {task.deadline && task.deadline !== getTodayDateISO() && (
                      <>
                        <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                        <span className="font-mono">Due {task.deadline}</span>
                      </>
                    )}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(task)}
                  aria-label={`Edit "${task.title}"`}
                  className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label={`Delete "${task.title}"`}
                  className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#E58A9B] hover:bg-[#FAF3F1] dark:hover:bg-[#291C1F] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detailed Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#292522]/35 dark:bg-black/65 backdrop-blur-[2px] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="todo-modal-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
              <h2 id="todo-modal-title" className="text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                {editingTask ? 'Edit Task' : 'New Detailed Task'}
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

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label htmlFor="todo-title" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                  Task Title
                </label>
                <input
                  id="todo-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., Polish UX design portfolio case study"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  autoFocus
                />
                {formError && <p className="mt-1 text-xs text-[#800020] dark:text-[#E58A9B]">{formError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="todo-time" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Time
                  </label>
                  <input
                    id="todo-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  />
                </div>
                <div>
                  <label htmlFor="todo-deadline" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Deadline
                  </label>
                  <input
                    id="todo-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="todo-day" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Day
                  </label>
                  <select
                    id="todo-day"
                    value={day}
                    onChange={(e) => setDay(e.target.value as Weekday)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  >
                    {WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-priority" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Priority
                  </label>
                  <select
                    id="todo-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-category" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Category
                  </label>
                  <select
                    id="todo-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="todo-notes" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  id="todo-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                />
              </div>

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
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
