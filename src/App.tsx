import { useMemo, useState } from 'react';
import { BackupModal } from './components/BackupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DailyRoutine } from './components/DailyRoutine';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { NotesReminders } from './components/NotesReminders';
import { RitualModal, type RitualMode } from './components/RitualModal';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TodoList } from './components/TodoList';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { getTodayDateISO, getTodayWeekday } from './data/sampleData';
import { CompanionProvider, useCompanionStore } from './hooks/useCompanionStore';
import { FocusTimerProvider } from './hooks/useFocusTimer';
import { useMyDayStore } from './hooks/useMyDayStore';
import { useTheme } from './hooks/useTheme';
import type { AppTab } from './types';

const GUIDE_STORAGE_KEY = 'myday_guide_dismissed';

function DayEaseWorkspace() {
  const { preference, resolvedTheme, setPreference, cyclePreference } = useTheme();
  const {
    companion,
    deleteJournalEntry,
    saveMorningReset,
    saveEveningReflection,
    replaceCompanionState,
    clearCompanionWorkspace,
  } = useCompanionStore();

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [ritualMode, setRitualMode] = useState<RitualMode>(null);

  const [showGuide, setShowGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUIDE_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const {
    state,
    focusCategories,
    rolledOverNewDay,
    dismissRolloverNotice,
    toasts,
    notify,
    dismissToast,
    addFocusSpace,
    removeFocusSpace,
    addTask,
    updateTask,
    moveTaskToDay,
    moveTasksBatchToDay,
    rollOverOverdueTasksToToday,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addRoutineItem,
    updateRoutineItem,
    toggleRoutineItem,
    deleteRoutineItem,
    resetRoutineCheckmarks,
    loadStarterRoutine,
    adjustHabitValue,
    setHabitValue,
    updateHabitTarget,
    toggleHabitWeekday,
    addCustomHabit,
    loadStarterHabits,
    deleteCustomHabit,
    addNote,
    updateNote,
    toggleNoteCompleted,
    toggleNotePinned,
    deleteNote,
    replaceFullState,
    clearWorkspace,
  } = useMyDayStore();

  const todayISO = getTodayDateISO();
  const todayDay = getTodayWeekday();
  const todayPendingTasks = useMemo(
    () => state.tasks.filter((t) => t.day === todayDay && !t.completed),
    [state.tasks, todayDay],
  );
  const completedTodayCount = useMemo(
    () => state.tasks.filter((t) => t.day === todayDay && t.completed).length,
    [state.tasks, todayDay],
  );
  const overdueTasks = useMemo(
    () => state.tasks.filter((t) => !t.completed && Boolean(t.deadline) && t.deadline < todayISO),
    [state.tasks, todayISO],
  );
  const habitsMetToday = useMemo(
    () => state.habits.filter((h) => h.todayValue >= h.targetValue).length,
    [state.habits],
  );
  const todayFocusMinutes = useMemo(
    () =>
      companion.focusSessions
        .filter((s) => s.date === todayISO)
        .reduce((sum, s) => sum + s.minutes, 0),
    [companion.focusSessions, todayISO],
  );

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
    <FocusTimerProvider onNotify={notify}>
      <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#141414] text-[#292522] dark:text-[#F3EFEA] flex flex-col lg:flex-row transition-colors duration-200">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onRequestReset={() => setClearModalOpen(true)}
          onOpenGuide={openGuide}
          onOpenBackup={() => setBackupOpen(true)}
          pendingTodayCount={todayPendingTasks.length}
          themePreference={preference}
          resolvedTheme={resolvedTheme}
          onSetThemePreference={setPreference}
          onCycleTheme={cyclePreference}
        />

        <main className="flex-1 lg:pl-64 pb-24 lg:pb-14 min-w-0">
          <div
            className={`mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 ${
              activeTab === 'dashboard' ? 'max-w-[1440px]' : 'max-w-6xl'
            }`}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                tasks={state.tasks}
                routine={state.routine}
                habits={state.habits}
                notes={state.notes}
                focusCategories={focusCategories}
                showGuide={showGuide}
                rolledOverNewDay={rolledOverNewDay}
                onDismissGuide={dismissGuide}
                onDismissRolloverNotice={dismissRolloverNotice}
                onOpenRitual={(mode) => setRitualMode(mode)}
                onAddFocusSpace={addFocusSpace}
                onQuickAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onToggleRoutine={toggleRoutineItem}
                onAdjustHabit={adjustHabitValue}
                onSetHabitValue={setHabitValue}
                onAddNote={addNote}
                onToggleNoteCompleted={toggleNoteCompleted}
                onDeleteJournalEntry={deleteJournalEntry}
                onLoadStarterRoutine={loadStarterRoutine}
                onLoadStarterHabits={loadStarterHabits}
                onNotify={notify}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'todos' && (
              <TodoList
                tasks={state.tasks}
                focusCategories={focusCategories}
                onAddFocusSpace={addFocusSpace}
                onRemoveFocusSpace={removeFocusSpace}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onMoveTaskToDay={moveTaskToDay}
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
                onLoadStarterRoutine={loadStarterRoutine}
              />
            )}

            {activeTab === 'weekly' && (
              <WeeklyPlanner
                tasks={state.tasks}
                focusCategories={focusCategories}
                onAddTask={addTask}
                onMoveTaskToDay={moveTaskToDay}
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
                onAddCustomHabit={addCustomHabit}
                onLoadStarterHabits={loadStarterHabits}
                onDeleteHabit={deleteCustomHabit}
              />
            )}

            {activeTab === 'notes' && (
              <NotesReminders
                notes={state.notes}
                onAddNote={addNote}
                onUpdateNote={updateNote}
                onToggleNoteCompleted={toggleNoteCompleted}
                onToggleNotePinned={toggleNotePinned}
                onDeleteNote={deleteNote}
              />
            )}
          </div>
        </main>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        <BackupModal
          open={backupOpen}
          onClose={() => setBackupOpen(false)}
          state={state}
          companion={companion}
          onRestore={({ state: nextState, companion: nextCompanion }) => {
            if (nextState) replaceFullState(nextState);
            if (nextCompanion) replaceCompanionState(nextCompanion);
          }}
          onNotify={notify}
        />

        <RitualModal
          mode={ritualMode}
          onClose={() => setRitualMode(null)}
          overdueTasks={overdueTasks}
          todayTasksPending={todayPendingTasks}
          completedTodayCount={completedTodayCount}
          habitsMetToday={habitsMetToday}
          totalHabits={state.habits.length}
          todayFocusMinutes={todayFocusMinutes}
          existingMorningIntention={companion.morningResets[todayISO]?.intention}
          existingEveningHighlight={companion.eveningReflections[todayISO]?.highlight}
          existingEveningGratitude={companion.eveningReflections[todayISO]?.gratitude}
          onRollOverOverdueToToday={rollOverOverdueTasksToToday}
          onMoveTasksToTomorrow={(ids, day, deadline) => moveTasksBatchToDay(ids, day, deadline)}
          onSaveMorningReset={saveMorningReset}
          onSaveEveningReflection={saveEveningReflection}
          onNotify={notify}
        />

        <ConfirmModal
          open={clearModalOpen}
          title="Clear My Workspace?"
          description="This permanently removes your tasks, routine blocks, habits, notes, mood check-ins, focus sessions, and journal entries in this browser. Your theme, name, and appearance settings will be kept."
          confirmLabel="Clear My Workspace"
          onCancel={() => setClearModalOpen(false)}
          onConfirm={() => {
            clearWorkspace();
            clearCompanionWorkspace();
            setClearModalOpen(false);
          }}
        />
      </div>
    </FocusTimerProvider>
  );
}

export default function App() {
  return (
    <CompanionProvider>
      <DayEaseWorkspace />
    </CompanionProvider>
  );
}
