import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FOCUS_CATEGORIES,
  createInitialMyDayState,
  createStarterHabitsTemplate,
  createStarterRoutineTemplate,
  getDateForWeekday,
  getTodayDateISO,
  getTodayWeekday,
  getTodayWeekdayIndex,
  getWeekStartISO,
} from '../data/sampleData';
import type {
  Habit,
  HabitKey,
  MyDayState,
  Note,
  PlantStyle,
  RoutineItem,
  Task,
  ToastItem,
  Weekday,
} from '../types';

export const MYDAY_STORAGE_KEY = 'myday_state_v1';

interface LoadedStateResult {
  state: MyDayState;
  rolledOverNewDay: boolean;
  rolledOverNewWeek: boolean;
}

function loadInitialState(): LoadedStateResult {
  const todayISO = getTodayDateISO();
  const weekStartISO = getWeekStartISO(0);

  try {
    const raw = localStorage.getItem(MYDAY_STORAGE_KEY);
    if (!raw) {
      return {
        state: createInitialMyDayState(),
        rolledOverNewDay: false,
        rolledOverNewWeek: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<MyDayState>;
    const fallback = createInitialMyDayState();

    const baseTasks = Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks;
    const baseRoutine = Array.isArray(parsed.routine) ? parsed.routine : fallback.routine;
    const baseHabits = Array.isArray(parsed.habits) ? parsed.habits : fallback.habits;
    const baseNotes = Array.isArray(parsed.notes) ? parsed.notes : fallback.notes;
    const baseCustomCats = Array.isArray(parsed.customCategories)
      ? parsed.customCategories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      : [];

    const lastDate = typeof parsed.lastOpenedDate === 'string' ? parsed.lastOpenedDate : todayISO;
    const lastWeek =
      typeof parsed.lastOpenedWeekStart === 'string' ? parsed.lastOpenedWeekStart : weekStartISO;

    const isNewDay = lastDate !== todayISO;
    const isNewWeek = lastWeek !== weekStartISO;

    const rolledRoutine = isNewDay
      ? baseRoutine.map((r) => ({ ...r, completed: false }))
      : baseRoutine;

    const rolledHabits = baseHabits.map((h) => {
      const nextHistory: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] =
        isNewWeek
          ? [false, false, false, false, false, false, false]
          : Array.isArray(h.weeklyHistory) && h.weeklyHistory.length === 7
            ? (h.weeklyHistory.map(Boolean) as [
                boolean,
                boolean,
                boolean,
                boolean,
                boolean,
                boolean,
                boolean,
              ])
            : [false, false, false, false, false, false, false];

      return {
        ...h,
        todayValue: isNewDay ? 0 : typeof h.todayValue === 'number' ? h.todayValue : 0,
        weeklyHistory: nextHistory,
      };
    });

    return {
      state: {
        tasks: baseTasks,
        routine: rolledRoutine,
        habits: rolledHabits,
        notes: baseNotes,
        customCategories: baseCustomCats,
        lastOpenedDate: todayISO,
        lastOpenedWeekStart: weekStartISO,
      },
      rolledOverNewDay: isNewDay,
      rolledOverNewWeek: isNewWeek,
    };
  } catch {
    return {
      state: createInitialMyDayState(),
      rolledOverNewDay: false,
      rolledOverNewWeek: false,
    };
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
  const [initialMeta] = useState<LoadedStateResult>(() => loadInitialState());
  const [state, setState] = useState<MyDayState>(initialMeta.state);
  const [rolledOverNewDay, setRolledOverNewDay] = useState<boolean>(initialMeta.rolledOverNewDay);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(MYDAY_STORAGE_KEY, JSON.stringify(state));
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

  const dismissRolloverNotice = useCallback(() => {
    setRolledOverNewDay(false);
  }, []);

  // Combined focus categories (defaults + user custom spaces + any legacy categories present in user tasks)
  const focusCategories = useMemo(() => {
    const custom = state.customCategories || [];
    const seen = new Set(DEFAULT_FOCUS_CATEGORIES);
    const extras: string[] = [];

    for (const c of custom) {
      const clean = c.trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        extras.push(clean);
      }
    }

    // Preserve existing categories on saved tasks (e.g. migrating returning users)
    for (const t of state.tasks) {
      const clean = typeof t.category === 'string' ? t.category.trim() : '';
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        extras.push(clean);
      }
    }

    return [...DEFAULT_FOCUS_CATEGORIES, ...extras];
  }, [state.customCategories, state.tasks]);

  const addFocusSpace = useCallback(
    (rawName: string): boolean => {
      const clean = rawName.trim();
      if (!clean) return false;
      if (focusCategories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        notify(`"${clean}" focus space already exists.`, 'info');
        return false;
      }
      setState((prev) => ({
        ...prev,
        customCategories: [...(prev.customCategories || []), clean],
      }));
      notify(`Created focus space "${clean}".`);
      return true;
    },
    [focusCategories, notify],
  );

  const removeFocusSpace = useCallback(
    (name: string) => {
      if (DEFAULT_FOCUS_CATEGORIES.includes(name)) return;
      setState((prev) => ({
        ...prev,
        customCategories: (prev.customCategories || []).filter((c) => c !== name),
        tasks: prev.tasks.map((t) => (t.category === name ? { ...t, category: 'Personal' } : t)),
      }));
      notify(`Removed "${name}" space (tasks moved to Personal).`, 'info');
    },
    [notify],
  );

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

  const moveTaskToDay = useCallback(
    (id: string, day: Weekday, deadline?: string) => {
      const targetDeadline = deadline || getDateForWeekday(day);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, day, deadline: targetDeadline } : t,
        ),
      }));
      notify(`Moved task to ${day}.`, 'info');
    },
    [notify],
  );

  const moveTasksBatchToDay = useCallback(
    (ids: string[], day: Weekday, deadline?: string) => {
      if (ids.length === 0) return;
      const targetDeadline = deadline || getDateForWeekday(day);
      const idSet = new Set(ids);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          idSet.has(t.id) ? { ...t, day, deadline: targetDeadline } : t,
        ),
      }));
      notify(`Moved ${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} to ${day}.`, 'info');
    },
    [notify],
  );

  const rollOverOverdueTasksToToday = useCallback((): number => {
    const todayISO = getTodayDateISO();
    const todayDay = getTodayWeekday();
    let movedCount = 0;

    setState((prev) => {
      const nextTasks = prev.tasks.map((t) => {
        if (!t.completed && t.deadline && t.deadline < todayISO) {
          movedCount += 1;
          return { ...t, day: todayDay, deadline: todayISO };
        }
        return t;
      });
      return movedCount > 0 ? { ...prev, tasks: nextTasks } : prev;
    });

    return movedCount;
  }, []);

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

  const loadStarterRoutine = useCallback(() => {
    setState((prev) => ({
      ...prev,
      routine: createStarterRoutineTemplate(),
    }));
    notify('Loaded gentle starter routine template.');
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

  // Sync today's weekday dot directly with todayValue so state never drifts
  const toggleHabitWeekday = useCallback((key: HabitKey, dayIndex: number) => {
    const todayIdx = getTodayWeekdayIndex();
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
        const nextDone = !nextHistory[dayIndex];
        nextHistory[dayIndex] = nextDone;
        return {
          ...h,
          todayValue:
            dayIndex === todayIdx
              ? nextDone
                ? Math.max(h.todayValue, h.targetValue)
                : 0
              : h.todayValue,
          weeklyHistory: nextHistory,
        };
      }),
    }));
  }, []);

  const addCustomHabit = useCallback(
    (input: {
      name: string;
      unit: string;
      targetValue: number;
      step: number;
      plantStyle: PlantStyle;
    }) => {
      const cleanName = input.name.trim();
      if (!cleanName) return;
      const target = Math.max(1, input.targetValue);
      const step = Math.max(1, Math.min(target, input.step));
      const newHabit: Habit = {
        key: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: cleanName,
        unit: input.unit.trim() || 'times',
        step,
        todayValue: 0,
        targetValue: target,
        minTarget: 1,
        maxTarget: Math.max(20, target * 4),
        plantStyle: input.plantStyle,
        isCustom: true,
        weeklyHistory: [false, false, false, false, false, false, false],
      };
      setState((prev) => ({
        ...prev,
        habits: [...prev.habits, newHabit],
      }));
      notify(`Planted new habit "${cleanName}".`);
    },
    [notify],
  );

  const loadStarterHabits = useCallback(() => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.length > 0 ? prev.habits : createStarterHabitsTemplate(),
    }));
    notify('Added starter botanical habits.');
  }, [notify]);

  const deleteCustomHabit = useCallback(
    (key: HabitKey) => {
      setState((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.key !== key),
      }));
      notify('Habit removed from garden.', 'info');
    },
    [notify],
  );

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

  const toggleNotePinned = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
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

  // --- Backup Restore & Clear Workspace ---
  const replaceFullState = useCallback((next: Partial<MyDayState>) => {
    const fallback = createInitialMyDayState();
    setState({
      tasks: Array.isArray(next.tasks) ? next.tasks : fallback.tasks,
      routine: Array.isArray(next.routine) ? next.routine : fallback.routine,
      habits: Array.isArray(next.habits) ? next.habits : fallback.habits,
      notes: Array.isArray(next.notes) ? next.notes : fallback.notes,
      customCategories: Array.isArray(next.customCategories) ? next.customCategories : [],
      lastOpenedDate: getTodayDateISO(),
      lastOpenedWeekStart: getWeekStartISO(0),
    });
  }, []);

  const clearWorkspace = useCallback(() => {
    setState(createInitialMyDayState());
    notify('Cleared your DayEase workspace. Everything is fresh and ready.', 'info');
  }, [notify]);

  return {
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
  };
}
