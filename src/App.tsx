import { useState } from 'react';
import { ConfirmModal } from './components/ConfirmModal';
import { DailyRoutine } from './components/DailyRoutine';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { NotesReminders } from './components/NotesReminders';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TodoList } from './components/TodoList';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { getTodayWeekday } from './data/sampleData';
import { useMyDayStore } from './hooks/useMyDayStore';
import type { AppTab } from './types';

const GUIDE_STORAGE_KEY = 'myday_guide_dismissed';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUIDE_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const {
    state,
    toasts,
    dismissToast,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addRoutineItem,
    updateRoutineItem,
    toggleRoutineItem,
    deleteRoutineItem,
    resetRoutineCheckmarks,
    resetDefaultRoutine,
    adjustHabitValue,
    setHabitValue,
    updateHabitTarget,
    toggleHabitWeekday,
    addNote,
    updateNote,
    toggleNoteCompleted,
    deleteNote,
    resetAllSampleData,
  } = useMyDayStore();

  const todayDay = getTodayWeekday();
  const pendingTodayCount = state.tasks.filter((t) => t.day === todayDay && !t.completed).length;

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage error
    }
  };

  const openGuide = () => {
    setShowGuide(true);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem(GUIDE_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1A17] flex flex-col lg:flex-row">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRequestReset={() => setResetModalOpen(true)}
        onOpenGuide={openGuide}
        pendingTodayCount={pendingTodayCount}
      />

      <main className="flex-1 lg:pl-64 pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-9">
          {activeTab === 'dashboard' && (
            <Dashboard
              tasks={state.tasks}
              routine={state.routine}
              habits={state.habits}
              showGuide={showGuide}
              onDismissGuide={dismissGuide}
              onQuickAddTask={addTask}
              onToggleTask={toggleTask}
              onToggleRoutine={toggleRoutineItem}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'todos' && (
            <TodoList
              tasks={state.tasks}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onClearCompleted={clearCompletedTasks}
            />
          )}

          {activeTab === 'routine' && (
            <DailyRoutine
              routine={state.routine}
              onAddRoutine={addRoutineItem}
              onUpdateRoutine={updateRoutineItem}
              onToggleRoutine={toggleRoutineItem}
              onDeleteRoutine={deleteRoutineItem}
              onClearCheckmarks={resetRoutineCheckmarks}
              onResetDefaultRoutine={resetDefaultRoutine}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyPlanner
              tasks={state.tasks}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
            />
          )}

          {activeTab === 'habits' && (
            <HabitTracker
              habits={state.habits}
              onAdjustValue={adjustHabitValue}
              onSetValue={setHabitValue}
              onUpdateTarget={updateHabitTarget}
              onToggleWeekday={toggleHabitWeekday}
            />
          )}

          {activeTab === 'notes' && (
            <NotesReminders
              notes={state.notes}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onToggleNoteCompleted={toggleNoteCompleted}
              onDeleteNote={deleteNote}
            />
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        open={resetModalOpen}
        title="Reset Schedule & Sample Data?"
        description="This will restore the default My Day routine timetable, sample tasks, habit progress, and notes. Custom edits stored in this browser will be replaced."
        confirmLabel="Reset Sample Data"
        onCancel={() => setResetModalOpen(false)}
        onConfirm={() => {
          resetAllSampleData();
          setResetModalOpen(false);
        }}
      />
    </div>
  );
}
