import { useMemo, useState } from 'react';
import {
  Plus,
  Check,
  Pencil,
  Trash2,
  Search,
  X,
  CheckSquare,
  Play,
  CalendarClock,
  FolderPlus,
} from 'lucide-react';
import {
  DEFAULT_FOCUS_CATEGORIES,
  WEEK_DAYS,
  formatTime12h,
  getDateForWeekday,
  getOffsetDateISO,
  getTodayDateISO,
  getTodayWeekday,
  getTodayWeekdayIndex,
} from '../data/sampleData';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { FocusCategoryCover, PageCoverHeader } from './EditorialCovers';
import { ModalShell } from './ModalShell';
import type { Priority, Task, TaskCategory, TaskFilter, Weekday } from '../types';

interface TodoListProps {
  tasks: Task[];
  focusCategories: string[];
  onAddFocusSpace: (name: string) => boolean;
  onRemoveFocusSpace: (name: string) => void;
  onAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onMoveTaskToDay: (id: string, day: Weekday, deadline?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
}

const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const FILTERS: TaskFilter[] = ['All', 'Pending', 'Completed', 'High Priority'];

function getPriorityTextClass(priority: Priority): string {
  if (priority === 'High') return 'text-[#800020] dark:text-[#D4A85E] font-medium';
  if (priority === 'Medium') return 'text-[#5C534D] dark:text-[#CFC4B8] font-medium';
  return 'text-[#6E6359] dark:text-[#A69E94]';
}

export function TodoList({
  tasks,
  focusCategories,
  onAddFocusSpace,
  onRemoveFocusSpace,
  onAddTask,
  onUpdateTask,
  onMoveTaskToDay,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}: TodoListProps) {
  const { companion } = useCompanionStore();
  const { startTaskFocus } = useFocusTimer();

  const todayISO = getTodayDateISO();
  const todayDay = getTodayWeekday();
  const tomorrowDay = WEEK_DAYS[(getTodayWeekdayIndex() + 1) % 7];
  const tomorrowISO = getOffsetDateISO(1);

  const [dayScope, setDayScope] = useState<'today' | 'all'>('today');
  const [filter, setFilter] = useState<TaskFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | TaskCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Focus Space creator
  const [addingSpace, setAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // Quick-add inline bar
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('10:00');
  const [quickPriority, setQuickPriority] = useState<Priority>('Medium');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>(
    focusCategories[0] || 'Personal',
  );

  // Detailed modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');
  const [deadline, setDeadline] = useState(todayISO);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [category, setCategory] = useState<TaskCategory>(focusCategories[0] || 'Personal');
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
      deadline: todayISO,
      priority: quickPriority,
      category: categoryFilter === 'All' ? quickCategory : categoryFilter,
      day: todayDay,
    });
    setQuickTitle('');
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onAddFocusSpace(newSpaceName);
    if (ok) {
      setCategoryFilter(newSpaceName.trim());
      setQuickCategory(newSpaceName.trim());
      setNewSpaceName('');
      setAddingSpace(false);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setTime('10:00');
    setDeadline(todayISO);
    setPriority('Medium');
    setCategory(categoryFilter === 'All' ? focusCategories[0] || 'Personal' : categoryFilter);
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
        variant="todos"
        eyebrow={`planning space · ${todayDay}`}
        title="to-do list"
        subtitle="Capture daily intentions with times, priorities, and focus spaces. Everything stays in sync with your Dashboard and Weekly Planner."
        icon={<CheckSquare className="w-6 h-6" />}
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Detailed Task</span>
          </button>
        }
      />

