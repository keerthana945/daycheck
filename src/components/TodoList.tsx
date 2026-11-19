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
  if (priority === 'High') return 'text-[#6D1D2C] font-medium';
  if (priority === 'Medium') return 'text-[#B45309] font-medium';
  return 'text-[#6B625B]';
}

export function TodoList({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onClearCompleted,
}: TodoListProps) {
  const todayDay = getTodayWeekday();
  const [dayScope, setDayScope] = useState<'today' | 'all'>('today');
  const [filter, setFilter] = useState<TaskFilter>('All');
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
  }, [scopedTasks, filter, searchQuery]);

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
    setCategory('Study');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1F1A17] text-balance">
            To-Do List
          </h1>
          <p className="mt-1 text-sm text-[#6B625B]">
            Add a task quickly below or set deadlines and details. Tasks sync to your Weekly Planner.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DDD0] bg-white text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Detailed Task</span>
        </button>
      </div>

      {/* Inline Quick-Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl bg-white border border-[#E6DDD0] p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="What needs to be done today?"
          aria-label="Quick add task title"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#9A9086] focus:outline-none focus:border-[#6D1D2C]"
        />
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <input
            type="time"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            aria-label="Task time"
            className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
          />
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            aria-label="Task category"
            className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
            className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] disabled:opacity-45 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Progress & Scope Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-full max-w-xs h-2 rounded-full bg-[#E6DDD0] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#6D1D2C] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[#6B625B] tabular-nums whitespace-nowrap">
            {completedCount}/{scopedTasks.length} done ({completionPct}%)
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2ECE3] border border-[#E6DDD0] w-fit">
          <button
            type="button"
            onClick={() => setDayScope('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              dayScope === 'today'
                ? 'bg-white text-[#1F1A17] shadow-xs'
                : 'text-[#6B625B] hover:text-[#1F1A17]'
            }`}
          >
            Today ({todayDay})
          </button>
          <button
            type="button"
            onClick={() => setDayScope('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              dayScope === 'all'
                ? 'bg-white text-[#1F1A17] shadow-xs'
                : 'text-[#6B625B] hover:text-[#1F1A17]'
            }`}
          >
            All Week ({tasks.length})
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F2ECE3] border border-[#E6DDD0] w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-white text-[#1F1A17] shadow-xs'
                  : 'text-[#6B625B] hover:text-[#1F1A17]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-4 h-4 text-[#6B625B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search tasks"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#9A9086] focus:outline-none focus:border-[#6D1D2C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B625B] hover:text-[#1F1A17]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClearCompleted}
            disabled={totalCompletedOverall === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DDD0] bg-white text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            Clear Done
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="rounded-2xl bg-white border border-[#E6DDD0] divide-y divide-[#F2ECE3] overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-[#F2ECE3] flex items-center justify-center text-[#6D1D2C]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-[#1F1A17]">No tasks here yet</h2>
            <p className="mt-1 text-sm text-[#6B625B]">
              Use the quick bar above to add a task or adjust your filter.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAF7F2]/70 ${
                task.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                      : 'border-[#CFC5B8] bg-white hover:border-[#6D1D2C]'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm sm:text-base font-medium leading-snug ${
                      task.completed ? 'line-through text-[#6B625B]' : 'text-[#1F1A17]'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#6B625B] tabular-nums">
                    <span className="font-mono">{formatTime12h(task.time)}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{task.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span className={getPriorityTextClass(task.priority)}>{task.priority}</span>
                    {dayScope === 'all' && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{task.day}</span>
                      </>
                    )}
                    {task.deadline && task.deadline !== getTodayDateISO() && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono">Due {task.deadline}</span>
                      </>
                    )}
                  </p>
                  {task.notes && (
                    <p className="mt-1 text-xs text-[#6B625B]">{task.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(task)}
                  aria-label={`Edit "${task.title}"`}
                  className="p-2 rounded-lg text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label={`Delete "${task.title}"`}
                  className="p-2 rounded-lg text-[#6B625B] hover:text-[#991B1B] hover:bg-[#F7ECEE] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1A17]/35 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="todo-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E6DDD0] p-6 shadow-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
              <h2 id="todo-modal-title" className="text-lg font-semibold text-[#1F1A17]">
                {editingTask ? 'Edit Task' : 'New Detailed Task'}
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

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label htmlFor="todo-title" className="block text-xs font-medium text-[#4A433E] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  autoFocus
                />
                {formError && <p className="mt-1 text-xs text-[#991B1B]">{formError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="todo-time" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Time
                  </label>
                  <input
                    id="todo-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  />
                </div>
                <div>
                  <label htmlFor="todo-deadline" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Deadline
                  </label>
                  <input
                    id="todo-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="todo-day" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Day
                  </label>
                  <select
                    id="todo-day"
                    value={day}
                    onChange={(e) => setDay(e.target.value as Weekday)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  >
                    {WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-priority" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Priority
                  </label>
                  <select
                    id="todo-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="todo-category" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Category
                  </label>
                  <select
                    id="todo-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
                <label htmlFor="todo-notes" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  id="todo-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                />
              </div>

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
