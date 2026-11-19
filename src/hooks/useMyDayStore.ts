import { useCallback, useEffect, useState } from 'react';
import {
  createDefaultRoutine,
  createInitialMyDayState,
  getTodayDateISO,
  getTodayWeekdayIndex,
} from '../data/sampleData';
import type {
  HabitKey,
  MyDayState,
  Note,
  RoutineItem,
  Task,
  ToastItem,
} from '../types';

const STORAGE_KEY = 'myday_state_v1';

function loadInitialState(): MyDayState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialMyDayState();
    const parsed = JSON.parse(raw) as Partial<MyDayState>;
    const fallback = createInitialMyDayState();
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks,
      routine: Array.isArray(parsed.routine) ? parsed.routine : fallback.routine,
      habits:
        Array.isArray(parsed.habits) && parsed.habits.length === 5
          ? parsed.habits
          : fallback.habits,
      notes: Array.isArray(parsed.notes) ? parsed.notes : fallback.notes,
    };
  } catch {
    return createInitialMyDayState();
  }
}

export function computeHabitStreak(
  weeklyHistory: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
): number {
  const todayIdx = getTodayWeekdayIndex();
  let streak = 0;
  let cursor = weeklyHistory[todayIdx] ? todayIdx : todayIdx - 1;
  while (cursor >= 0 && weeklyHistory[cursor]) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function useMyDayStore() {
  const [state, setState] = useState<MyDayState>(loadInitialState);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [state]);

  const notify = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Tasks ---
  const addTask = useCallback(
    (input: Omit<Task, 'id' | 'completed'>) => {
      const task: Task = {
        ...input,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completed: false,
      };
      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, task],
      }));
      notify(`Added "${input.title}".`);
    },
    [notify],
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      notify('Task updated.');
    },
    [notify],
  );

  const toggleTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }, []);

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
      notify('Task deleted.', 'info');
    },
    [notify],
  );

  const clearCompletedTasks = useCallback(() => {
    setState((prev) => {
      const count = prev.tasks.filter((t) => t.completed).length;
      if (count === 0) return prev;
      notify(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}.`, 'info');
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => !t.completed),
      };
    });
  }, [notify]);

  // --- Daily Routine ---
  const addRoutineItem = useCallback(
    (input: Omit<RoutineItem, 'id' | 'completed'>) => {
      const item: RoutineItem = {
        ...input,
        id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        completed: false,
      };
      setState((prev) => ({
        ...prev,
        routine: [...prev.routine, item].sort((a, b) => a.time.localeCompare(b.time)),
      }));
      notify(`Added "${input.title}" to your routine.`);
    },
    [notify],
  );

  const updateRoutineItem = useCallback(
    (id: string, updates: Partial<Omit<RoutineItem, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        routine: prev.routine
          .map((r) => (r.id === id ? { ...r, ...updates } : r))
          .sort((a, b) => a.time.localeCompare(b.time)),
      }));
      notify('Routine block updated.');
    },
    [notify],
  );

  const toggleRoutineItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      routine: prev.routine.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
    }));
  }, []);

  const deleteRoutineItem = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        routine: prev.routine.filter((r) => r.id !== id),
      }));
      notify('Routine block removed.', 'info');
    },
    [notify],
  );

  const resetRoutineCheckmarks = useCallback(() => {
    setState((prev) => ({
      ...prev,
      routine: prev.routine.map((r) => ({ ...r, completed: false })),
    }));
    notify('Cleared today’s routine checkmarks.', 'info');
  }, [notify]);

  const resetDefaultRoutine = useCallback(() => {
    setState((prev) => ({
      ...prev,
      routine: createDefaultRoutine(),
    }));
    notify('Restored default daily routine timetable.');
  }, [notify]);

  // --- Habits ---
  const adjustHabitValue = useCallback((key: HabitKey, delta: number) => {
    const todayIdx = getTodayWeekdayIndex();
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.key !== key) return h;
        const nextValue = Math.max(0, Math.round((h.todayValue + delta) * 10) / 10);
        const nextHistory = [...h.weeklyHistory] as [
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
        ];
        nextHistory[todayIdx] = nextValue >= h.targetValue;
        return {
          ...h,
          todayValue: nextValue,
          weeklyHistory: nextHistory,
        };
      }),
    }));
  }, []);

  const setHabitValue = useCallback((key: HabitKey, value: number) => {
    const todayIdx = getTodayWeekdayIndex();
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.key !== key) return h;
        const nextValue = Math.max(0, Math.round(value * 10) / 10);
        const nextHistory = [...h.weeklyHistory] as [
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
        ];
        nextHistory[todayIdx] = nextValue >= h.targetValue;
        return {
          ...h,
          todayValue: nextValue,
          weeklyHistory: nextHistory,
        };
      }),
    }));
  }, []);

  const updateHabitTarget = useCallback(
    (key: HabitKey, targetValue: number) => {
      const todayIdx = getTodayWeekdayIndex();
      setState((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.key !== key) return h;
          const clamped = Math.min(h.maxTarget, Math.max(h.minTarget, targetValue));
          const nextHistory = [...h.weeklyHistory] as [
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
          ];
          nextHistory[todayIdx] = h.todayValue >= clamped;
          return {
            ...h,
            targetValue: clamped,
            weeklyHistory: nextHistory,
          };
        }),
      }));
      notify('Daily habit target updated.');
    },
    [notify],
  );

  const toggleHabitWeekday = useCallback((key: HabitKey, dayIndex: number) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.key !== key) return h;
        const nextHistory = [...h.weeklyHistory] as [
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
        ];
        nextHistory[dayIndex] = !nextHistory[dayIndex];
        return {
          ...h,
          weeklyHistory: nextHistory,
        };
      }),
    }));
  }, []);

  // --- Notes & Reminders ---
  const addNote = useCallback(
    (input: Omit<Note, 'id' | 'updatedAt'>) => {
      const note: Note = {
        ...input,
        id: `note-${Date.now()}`,
        updatedAt: getTodayDateISO(),
      };
      setState((prev) => ({
        ...prev,
        notes: [note, ...prev.notes],
      }));
      notify(`Saved "${input.title}".`);
    },
    [notify],
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Omit<Note, 'id'>>) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: getTodayDateISO() } : n,
        ),
      }));
      notify('Note updated.');
    },
    [notify],
  );

  const toggleNoteCompleted = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n)),
    }));
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }));
      notify('Note deleted.', 'info');
    },
    [notify],
  );

  // --- Global Reset ---
  const resetAllSampleData = useCallback(() => {
    setState(createInitialMyDayState());
    notify('Restored sample schedule, tasks, habits, and notes.');
  }, [notify]);

  return {
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
  };
}