      {/* Focus Spaces Swatch Filter + Custom Focus Space Creator */}
      <section aria-label="Focus spaces filter" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">
            Filter by Focus Space
          </p>
          {addingSpace ? (
            <form onSubmit={handleCreateSpace} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Space name..."
                aria-label="New focus space name"
                className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingSpace(false)}
                aria-label="Cancel adding space"
                className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSpace(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Focus Space</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {focusCategories.map((cat) => {
            const active = categoryFilter === cat;
            const catCount = scopedTasks.filter((t) => t.category === cat && !t.completed).length;
            const isCustom = !DEFAULT_FOCUS_CATEGORIES.includes(cat);
            return (
              <div
                key={cat}
                className={`group relative rounded-2xl overflow-hidden border transition-all bg-[#FFFDF9] dark:bg-[#1E1E1E] ${
                  active
                    ? 'border-[#800020] dark:border-[#D4A85E] ring-2 ring-[#800020]/15 dark:ring-[#D4A85E]/20'
                    : 'border-[#E6DFD5] dark:border-[#2E2C29] hover:border-[#CBBFB2] dark:hover:border-[#4A4640]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCategoryFilter((prev) => (prev === cat ? 'All' : cat))}
                  className="w-full text-left"
                >
                  <div className="h-11 w-full overflow-hidden">
                    <FocusCategoryCover category={cat} />
                  </div>
                  <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-[#292522] dark:text-[#F3EFEA] truncate">
                      {cat}
                    </span>
                    <span className="font-mono text-[11px] text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                      {catCount}
                    </span>
                  </div>
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      if (categoryFilter === cat) setCategoryFilter('All');
                      onRemoveFocusSpace(cat);
                    }}
                    aria-label={`Remove ${cat} focus space`}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/45 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
          className="flex-1 min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E] transition-colors"
        />
        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2">
          <input
            type="time"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            aria-label="Task time"
            className="min-h-[42px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          />
          <select
            value={categoryFilter === 'All' ? quickCategory : categoryFilter}
            onChange={(e) => {
              setQuickCategory(e.target.value as TaskCategory);
              if (categoryFilter !== 'All') setCategoryFilter('All');
            }}
            aria-label="Task category"
            className="min-h-[42px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          >
            {focusCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as Priority)}
            aria-label="Task priority"
            className="min-h-[42px] px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
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
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Consolidated Scope, Filter & Search Strip */}
      <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29]">
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

            <button
              type="button"
              onClick={onClearCompleted}
              disabled={totalCompletedOverall === 0}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0] dark:bg-[#161616] text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
            >
              Clear Done
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2 border-t border-[#EFE9E0] dark:border-[#262422]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29]">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#6E6359] dark:text-[#A69E94] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search intentions..."
              aria-label="Search tasks"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
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
        </div>
      </div>

      {/* Individual Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-6 py-12 text-center shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FAF3F1] dark:bg-[#262320] border border-[#EAD9D8] dark:border-[#493E33] flex items-center justify-center text-[#800020] dark:text-[#D4A85E]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h2 className="mt-3.5 font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
            {tasks.length === 0 ? 'Your to-do list is fresh and ready' : 'No matching tasks'}
          </h2>
          <p className="mt-1.5 text-sm text-[#6E6359] dark:text-[#A69E94] max-w-md mx-auto">
            {tasks.length === 0
              ? 'Type your first task above or open New Detailed Task to pick a focus space, priority, and due date.'
              : 'Try switching to All Week or clearing your search and filters.'}
          </p>
          {tasks.length === 0 && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isOverdue = !task.completed && Boolean(task.deadline) && task.deadline < todayISO;
            return (
              <article
                key={task.id}
                className={`group rounded-2xl border px-4 sm:px-5 py-4 transition-all duration-150 flex items-start justify-between gap-3 ${
                  task.completed
                    ? 'bg-[#FFFDF9]/70 dark:bg-[#1E1E1E]/60 border-[#EAE3D9] dark:border-[#262422]'
                    : isOverdue
                      ? 'bg-[#FAF3F1]/75 dark:bg-[#241B1E] border-[#E4C2C7] dark:border-[#4D3036]'
                      : 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#E6DFD5] dark:border-[#2E2C29] shadow-[0_1px_2px_rgba(41,37,34,0.03)] dark:shadow-none hover:border-[#CBBFB2] dark:hover:border-[#4A4640]'
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
                      {task.deadline && task.deadline !== todayISO && (
                        <>
                          <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                          <span className={`font-mono ${isOverdue ? 'text-[#800020] dark:text-[#E58A9B] font-medium' : ''}`}>
                            {isOverdue ? `Overdue (${task.deadline})` : `Due ${task.deadline}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => startTaskFocus(task.id, task.title)}
                      title="Start 25m focus session on this task"
                      aria-label={`Focus on "${task.title}"`}
                      className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#D4A85E] hover:bg-[#FAF3F1] dark:hover:bg-[#262320] transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() =>
                        isOverdue || task.day !== todayDay
                          ? onMoveTaskToDay(task.id, todayDay, todayISO)
                          : onMoveTaskToDay(task.id, tomorrowDay, tomorrowISO)
                      }
                      title={
                        isOverdue || task.day !== todayDay
                          ? 'Move to today'
                          : `Move to tomorrow (${tomorrowDay})`
                      }
                      aria-label={
                        isOverdue || task.day !== todayDay
                          ? `Move "${task.title}" to today`
                          : `Move "${task.title}" to tomorrow`
                      }
                      className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
                    >
                      <CalendarClock className="w-4 h-4" />
                    </button>
                  )}
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
            );
          })}
        </div>
      )}

      {/* Detailed Add / Edit Modal using ModalShell */}
      <ModalShell
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Detailed Task'}
        titleId="todo-modal-title"
        maxWidthClass="max-w-lg"
      >
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
              placeholder="e.g., Prepare weekly reading notes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              autoFocus
            />
            {formError && <p className="mt-1 text-xs text-[#800020] dark:text-[#E58A9B]">{formError}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Focus Space
              </label>
              <select
                id="todo-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              >
                {focusCategories.map((c) => (
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
      </ModalShell>
    </div>
  );
}
